import React, { useEffect, useState } from "react";
import { Create, useSelect, useForm } from "@refinedev/antd";
import {
  useCustom,
  useNavigation,
  useOne,
  useUpdateMany,
  useCreate,
} from "@refinedev/core";
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Table,
  Upload,
  notification,
} from "antd";
import dayjs from "dayjs";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  PaperClipOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../App";
import TextArea from "antd/lib/input/TextArea";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";

dayjs.extend(utc);
dayjs.extend(timezone);

// Функция для получения исторического курса валюты на конкретную дату
const getHistoricalRate = (currency: any, targetDate: string) => {
  if (!currency?.currency_history || !targetDate) {
    return currency?.rate || 1;
  }

  // Сортируем историю по дате (по убыванию)
  const sortedHistory = [...currency.currency_history].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const targetDateTime = new Date(targetDate).getTime();

  // Ищем курс, который был актуален на дату создания товара
  for (const historyRecord of sortedHistory) {
    const historyDateTime = new Date(historyRecord.created_at).getTime();
    if (historyDateTime <= targetDateTime) {
      return historyRecord.rate;
    }
  }

  // Если не нашли подходящий исторический курс, берем самый ранний
  return sortedHistory[sortedHistory.length - 1]?.rate || currency?.rate || 1;
};

export enum CurrencyType {
  Usd = "Доллар",
  Rub = "Рубль",
  Som = "Сом",
}

