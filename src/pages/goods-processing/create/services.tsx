import React, { useMemo, useRef, useState } from "react";
import { useSelect } from "@refinedev/antd";
import {
  Button,
  Col,
  Input,
  Row,
  Table,
  Tooltip,
  Select,
  InputNumber,
  Space,
  Checkbox,
  message,
} from "antd";
import Title from "antd/es/typography/Title";
import {
  CopyOutlined,
  DeleteOutlined,
  FileAddOutlined,
} from "@ant-design/icons";

export const GoodsProcessingCreateServices = React.memo(
  ({
    services,
    setServices,
  }: {
    services: any[];
    setServices: (services: any[]) => void;
  }) => {
    const countRef = useRef(0);
    const nextId = useRef(0);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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

    const lastGoods = useMemo(
      () => [
        {
          weight: services.reduce(
            (acc, item) => acc + Number(item.weight || 0),
            0
          ),
          price: 0,
          quantity: services.reduce(
            (acc, item) => acc + Number(item.quantity || 0),
            0
          ),
          sum: services.reduce((acc, item) => acc + Number(item.sum || 0), 0),
        },
      ],
      [services]
    );

    const calculateSum = (weight: number = 0, tariff: number = 0): number => {
      return weight * tariff;
    };

    const updateItemField = (id: number, field: string, value: any) => {
      setServices(
        services.map((item) => {
          if (item.id === id) {
            const newItem = { ...item, [field]: value };

            // if (field === "type_id" || field === "weight") {
            //   const selectedType = tariffTableProps?.dataSource?.find(
            //     (type: any) =>
            //       type.branch_id === values?.destination_id &&
            //       type.product_type_id ===
            //         (field === "weight" ? Number(item.type_id) : value)
            //   );

            //   if (selectedType) {
            //     newItem.tariff = selectedType.tariff;

            //     if (!item.is_price_editable) {
            //       newItem.price = Number(selectedType.tariff)
            //     }

            //     if (newItem.weight) {
            //       const priceToUse = item.is_price_editable
            //         ? newItem.price
            //         : Number(selectedType.tariff)
            //       newItem.sum = calculateSum(newItem.weight, priceToUse);
            //     }
            //   }
            // }

            if (field === "price" && item.is_price_editable && newItem.weight) {
              newItem.sum = calculateSum(newItem.weight, value);
            }

            return newItem;
          }
          return item;
        })
      );
    };

    const removeItem = (id: number) => {
      setServices(services.filter((item) => item.id !== id));
    };

    const addNewItem = () => {
      setServices([
        ...services,
        {
          id: services.length + 1,
          nomenclature_id: "",
          type_id: "",
        },
      ]);
    };

    const generateBarcode = (): string => {
      const prefix = "45";
      const timestamp = Date.now().toString().slice(-10);
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `${prefix}${timestamp}${random}`;
    };

    const createItemsByCount = () => {
      const count = Number(countRef.current || 0);
      if (count <= 0) {
        message.warning("Укажите корректное количество для создания");
        return;
      }

      let newItems: any[] = [];

      if (selectedRowKeys.length > 0) {
        const selectedItems = services.filter((item) =>
          selectedRowKeys.includes(item.id)
        );

        for (let i = 0; i < count; i++) {
          const itemsToAdd = selectedItems.map((item, index) => {
            const newId = nextId.current + i * selectedItems.length + index;
            return {
              ...item,
              id: newId,
              barcode: generateBarcode(),
              is_price_editable: item.is_price_editable || false,
            };
          });
          newItems = [...newItems, ...itemsToAdd];
        }

        nextId.current += count * selectedItems.length;
      } else {
        // Если нет выделенных товаров, создаем пустые
        newItems = Array.from({ length: count }, (_, i) => {
          const newId = nextId.current + i;
          return {
            id: newId,
            barcode: generateBarcode(),
            bag_number_numeric: "",
            is_price_editable: false,
          };
        });

        nextId.current += count;
      }

      setServices([...services, ...newItems]);
      setSelectedRowKeys([]); // Сбрасываем выделение
    };

    const copyWhileCount = () => {
      const count = Number(countRef.current || 0);
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

    const copySelectedItems = () => {
      if (selectedRowKeys.length === 0) {
        message.warning("Выберите товары для копирования");
        return;
      }

      const selectedItems = services.filter((item) =>
        selectedRowKeys.includes(item.id)
      );
      const newItems = selectedItems.map((item) => {
        const newId = nextId.current + selectedItems.indexOf(item);
        return {
          ...item,
          id: newId,
          barcode: generateBarcode(),
        };
      });

      setServices([...services, ...newItems]);
      nextId.current += selectedItems.length;
      setSelectedRowKeys([]);

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
      setServices(selectedItems);
      setSelectedRowKeys([]);

      message.success(`Удалено ${selectedItems.length} товаров`);
    };

    const rowSelection = {
      selectedRowKeys,
      onChange: (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
      },
      getCheckboxProps: (
        record:
          | any
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
              value={countRef.current}
              onChange={(e: any) => (countRef.current = e.target.value)}
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
                disabled={Number(countRef.current || 0) === 0}
                onClick={copyWhileCount}
                icon={<CopyOutlined />}
                style={{ width: "100%" }}
              >
                {selectedRowKeys.length > 0 ? "Копировать" : "Создать"}: (
                {countRef.current})
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
      </>
    );
  }
);
