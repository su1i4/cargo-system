import React, { useEffect } from "react";
import { useSelect } from "@refinedev/antd";
import {
  Button,
  Col,
  Input,
  Row,
  Table,
  Select,
  InputNumber,
  Space,
  Checkbox,
  message,
  Form,
} from "antd";
import Title from "antd/es/typography/Title";
import {
  CopyOutlined,
  DeleteOutlined,
  FileAddOutlined,
} from "@ant-design/icons";

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
  updated?: boolean;
  is_created?: boolean;
  bag_number_numeric?: string;
  is_price_editable?: boolean;
  individual_discount?: number;
  discount_id?: number | null;
}

interface TypeProduct {
  id: string;
  name: string;
  tariff: number;
}

interface GoodsProcessingEditServicesProps {
  services: GoodItem[];
  setServices: (services: GoodItem[]) => void;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  deletedServices: GoodItem[];
  setDeletedServices: (services: GoodItem[]) => void;
  nextId: number;
  setNextId: (id: number) => void;
  copyCount: number;
  setCopyCount: (count: number) => void;
  tariffTableProps: any;
  values: any;
  record: any;
  tariffs: any[];
  typeProducts: TypeProduct[];
  selectedDiscountOption: any;
}

export const GoodsProcessingEditServices = React.memo(
  ({
    services,
    setServices,
    selectedRowKeys,
    setSelectedRowKeys,
    deletedServices,
    setDeletedServices,
    nextId,
    setNextId,
    copyCount,
    setCopyCount,
    tariffTableProps,
    values,
    record,
    tariffs,
    typeProducts,
    selectedDiscountOption,
  }: GoodsProcessingEditServicesProps) => {

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

    const findTariff = (branchId: number, productTypeId: number): number => {
      const foundTariff = tariffs.find(
        (tariff) =>
          tariff.branch_id === branchId &&
          tariff.product_type_id === productTypeId
      );

      return foundTariff ? parseFloat(foundTariff.tariff) : 0;
    };

    const calculateSum = (weight: number = 0, tariff: number = 0): number => {
      return weight * tariff;
    };

    const generateBarcode = (): string => {
      const prefix = "45";
      const timestamp = Date.now().toString().slice(-10);
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `${prefix}${timestamp}${random}`;
    };

    const updateItemField = async (
      id: number,
      field: string,
      value: any
    ) => {
      const updatedServices = services.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };

          // Помечаем услугу как обновленную, если это не новая услуга
          if (!newItem.is_created) {
            newItem.updated = true;
          }

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
                const discountToApply = newItem.individual_discount || 0;
                newItem.price = Number(selectedType.tariff) - discountToApply;
              }

              if (newItem.weight) {
                const discountToApply = newItem.individual_discount || 0;
                const priceToUse = item.is_price_editable
                  ? newItem.price
                  : Number(selectedType.tariff) - discountToApply;
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
      });

      setServices(updatedServices);
    };

    const addNewItem = () => {
      const newItem: GoodItem = {
        id: nextId,
        barcode: generateBarcode(),
        is_price_editable: false,
        is_created: true,
        updated: false,
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
      
      const newItems = selectedItems.map((item, index) => {
        const newId = nextId + index;
        return {
          ...item,
          id: newId,
          barcode: generateBarcode(),
          is_created: true,
          updated: false,
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
              is_created: true,
              updated: false,
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
            is_price_editable: false,
            is_created: true,
            updated: false,
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

      if (count <= 0) {
        message.warning("Укажите корректное количество для создания");
        return;
      }

      requestAnimationFrame(() => {
        createItemsByCount();

        if (hasSelectedItems) {
          message.success(
            `Скопировано ${selectedRowKeys.length} товаров ${count} раз(а)`
          );
        } else {
          message.success(`Создано ${count} новых товаров`);
        }
      });
    };

    const removeSelectedItems = () => {
      if (selectedRowKeys.length === 0) {
        message.warning("Выберите товары для удаления");
        return;
      }

      const itemsToDelete = services.filter((item) =>
        selectedRowKeys.includes(item.id)
      );
      
      // Добавляем в список удаленных только существующие услуги (не новые)
      const existingItemsToDelete = itemsToDelete.filter(item => !item.is_created);
      if (existingItemsToDelete.length > 0) {
        setDeletedServices([...deletedServices, ...existingItemsToDelete]);
      }

      const remainingItems = services.filter(
        (item) => !selectedRowKeys.includes(item.id)
      );
      
      setServices(remainingItems);
      setSelectedRowKeys([]);

      message.success(`Удалено ${selectedRowKeys.length} товаров`);
    };

    const removeItem = (id: number) => {
      const itemToDelete = services.find(item => item.id === id);
      
      if (itemToDelete && !itemToDelete.is_created) {
        setDeletedServices([...deletedServices, itemToDelete]);
      }
      
      setServices(services.filter((item) => item.id !== id));
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

    // Обновляем тарифы при изменении destination_id
    useEffect(() => {
      const updateServicesWithTariffs = async () => {
        if (values?.destination_id && services.length > 0) {
          const branchId = Number(values.destination_id);

          const updatedServices = services.map((item) => {
            if (item.type_id) {
              const productTypeId = Number(item.type_id);
              const tariffValue = findTariff(branchId, productTypeId);

              if (tariffValue > 0) {
                const newItem = { ...item };
                newItem.tariff = tariffValue;
                
                const discountToApply = newItem.individual_discount || 0;
                newItem.price = tariffValue - discountToApply;

                if (newItem.weight) {
                  newItem.sum = calculateSum(newItem.weight, newItem.price);
                }

                if (!newItem.is_created) {
                  newItem.updated = true;
                }

                return newItem;
              }
            }
            return item;
          });

          setServices(updatedServices);
        }
      };

      updateServicesWithTariffs();
    }, [values?.destination_id, tariffs]);

    return (
      <>
        <Title level={5}>Услуги</Title>
        <Row gutter={[16, 8]} style={{ marginBottom: 10 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button
              onClick={addNewItem}
              icon={<FileAddOutlined />}
              style={{ width: "100%" }}
            >
              Добавить товар
            </Button>
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
            <Button
              disabled={Number(copyCount || 0) === 0}
              onClick={copyWhileCount}
              icon={<CopyOutlined />}
              style={{ width: "100%" }}
            >
              {selectedRowKeys.length > 0 ? "Копировать" : "Создать"}: (
              {copyCount})
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
                  style={{ 
                    width: 200,
                    backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                  }}
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
                <div style={{ position: 'relative' }}>
                  <Select
                    style={{ 
                      width: 200,
                      backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                    }}
                    {...typeProductSelectProps}
                    value={value}
                    onChange={(val) => {
                      updateItemField(record.id, "type_id", val);
                    }}
                    allowClear
                  />
                  {record.updated && (
                    <span style={{ 
                      position: 'absolute', 
                      right: -50, 
                      top: 5, 
                      color: '#1890ff', 
                      fontSize: '12px' 
                    }}>
                      изм.
                    </span>
                  )}
                  {record.is_created && (
                    <span style={{ 
                      position: 'absolute', 
                      right: -50, 
                      top: 5, 
                      color: '#52c41a', 
                      fontSize: '12px' 
                    }}>
                      нов.
                    </span>
                  )}
                </div>
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
                      const newValue = e.target.value;
                      updateItemField(record.id, "bag_number_numeric", newValue);
                    }}
                    style={{
                      width: 120,
                      backgroundColor: record.updated ? '#f6ffed' : 'inherit'
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
                style={{ 
                  width: 100,
                  backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                }}
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
                style={{ 
                  width: 100,
                  backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                }}
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
                  style={{ 
                    width: 100,
                    backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                  }}
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
                style={{ 
                  width: 100,
                  backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                }}
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

        {/* Секция "Прочее" */}
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
                      (services.reduce(
                        (acc, item) => acc + Number(item.sum || 0),
                        0
                      ) *
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
                    services.reduce(
                      (acc, item) => acc + Number(item.sum || 0),
                      0
                    ) *
                    (1 + (Number(values?.markup) || 0) / 100)
                  ).toFixed(2)}{" "}
                  руб.
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Секция "Гарантия" */}
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

        {/* Секция "Упаковщики" */}
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
      </>
    );
  }
); 