export const CashDeskCreate: React.FC = () => {
  const { push } = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [preselectedGoodsIds, setPreselectedGoodsIds] = useState<number[]>([]);

  // Mutate function to update multiple goods (e.g., link them to the new cash-desk operation)
  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: async (data: any, variables, context) => {
        refetch(); // Refetch goods data after update
        push("/income"); // Navigate to income page
      },
    },
  });

  // Функция для создания cash-desk записей
  const { mutate: createCashDeskEntry } = useCreate();

  // Функция для создания множественных cash-desk записей для каждого товара
  const createMultipleCashDeskEntries = async (formValues: any) => {
    let successCount = 0;
    const totalItems = selectedRows.length;

    // Показываем уведомление о начале процесса
    notification.info({
      message: "Создание оплат",
      description: `Создается ${totalItems} записей оплаты для каждого товара...`,
      duration: 3,
    });

    const selectedCurrency = formValues.type_currency;
    const selectedCurrencyData = currency.data?.find(
      (item: any) => item.name === selectedCurrency
    );

    for (const good of selectedRows) {
      // Получаем исторический курс валюты на дату создания товара
      const historicalRate = getHistoricalRate(
        selectedCurrencyData,
        good.created_at
      );

      // Вычисляем сумму для каждого товара отдельно
      const totalServiceAmount = good.services.reduce(
        (acc: number, service: any) => acc + Number(service.sum || 0),
        0
      );
      const totalProductAmount = good.products.reduce(
        (acc: number, product: any) => acc + Number(product.sum || 0),
        0
      );

      const totalGoodAmount = totalServiceAmount + totalProductAmount;   
      const transformAmount =
        historicalRate > 0 ? historicalRate * totalGoodAmount : totalGoodAmount;
      const remainingToPay = transformAmount - (good?.paid_sum || 0);

      // Создаем отдельную cash-desk запись для каждого товара
      const cashDeskData = {
        ...formValues,
        amount: remainingToPay,
        paid_sum: remainingToPay,
        good_id: good.id,
        counterparty_id: formValues.sender_id,
      };

      try {
        // Создаем cash-desk запись
        await new Promise((resolve, reject) => {
          createCashDeskEntry(
            {
              resource: "cash-desk",
              values: cashDeskData,
            },
            {
              onSuccess: (response: any) => {
                // Обновляем товар с новым operation_id
                updateManyGoods({
                  ids: [good.id],
                  values: {
                    operation_id: response.data.id,
                  },
                });
                successCount++;

                // Показываем прогресс
                notification.info({
                  message: "Прогресс создания",
                  description: `Создано ${successCount} из ${totalItems} записей`,
                  duration: 1,
                });

                resolve(response);
              },
              onError: (error) => {
                notification.error({
                  message: "Ошибка при создании оплаты",
                  description: `Не удалось создать оплату для товара ${
                    good.invoice_number || good.id
                  }`,
                  duration: 4,
                });
                reject(error);
              },
            }
          );
        });
      } catch (error) {
        console.error(
          `Ошибка при создании cash-desk записи для товара ${good.id}:`,
          error
        );
      }
    }

    // После завершения всех операций показываем результат и переходим на страницу income
    if (successCount === totalItems) {
      notification.success({
        message: "Оплаты созданы успешно",
        description: `Успешно создано ${successCount} записей оплаты для каждого товара`,
        duration: 4,
      });
      setTimeout(() => {
        push("/income");
      }, 1000);
    } else {
      notification.warning({
        message: "Процесс завершен с ошибками",
        description: `Создано ${successCount} из ${totalItems} записей. Проверьте остальные товары.`,
        duration: 5,
      });
    }
  };

  // Form hook for creating a cash-desk entry
  const { formProps, saveButtonProps, form } = useForm({
    onMutationSuccess(data, variables, context, isAutoSave) {
      // Оптовая оплата с несколькими товарами обрабатывается в onFinish
      // Здесь обрабатываем только остальные случаи
      const id = data?.data?.id; // Get the ID of the newly created cash-desk entry
      if (selectedRowKeys.length > 0) {
        // If goods were selected, update them with the cash-desk operation ID
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            operation_id: id,
          },
        });
      } else {
        // If no goods were selected (e.g., direct income), navigate
        navigate("/income");
      }
    },
    resource: "cash-desk",
    redirect: false, // Prevent default redirection
    //@ts-ignore
    defaultValues: {
      type: "income", // Default type for cash desk entry
      type_operation: "Извне", // Default operation type
      date: dayjs(), // Default date to current day
      type_currency: "Сом", // Default currency to Som
    },
  });

  const [isAgent, setIsAgent] = useState(false); // State to control visibility of agent-related fields and table
  const [sorterVisible, setSorterVisible] = useState(false); // State for sort dropdown visibility
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC"); // Sorting direction
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id"); // Field to sort by
  const [filters, setFilters] = useState<any>([]); // Filters for the goods table
  const [currentPage, setCurrentPage] = useState(1); // Current page for goods table
  const [pageSize, setPageSize] = useState(100); // Page size for goods table
  const [change, setChange] = useState(0); // Dummy state to trigger useEffect for amount calculation
  const [bolik, setBolik] = useState(false); // True for "Контрагент частично" (partial payment), enables single selection
  const [selectedCurrency, setSelectedCurrency] = useState("Сом"); // Track selected currency for table display
  const [selectedCounterparty, setSelectedCounterparty] = useState<any>(null); // Track selected counterparty for balance operations
  const [isBalanceOperation, setIsBalanceOperation] = useState(false); // Track if operation is "Контрагент частично с баланса"

  // Fetch currency data
  const { data: currency = { data: [] }, isLoading: currencyLoading } =
    useCustom<any>({
      url: `${API_URL}/currency`,
      method: "get",
    });

  const [selectedType, setSelectedType] = useState<string | null>(null); // To determine if sender or recipient
  const [selectedReceipientId, setSelectedReceipientId] = useState<
    string | null
  >(null); // For fetching counterparty details (though not directly used now)

  // Функция для построения фильтров запроса
  const buildGoodsQuery = () => {
    if (preselectedGoodsIds.length > 0) {
      return {
        s: JSON.stringify({
          $and: [
            {
              id: {
                $in: preselectedGoodsIds,
              },
            },
            ...filters,
            {
              is_payment: {
                $eq: false,
              },
            },
          ],
        }),
        sort: `${sortField},${sortDirection}`,
        limit: pageSize,
        page: currentPage,
        offset: (currentPage - 1) * pageSize,
      };
    }

    // Обычная логика фильтрации по контрагенту
    return {
      s: JSON.stringify({
        $and: [
          {
            $or: [
              {
                "sender.id": {
                  $eq:
                    form?.getFieldValue("sender_id") === undefined
                      ? 0
                      : form?.getFieldValue("sender_id"),
                },
              },
              {
                "recipient.id": {
                  $eq:
                    form?.getFieldValue("sender_id") === undefined
                      ? 0
                      : form?.getFieldValue("sender_id"),
                },
              },
            ],
          },
          ...filters,
          {
            is_payment: {
              $eq: false,
            },
          },
        ],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  // Fetch goods-processing data based on filters, sorting, and pagination
  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildGoodsQuery(),
    },
  });

  // Select properties for the sender/counterparty dropdown
  const { selectProps: senderSelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) =>
      `${item.name} ${item.clientPrefix}-${item.clientCode}/${
        item.type === "sender" ? "." : ","
      }`, // Custom label combining name, prefix, code
    filters: [
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value: "" },
          { field: "clientCode", operator: "contains", value: "" },
          { field: "clientPrefix", operator: "contains", value: "" },
        ],
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value },
          { field: "clientCode", operator: "contains", value },
          { field: "clientPrefix", operator: "contains", value },
        ],
      },
    ],
  });

  // Fetch selected counterparty data for balance operations
  const { data: selectedCounterpartyData } = useOne({
    resource: "counterparty",
    id: selectedCounterparty ?? "",
    queryOptions: {
      enabled: !!selectedCounterparty && isBalanceOperation,
    },
  });

  // Set initial form values (type: "income", currency: "Сом") when the form is available
  useEffect(() => {
    if (form) {
      form.setFieldValue("type", "income");
      form.setFieldValue("type_currency", "Сом");
      setSelectedCurrency("Сом"); // Set initial selected currency
    }
  }, [form]);

  // Effect to calculate and set 'amount' and 'paid_sum' based on selections and currency
  useEffect(() => {
    if (formProps.form) {
      if (isAgent) {
        const currentValue: any = formProps.form.getFieldValue("type_currency");
        const selectedCurrencyData = currency.data?.find(
          (item: any) => item.name === currentValue
        );

        // Calculate total amounts from selected goods using historical rates for each good
        let totalTransformedAmount = 0;
        let totalPaidSumInCurrentCurrency = 0;

        selectedRows.forEach((item: any) => {
          // Получаем исторический курс для каждого товара на дату его создания
          const historicalRate = getHistoricalRate(
            selectedCurrencyData,
            item.created_at
          );

          // Рассчитываем сумму для каждого товара отдельно
          const serviceAmount = item.services.reduce(
            (acc: number, service: any) => acc + Number(service.sum || 0),
            0
          );
          const productAmount = item.products.reduce(
            (acc: number, product: any) => acc + Number(product.sum || 0),
            0
          );
          const itemTotalAmount = serviceAmount + productAmount;

          // Применяем исторический курс к сумме товара
          const itemTransformedAmount =
            historicalRate > 0
              ? historicalRate * itemTotalAmount
              : itemTotalAmount;
          totalTransformedAmount += itemTransformedAmount;

          // Конвертируем paid_sum с учетом исторического курса
          const itemPaidSum = convertAmount(
            item.paid_sum || 0,
            currentValue,
            item.created_at
          );
          totalPaidSumInCurrentCurrency += itemPaidSum;
        });

        const remainingToPay =
          totalTransformedAmount - totalPaidSumInCurrentCurrency;

        // Для операций с балансом подставляем баланс контрагента, но не больше суммы к оплате
        if (isBalanceOperation && selectedCounterpartyData?.data?.ross_coin) {
          const counterpartyBalance = Number(
            selectedCounterpartyData.data.ross_coin
          );
          const amountToSet = Math.min(counterpartyBalance, remainingToPay);

          // Set form fields: 'amount' and 'paid_sum'
          formProps.form.setFieldsValue({
            amount: amountToSet,
            paid_sum: remainingToPay,
          });
        } else {
          // Set form fields: 'amount' and 'paid_sum'
          formProps.form.setFieldsValue({
            amount: remainingToPay,
            paid_sum: remainingToPay,
          });
        }
      } else {
        // If not an agent operation, reset agent-specific fields
        const currentValues: any = formProps.form.getFieldsValue();

        const resetValues = Object.keys(currentValues).reduce(
          (acc: any, key: any) => {
            if (
              key === "income" ||
              key === "type_operation" ||
              key === "date" ||
              key === "type" ||
              key === "type_currency" || // Keep currency selection
              key === "bank_id" || // Keep bank selection
              key === "method_payment" || // Keep payment method
              key === "comment" // Keep comment
            ) {
              acc[key] = currentValues[key];
            } else {
              acc[key] = undefined; // Reset other fields
            }
            return acc;
          },
          {}
        );

        formProps.form.setFieldsValue(resetValues);
      }
    }
  }, [
    isAgent,
    selectedRows,
    currency.data,
    change,
    bolik,
    selectedCurrency,
    isBalanceOperation,
    selectedCounterpartyData,
  ]); // Added selectedCurrency to dependencies

  // Select properties for the bank dropdown
  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  // Function to convert amount based on selected currency and optional date for historical rate
  const convertAmount = (
    amount: number,
    targetCurrency: string,
    createdAt?: string
  ) => {
    if (!targetCurrency || !currency.data) return amount;

    const currencyData = currency.data.find(
      (item: any) => item.name === targetCurrency
    );

    // Если передана дата, используем исторический курс, иначе текущий
    const rate = createdAt
      ? getHistoricalRate(currencyData, createdAt)
      : currencyData?.rate || 0;

    // Convert from rubles to target currency
    return rate * amount;
  };

  // Fetch counterparty data (currently not fully utilized for setting form fields, but available)
  const { data: counterpartyData } = useOne({
    resource: "counterparty",
    id: selectedReceipientId ?? "",
    queryOptions: {
      enabled: !!selectedReceipientId,
    },
  });

  const currentDateDayjs = dayjs(); // Get current date for default value

  // Set counterparty name and default date when data is available
  useEffect(() => {
    if (counterpartyData && counterpartyData.data) {
      // @ts-ignore
      formProps.form.setFieldsValue({
        name: counterpartyData.data.name,
      });
    }
    if (formProps.form) {
      formProps.form.setFieldsValue({
        date: currentDateDayjs,
      });
    }
  }, [counterpartyData, formProps.form]);

  // Set default type_operation on component mount
  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        type_operation: "Извне",
      });
    }
  }, []);

  // Set default bank and payment method when bank data is loaded
  useEffect(() => {
    if (
      formProps.form &&
      bankSelectProps.options &&
      bankSelectProps.options.length > 0
    ) {
      // Выбираем первый банк из списка
      const firstBank = bankSelectProps.options[0];
      formProps.form.setFieldsValue({
        bank_id: firstBank.value,
        method_payment: "Оплата наличными", // Устанавливаем метод оплаты по умолчанию
      });
    }
  }, [formProps.form, bankSelectProps.options]);

  // Обработка URL параметров для автоматической установки типа операции и выбора товаров
  useEffect(() => {
    const typeOperation = searchParams.get("type_operation");
    const goodsIds = searchParams.get("goods_ids");

    if (formProps.form && typeOperation) {
      formProps.form.setFieldsValue({
        type_operation: typeOperation,
      });

      // Если тип операции "Контрагент оптом" или "Контрагент частично", активируем режим агента
      if (
        typeOperation === "Контрагент оптом" ||
        typeOperation === "Контрагент частично" ||
        typeOperation === "Контрагент частично с баланса"
      ) {
        setIsAgent(true);
        // Для частичного контрагента включаем режим одиночного выбора
        if (
          typeOperation === "Контрагент частично" ||
          typeOperation === "Контрагент частично с баланса"
        ) {
          setBolik(true);
        }
        // Для операций с балансом включаем режим баланса
        if (typeOperation === "Контрагент частично с баланса") {
          setIsBalanceOperation(true);
          // Автоматически устанавливаем рубль для операций с балансом
          formProps.form.setFieldValue("type_currency", "Рубль");
          setSelectedCurrency("Рубль");
          // Автоматически устанавливаем метод оплаты балансом
          formProps.form.setFieldValue("method_payment", "Оплата балансом");
        }
      }
    }

    // Устанавливаем предварительно выбранные товары для загрузки
    if (goodsIds) {
      const idsArray = goodsIds.split(",").map((id) => parseInt(id.trim()));
      setPreselectedGoodsIds(idsArray);
    }

    // Синхронизируем selectedCurrency с текущим значением формы
    const currentCurrency = formProps.form?.getFieldValue("type_currency");
    if (currentCurrency) {
      setSelectedCurrency(currentCurrency);
    }
  }, [formProps.form, searchParams]);

  // Отдельный useEffect для автоматического выбора товаров после их загрузки
  useEffect(() => {
    if (preselectedGoodsIds.length > 0 && data?.data?.data) {
      const goodsToSelect = data.data.data.filter((good: any) =>
        preselectedGoodsIds.includes(good.id)
      );

      setSelectedRowKeys(preselectedGoodsIds);
      setSelectedRows(goodsToSelect);

      // Автоматически выбираем контрагента на основе первого товара
      if (goodsToSelect.length > 0 && formProps.form) {
        const firstGood = goodsToSelect[0];
        // Выбираем отправителя как контрагента
        if (firstGood.sender?.id) {
          formProps.form.setFieldsValue({
            sender_id: firstGood.sender.id,
          });
        }
      }
    }
  }, [data?.data?.data, preselectedGoodsIds, formProps.form]);

  // Принудительное обновление данных при изменении preselectedGoodsIds
  useEffect(() => {
    if (preselectedGoodsIds.length > 0) {
      refetch();
    }
  }, [preselectedGoodsIds, refetch]);

  // Handle sender selection change
  const handleSenderChange = (value: any, record: any) => {
    setSelectedType(
      record.label.split("/")[1] === "." ? "sender" : "recipient"
    );
    setSelectedRows([]); // Clear selected rows when sender changes
    setSelectedRowKeys([]); // Clear selected row keys
    setChange(change + 1); // Trigger recalculation

    // Для операций с балансом сохраняем выбранного контрагента
    if (isBalanceOperation) {
      setSelectedCounterparty(value);
    }
  };

  const paymentTypes = [
    "Оплата наличными",
    "Оплата переводом",
    "Оплата перечислением",
    "Оплата балансом",
  ];

  const incomeTypes = [
    "Извне",
    "Контрагент оптом",
    "Контрагент частично",
    "Контрагент частично с баланса",
  ];

  // Handle table pagination, filtering, and sorting
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const dataSource = data?.data?.data;

  // Table props configuration
  const tableProps = {
    type: "radio" as const, // Although we handle multi-select with checkboxes, Antd Table `type` can be used for built-in radio
    dataSource: dataSource?.filter((item: any) => item.id !== 64),
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
    rowClassName: (record: any) => {
      return selectedRowKeys.includes(record.id)
        ? "ant-table-row-selected"
        : "";
    },
  };

  // Content for the date picker dropdown
  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setFilters([
            {
              created_at: {
                $gte: dateStrings[0],
                $lte: dateStrings[1],
              },
            },
          ]);
        } else {
          setFilters([]); // Clear date filter if dates are cleared
        }
      }}
    />
  );

  // Content for the sort dropdown
  const sortContent = (
    <Card style={{ width: 200, padding: "0px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            marginBottom: "8px",
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Сортировать по
        </div>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "counterparty.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("counterparty.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По фио{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const handleRowSelect = (record: any) => {
    if (!bolik) {
      const alreadySelected = selectedRowKeys.includes(record.id);

      if (alreadySelected) {
        setSelectedRowKeys(selectedRowKeys.filter((id) => id !== record.id));
        setSelectedRows(selectedRows.filter((row) => row.id !== record.id));
      } else {
        setSelectedRowKeys([...selectedRowKeys, record.id]);
        setSelectedRows([...selectedRows, record]);
      }
    } else {
      setSelectedRowKeys([record.id]);
      setSelectedRows([record]);
    }
  };

  useEffect(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [bolik]);

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          const confirmed = window.confirm("Вы уверены, что хотите сохранить?");
          if (confirmed) {
            form.setFieldValue("type", "income");
            saveButtonProps.onClick && saveButtonProps.onClick();
          }
        },
      }}
      title={<h4 style={{ margin: 0 }}>Добавить приход</h4>}
    >
      <Form
        {...formProps}
        layout="vertical"
        style={{ marginBottom: 0 }}
        initialValues={{
          type: "income",
        }}
        onFinish={(values: any) => {
          // --- Validation for agent operations - товар должен быть выбран ---
          if (isAgent && selectedRows.length === 0) {
            message.error(
              "Для операций с контрагентом необходимо выбрать хотя бы один товар."
            );
            return; // Prevent form submission
          }

          // --- Validation for "Контрагент частично" (Partial Payment) ---
          // This ensures the user cannot pay more than the remaining balance for a single item.
          if (bolik && selectedRows.length === 1) {
            const selectedGood = selectedRows[0];
            let rate = 0;
            const selectedCurrency = values.type_currency;
            if (selectedCurrency) {
              rate =
                currency.data?.find(
                  (item: any) => item.name === selectedCurrency
                )?.rate || 0;
            }

            // Calculate the total actual amount of the selected good (services + products)
            const totalGoodAmount =
              selectedGood.services.reduce(
                (acc: number, service: any) => acc + Number(service.sum || 0),
                0
              ) +
              selectedGood.products.reduce(
                (acc: number, product: any) => acc + Number(product.sum || 0),
                0
              );

            // Calculate the remaining amount due for this specific good, considering currency rate
            const remainingAmount =
              (rate > 0 ? rate * totalGoodAmount : totalGoodAmount) -
              (selectedGood?.paid_sum || 0);

            // Check if the user-entered amount exceeds the remaining amount
            if (values.amount > remainingAmount) {
              message.error(
                "Сумма к оплате не может превышать оставшуюся сумму."
              );
              return; // Prevent form submission
            }

            // Additional validation for balance operations
            if (
              isBalanceOperation &&
              selectedCounterpartyData?.data?.ross_coin
            ) {
              const counterpartyBalance = Number(
                selectedCounterpartyData.data.ross_coin
              );
              if (values.amount > counterpartyBalance) {
                message.error(
                  "Сумма к оплате не может превышать баланс контрагента."
                );
                return; // Prevent form submission
              }
            }
          }
          // --- End Validation ---

          // Проверяем, если это оптовая оплата с несколькими товарами
          if (
            values.type_operation === "Контрагент оптом" &&
            selectedRows.length > 1
          ) {
            // Для оптовой оплаты создаем отдельные записи для каждого товара
            // и не создаем основную запись
            createMultipleCashDeskEntries(values);
            return; // Не продолжаем обычную логику создания
          }

          const finalValues = {
            ...values,
            type: "income",
            // counterparty_id is set based on the sender_id selected in the form
            counterparty_id: formProps?.form?.getFieldValue("sender_id"),
          };

          // If it's an agent operation, link the cash desk entry to the first selected good
          // (For "Контрагент частично", this will be the single selected good)
          // (For "Контрагент оптом" с одним товаром, this will link to that single good)
          if (isAgent && selectedRows.length > 0) {
            //@ts-ignore
            finalValues.good_id = selectedRows[0]?.id; // Link to the first selected good's ID
          }

          formProps.onFinish && formProps.onFinish(finalValues); // Proceed with form submission
        }}
      >
        <Form.Item name="type" hidden={true} initialValue="income">
          <Input />
        </Form.Item>

        <Row gutter={[16, 2]}>
          <Col span={4}>
            <Form.Item
              label="Дата поступление"
              name="date"
              style={{ marginBottom: 5 }}
            >
              <DatePicker
                disabled={true} // Date is disabled and set to current date
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Банк"
              name={["bank_id"]}
              rules={[{ required: true, message: "Пожалуйста, выберите Банк" }]}
              style={{ marginBottom: 5 }}
            >
              <Select
                {...bankSelectProps}
                placeholder="Выберите код банк"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Вид прихода"
              name="type_operation"
              rules={[
                {
                  required: true,
                  message: "Пожалуйста, выберите вид прихода",
                },
              ]}
              style={{ marginBottom: 5 }}
            >
              <Select
                options={incomeTypes.map((enumValue) => ({
                  label: enumValue,
                  value: enumValue,
                }))}
                placeholder="Выберите вид прихода"
                style={{ width: "100%" }}
                onChange={(e) => {
                  // Set isAgent based on selection
                  setIsAgent(
                    e === "Контрагент оптом" ||
                      e === "Контрагент частично" ||
                      e === "Контрагент частично с баланса"
                  );
                  // Set bolik for "Контрагент частично" to enable single selection
                  setBolik(
                    e === "Контрагент частично" ||
                      e === "Контрагент частично с баланса"
                  );
                  // Set balance operation flag
                  setIsBalanceOperation(e === "Контрагент частично с баланса");

                  // Reset counterparty selection when changing operation type
                  if (e !== "Контрагент частично с баланса") {
                    setSelectedCounterparty(null);
                  }

                  // Auto-set currency to Ruble for balance operations
                  if (e === "Контрагент частично с баланса") {
                    form.setFieldValue("type_currency", "Рубль");
                    setSelectedCurrency("Рубль");
                    form.setFieldValue("method_payment", "Оплата балансом");
                  }
                }}
              />
              {form?.getFieldValue("type_operation") === "Контрагент оптом" &&
                selectedRows.length > 1 && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#1890ff",
                      marginTop: "4px",
                    }}
                  >
                    ℹ️ Будет создано {selectedRows.length} отдельных записей
                    оплаты для каждого товара
                  </div>
                )}
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Метод оплаты"
              name="method_payment"
              rules={[
                {
                  required: true,
                  message: "Пожалуйста, выберите метод оплаты",
                },
              ]}
              style={{ marginBottom: 5 }}
            >
              <Select
                disabled={isBalanceOperation} // Disabled for balance operations
                options={
                  isBalanceOperation
                    ? [{ label: "Оплата балансом", value: "Оплата балансом" }] // Only balance payment for balance operations
                    : paymentTypes.map((enumValue) => ({
                        label: enumValue,
                        value: enumValue,
                      }))
                }
                placeholder="Выберите метод оплаты"
                style={{ width: "100%" }}
              />
            </Form.Item>
            {isBalanceOperation && (
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "-5px" }}
              >
                ℹ️ Доступна только оплата балансом
              </div>
            )}
          </Col>
          {isAgent && (
            <>
              <Col span={10}>
                <Form.Item
                  label="Код клиента"
                  name="sender_id"
                  rules={[
                    {
                      required: true,
                      message: "Пожалуйста, выберите клиента",
                    },
                  ]}
                  style={{ marginBottom: 5 }}
                >
                  <Select
                    {...senderSelectProps}
                    onChange={handleSenderChange}
                    placeholder="Выберите клиента"
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={false}
                  />
                </Form.Item>
              </Col>
            </>
          )}
          <Col span={isAgent ? 7 : 12}>
            <Form.Item
              name="type_currency"
              label="Валюта"
              rules={[{ required: true, message: "Выберите Валюту" }]}
              style={{ marginBottom: 5 }}
            >
              <Select
                showSearch
                loading={currencyLoading}
                disabled={currencyLoading || isBalanceOperation} // Disabled for balance operations
                placeholder="Выберите валюту"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value) => {
                  setSelectedCurrency(value); // Update selected currency for table display
                  setChange(change + 1); // Trigger re-calculation on currency change
                  // The main logic for amount calculation is in the useEffect,
                  // this handler just ensures that effect runs.
                }}
                options={
                  isBalanceOperation
                    ? [{ label: "Рубль", value: "Рубль" }] // Only rubles for balance operations
                    : Object.values(CurrencyType).map((item: any) => ({
                        label: `${item}`,
                        value: item,
                      }))
                }
              />
            </Form.Item>
            {isBalanceOperation && (
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "-5px" }}
              >
                ℹ️ Для операций с балансом доступны только рубли
              </div>
            )}
          </Col>
          <Col span={isAgent ? 4 : 12}>
            <Form.Item
              label="Сумма для прихода"
              name="amount"
              rules={[{ required: true, message: "Укажите сумму" }]}
              style={{ marginBottom: 5 }}
            >
              <Input
                type="number"
                disabled={isAgent && !bolik} // Disabled if agent AND NOT partial payment (bolik)
                min={0}
                max={
                  isBalanceOperation &&
                  selectedCounterpartyData?.data?.ross_coin
                    ? Number(selectedCounterpartyData.data.ross_coin)
                    : undefined
                }
                placeholder="Введите сумму прихода"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          {isAgent && (
            <Col span={3}>
              <Form.Item
                label="Сумма к оплате"
                name="paid_sum"
                style={{ marginBottom: 5 }}
              >
                <Input
                  type="number"
                  disabled // This field is always disabled as it displays the calculated remaining amount
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          )}
          {isBalanceOperation && selectedCounterpartyData?.data && (
            <Col span={24}>
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#f0f2f5",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                <strong>Баланс контрагента:</strong>{" "}
                {selectedCounterpartyData.data.ross_coin || 0} руб
              </div>
            </Col>
          )}
          <Col span={12}>
            <Form.Item
              label="Комментарий"
              name="comment"
              rules={[{ required: false }]}
              style={{ marginBottom: 5 }}
            >
              <TextArea
                placeholder="Комментарий"
                style={{ width: "100%", height: 63 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Чек">
              <Form.Item name="check_file" noStyle>
                <Upload.Dragger
                  name="file"
                  action={`${API_URL}/file-upload`} // Your upload endpoint
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  beforeUpload={(file) => {
                    // Create FormData to send the file
                    const formData = new FormData();
                    formData.append("file", file);

                    // Send request to server to get file path
                    fetch(`${API_URL}/file-upload`, {
                      method: "POST",
                      body: formData,
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        // Assuming the server returns an object with the file path
                        const filePath = data.path || data.url || data.filePath;
                        // Set the file path in the form field
                        if (formProps.form) {
                          formProps.form.setFieldsValue({
                            check_file: filePath,
                          });
                        }
                      })
                      .catch((error) => {
                        console.error("Ошибка загрузки файла:", error);
                      });

                    // Prevent Ant Design's default upload behavior
                    return false;
                  }}
                >
                  <p className="ant-upload-text">
                    <PaperClipOutlined /> Прикрепить чек
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {isAgent && (
        <>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space size="middle">
                <Dropdown
                  overlay={sortContent}
                  trigger={["click"]}
                  placement="bottomLeft"
                  open={sorterVisible}
                  onOpenChange={(visible) => {
                    setSorterVisible(visible);
                  }}
                >
                  <Button
                    icon={
                      sortDirection === "ASC" ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )
                    }
                  ></Button>
                </Dropdown>
              </Space>
            </Col>
            <Col flex="auto">
              <Input
                placeholder="Поиск по номеру накладной"
                prefix={<SearchOutlined />}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setFilters([]); // Clear filters if search is empty
                    return;
                  }

                  setFilters([
                    {
                      $or: [
                        { invoice_number: { $contL: value } },
                        { "sender.clientCode": { $contL: value } },
                        { "recipient.clientCode": { $contL: value } },
                        { "sender.name": { $contL: value } },
                        { "recipient.name": { $contL: value } },
                      ],
                    },
                  ]);
                }}
              />
            </Col>
            <Col>
              <Dropdown
                overlay={datePickerContent}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  icon={<CalendarOutlined />}
                  className="date-picker-button"
                >
                  Дата
                </Button>
              </Dropdown>
            </Col>
          </Row>

          <Table
            {...tableProps}
            rowKey="id"
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => {
                handleRowSelect(record); // Handle row click for selection
              },
              style: { cursor: "pointer" },
            })}
          >
            <Table.Column
              title=""
              dataIndex="id"
              render={(value) => (
                <Checkbox
                  // This checkbox visualizes selection; the actual selection is handled by onRow onClick
                  checked={selectedRowKeys.includes(value)}
                />
              )}
            />
            <Table.Column
              title="№"
              render={(_: any, __: any, index: number) => {
                return (data?.data?.page - 1) * pageSize + index + 1;
              }}
            />
            <Table.Column
              dataIndex="created_at"
              title="Дата приемки"
              render={(value) =>
                value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
              }
            />
            <Table.Column dataIndex="invoice_number" title="№ накладной" />
            <Table.Column
              dataIndex="employee"
              title="Пункт приема"
              render={(value) =>
                `${value?.branch?.name}, ${value?.under_branch?.address || ""}`
              }
            />
            <Table.Column
              dataIndex="sender"
              title="Код отправителя"
              render={(value) => {
                return value?.clientPrefix + "-" + value?.clientCode;
              }}
            />
            <Table.Column
              dataIndex="sender"
              title="Фио отправителя"
              render={(value) => value?.name}
            />
            <Table.Column
              dataIndex="recipient"
              title="Код получателя"
              render={(value) => {
                return value?.clientPrefix + "-" + value?.clientCode;
              }}
            />
            <Table.Column
              dataIndex="recipient"
              title="Фио получателя"
              render={(value) => value?.name}
            />
            <Table.Column
              dataIndex="destination"
              render={(value) => value?.name}
              title="Пункт назначения"
            />
            <Table.Column
              dataIndex="totalServiceWeight"
              title="Вес"
              render={(value) => value.toFixed(2) + " кг"}
            />
            <Table.Column
              dataIndex="services"
              title="Кол-во мешков"
              render={(value) => value?.length + " шт"}
            />
            <Table.Column
              dataIndex="totalServiceAmountSum"
              title="Сумма"
              render={(_, record: any) => {
                const totalAmount =
                  Number(record.totalServiceAmountSum) +
                  Number(record.totalProductAmountSum);
                const convertedAmount = convertAmount(
                  totalAmount,
                  selectedCurrency,
                  record.created_at
                );
                const currencySymbol =
                  selectedCurrency === "Доллар"
                    ? "USD"
                    : selectedCurrency === "Рубль"
                    ? "руб"
                    : "сом";
                return `${convertedAmount.toFixed(2)} ${currencySymbol}`;
              }}
            />
            <Table.Column
              dataIndex="paid_sum"
              title="Оплачено"
              render={(value, record: any) => {
                const paidAmount = value || 0;
                const convertedPaidAmount = convertAmount(
                  paidAmount,
                  selectedCurrency,
                  record.created_at
                );
                const currencySymbol =
                  selectedCurrency === "Доллар"
                    ? "USD"
                    : selectedCurrency === "Рубль"
                    ? "руб"
                    : "сом";
                return `${convertedPaidAmount.toFixed(2)} ${currencySymbol}`;
              }}
            />
            <Table.Column
              dataIndex="employee"
              title="Сотрудник"
              render={(value) => {
                return `${value?.firstName}-${value?.lastName}`;
              }}
            />
            <Table.Column dataIndex="comments" title="Комментарий" />
          </Table>
        </>
      )}
    </Create>
  );
};
