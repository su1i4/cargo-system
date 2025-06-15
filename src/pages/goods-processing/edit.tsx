import { useEffect, useState } from "react";
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
  price: number; // Цена приходит с бэкенда
  quantity?: number;
  sum?: number;
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

  // Расчет суммы комиссии на основе объявленной ценности и процента комиссии
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
            ...item,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            sum: product.sum,
          };
        } else {
          return {
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0, // Цена берется из бэкенда
            quantity: 0,
            sum: 0,
          };
        }
      });
      console.log(formattedProducts, " updateProductField");
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
      is_created: true, // Отмечаем, что товар новый
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
              newItem.price = Number(selectedType.tariff) - discount;
              if (newItem.weight) {
                newItem.sum = calculateSum(
                  newItem.weight,
                  Number(selectedType.tariff - discount)
                );
              }
            }
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

          // Если изменяется количество, пересчитываем сумму на основе количества и цены
          if (field === "quantity") {
            newItem.sum = value * item.price;
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

  // Настройки для выбора строк в таблице товаров
  const productRowSelection = {
    selectedRowKeys: selectedProductKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedProductKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: ProductItem) => ({
      // Отключаем выбор для итоговой строки
      disabled: record.id === "total",
      style: {
        display: record.id === "total" ? "none" : "",
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

    const submitValues = {
      ...values,
      services: [...services, ...deletedServices].map((service) => ({
        ...service,
        // Добавляем метки для изменений
        is_updated: service.updated === true && !service.is_created,
        is_created: service.is_created === true,
      })),
      products: products
        // .filter((product) => Number(product.quantity) > 0)
        .map((product) => ({
          ...product,
          // Добавляем метки для изменений
          is_updated: product.updated === true && !product.is_created,
          is_created: product.is_created === true,
        })),
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

  useEffect(() => {
    if (services?.length > 0) {
      const newServices = services.map((item) => {
        const selectedType = tariffTableProps?.dataSource?.find(
          (type: any) =>
            type.branch_id === values?.destination_id &&
            type.product_type_id === Number(item.type_id)
        );
        return {
          ...item,
          price: Number(selectedType?.tariff) - discount,
          sum: calculateSum(
            Number(item.weight),
            Number(Number(selectedType?.tariff) - discount)
          ),
        };
      });
      setServices(newServices);
    }
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
      (item) => item.value === recieverId
    );
    const branchId = formProps.form?.getFieldValue("destination_id");
    const branch = branchSelectProps.options?.find(
      (item) => item.value === branchId
    );
    createItemsByCount(
      getLabelSafe(reciver) && getLabelSafe(branch)
        ? `${getLabelSafe(reciver).split(",")[0]}/${getLabelSafe(branch).slice(
            0,
            1
          )}`
        : ""
    );
    message.success(`Создано ${copyCount} новых товаров`);
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
                    (item) => item.value === branchId
                  );
                  const recordLabel = getLabelSafe(record);
                  const branchLabel = getLabelSafe(branch);
                  const newServices = services.map((item) => {
                    return {
                      ...item,
                      bag_number:
                        recordLabel && branchLabel
                          ? `${recordLabel.split(",")[0]}/${branchLabel.slice(
                              0,
                              1
                            )}`
                          : "",
                    };
                  });
                  setServices(newServices);
                }}
                {...counterpartySelectPropsReceiver}
                allowClear
              />
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
          {/* <Col span={6}>
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
          </Col> */}
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
              <Select
                onChange={(_, record: { label: string; value: number }) =>
                  setDiscount(Number(record?.label?.split("'")[1]))
                }
                {...discountSelectProps}
                allowClear
              />
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
                onChange={(e) => setCopyCount(Number(e.target.value))}
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
          {/* <Table.Column
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
          /> */}
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
    </Edit>
  );
};
