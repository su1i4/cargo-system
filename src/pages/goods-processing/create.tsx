import { useEffect, useState, useMemo } from "react";
import { Create, useForm, useSelect, useTable } from "@refinedev/antd";
import { useApiUrl, useCustom } from "@refinedev/core";
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
import { API_URL } from "../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

interface GoodItem {
  id: number;
  nomenclature_id?: string;
  country?: string;
  type_id?: string;
  type_name?: string;
  tariff?: number;
  quantity?: number;
  weight?: number;
  price?: number;
  sum?: number;
  barcode: string;
  bag_number_numeric?: string;
  is_price_editable?: boolean;
}

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  sum?: number;
  edit?: boolean;
  isSelected?: boolean;
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

export const GoodsCreate = () => {
  const { formProps, saveButtonProps, form } = useForm();
  const apiUrl = useApiUrl();

  const { tableProps: tariffTableProps } = useTable({
    resource: "tariff",
    pagination: {
      mode: "off",
    },
  });

  const [services, setServices] = useState<GoodItem[]>([]);
  const [nextId, setNextId] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [copyCount, setCopyCount] = useState(0);
  const [sentCityData, setSentCityData] = useState<any[]>([]);
  const [cashBacks, setCashBacks] = useState<CashBackItem[]>([]);
  const [hasBagNumber, setHasBagNumber] = useState<
    { id: number; has: boolean }[]
  >([]);
  const [discountCashBackOptions, setDiscountCashBackOptions] = useState<
    DiscountOrCashBackItem[]
  >([]);

  const [counterpartiesWithDiscounts, setCounterpartiesWithDiscounts] =
    useState<any[]>([]);

  const values: any = Form.useWatch([], form);

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

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

  const findTariff = (branchId: number, productTypeId: number): number => {
    const foundTariff = tariffs.find(
      (tariff) =>
        tariff.branch_id === branchId &&
        tariff.product_type_id === productTypeId
    );

    return foundTariff ? parseFloat(foundTariff.tariff) : 0;
  };

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
    const prefix = "45";
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}${timestamp}${random}`;
  };

  const addNewItem = () => {
    const newItem: GoodItem = {
      id: nextId,
      barcode: generateBarcode(),
      bag_number_numeric: "",
      is_price_editable: false,
    };
    setServices([...services, newItem]);
    setNextId(nextId + 1);
  };

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
      };
    });

    setServices([...services, ...newItems]);
    setNextId(nextId + selectedItems.length);
    setSelectedRowKeys([]);

    message.success(`Скопировано ${selectedItems.length} товаров`);
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
            is_price_editable: item.is_price_editable || false,
          };
        });
        newItems = [...newItems, ...itemsToAdd];
      }

      setNextId(nextId + count * selectedItems.length);
    } else {
      newItems = Array.from({ length: count }, (_, i) => {
        const newId = nextId + i;
        return {
          id: newId,
          barcode: generateBarcode(),
          bag_number_numeric: "",
          is_price_editable: false,
        };
      });

      setNextId(nextId + count);
    }

    setServices([...services, ...newItems]);
    setSelectedRowKeys([]);
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

  const removeSelectedItems = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Выберите товары для удаления");
      return;
    }
    const selectedItems = services.filter(
      (item) => !selectedRowKeys.includes(item.id)
    );
    setServices(selectedItems);
    setSelectedRowKeys([]);

    message.success(`Удалено ${selectedItems.length} товаров`);
  };

  const removeItem = (id: number) => {
    setServices(services.filter((item) => item.id !== id));
  };

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
          const newItem = { ...item, [field]: value };

          if (field === "type_id" || field === "weight") {
            const selectedType = tariffTableProps?.dataSource?.find(
              (type: any) =>
                type.branch_id === values?.destination_id &&
                type.product_type_id ===
                  (field === "weight" ? Number(item.type_id) : value)
            );

            if (selectedType) {
              newItem.tariff = selectedType.tariff;

              if (!item.is_price_editable) {
                newItem.price = Number(selectedType.tariff) - discount;
              }

              if (newItem.weight) {
                const priceToUse = item.is_price_editable
                  ? newItem.price
                  : Number(selectedType.tariff) - discount;
                newItem.sum = calculateSum(newItem.weight, priceToUse);
              }
            }
          }

          if (field === "price" && item.is_price_editable && newItem.weight) {
            newItem.sum = calculateSum(newItem.weight, value);
          }

          return newItem;
        }
        return item;
      })
    );
  };

  useEffect(() => {
    if (values?.destination_id && services.length > 0) {
      const branchId = Number(values.destination_id);

      setServices(
        services.map((item) => {
          if (item.type_id) {
            const productTypeId = Number(item.type_id);
            const tariffValue = findTariff(branchId, productTypeId);

            if (tariffValue > 0) {
              const newItem = { ...item };
              newItem.tariff = tariffValue;
              newItem.price = tariffValue;

              if (newItem.weight) {
                newItem.sum = calculateSum(newItem.weight, tariffValue);
              }

              return newItem;
            }
          }
          return item;
        })
      );
    }
  }, [values?.destination_id, tariffs]);

  const isProductAvailableForBranch = (product: ProductItem): boolean => {
    if (!branchNomenclatureTableProps?.dataSource?.length) {
      return true;
    }

    return branchNomenclatureTableProps?.dataSource?.some(
      (availableProduct: any) =>
        availableProduct.id === product.id ||
        availableProduct.name === product.name
    );
  };

  const updateProductField = (
    id: string | number,
    field: string,
    value: any
  ) => {
    setProducts(
      products.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };

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
    if (services.length === 0) {
      message.warning("Выберите услуги");
      return;
    }

    let hasInvalidFields = false;
    services.forEach((service, index) => {
      if (
        !service.type_id ||
        !service.weight ||
        service.weight <= 0 ||
        !service.bag_number_numeric
      ) {
        hasInvalidFields = true;
        let missingFields = [];
        if (!service.type_id) missingFields.push("Тип товара");
        if (!service.weight || service.weight <= 0) missingFields.push("Вес");
        if (!service.bag_number_numeric) missingFields.push("Номер мешка");
        message.warning(
          `Услуга #${
            index + 1
          }: Заполните все обязательные поля (${missingFields.join(", ")})`
        );
      }
    });

    if (hasInvalidFields) {
      return;
    }

    const baseAmount =
      services.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.sum),
        0
      ) +
      products.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.sum),
        0
      );

    const markup = Number(values.markup) || 0;
    const finalAmount = baseAmount + (baseAmount * markup) / 100;

    const submitValues = {
      ...values,
      services: services,
      products: products.filter((product) => Number(product.quantity) > 0),
      amount: finalAmount,
      sent_back_id:
        sentCityData.find((item: any) => item.id === values.sent_back_id)
          ?.sent_city_id || null,
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
    optionLabel: (record: any) =>
      `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}`,
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "sender",
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
          {
            field: "clientPrefix",
            operator: "contains",
            value,
          },
          {
            field: "name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: counterpartySelectPropsReceiver } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) =>
      `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}`,
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "receiver",
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
          {
            field: "clientPrefix",
            operator: "contains",
            value,
          },
          {
            field: "name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) =>
      `${record?.name}${record?.is_sent ? " (досыльный)" : ""}`,
    filters: [
      {
        field: "name",
        operator: "ne",
        value: "Бишкек",
      },
    ],
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  const { tableProps: branchNomenclatureTableProps } = useTable({
    resource: "branch-nomenclature",
    filters: {
      permanent: [
        {
          field: "destination_id",
          operator: "eq",
          value: values?.destination_id,
        },
      ],
    },
    queryOptions: {
      enabled: !!values?.destination_id,
    },
  });

  useEffect(() => {
    //@ts-ignore
    if (!branchNomenclatureTableProps?.dataSource?.product_types?.length) {
      setProducts([]);
      return;
    }

    //@ts-ignore
    const formattedProducts = branchNomenclatureTableProps?.dataSource?.product_types?.map(
      (item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: 0,
        sum: 0,
        edit: item.edit || false,
        isSelected: false,
      })
    );
    setProducts(formattedProducts);
  }, [branchNomenclatureTableProps?.dataSource]);

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
      return record?.name;
    },
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  const { selectProps: packerSelectProps } = useSelect({
    resource: "packers",
    optionLabel: (record: any) => {
      return `${record?.first_name} ${record?.last_name}`;
    },
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "first_name",
            operator: "contains",
            value,
          },
          {
            field: "last_name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: visitingGroupSelectProps } = useSelect({
    resource: "visiting-group",
    optionLabel: (record: any) => {
      return `${record?.first_name} ${record?.last_name}`;
    },
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "first_name",
            operator: "contains",
            value,
          },
          {
            field: "last_name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

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

  useEffect(() => {
    if (
      discountCashBackOptions.length > 0 &&
      (values?.sender_id || values?.recipient_id)
    ) {
      const cashBackOption = discountCashBackOptions.find(
        (option) => option.type === "cashback"
      );

      if (cashBackOption) {
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
        const discountOption = discountCashBackOptions.find(
          (option) => option.type === "discount"
        );

        if (discountOption) {
          setDiscount(discountOption.value);
          formProps.form?.setFieldsValue({
            discount_cashback_id: discountOption.id,
            cash_back_target: null,
            discount_id: discountOption.originalData.id,
          });
        }
      }
    } else if (discountCashBackOptions.length === 0) {
      setDiscount(0);
      formProps.form?.setFieldsValue({
        discount_cashback_id: null,
        cash_back_target: null,
        discount_id: null,
      });
    }
  }, [discountCashBackOptions, values?.sender_id, values?.recipient_id]);

  useEffect(() => {
    if (services?.length > 0) {
      const newServices = services.map((item) => {
        const selectedType = tariffTableProps?.dataSource?.find(
          (type: any) =>
            type.branch_id === values?.destination_id &&
            type.product_type_id === Number(item.type_id)
        );

        const newItem = { ...item };

        if (!item.is_price_editable && selectedType?.tariff) {
          newItem.price = Number(selectedType.tariff) - discount;
        }

        if (newItem.weight && selectedType?.tariff) {
          const priceToUse = item.is_price_editable
            ? newItem.price
            : Number(selectedType.tariff) - discount;
          newItem.sum = calculateSum(Number(newItem.weight), priceToUse);
        }

        return newItem;
      });
      setServices(newServices);
    }
    setProducts([]);
  }, [discount, values?.destination_id]);

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
      quantity: products.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: products.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ];

  return (
    <Create saveButtonProps={saveButtonProps}>
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
                  const sentCityRecord = sentCityData.find(
                    (item: any) => item.sent_city_id === val
                  );

                  if (sentCityRecord) {
                    formProps.form?.setFieldsValue({
                      destination_id: sentCityRecord.city_id,
                      sent_back_id: sentCityRecord.id,
                    });
                    return;
                  }

                  formProps.form?.setFieldsValue({
                    destination_id: val,
                    sent_back_id: null,
                  });
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
              max={20}
              type="number"
              value={copyCount}
              onChange={(e: any) => setCopyCount(e.target.value)}
              placeholder="Кол-во"
            />
          </Col>
          <Col xs={12} sm={10} md={8} lg={6}>
            <Tooltip
              title={
                selectedRowKeys.length > 0
                  ? `Скопировать выделенные товары (${selectedRowKeys.length}) указанное количество раз`
                  : "Создать новые пустые товары в указанном количестве"
              }
            >
              <Button
                disabled={Number(copyCount || 0) === 0}
                onClick={copyWhileCount}
                icon={<CopyOutlined />}
                style={{ width: "100%" }}
              >
                {selectedRowKeys.length > 0 ? "Копировать" : "Создать"}: (
                {copyCount})
              </Button>
            </Tooltip>
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
                    updateItemField(record.id, "type_id", val, index);
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
                    onChange={async (e) => {
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

                      const response = await fetch(
                        `${API_URL}/service/checking-service-number?destination_id=${values?.destination_id}&bag_number=${e.target.value}`,
                        {
                          method: "GET",
                        }
                      );

                      const data = await response.json();
                      if (data) {
                        message.error(
                          `Номер мешка ${e.target.value} уже существует`
                        );

                        setHasBagNumber((prevState) => {
                          const exists = prevState.some(
                            (item) => item.id === record.id
                          );
                          if (!exists) {
                            return [...prevState, { id: record.id, has: true }];
                          }
                          return prevState;
                        });
                      } else {
                        setHasBagNumber((prevState) =>
                          prevState.filter((item) => item.id !== record.id)
                        );
                      }
                    }}
                    style={{
                      width: 120,
                      border: hasBagNumber.find(
                        (item: { id: number; has: boolean }) =>
                          item.id === record.id
                      )?.has
                        ? "1px solid red"
                        : "1px solid #d9d9d9",
                    }}
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
                onChange={(val) => {
                  if (val === null || val === undefined) {
                    updateItemField(record.id, "weight", null);
                    return;
                  }

                  updateItemField(record.id, "weight", val);
                }}
                formatter={(value) => {
                  return value?.toString().replace(".", ",") || "";
                }}
                parser={(value) => {
                  if (!value) return value;
                  const cleanValue = value.replace(",", ".");
                  const parsed = parseFloat(cleanValue);
                  return isNaN(parsed) ? null : parsed;
                }}
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
                  onChange={(val) => {
                    updateItemField(record.id, "price", val);
                  }}
                  disabled={!record.is_price_editable}
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
                onChange={(val) =>
                  updateProductField(record.id, "quantity", val)
                }
                disabled={
                  index >= products.length ||
                  (!record.edit && !isProductAvailableForBranch(record))
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
                  disabled={!record.edit}
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
          <Col span={8}>
            <Form.Item label="Процент скидки" name="discount_custom">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
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
    </Create>
  );
};
