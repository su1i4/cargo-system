import React, { useEffect, useRef, useState } from "react";
import { Create, useSelect, useForm } from "@refinedev/antd";
import {
  useCustom,
  useNavigation,
  useOne,
  useUpdateMany,
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
  PrinterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../App";
import TextArea from "antd/lib/input/TextArea";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";
import { useReactToPrint } from "react-to-print";
import { PrintContent } from "./print-content";

dayjs.extend(utc);
dayjs.extend(timezone);

// Экспорт типа валют для использования в модальных окнах
export const CurrencyType = {
  Сом: "Сом",
  Рубль: "Рубль", 
  Доллар: "Доллар"
};

const getHistoricalRate = (currency: any, targetDate: string) => {
  if (!currency?.currency_history || !targetDate) {
    return currency?.rate || 1;
  }

  const sortedHistory = [...currency.currency_history].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const targetDateTime = new Date(targetDate).getTime();

  for (const historyRecord of sortedHistory) {
    const historyDateTime = new Date(historyRecord.created_at).getTime();
    if (historyDateTime <= targetDateTime) {
      return historyRecord.rate;
    }
  }

  return sortedHistory[sortedHistory.length - 1]?.rate || currency?.rate || 1;
};



export const CashDeskCreate: React.FC = () => {
  const { push } = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [preselectedGoodsIds, setPreselectedGoodsIds] = useState<number[]>([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState<any>(null);
  const [isSubmit, setIsSubmit] = useState(false);
  const [showBagDetails, setShowBagDetails] = useState(false);

  // Print functionality
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Накладная ${dayjs().format("DD.MM.YYYY HH:mm")}`,
  });

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: async (data: any, variables, context) => {
        refetch();
        push("/income");
      },
    },
  });

  const createBulkIncomeEntries = async (formValues: any) => {
    setIsSubmit(true);
    const totalItems = selectedRows.length;

    notification.info({
      message: "Создание оплат",
      description: `Создается bulk оплата для ${totalItems} товаров...`,
      duration: 3,
    });

    const selectedCurrency = formValues.type_currency;
    const selectedCurrencyData = currency.data?.find(
      (item: any) => item.name === selectedCurrency
    );

    const bulkData = selectedRows.map((good: any) => {
      const historicalRate = getHistoricalRate(
        selectedCurrencyData,
        good.created_at
      );

      const totalGoodAmount = Number(good?.amount);
      const transformAmount =
        historicalRate > 0 ? historicalRate * totalGoodAmount : totalGoodAmount;
      const remainingToPay = transformAmount - (good?.paid_sum || 0);

      return {
        bank_id: formValues.bank_id,
        type_currency: formValues.type_currency,
        amount: remainingToPay,
        type: "income",
        good_id: good.id,
        date: formValues.date,
        counterparty_id: formValues.sender_id,
        comment: formValues.comment || "",
        method_payment: formValues.method_payment || "",
      };
    });

    try {
      const response = await fetch(`${API_URL}/cash-desk/income-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify(bulkData),
      });

      if (!response.ok) {
        message.error("Ошибка при создании bulk оплаты");
        return;
      }

      notification.success({
        message: "Bulk оплата создана успешно",
        description: `Успешно создана bulk оплата для ${totalItems} товаров`,
        duration: 4,
      });
      push("/income");
    } catch (error) {
      notification.error({
        message: "Ошибка при создании bulk оплаты",
        description: "Не удалось создать bulk оплату. Попробуйте снова.",
        duration: 4,
      });
    } finally {
      setIsSubmit(false);
    }
    setIsSubmit(false);
  };

  const { formProps, saveButtonProps, form } = useForm({
    onMutationSuccess(data, variables, context, isAutoSave) {
      const id = data?.data?.id;
      if (selectedRowKeys.length > 0) {
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            operation_id: id,
          },
        });
      } else {
        navigate("/income");
      }
    },
    resource: "cash-desk",
    redirect: false,
    //@ts-ignore
    defaultValues: {
      type: "income",
      type_operation: "Извне",
      date: dayjs(),
      type_currency: "Сом",
    },
  });

  const [isAgent, setIsAgent] = useState(false);
  const [sorterVisible, setSorterVisible] = useState(false);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [filters, setFilters] = useState<any>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [change, setChange] = useState(0);
  const [bolik, setBolik] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("Сом");
  const [isBalanceOperation, setIsBalanceOperation] = useState(false);
  const [branchFilter, setBranchFilter] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<any>(null);

  const { data: currency = { data: [] }, isLoading: currencyLoading } =
    useCustom<any>({
      url: `${API_URL}/currency`,
      method: "get",
    });

  // Добавляем select для городов
  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
  });

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedReceipientId, setSelectedReceipientId] = useState<
    string | null
  >(null);

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

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildGoodsQuery(),
    },
  });

  const { selectProps: senderSelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) =>
      `${item.name} ${item.clientPrefix}-${item.clientCode}/${
        item.type === "sender" ? "." : ","
      }`,
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

  const { data: selectedCounterpartyData } = useOne({
    resource: "counterparty",
    id: selectedCounterparty ?? "",
    queryOptions: {
      enabled: !!selectedCounterparty && isBalanceOperation,
    },
  });

  useEffect(() => {
    if (form && currency.data && currency.data.length > 0) {
      form.setFieldValue("type", "income");
      
      // Ищем "Сом" в списке валют, если нет - берем "Рубль"
      const hasSom = currency.data.some((item: any) => item.name === "Сом");
      const defaultCurrency = hasSom ? "Сом" : "Рубль";
      
      form.setFieldValue("type_currency", defaultCurrency);
      setSelectedCurrency(defaultCurrency);
    }
  }, [form, currency.data]);

  useEffect(() => {
    if (formProps.form) {
      if (isAgent) {
        const currentValue: any = formProps.form.getFieldValue("type_currency");
        const selectedCurrencyData = currency.data?.find(
          (item: any) => item.name === currentValue
        );

        let totalTransformedAmount = 0;
        let totalPaidSumInCurrentCurrency = 0;

        selectedRows.forEach((item: any) => {
          const historicalRate = getHistoricalRate(
            selectedCurrencyData,
            item.created_at
          );

          const itemTotalAmount = Number(item?.amount);

          const itemTransformedAmount =
            historicalRate > 0
              ? historicalRate * itemTotalAmount
              : itemTotalAmount;
          totalTransformedAmount += itemTransformedAmount;

          const itemPaidSum = convertAmount(
            item.paid_sum || 0,
            currentValue,
            item.created_at
          );
          totalPaidSumInCurrentCurrency += itemPaidSum;
        });

        const remainingToPay =
          totalTransformedAmount - totalPaidSumInCurrentCurrency;

        if (isBalanceOperation && selectedCounterpartyData?.data?.ross_coin) {
          const counterpartyBalance = Number(
            selectedCounterpartyData.data.ross_coin
          );
          const amountToSet = Math.min(counterpartyBalance, remainingToPay);

          formProps.form.setFieldsValue({
            amount: amountToSet,
            paid_sum: remainingToPay,
          });
        } else {
          formProps.form.setFieldsValue({
            amount: remainingToPay,
            paid_sum: remainingToPay,
          });
        }
      } else {
        const currentValues: any = formProps.form.getFieldsValue();

        const resetValues = Object.keys(currentValues).reduce(
          (acc: any, key: any) => {
            if (
              key === "income" ||
              key === "type_operation" ||
              key === "date" ||
              key === "type" ||
              key === "type_currency" ||
              key === "bank_id" ||
              key === "method_payment" ||
              key === "comment"
            ) {
              acc[key] = currentValues[key];
            } else {
              acc[key] = undefined;
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
  ]);

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const convertAmount = (
    amount: number,
    targetCurrency: string,
    createdAt?: string
  ) => {
    if (!targetCurrency || !currency.data) return amount;

    const currencyData = currency.data.find(
      (item: any) => item.name === targetCurrency
    );

    const rate = createdAt
      ? getHistoricalRate(currencyData, createdAt)
      : currencyData?.rate || 0;

    return rate * amount;
  };

  const { data: counterpartyData } = useOne({
    resource: "counterparty",
    id: selectedReceipientId ?? "",
    queryOptions: {
      enabled: !!selectedReceipientId,
    },
  });

  const currentDateDayjs = dayjs();

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

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        type_operation: "Извне",
      });
    }
  }, []);

  useEffect(() => {
    if (
      formProps.form &&
      bankSelectProps.options &&
      bankSelectProps.options.length > 0
    ) {
      const firstBank = bankSelectProps.options[0];
      formProps.form.setFieldsValue({
        bank_id: firstBank.value,
        method_payment: "Оплата наличными",
      });
    }
  }, [formProps.form, bankSelectProps.options]);

  useEffect(() => {
    const typeOperation = searchParams.get("type_operation");
    const goodsIds = searchParams.get("goods_ids");

    if (formProps.form && typeOperation) {
      formProps.form.setFieldsValue({
        type_operation: typeOperation,
      });

      if (
        typeOperation === "Контрагент оптом" ||
        typeOperation === "Контрагент частично" ||
        typeOperation === "Контрагент частично с баланса"
      ) {
        setIsAgent(true);
        if (
          typeOperation === "Контрагент частично" ||
          typeOperation === "Контрагент частично с баланса"
        ) {
          setBolik(true);
        }
        if (typeOperation === "Контрагент частично с баланса") {
          setIsBalanceOperation(true);
          formProps.form.setFieldValue("type_currency", "Рубль");
          setSelectedCurrency("Рубль");
          formProps.form.setFieldValue("method_payment", "Оплата балансом");
        }
      }
    }

    if (goodsIds) {
      const idsArray = goodsIds.split(",").map((id) => parseInt(id.trim()));
      setPreselectedGoodsIds(idsArray);
    }

    const currentCurrency = formProps.form?.getFieldValue("type_currency");
    if (currentCurrency) {
      setSelectedCurrency(currentCurrency);
    }
  }, [formProps.form, searchParams]);

  useEffect(() => {
    if (preselectedGoodsIds.length > 0 && data?.data?.data) {
      const goodsToSelect = data.data.data.filter((good: any) =>
        preselectedGoodsIds.includes(good.id)
      );

      setSelectedRowKeys(preselectedGoodsIds);
      setSelectedRows(goodsToSelect);

      if (goodsToSelect.length > 0 && formProps.form) {
        const firstGood = goodsToSelect[0];
        if (firstGood.sender?.id) {
          formProps.form.setFieldsValue({
            sender_id: firstGood.sender.id,
          });
        }
      }
    }
  }, [data?.data?.data, preselectedGoodsIds, formProps.form]);

  useEffect(() => {
    if (preselectedGoodsIds.length > 0) {
      refetch();
    }
  }, [preselectedGoodsIds, refetch]);

  useEffect(() => {
    const allFilters = [
      branchFilter,
      searchFilter,
      dateFilter,
    ].filter(Boolean);

    setFilters(allFilters);
  }, [branchFilter, searchFilter, dateFilter]);

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const handleSenderChange = (value: any, record: any) => {
    setSelectedCounterparty(record);
    setSelectedType(
      record.label.split("/")[1] === "." ? "sender" : "recipient"
    );
    setSelectedRows([]);
    setSelectedRowKeys([]);
    setChange(change + 1);

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

  const tableProps = {
    type: "radio" as const,
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

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setDateFilter([
            {
              created_at: {
                $gte: dateStrings[0],
                $lte: dateStrings[1],
              },
            },
          ]);
        } else {
          setDateFilter([]);
        }
      }}
    />
  );

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

  // Print handler
  const handlePrint = () => {
    if (!data || !data.data || !data.data.data) {
      message.warning("Нет данных для печати");
      return;
    }

    // Structure the data for PrintContent component
    const printDataStructure = {
      data: {
        data: data.data.data,
      },
    };

    setPrintData(printDataStructure);

    // Give time for state to update before printing
    setTimeout(() => {
      reactToPrint();
    }, 300);
  };

  console.log(isSubmit, "isSubmit");

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          if (isSubmit) return;
          const confirmed =
            formProps.form?.getFieldValue("type_operation") ===
            "Контрагент оптом"
              ? true
              : window.confirm("Вы уверены, что хотите сохранить?");
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
          if (isSubmit) return;
          if (isAgent && selectedRows.length === 0) {
            message.error(
              "Для операций с контрагентом необходимо выбрать хотя бы один товар."
            );
            return;
          }

          if (bolik && selectedRows.length === 1) {
            const selectedGood = selectedRows[0];
            const selectedCurrency = values.type_currency;
            const selectedCurrencyData = currency.data?.find(
              (item: any) => item.name === selectedCurrency
            );
            
            const historicalRate = getHistoricalRate(
              selectedCurrencyData,
              selectedGood.created_at
            );

            const totalGoodAmount = Number(selectedGood?.amount);
            const remainingAmount =
              (historicalRate > 0 ? historicalRate * totalGoodAmount : totalGoodAmount) -
              (selectedGood?.paid_sum || 0);

            if (values.amount > remainingAmount) {
              message.error(
                "Сумма к оплате не может превышать оставшуюся сумму."
              );
              return;
            }

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
                return;
              }
            }
          }

          if (
            values.type_operation === "Контрагент оптом" &&
            selectedRows.length > 1
          ) {
            createBulkIncomeEntries(values);
            return;
          }

          const finalValues = {
            ...values,
            type: "income",
            counterparty_id: formProps?.form?.getFieldValue("sender_id"),
          };

          if (isAgent && selectedRows.length > 0) {
            //@ts-ignore
            finalValues.good_id = selectedRows[0]?.id;
          }

          formProps.onFinish && formProps.onFinish(finalValues);
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
                disabled={true}
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
                  setIsAgent(
                    e === "Контрагент оптом" ||
                      e === "Контрагент частично" ||
                      e === "Контрагент частично с баланса"
                  );
                  setBolik(
                    e === "Контрагент частично" ||
                      e === "Контрагент частично с баланса"
                  );
                  setIsBalanceOperation(e === "Контрагент частично с баланса");

                  if (e !== "Контрагент частично с баланса") {
                    setSelectedCounterparty(null);
                  }

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
                disabled={isBalanceOperation}
                options={
                  isBalanceOperation
                    ? [{ label: "Оплата балансом", value: "Оплата балансом" }]
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
                disabled={currencyLoading || isBalanceOperation}
                placeholder="Выберите валюту"
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value) => {
                  setSelectedCurrency(value);
                  setChange(change + 1);
                }}
                options={
                  isBalanceOperation
                    ? [{ label: "Рубль", value: "Рубль" }]
                    : currency.data?.map((item: any) => ({
                        label: item.name,
                        value: item.name,
                      })) || []
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
                disabled={isAgent && !bolik}
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
                <Input type="number" disabled style={{ width: "100%" }} />
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
                  action={`${API_URL}/file-upload`}
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  beforeUpload={(file) => {
                    const formData = new FormData();
                    formData.append("file", file);

                    fetch(`${API_URL}/file-upload`, {
                      method: "POST",
                      body: formData,
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        const filePath = data.path || data.url || data.filePath;
                        if (formProps.form) {
                          formProps.form.setFieldsValue({
                            check_file: filePath,
                          });
                        }
                      })
                      .catch((error) => {
                        console.error("Ошибка загрузки файла:", error);
                      });

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
            <Col>
              <Select
                placeholder="Выберите город"
                style={{ width: 200 }}
                allowClear
                {...branchSelectProps}
                onChange={(value) => {
                  if (value) {
                    setBranchFilter([
                      {
                        "destination.id": {
                          $eq: value,
                        },
                      },
                    ]);
                  } else {
                    setBranchFilter([]);
                  }
                }}
              />
            </Col>
            <Col flex="auto">
              <Input
                placeholder="Поиск по номеру накладной"
                prefix={<SearchOutlined />}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSearchFilter([]);
                    return;
                  }

                  setSearchFilter([
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
            <Col>
              <Checkbox
                checked={showBagDetails}
                onChange={(e) => setShowBagDetails(e.target.checked)}
              >
                Показать мешки
              </Checkbox>
            </Col>
            <Col>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                title="Печать"
              >
                Печать
              </Button>
            </Col>
          </Row>
          <Table
            {...tableProps}
            rowKey="id"
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => {
                handleRowSelect(record);
              },
              style: { cursor: "pointer" },
            })}
          >
            <Table.Column
              title={
                <Checkbox
                  checked={
                    dataSource && 
                    dataSource.length > 0 && 
                    dataSource.every((item: any) => selectedRowKeys.includes(item.id))
                  }
                  indeterminate={
                    selectedRowKeys.length > 0 && 
                    dataSource && 
                    !dataSource.every((item: any) => selectedRowKeys.includes(item.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Выбрать все
                      const allIds = dataSource?.map((item: any) => item.id) || [];
                      setSelectedRowKeys(allIds);
                      setSelectedRows(dataSource || []);
                    } else {
                      // Снять выбор со всех
                      setSelectedRowKeys([]);
                      setSelectedRows([]);
                    }
                  }}
                />
              }
              dataIndex="id"
              render={(value) => (
                <Checkbox checked={selectedRowKeys.includes(value)} />
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
            {showBagDetails && (
              <Table.Column
                dataIndex="services"
                title="Детали мешков"
                width={300}
                render={(services: any[]) => {
                  if (!services || services.length === 0) return "-";
                  
                  return (
                    <div style={{ fontSize: "11px", lineHeight: "1.2" }}>
                      {services.map((service: any, index: number) => (
                        <div key={index} style={{ marginBottom: "2px" }}>
                          <strong> номер:{service?.bag_number_numeric}</strong> {service.weight}кг, <span style={{ marginLeft: "5px" }}>{service.price} {selectedCurrency}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            )}
            <Table.Column
              dataIndex="totalServiceAmountSum"
              title="Сумма"
              render={(_, record: any) => {
                const currentCurrency = formProps.form?.getFieldValue("type_currency") || selectedCurrency;
                const selectedCurrencyData = currency.data?.find(
                  (item: any) => item.name === currentCurrency
                );
                
                const totalAmount = Number(record?.amount);
                const historicalRate = getHistoricalRate(
                  selectedCurrencyData,
                  record.created_at
                );
                
                // Используем ту же логику, что и в расчетах
                const transformedAmount = historicalRate > 0 ? historicalRate * totalAmount : totalAmount;
                
                const currencySymbol =
                  currentCurrency === "Доллар"
                    ? "USD"
                    : currentCurrency === "Рубль"
                    ? "руб"
                    : "сом";
                return `${transformedAmount.toFixed(2)} ${currencySymbol}`;
              }}
            />
            <Table.Column
              dataIndex="paid_sum"
              title="Оплачено"
              render={(value, record: any) => {
                const currentCurrency = formProps.form?.getFieldValue("type_currency") || selectedCurrency;
                const paidAmount = value || 0;
                const convertedPaidAmount = convertAmount(
                  paidAmount,
                  currentCurrency,
                  record.created_at
                );
                const currencySymbol =
                  currentCurrency === "Доллар"
                    ? "USD"
                    : currentCurrency === "Рубль"
                    ? "руб"
                    : "сом";
                return `${convertedPaidAmount.toFixed(2)} ${currencySymbol}`;
              }}
            />
            <Table.Column
              title="К доплате"
              render={(_, record: any) => {
                const currentCurrency = formProps.form?.getFieldValue("type_currency") || selectedCurrency;
                const selectedCurrencyData = currency.data?.find(
                  (item: any) => item.name === currentCurrency
                );
                
                const totalAmount = Number(record?.amount);
                const historicalRate = getHistoricalRate(
                  selectedCurrencyData,
                  record.created_at
                );
                
                const transformedAmount = historicalRate > 0 ? historicalRate * totalAmount : totalAmount;
                const paidAmount = record?.paid_sum || 0;
                const remainingToPay = transformedAmount - paidAmount;
                
                const currencySymbol =
                  currentCurrency === "Доллар"
                    ? "USD"
                    : currentCurrency === "Рубль"
                    ? "руб"
                    : "сом";
                return `${remainingToPay.toFixed(2)} ${currencySymbol}`;
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

          <div style={{ display: "none" }}>
            <div ref={printRef}>
              {printData && selectedCounterparty && (
                <PrintContent
                  data={printData}
                  selectedCurrency={selectedCurrency}
                  convertAmount={convertAmount}
                  client={selectedCounterparty}
                  showBagDetails={showBagDetails}
                />
              )}
            </div>
          </div>
        </>
      )}
    </Create>
  );
};
