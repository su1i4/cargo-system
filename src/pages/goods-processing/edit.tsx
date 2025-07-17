import { useEffect, useState, useMemo } from "react";
import { Edit, useForm, useSelect, useTable } from "@refinedev/antd";
import { useApiUrl, useCustom, useNavigation } from "@refinedev/core";
import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Table,
  Space,
  message,
  Input,
  Tooltip,
  Checkbox,
} from "antd";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  FileAddOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import Title from "antd/es/typography/Title";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

interface GoodItem {
  id: number;
  nomenclature_id?: string;
  country?: string;
  type_id?: string;
  type_name?: string;
  tariff?: number; // Тариф (цена за кг)
  quantity?: number;
  weight?: number;
  price?: number; // Цена за кг (из тарифа)
  sum?: number; // Общая сумма (вес * цена)
  barcode: string;
  updated?: boolean; // Флаг, указывающий, что услуга была изменена
  is_created?: boolean; // Флаг, указывающий, что услуга была создана
  bag_number_numeric?: string;
  is_price_editable?: boolean;
}

interface TypeProduct {
  id: string;
  name: string;
  tariff: number;
}

interface ProductItem {
  id: string | number;
  name: string;
  price: number; // Цена приходит с бэкенда
  quantity?: number;
  sum?: number;
  edit?: boolean; // Флаг разрешения редактирования товара
  isSelected?: boolean; // Флаг для отслеживания выбранных товаров
  updated?: boolean; // Флаг, указывающий, что товар был изменен
  is_created?: boolean; // Флаг, указывающий, что товар был создан
}

interface TariffItem {
  id: number;
  branch_id: number;
  product_type_id: number;
  tariff: string;
  product_type: {
    id: number;
    name: string;
    tariff: string;
  };
  branch: {
    id: number;
    name: string;
    tarif: string;
    prefix: string;
    visible: boolean;
  };
}

interface CashBackItem {
  id: number;
  amount: number;
  counterparty_id: number;
  counterparty: {
    id: number;
    name: string;
    clientPrefix: string;
    clientCode: string;
  };
}

interface DiscountOrCashBackItem {
  id: string;
  type: "discount" | "cashback";
  label: string;
  value: number;
  counterpartyId?: number;
  originalData: any;
}

