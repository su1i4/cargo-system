import { useEffect, useState } from "react";
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
  tariff?: number;
  quantity?: number;
  weight?: number;
  price?: number;
  sum?: number;
  barcode: string;
  bag_number?: string;
}

interface TypeProduct {
  id: string;
  name: string;
  tariff: number;
}

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  sum?: number;
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

const countries = [
  { label: "Китай", value: "Китай" },
  { label: "Узбекистан", value: "Узбекистан" },
  { label: "Туркменистан", value: "Туркменистан" },
  { label: "Кыргызстан", value: "Кыргызстан" },
  { label: "Турция", value: "Турция" },
];

export const GoodsCreate = () => {
  const { formProps, saveButtonProps, form } = useForm();
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
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [copyCount, setCopyCount] = useState(0);

  const [senderData, setSenderData] = useState<any>(null);
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

  useEffect(() => {
    refetchTariffs();
  }, []);

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
    if (tableProps.dataSource) {
      const formattedProducts = tableProps.dataSource.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: 0,
        sum: 0,
        isSelected: false,
      }));
      setProducts(formattedProducts);
    }
  }, [tableProps.dataSource]);

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
    const recieverId = formProps.form?.getFieldValue("recipient_id");
    const reciver = counterpartySelectPropsReceiver.options?.find(
      (item: any) => item.value === recieverId
    );
    const branchId = formProps.form?.getFieldValue("destination_id");
    const branch = branchSelectProps.options?.find(
      (item: any) => item.value === branchId
    );
    const newItem: GoodItem = {
      id: nextId,
      barcode: generateBarcode(),
      //@ts-ignore
      bag_number: `${reciver?.label?.split(",")[0]}/${branch?.label?.slice(
        0,
        1
      )}|`,
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

  const createItemsByCount = (bag_number: string) => {
    const count = Number(copyCount || 0);
    if (count <= 0) {
      message.warning("Укажите корректное количество для создания");
      return;
    }

    const newItems = Array.from({ length: count }, (_, i) => {
      const newId = nextId + i;

      return {
        id: newId,
        name: "Новый товар",
        barcode: generateBarcode(),
        bag_number: bag_number,
      };
    });

    setServices([...services, ...newItems]);
    setNextId(nextId + count);
  };

  const copyWhileCount = () => {
    const recieverId = formProps.form?.getFieldValue("recipient_id");
    const reciver = counterpartySelectPropsReceiver.options?.find(
      (item: any) => item.value === recieverId
    );
    const branchId = formProps.form?.getFieldValue("destination_id");
    const branch = branchSelectProps.options?.find(
      (item: any) => item.value === branchId
    );
    for (let i = 0; i < Number(copyCount || 0); i++) {
      //@ts-ignore
      createItemsByCount(
        //@ts-ignore
        `${reciver?.label?.split(",")[0]}/${branch?.label?.slice(0, 1)}|`
      );
    }
    message.success(`Создано ${copyCount} новых товаров`);
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

          if (field === "type_id") {
            const selectedType = tariffTableProps?.dataSource?.find(
              (type: any) =>
                type.branch_id === values?.destination_id &&
                type.product_type_id === value
            );

            if (selectedType) {
              newItem.tariff = selectedType.tariff;
              newItem.price = selectedType.tariff;
              if (newItem.weight) {
                newItem.sum = calculateSum(newItem.weight, selectedType.tariff);
              }
            }
          }

          if (field === "weight") {
            if (newItem.tariff) {
              newItem.sum = calculateSum(value, newItem.tariff);
            }
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

    const submitValues = {
      ...values,
      services: services,
      products: products.filter((product) => Number(product.quantity) > 0),
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

  useEffect(() => {
    if (values?.sender_id && counterpartySelectPropsSender?.options) {
      const selectedSender = counterpartySelectPropsSender.options.find(
        (item: any) => item.value === values.sender_id
      );
      if (selectedSender) {
        setSenderData(selectedSender);

        if (services.length > 0) {
          const senderPrefix =
            typeof selectedSender?.label === "string"
              ? selectedSender.label.split(",")[0]
              : "";
          setServices(
            services.map((service, index) => {
              const selectedType = tariffTableProps?.dataSource?.find(
                (type: any) =>
                  type.branch_id === values?.destination_id &&
                  type.product_type_id === service.type_id
              );
              return {
                ...service,
                bag_number: `${senderPrefix}/${
                  selectedType?.product_type?.name.slice(0, 1) || ""
                }${index + 1}`,
              };
            })
          );
        }
      }
    }
  }, [values?.sender_id]);

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

  const { selectProps: discountSelectProps }: any = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, ${record?.discount.discount} руб`;
    },
    optionValue: (record: any) => {
      return record?.id;
    },
    filters: [
      {
        field: "id",
        operator: "in",
        value: [values?.sender_id, values?.recipient_id],
      },
    ],
    queryOptions: {
      enabled: !!values?.sender_id && !!values?.recipient_id,
    },
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => `${record?.name}`,
    filters: [
      {
        field: "name",
        operator: "ne",
        value: "Бишкек",
      },
      {
        field: "is_sent",
        operator: "eq",
        value: false,
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
    if (discountSelectProps?.options?.length > 0) {
      formProps.form?.setFieldsValue({
        discount_id: discountSelectProps?.options?.reduce(
          (max: any, current: any) => {
            return parseFloat(current.discount) < parseFloat(max.discount)
              ? current
              : max;
          }
        ).value,
      });
      console.log(
        discountSelectProps?.options?.reduce((max: any, current: any) => {
          return parseFloat(current.discount) < parseFloat(max.discount)
            ? current
            : max;
        }).value
      );
    }
  }, [values?.sender_id, values?.recipient_id]);

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
                  const recieverId =
                    formProps.form?.getFieldValue("recipient_id");
                  const reciver = counterpartySelectPropsReceiver.options?.find(
                    (item: any) => item.value === recieverId
                  );
                  const newServices = services.map((item) => {
                    return {
                      ...item,
                      bag_number: `${
                        //@ts-ignore
                        reciver?.label?.split(",")[0]
                      }/${record?.label?.slice(0, 1)}`,
                    };
                  });
                  console.log(
                    newServices,
                    counterpartySelectPropsReceiver,
                    recieverId
                  );
                  setServices(newServices);
                  formProps.form?.setFieldsValue({
                    sent_back_id: null,
                  });
                }}
                {...branchSelectProps}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              rules={[{ required: true, message: "Отправитель обязателен" }]}
              label="Отправитель"
              name="sender_id"
            >
              <Select {...counterpartySelectPropsSender} allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              rules={[{ required: true, message: "Получатель обязателен" }]}
              label="Получатель"
              name="recipient_id"
            >
              <Select
                onChange={(val, record) => {
                  const branchId =
                    formProps.form?.getFieldValue("destination_id");
                  const branch = branchSelectProps.options?.find(
                    (item: any) => item.value === branchId
                  );
                  const newServices = services.map((item) => {
                    return {
                      ...item,
                      bag_number: `${
                        //@ts-ignore
                        record?.label?.split(",")[0]
                        //@ts-ignore
                      }/${branch?.label?.slice(0, 1)}`,
                    };
                  });
                  setServices(newServices);
                  console.log(branch, branchId, newServices);
                }}
                {...counterpartySelectPropsReceiver}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Комментарий" name="comment">
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
              rules={[{ required: true, message: "Оплачивает" }]}
              label="Оплачивает"
              name="pays"
              initialValue="recipient"
            >
              <Select
                showSearch
                allowClear
                placeholder="Выберите"
                options={[
                  { label: "Получатель", value: "recipient" },
                  { label: "Отправитель", value: "sender" },
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
            <Form.Item label="Скидка" name="discount_id">
              <Select {...discountSelectProps} allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Title level={5}>Услуги</Title>
        <Row gutter={16} style={{ marginBottom: 10 }}>
          <Col>
            <Space>
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
                >
                  Добавить товар
                </Button>
              </Tooltip>
              <Input
                style={{ width: 100 }}
                min={0}
                type="number"
                value={copyCount}
                onChange={(e: any) => setCopyCount(e.target.value)}
              />
              <Button
                disabled={
                  Number(copyCount || 0) === 0 ||
                  values?.destination_id === undefined ||
                  values?.sender_id === undefined ||
                  values?.recipient_id === undefined
                }
                onClick={copyWhileCount}
                icon={<CopyOutlined />}
              >
                Копировать: ({copyCount}) кол-во
              </Button>
              <Button
                onClick={copySelectedItems}
                icon={<CopyOutlined />}
                disabled={selectedRowKeys.length === 0}
              >
                Копировать выбранные ({selectedRowKeys.length})
              </Button>
              <Button
                onClick={removeSelectedItems}
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
              >
                Удалить выбранные ({selectedRowKeys.length})
              </Button>
            </Space>
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
            title="Страна"
            dataIndex="country"
            render={(value, record: any, index: number) =>
              index < services.length && (
                <Select
                  style={{ width: 200 }}
                  options={countries}
                  value={value}
                  onChange={(val) => updateItemField(record.id, "country", val)}
                  allowClear
                  showSearch
                  onSearch={(val) => [
                    {
                      field: "name",
                      operator: "contains",
                      value: val,
                    },
                  ]}
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
                    console.log(val);
                    updateItemField(record.id, "type_id", val, index);
                  }}
                  allowClear
                />
              )
            }
          />
          <Table.Column
            title="Номер мешка"
            dataIndex="bag_number"
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
                              bag_number: e.target.value,
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
                  disabled
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
                <Space size="middle">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.id)}
                  />
                </Space>
              )
            }
          />
        </Table>
        <Title style={{ marginTop: 30 }} level={5}>
          Товары
        </Title>
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
                disabled={index >= products.length}
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
                  disabled
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
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
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