export const GoodsEdit = () => {
  const { goBack } = useNavigation();
  const { formProps, saveButtonProps, form, queryResult } = useForm({
    redirect: false,
    onMutationSuccess: () => {
      goBack();
    },
  });
  const apiUrl = useApiUrl();

  const { tableProps } = useTable({
    resource: "products",
  });

  const { tableProps: tariffTableProps } = useTable({
    resource: "tariff",
    pagination: {
      mode: "off",
    },
  });

  const [services, setServices] = useState<GoodItem[]>([]);
  const [nextId, setNextId] = useState(1);
  const [typeProducts, setTypeProducts] = useState<TypeProduct[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>(
    []
  );
  const [deletedServices, setDeletedServices] = useState<GoodItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [copyCount, setCopyCount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [sentCityData, setSentCityData] = useState<any[]>([]);

  const [cashBacks, setCashBacks] = useState<CashBackItem[]>([]);
  const [discountCashBackOptions, setDiscountCashBackOptions] = useState<
    DiscountOrCashBackItem[]
  >([]);
  const [selectedDiscountType, setSelectedDiscountType] = useState<
    "discount" | "cashback" | null
  >(null);
  const [counterpartiesWithDiscounts, setCounterpartiesWithDiscounts] =
    useState<any[]>([]);

  // Добавляем состояние для доступных продуктов филиала
  const [branchNomenclature, setBranchNomenclature] = useState<any>(null);

  const values: any = Form.useWatch([], form);
  const record = queryResult?.data?.data;

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

  // Загрузка тарифов
  const { refetch: refetchTariffs } = useCustom({
    url: `${apiUrl}/tariff`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        setTariffs(data?.data || []);
      },
    },
  });

  const { refetch: refetchSentCity } = useCustom({
    url: `${apiUrl}/sent-the-city`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        setSentCityData(data?.data || []);
      },
    },
  });

  const { refetch: refetchCashBacks } = useCustom({
    url: `${apiUrl}/cash-back`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        setCashBacks(data?.data || []);
      },
      enabled: !!values?.sender_id && !!values?.recipient_id,
    },
  });

  const { refetch: refetchCounterpartiesWithDiscounts } = useCustom({
    url: `${apiUrl}/counterparty`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        const withDiscounts = (data?.data || []).filter(
          (item: any) => item.discount && item.discount.discount > 0
        );
        setCounterpartiesWithDiscounts(withDiscounts);
      },
      enabled: true,
    },
  });

  // Добавляем запрос к branch-nomenclature
  const { refetch: refetchBranchNomenclature } = useCustom({
    url: `${apiUrl}/branch-nomenclature`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        // Находим запись для выбранного филиала назначения
        const branchRecord = (data?.data || []).find(
          (item: any) => item.destination_id === values?.destination_id
        );
        setBranchNomenclature(branchRecord);
      },
      enabled: !!values?.destination_id,
    },
  });

  useEffect(() => {
    refetchTariffs();
    refetchSentCity();
    refetchCashBacks();
    refetchCounterpartiesWithDiscounts();
  }, []);

  useEffect(() => {
    if (values?.sender_id && values?.recipient_id) {
      refetchCashBacks();
      refetchCounterpartiesWithDiscounts();
    }
  }, [values?.sender_id, values?.recipient_id]);

  // Добавляем эффект для обновления данных о номенклатуре филиала
  useEffect(() => {
    if (values?.destination_id) {
      refetchBranchNomenclature();
    } else {
      setBranchNomenclature(null);
    }
  }, [values?.destination_id]);

  useEffect(() => {
    const options: DiscountOrCashBackItem[] = [];

    counterpartiesWithDiscounts.forEach((record: any) => {
      if (
        record?.discount?.discount > 0 &&
        (record.id === values?.sender_id || record.id === values?.recipient_id)
      ) {
        options.push({
          id: `discount-${record.id}`,
          type: "discount",
          label: `Скидка: ${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, '${record?.discount?.discount}' руб`,
          value: record.discount.discount,
          counterpartyId: record.id,
          originalData: record,
        });
      }
    });

    cashBacks.forEach((cashBack) => {
      if (
        cashBack.counterparty_id === values?.sender_id ||
        cashBack.counterparty_id === values?.recipient_id
      ) {
        options.push({
          id: `cashback-${cashBack.id}`,
          type: "cashback",
          label: `Кешбек: ${cashBack.counterparty?.clientPrefix}-${cashBack.counterparty?.clientCode}, ${cashBack.counterparty?.name}, '${cashBack.amount}' руб`,
          value: cashBack.amount,
          counterpartyId: cashBack.counterparty_id,
          originalData: cashBack,
        });
      }
    });

    setDiscountCashBackOptions(options);
  }, [
    counterpartiesWithDiscounts,
    cashBacks,
    values?.sender_id,
    values?.recipient_id,
  ]);

  // Автоматически выбираем скидку или кешбек при изменении контрагентов
  useEffect(() => {
    if (
      discountCashBackOptions.length > 0 &&
      (values?.sender_id || values?.recipient_id)
    ) {
      // Сначала ищем кешбек
      const cashBackOption = discountCashBackOptions.find(
        (option) => option.type === "cashback"
      );

      if (cashBackOption) {
        // Если есть кешбек - выбираем его
        setSelectedDiscountType(cashBackOption.type);
        setDiscount(0);
        const cashBackTarget =
          cashBackOption.counterpartyId === values?.sender_id
            ? "sender"
            : "receiver";
        formProps.form?.setFieldsValue({
          discount_cashback_id: cashBackOption.id,
          cash_back_target: cashBackTarget,
          discount_id: null,
        });
      } else {
        // Если кешбека нет - ищем скидку
        const discountOption = discountCashBackOptions.find(
          (option) => option.type === "discount"
        );

        if (discountOption) {
          setSelectedDiscountType(discountOption.type);
          setDiscount(discountOption.value);
          formProps.form?.setFieldsValue({
            discount_cashback_id: discountOption.id,
            cash_back_target: null,
            discount_id: discountOption.originalData.id,
          });
        }
      }
    } else if (discountCashBackOptions.length === 0) {
      // Если нет ни скидок, ни кешбеков - очищаем поля
      setSelectedDiscountType(null);
      setDiscount(0);
      formProps.form?.setFieldsValue({
        discount_cashback_id: null,
        cash_back_target: null,
        discount_id: null,
      });
    }
  }, [discountCashBackOptions, values?.sender_id, values?.recipient_id]);

  const findTariff = (branchId: number, productTypeId: number): number => {
    const foundTariff = tariffs.find(
      (tariff) =>
        tariff.branch_id === branchId &&
        tariff.product_type_id === productTypeId
    );

    return foundTariff ? parseFloat(foundTariff.tariff) : 0;
  };

  // Загрузка данных из записи при открытии формы редактирования
  useEffect(() => {
    if (record) {
      // Загрузка услуг из записи
      if (record.services && Array.isArray(record.services)) {
        setServices(
          record.services.map((service: any, index: number) => ({
            ...service,
            id: service.id || index + 1,
            nomenclature_id: service.nomenclature.id || null,
            deleted: false,
            type_id: service.product_type.id || null,
            is_price_editable: false,
          }))
        );

        // Установка следующего ID после последней услуги
        const maxId = Math.max(
          ...record.services.map((s: any) => s.id || 0),
          0
        );
        setNextId(maxId + 1);
      }

      if (record.packers && Array.isArray(record.packers)) {
        const packerIds = record.packers.map((packer: any) => packer.id);
        formProps.form?.setFieldsValue({
          packers: packerIds,
        });
      }
      if (
        record.visiting_group_ids &&
        Array.isArray(record.visiting_group_ids)
      ) {
        const visitingGroupIds = record.visiting_group_ids.map(
          (visitingGroup: any) => visitingGroup.id
        );
        formProps.form?.setFieldsValue({
          visiting_group_ids: visitingGroupIds,
        });
      }
    }
  }, [record]);

  const calculateCommissionAmount = (
    declaredValue: number,
    commissionPercent: number
  ): number => {
    return (declaredValue * commissionPercent) / 100;
  };

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, []);

  useEffect(() => {
    if (tableProps.dataSource && record?.products) {
      const formattedProducts = tableProps.dataSource.map((item: any) => {
        const product = record.products.find((p: any) => p.name === item.name);
        if (product) {
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            sum: product.sum,
            edit: product.edit || false, // Добавляем поле edit
          };
        } else {
          return {
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: 0,
            sum: 0,
            edit: item.edit || false, // По умолчанию редактирование отключено для новых продуктов
          };
        }
      });
      setProducts(formattedProducts);
    }
  }, [tableProps.dataSource, record?.products]);

  // Отслеживание изменений в полях объявленной ценности и комиссии
  useEffect(() => {
    if (values?.declared_value && values?.commission) {
      const declaredValue = Number(values.declared_value);
      const commissionPercent = Number(values.commission);

      if (!isNaN(declaredValue) && !isNaN(commissionPercent)) {
        const commissionAmount = calculateCommissionAmount(
          declaredValue,
          commissionPercent
        );
        formProps.form?.setFieldsValue({
          amount_commission: commissionAmount,
        });
      }
    }
  }, [values?.declared_value, values?.commission]);

  const generateBarcode = (): string => {
    const prefix = "45"; // Префикс для штрихкода
    const timestamp = Date.now().toString().slice(-10); // Последние 10 цифр временной метки
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0"); // Случайное число
    return `${prefix}${timestamp}${random}`;
  };

  // Добавление нового товара
  const addNewItem = () => {
    const newItem: GoodItem = {
      id: nextId,
      barcode: generateBarcode(),
      bag_number_numeric: "",
      is_created: true, // Отмечаем, что товар новый
      is_price_editable: false,
    };
    setServices([...services, newItem]);
    setNextId(nextId + 1);
  };

  // Копирование выбранных товаров
  const copySelectedItems = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Выберите товары для копирования");
      return;
    }

    const selectedItems = services.filter((item) =>
      selectedRowKeys.includes(item.id)
    );

    const newItems = selectedItems.map((item) => {
      const newId = nextId + selectedItems.indexOf(item);

      return {
        ...item,
        id: newId,
        barcode: generateBarcode(),
        is_created: true, // Отмечаем, что это копия (новый товар)
        is_price_editable: item.is_price_editable || false,
      };
    });

    setServices([...services, ...newItems]);
    setNextId(nextId + selectedItems.length);
    setSelectedRowKeys([]); // Сбрасываем выбор после копирования

    message.success(`Скопировано ${selectedItems.length} товаров`);
  };

  const removeSelectedItems = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Выберите товары для удаления");
      return;
    }
    const selectedItems = services.filter(
      (item) => !selectedRowKeys.includes(item.id)
    );

    const deletedItems = services
      .filter(
        (item) =>
          selectedRowKeys.includes(item.id) && item.hasOwnProperty("deleted")
      )
      .map((item) => ({ ...item, deleted: true }));

    setDeletedServices([...deletedServices, ...deletedItems]);
    setServices(selectedItems);
    setSelectedRowKeys([]); // Сбрасываем выбор после копирования

    message.success(`Удалено ${selectedItems.length} товаров`);
  };

  // Удаление товара из таблицы
  const removeItem = (record: any) => {
    if (record.hasOwnProperty("deleted")) {
      setDeletedServices([...deletedServices, { ...record, deleted: true }]);
    }
    setServices(services.filter((item) => item.id !== record.id));
  };

  // Расчет суммы на основе веса и тарифа
  const calculateSum = (weight: number = 0, tariff: number = 0): number => {
    return weight * tariff;
  };

  const updateItemField = (
    id: number,
    field: string,
    value: any,
    index?: number
  ) => {
    setServices(
      services.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value, updated: true };

          if (field === "type_id" || field === "weight") {
            const selectedType = tariffTableProps?.dataSource?.find(
              (type: any) =>
                type.branch_id === values?.destination_id &&
                type.product_type_id ===
                  (field === "weight" ? Number(item.type_id) : value)
            );

            if (selectedType) {
              newItem.tariff = selectedType.tariff;

              // Обновляем цену только если ручное редактирование отключено И это новая услуга
              if (!item.is_price_editable && item.is_created) {
                newItem.price = Number(selectedType.tariff) - discount;
              }

              // Пересчитываем сумму с учетом текущей цены (может быть пользовательской)
              if (newItem.weight) {
                const priceToUse =
                  item.is_price_editable || !item.is_created
                    ? newItem.price
                    : Number(selectedType.tariff) - discount;
                newItem.sum = calculateSum(newItem.weight, priceToUse);
              }
            }
          }

          // Если изменяется цена вручную и включено ручное редактирование, пересчитываем сумму
          if (field === "price" && item.is_price_editable && newItem.weight) {
            newItem.sum = calculateSum(newItem.weight, value);
          }

          return newItem;
        }
        return item;
      })
    );
  };

  // Обработка изменения филиала назначения
  useEffect(() => {
    if (values?.destination_id && services.length > 0) {
      // Обновляем тарифы для всех сервисов при изменении филиала
      const branchId = Number(values.destination_id);

      setServices(
        services.map((item) => {
          if (item.type_id) {
            const productTypeId = Number(item.type_id);
            const tariffValue = findTariff(branchId, productTypeId);

            if (tariffValue > 0) {
              const newItem = { ...item, updated: true };
              newItem.tariff = tariffValue;

              // Обновляем цену только если ручное редактирование отключено И это новая услуга
              if (!item.is_price_editable && item.is_created) {
                newItem.price = tariffValue;
              }

              if (newItem.weight) {
                const priceToUse =
                  item.is_price_editable || !item.is_created
                    ? newItem.price
                    : tariffValue;
                newItem.sum = calculateSum(newItem.weight, priceToUse);
              }

              return newItem;
            }
          }
          return item;
        })
      );
    }
  }, [values?.destination_id, tariffs]);

  // Обработка изменения скидки
  useEffect(() => {
    if (services?.length > 0) {
      const newServices = services.map((item) => {
        const selectedType = tariffTableProps?.dataSource?.find(
          (type: any) =>
            type.branch_id === values?.destination_id &&
            type.product_type_id === Number(item.type_id)
        );

        const newItem = { ...item, updated: true };

        // Обновляем цену только если ручное редактирование отключено И это новая услуга
        if (
          !item.is_price_editable &&
          item.is_created &&
          selectedType?.tariff
        ) {
          newItem.price = Number(selectedType.tariff) - discount;
        }

        // Пересчитываем сумму с учетом текущей цены
        if (newItem.weight && selectedType?.tariff) {
          const priceToUse =
            item.is_price_editable || !item.is_created
              ? newItem.price
              : Number(selectedType.tariff) - discount;
          newItem.sum = calculateSum(Number(newItem.weight), priceToUse);
        }

        return newItem;
      });
      setServices(newServices);
    }
  }, [discount, values?.destination_id]);

  // Обновление данных товара из бэкенда
  const updateProductField = (
    id: string | number,
    field: string,
    value: any
  ) => {
    setProducts(
      products.map((item) => {
        if (item.id === id) {
          // Если текущее количество = 0, а новое > 0, считаем товар новым
          const wasEmpty = Number(item.quantity) === 0;
          const isNowFilled = Number(value) > 0;
          const isNewlyAdded = wasEmpty && isNowFilled;

          const newItem = {
            ...item,
            [field]: value,
            updated: true,
            // Если товар только что добавили (изменили количество с 0 на > 0),
            // отмечаем его как созданный
            is_created: isNewlyAdded || item.is_created,
          };

          // Если изменяется количество или цена, пересчитываем сумму
          if (field === "quantity") {
            newItem.sum = value * item.price;
          } else if (field === "price") {
            newItem.sum = value * (item.quantity || 0);
          }

          return newItem;
        }
        return item;
      })
    );
  };

  // Настройки для выбора строк в таблице услуг
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (
      record:
        | GoodItem
        | { weight: number; price: number; quantity: number; sum: number }
    ) => ({
      // Отключаем выбор для итоговой строки (которая содержит все поля итогового объекта)
      disabled:
        "weight" in record &&
        "price" in record &&
        "quantity" in record &&
        "sum" in record &&
        !("id" in record),
      style: {
        display:
          "weight" in record &&
          "price" in record &&
          "quantity" in record &&
          "sum" in record &&
          !("id" in record)
            ? "none"
            : "",
      },
    }),
  };

  const handleFormSubmit = (values: any) => {
    // Проверяем наличие услуг
    if (services.length === 0) {
      message.warning("Выберите услуги");
      return;
    }

    // Проверяем заполнение обязательных полей в услугах
    let hasInvalidFields = false;
    services.forEach((service, index) => {
      if (!service.type_id || !service.weight || service.weight <= 0) {
        hasInvalidFields = true;
        message.warning(
          `Услуга #${
            index + 1
          }: Заполните все обязательные поля (Тип товара, Вес)`
        );
      }
    });

    if (hasInvalidFields) {
      return;
    }

    // Рассчитываем базовую сумму (услуги + товары)
    const baseAmount =
      services.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.sum),
        0
      ) +
      products.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.sum),
        0
      );

    // Добавляем наценку к базовой сумме
    const markup = Number(values.markup) || 0;
    const finalAmount = baseAmount + (baseAmount * markup) / 100;

    const submitValues = {
      ...values,
      services: [...services, ...deletedServices].map((service) => ({
        ...service,
        // Добавляем метки для изменений
        is_updated: service.updated === true && !service.is_created,
        is_created: service.is_created === true,
      })),
      products: products.map((product) => ({
        ...product,
        is_updated: product.updated === true && !product.is_created,
        is_created: product.is_created === true,
      })),
      amount: finalAmount,
      sent_back_id:
        sentCityData.find((item: any) => item.id === values.sent_back_id)
          ?.sent_city_id || null,
      destination_id: values?.destination_id || null,
    };

    if (submitValues.created_at) {
      if (typeof submitValues.created_at === "object") {
        if (submitValues.created_at.$d) {
          submitValues.created_at =
            submitValues.created_at.format("YYYY-MM-DDTHH:mm:ss") + ".100Z";
        } else if (submitValues.created_at instanceof Date) {
          submitValues.created_at = submitValues.created_at.toISOString();
        }
      }
    }

    if (submitValues.photo) {
      submitValues.photo = {
        file: {
          response: {
            filePath: submitValues.photo?.file?.response?.filePath,
          },
        },
      };
    }

    if (formProps.onFinish) {
      formProps.onFinish(submitValues);
    }
  };

  const { selectProps: counterpartySelectPropsSender } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, `;
    },
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "sender",
      },
    ],
  });

  const { selectProps: counterpartySelectPropsReceiver } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, `;
    },
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "receiver",
      },
    ],
  });

  const { selectProps: discountSelectProps }: any = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.clientPrefix ?? ""}-${record?.clientCode ?? ""}, ${
        record?.name ?? ""
      }, '${record?.discount?.discount ?? 0}' руб`;
    },
    filters: [
      {
        field: "id",
        operator: "in",
        value: [values?.sender_id, values?.recipient_id].filter(Boolean),
      },
    ],
    queryOptions: {
      enabled: !!values?.sender_id && !!values?.recipient_id,
    },
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => {
      return `${record?.name}`;
    },
  });

  const { selectProps: nomenclatureSelectProps } = useSelect({
    resource: "nomenclature",
    optionLabel: (record: any) => {
      return `${record?.name}`;
    },
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  const { selectProps: typeProductSelectProps } = useSelect({
    resource: "type-product",
    optionLabel: (record: any) => {
      return `${record?.name} (${record?.tariff} за кг)`;
    },
    onSearch: (value) => [],
    queryOptions: {
      onSuccess: (data: any) => {
        const typeProductsData = data?.data?.map((item: any) => ({
          id: item.id,
          name: item.name,
          tariff: item.tariff,
        }));
        setTypeProducts(typeProductsData || []);
      },
    },
  });

  const { selectProps: packerSelectProps } = useSelect({
    resource: "packers",
    optionLabel: (record: any) => {
      return `${record?.first_name} ${record?.last_name}`;
    },
  });

  const { selectProps: visitingGroupSelectProps } = useSelect({
    resource: "visiting-group",
    optionLabel: (record: any) => {
      return `${record?.first_name} ${record?.last_name}`;
    },
  });

  const lastGoods = [
    {
      weight: services.reduce((acc, item) => acc + Number(item.weight || 0), 0),
      price: 0,
      quantity: services.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: services.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ];

  const lastProducts = [
    {
      id: "total",
      name: "Итого",
      price: 0,
      quantity: products.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: products.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ];

  const styleBlock = (
    <style>{`
      .updated-row {
        background-color: rgba(24, 144, 255, 0.1);
      }
      .updated-row:hover > td {
        background-color: rgba(24, 144, 255, 0.2) !important;
      }
      .created-row {
        background-color: rgba(82, 196, 26, 0.1);
      }
      .created-row:hover > td {
        background-color: rgba(82, 196, 26, 0.2) !important;
      }
    `}</style>
  );

  // Добавляю селект для досыльных городов (как в create.tsx)
  const { selectProps: branchSelectPropsIsSent } = useSelect({
    resource: "sent-the-city",
    optionLabel: (record: any) => `${record?.sent_city?.name}`,
    filters: [
      {
        field: "city_id",
        operator: "eq",
        value: values?.destination_id,
      },
    ],
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
    queryOptions: {
      enabled: !!values?.destination_id,
    },
  });

  const getLabelSafe = (option: any) => {
    if (!option) return "";
    if (Array.isArray(option)) return "";
    if (typeof option === "object" && typeof option.label === "string")
      return option.label;
    return "";
  };

  const createItemsByCount = () => {
    const count = Number(copyCount || 0);
    if (count <= 0) {
      message.warning("Укажите корректное количество для создания");
      return;
    }

    let newItems: GoodItem[] = [];

    if (selectedRowKeys.length > 0) {
      const selectedItems = services.filter((item) =>
        selectedRowKeys.includes(item.id)
      );

      for (let i = 0; i < count; i++) {
        const itemsToAdd = selectedItems.map((item, index) => {
          const newId = nextId + i * selectedItems.length + index;
          return {
            ...item,
            id: newId,
            barcode: generateBarcode(),
            is_created: true,
            is_price_editable: item.is_price_editable || false,
          };
        });
        newItems = [...newItems, ...itemsToAdd];
      }

      setNextId(nextId + count * selectedItems.length);
    } else {
      // Если нет выделенных товаров, создаем пустые
      newItems = Array.from({ length: count }, (_, i) => {
        const newId = nextId + i;
        return {
          id: newId,
          barcode: generateBarcode(),
          bag_number_numeric: "",
          is_created: true,
          is_price_editable: false,
        };
      });

      setNextId(nextId + count);
    }

    setServices([...services, ...newItems]);
    setSelectedRowKeys([]); // Сбрасываем выделение
  };

  const copyWhileCount = () => {
    const count = Number(copyCount || 0);
    const hasSelectedItems = selectedRowKeys.length > 0;

    createItemsByCount();

    if (hasSelectedItems) {
      message.success(
        `Скопировано ${selectedRowKeys.length} товаров ${count} раз(а)`
      );
    } else {
      message.success(`Создано ${count} новых товаров`);
    }
  };

  // Функция для проверки доступности продукта для филиала
  const isProductAvailableForBranch = (product: ProductItem): boolean => {
    // Если нет данных о номенклатуре филиала, разрешаем редактирование всех продуктов
    if (!branchNomenclature || !branchNomenclature.product_types) {
      return true;
    }

    // Проверяем, есть ли продукт в списке доступных для филиала
    return branchNomenclature.product_types.some(
      (availableProduct: any) =>
        availableProduct.id === product.id ||
        availableProduct.name === product.name
    );
  };

  return (
    <Edit headerButtons={() => null} saveButtonProps={saveButtonProps}>
      {styleBlock}
      <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
        <Title level={5}>Реквизиты</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              rules={[
                { required: true, message: "Город назначения обязателен" },
              ]}
              label="Город назначения"
              name="destination_id"
            >
              <Select
                onChange={(val, record: any) => {
                  // Ищем досыльную запись для выбранного города
                  const sentCityRecord = sentCityData.find(
                    (item: any) => item.city_id === val
                  );

                  if (sentCityRecord) {
                    // Если у города есть досыльная привязка, автоматически выбираем её
                    formProps.form?.setFieldsValue({
                      destination_id: sentCityRecord.city_id,
                      sent_back_id: sentCityRecord.id,
                    });
                  } else {
                    // Если досыльной привязки нет, просто устанавливаем город
                    formProps.form?.setFieldsValue({
                      destination_id: val,
                      sent_back_id: null,
                    });
                  }
                }}
                {...branchSelectProps}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item
              rules={[{ required: true, message: "Отправитель обязателен" }]}
              label="Отправитель"
              name="sender_id"
            >
              <Select {...counterpartySelectPropsSender} allowClear />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item
              rules={[{ required: true, message: "Получатель обязателен" }]}
              label="Получатель"
              name="recipient_id"
            >
              <Select {...counterpartySelectPropsReceiver} allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Комментарий" name="comments">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Досыльные города" name="sent_back_id">
              <Select {...branchSelectPropsIsSent} allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              rules={[{ required: true, message: "Способ оплаты обязателен" }]}
              label="Способ оплаты"
              name="payment_method"
              initialValue="Наличные"
            >
              <Select
                showSearch
                allowClear
                placeholder="Выберите способ оплаты"
                options={[
                  { label: "Наличные", value: "Наличные" },
                  { label: "Безналичные", value: "Безналичные" },
                  { label: "Перечислением", value: "Перечислением" },
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Скидка/Кешбек" name="discount_cashback_id">
              <Select
                placeholder="Выберите скидку или кешбек"
                onChange={(value: string) => {
                  const selectedOption = discountCashBackOptions.find(
                    (opt) => opt.id === value
                  );
                  if (selectedOption) {
                    setSelectedDiscountType(selectedOption.type);

                    if (selectedOption.type === "discount") {
                      setDiscount(selectedOption.value);
                      formProps.form?.setFieldsValue({
                        cash_back_target: null,
                        discount_id: selectedOption.originalData.id,
                      });
                    } else if (selectedOption.type === "cashback") {
                      setDiscount(0);
                      const cashBackTarget =
                        selectedOption.counterpartyId === values?.sender_id
                          ? "sender"
                          : "receiver";
                      formProps.form?.setFieldsValue({
                        cash_back_target: cashBackTarget,
                        discount_id: null,
                      });
                    }
                  } else {
                    setSelectedDiscountType(null);
                    setDiscount(0);
                    formProps.form?.setFieldsValue({
                      cash_back_target: null,
                      discount_id: null,
                    });
                  }
                }}
                allowClear
                options={discountCashBackOptions.map((option) => ({
                  label: option.label,
                  value: option.id,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Скрытые поля для отправки данных */}
        <Form.Item name="cash_back_target" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="discount_id" hidden>
          <Input />
        </Form.Item>

        <Title level={5}>Услуги</Title>
        <Row gutter={[16, 8]} style={{ marginBottom: 10 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Tooltip
              color="red"
              title={
                !values?.destination_id
                  ? "Сначала выберите город назначения"
                  : ""
              }
            >
              <Button
                disabled={!values?.destination_id}
                onClick={addNewItem}
                icon={<FileAddOutlined />}
                style={{ width: "100%" }}
              >
                Добавить товар
              </Button>
            </Tooltip>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Input
              style={{ width: "100%" }}
              min={0}
              type="number"
              value={copyCount}
              onChange={(e) => setCopyCount(Number(e.target.value))}
              placeholder="Кол-во"
            />
          </Col>
          <Col xs={12} sm={10} md={8} lg={6}>
            <Button
              disabled={
                Number(copyCount || 0) === 0 ||
                values?.destination_id === undefined ||
                values?.sender_id === undefined ||
                values?.recipient_id === undefined
              }
              onClick={copyWhileCount}
              icon={<CopyOutlined />}
              style={{ width: "100%" }}
            >
              Копировать: ({copyCount})
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={5}>
            <Button
              onClick={copySelectedItems}
              icon={<CopyOutlined />}
              disabled={selectedRowKeys.length === 0}
              style={{ width: "100%" }}
            >
              Копировать ({selectedRowKeys.length})
            </Button>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Button
              onClick={removeSelectedItems}
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              style={{ width: "100%" }}
              danger
            >
              Удалить ({selectedRowKeys.length})
            </Button>
          </Col>
        </Row>
        <Table
          scroll={{ x: 1200 }}
          dataSource={[...services, ...lastGoods]}
          style={{ marginTop: 10 }}
          rowKey="id"
          pagination={false}
          rowSelection={rowSelection}
        >
          <Table.Column
            title="№"
            dataIndex="id"
            width={50}
            render={(value, record: any, index: number) =>
              index < services.length && <span>{index + 1}</span>
            }
          />
          <Table.Column
            title="Номенклатура"
            dataIndex="nomenclature_id"
            render={(value, record: any, index: number) =>
              index < services.length && (
                <Select
                  style={{ width: 200 }}
                  {...nomenclatureSelectProps}
                  value={value}
                  onChange={(val) =>
                    updateItemField(record.id, "nomenclature_id", val)
                  }
                  allowClear
                />
              )
            }
          />
          <Table.Column
            title="Тип товара"
            dataIndex="type_id"
            render={(value, record: any, index: number) =>
              index < services.length && (
                <Select
                  style={{ width: 200 }}
                  {...typeProductSelectProps}
                  value={value}
                  onChange={(val) => {
                    updateItemField(record.id, "type_id", val);
                  }}
                  allowClear
                />
              )
            }
          />
          <Table.Column
            title="Номер мешка"
            dataIndex="bag_number_numeric"
            render={(value, record: any, index: number) => {
              return (
                index < services.length && (
                  <Input
                    onChange={(e) => {
                      setServices(
                        services.map((item: any, serviceIndex: number) => {
                          if (serviceIndex === index) {
                            return {
                              ...item,
                              bag_number_numeric: e.target.value,
                            };
                          } else {
                            return item;
                          }
                        })
                      );
                    }}
                    style={{ width: 120 }}
                    value={value}
                  />
                )
              );
            }}
          />
          <Table.Column
            title="Количество"
            dataIndex="quantity"
            render={(value, record: any, index: number) => (
              <InputNumber
                style={{ width: 100 }}
                min={0}
                value={value}
                disabled={index >= services.length}
                onChange={(val) => updateItemField(record.id, "quantity", val)}
              />
            )}
          />
          <Table.Column
            title="Вес (кг)"
            dataIndex="weight"
            render={(value, record: any, index: number) => (
              <InputNumber
                style={{ width: 100 }}
                min={0}
                precision={2}
                value={value}
                disabled={index >= services.length}
                onChange={(val) => updateItemField(record.id, "weight", val)}
              />
            )}
          />
          <Table.Column
            title="Цена за кг"
            dataIndex="price"
            render={(value, record: any, index: number) =>
              index < services.length && (
                <InputNumber
                  style={{ width: 100 }}
                  min={0}
                  precision={2}
                  value={value}
                  disabled={!record.is_price_editable}
                  onChange={(val) => {
                    updateItemField(record.id, "price", val);
                  }}
                />
              )
            }
          />
          <Table.Column
            title="Сумма"
            dataIndex="sum"
            render={(value, record: any) => (
              <InputNumber
                style={{ width: 100 }}
                min={0}
                precision={2}
                value={value}
                disabled
              />
            )}
          />
          <Table.Column
            title="Штрихкод"
            dataIndex="barcode"
            render={(value, record: any, index: number) =>
              index < services.length && (
                <span style={{ width: 200 }}>{value}</span>
              )
            }
          />
          <Table.Column
            title="Действия"
            key="action"
            render={(_, record: any, index: number) =>
              index < services.length && (
                <Space size="small">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.id)}
                  />
                  <Button
                    type="text"
                    icon={
                      <Checkbox
                        checked={record.is_price_editable || false}
                        onChange={(e) =>
                          updateItemField(
                            record.id,
                            "is_price_editable",
                            e.target.checked
                          )
                        }
                      />
                    }
                  />
                </Space>
              )
            }
          />
        </Table>
        <div style={{ marginTop: 30 }}>
          <Title level={5} style={{ margin: 0 }}>
            Товары
          </Title>
          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
            Доступны для редактирования товары с разрешением или разрешенные для
            филиала назначения
          </div>
        </div>
        <Table
          dataSource={[...products, ...lastProducts]}
          style={{ marginTop: 10 }}
          rowKey="id"
          pagination={false}
        >
          <Table.Column
            title="№"
            dataIndex="id"
            width={50}
            render={(value, record: any, index: number) =>
              index < products.length && <span>{index + 1}</span>
            }
          />
          <Table.Column
            title="Наименование"
            dataIndex="name"
            render={(value, record: any, index: number) =>
              index < products.length && <span>{value}</span>
            }
          />
          <Table.Column
            title="Количество"
            dataIndex="quantity"
            render={(value, record: any, index: number) => (
              <InputNumber
                style={{ width: 100 }}
                min={0}
                value={value}
                disabled={
                  index >= products.length ||
                  (!record.edit && !isProductAvailableForBranch(record))
                }
                onChange={(val) =>
                  updateProductField(record.id, "quantity", val)
                }
              />
            )}
          />
          <Table.Column
            title="Цена"
            dataIndex="price"
            render={(value, record: any, index: number) =>
              index < products.length && (
                <InputNumber
                  style={{ width: 100 }}
                  min={0}
                  precision={2}
                  value={value}
                  disabled={
                    !record.edit && !isProductAvailableForBranch(record)
                  }
                  onChange={(val) =>
                    updateProductField(record.id, "price", val)
                  }
                />
              )
            }
          />
          <Table.Column
            title="Сумма"
            dataIndex="sum"
            render={(value) => (
              <InputNumber
                style={{ width: 100 }}
                min={0}
                precision={2}
                value={value}
                disabled
              />
            )}
          />
        </Table>
        <Title style={{ marginTop: 20 }} level={5}>
          Прочее
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Процент скидки" name="discount_custom">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Процент наценки" name="markup">
              <InputNumber style={{ width: "100%" }} min={0} addonAfter="%" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f5f5f5",
                borderRadius: "6px",
                border: "1px solid #d9d9d9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>Базовая сумма:</span>
                <span style={{ fontWeight: "bold" }}>
                  {(
                    services.reduce(
                      (acc, item) => acc + Number(item.sum || 0),
                      0
                    ) +
                    products.reduce(
                      (acc, item) => acc + Number(item.sum || 0),
                      0
                    )
                  ).toFixed(2)}{" "}
                  руб.
                </span>
              </div>
              {values?.markup && Number(values.markup) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span>Наценка ({values.markup}%):</span>
                  <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                    {(
                      ((services.reduce(
                        (acc, item) => acc + Number(item.sum || 0),
                        0
                      ) +
                        products.reduce(
                          (acc, item) => acc + Number(item.sum || 0),
                          0
                        )) *
                        Number(values.markup)) /
                      100
                    ).toFixed(2)}{" "}
                    руб.
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #d9d9d9",
                  paddingTop: "8px",
                  fontSize: "16px",
                }}
              >
                <span style={{ fontWeight: "bold" }}>Итоговая сумма:</span>
                <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                  {(
                    (services.reduce(
                      (acc, item) => acc + Number(item.sum || 0),
                      0
                    ) +
                      products.reduce(
                        (acc, item) => acc + Number(item.sum || 0),
                        0
                      )) *
                    (1 + (Number(values?.markup) || 0) / 100)
                  ).toFixed(2)}{" "}
                  руб.
                </span>
              </div>
            </div>
          </Col>
        </Row>
        <Title style={{ marginTop: 10 }} level={5}>
          Гарантия
        </Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Объявленная ценность" name="declared_value">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Введите объявленную ценность"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Комиссия" name="commission">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={100}
                placeholder="Введите процент комиссии"
                addonAfter="%"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Сумма комиссии" name="amount_commission">
              <InputNumber style={{ width: "100%" }} min={0} disabled />
            </Form.Item>
          </Col>
        </Row>
        <Title style={{ marginTop: 10 }} level={5}>
          Упаковщики
        </Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Выберите упаковщика" name="packers">
              <Select {...packerSelectProps} mode="multiple" allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Выездная группа" name="visiting_group_ids">
              <Select
                {...visitingGroupSelectProps}
                mode="multiple"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
