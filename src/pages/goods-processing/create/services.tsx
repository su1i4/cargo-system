import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { API_URL } from "../../../App";

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
  individual_discount?: number;
  discount_id?: number | null;
}

interface GoodsProcessingCreateServicesProps {
  services: GoodItem[];
  setServices: (services: GoodItem[]) => void;
  hasBagNumber: { id: number; has: boolean }[];
  setHasBagNumber: React.Dispatch<
    React.SetStateAction<{ id: number; has: boolean }[]>
  >;
  checkTimeouts: { [key: number]: NodeJS.Timeout };
  setCheckTimeouts: React.Dispatch<
    React.SetStateAction<{ [key: number]: NodeJS.Timeout }>
  >;
  isCheckingBagNumbers: boolean;
  setIsCheckingBagNumbers: (checking: boolean) => void;
  tariffTableProps: any;
  values: any;
  tariffs: any[];
  selectedDiscountOption: any;
  discounts: any[];
}

const nomenclatureSelectConfig = {
  resource: "nomenclature",
  optionLabel: (record: any) => record?.name || "",
  onSearch: (value: string) => [
    {
      field: "name",
      operator: "contains" as const,
      value,
    },
  ],
};

const typeProductSelectConfig = {
  resource: "type-product",
  optionLabel: (record: any) => record?.name || "",
  onSearch: (value: string) => [
    {
      field: "name",
      operator: "contains" as const,
      value,
    },
  ],
};

export const GoodsProcessingCreateServices = React.memo(
  ({
    services,
    setServices,
    hasBagNumber,
    setHasBagNumber,
    checkTimeouts,
    setCheckTimeouts,
    isCheckingBagNumbers,
    setIsCheckingBagNumbers,
    tariffTableProps,
    values,
    tariffs,
    discounts,
    selectedDiscountOption,
  }: GoodsProcessingCreateServicesProps) => {
    const [nextId, setNextId] = useState(1);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [copyCount, setCopyCount] = useState(0);

    const { selectProps: nomenclatureSelectProps } = useSelect(
      nomenclatureSelectConfig
    );
    const { selectProps: typeProductSelectProps } = useSelect(
      typeProductSelectConfig
    );

    const findTariff = useCallback(
      (branchId: number, productTypeId: number): number => {
        const foundTariff = tariffs.find(
          (tariff) =>
            tariff.branch_id === branchId &&
            tariff.product_type_id === productTypeId
        );
        return foundTariff ? parseFloat(foundTariff.tariff) : 0;
      },
      [tariffs]
    );

    const calculateSum = useCallback(
      (weight: number = 0, tariff: number = 0): number => {
        return weight * tariff;
      },
      []
    );

    const generateBarcode = useCallback((): string => {
      const prefix = "45";
      const timestamp = Date.now().toString().slice(-10);
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `${prefix}${timestamp}${random}`;
    }, []);

    const getNextBagNumber = useCallback((): string => {
      const existingNumbers = services
        .map((item) => item.bag_number_numeric)
        .filter((num) => num && !isNaN(Number(num)))
        .map((num) => Number(num))
        .sort((a, b) => a - b);

      if (existingNumbers.length === 0) {
        return "1";
      }

      const maxNumber = Math.max(...existingNumbers);
      return (maxNumber + 1).toString();
    }, [services]);

    const generateConsecutiveBagNumbers = useCallback(
      (count: number): string[] => {
        const existingNumbers = services
          .map((item) => item.bag_number_numeric)
          .filter((num) => num && !isNaN(Number(num)))
          .map((num) => Number(num))
          .sort((a, b) => a - b);

        let startNumber = 1;
        if (existingNumbers.length > 0) {
          startNumber = Math.max(...existingNumbers) + 1;
        }

        return Array.from({ length: count }, (_, i) =>
          (startNumber + i).toString()
        );
      },
      [services]
    );

    const checkBagNumberAsync = useCallback(
      async (bagNumber: string, recordId: number) => {
        if (!values?.destination_id || !bagNumber) return;

        try {
          const response = await fetch(
            `${API_URL}/service/checking-service-number?destination_id=${values.destination_id}&bag_number=${bagNumber}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "cargo-system-token"
                )}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data) {
            message.error(`Номер мешка ${bagNumber} уже существует`);

            setHasBagNumber((prevState: { id: number; has: boolean }[]) => {
              const exists = prevState.some(
                (item: { id: number; has: boolean }) => item.id === recordId
              );
              if (!exists) {
                return [...prevState, { id: recordId, has: true }];
              }
              return prevState;
            });
          } else {
            setHasBagNumber((prevState: { id: number; has: boolean }[]) =>
              prevState.filter(
                (item: { id: number; has: boolean }) => item.id !== recordId
              )
            );
          }
        } catch (error) {
          console.error("Ошибка при проверке номера мешка:", error);
        }
      },
      [values?.destination_id, setHasBagNumber]
    );

    const checkBagNumberWithDebounce = useCallback(
      (bagNumber: string, recordId: number) => {
        if (checkTimeouts[recordId]) {
          clearTimeout(checkTimeouts[recordId]);
        }

        const timeoutId = setTimeout(() => {
          checkBagNumberAsync(bagNumber, recordId);
          setCheckTimeouts((prev: { [key: number]: NodeJS.Timeout }) => {
            const newTimeouts = { ...prev };
            delete newTimeouts[recordId];
            return newTimeouts;
          });
        }, 500);

        setCheckTimeouts((prev: { [key: number]: NodeJS.Timeout }) => ({
          ...prev,
          [recordId]: timeoutId,
        }));
      },
      [checkTimeouts, checkBagNumberAsync, setCheckTimeouts]
    );

    const checkMultipleBagNumbersAsync = useCallback(
      async (bagNumbersData: { bagNumber: string; recordId: number }[]) => {
        if (!values?.destination_id || bagNumbersData.length === 0) return;

        setIsCheckingBagNumbers(true);

        try {
          const batchSize = 5;
          const batches = [];

          for (let i = 0; i < bagNumbersData.length; i += batchSize) {
            const batch = bagNumbersData.slice(i, i + batchSize);
            batches.push(batch);
          }

          for (const batch of batches) {
            const promises = batch.map(async ({ bagNumber, recordId }) => {
              try {
                const response = await fetch(
                  `${API_URL}/service/checking-service-number?destination_id=${values.destination_id}&bag_number=${bagNumber}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem(
                        "cargo-system-token"
                      )}`,
                    },
                  }
                );

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return { recordId, bagNumber, exists: !!data };
              } catch (error) {
                console.error(
                  `Ошибка при проверке номера мешка ${bagNumber}:`,
                  error
                );
                return { recordId, bagNumber, exists: false };
              }
            });

            const results = await Promise.all(promises);

            const duplicates = results.filter((result) => result.exists);
            const valid = results.filter((result) => !result.exists);

            if (duplicates.length > 0) {
              duplicates.forEach(({ bagNumber }) => {
                message.error(`Номер мешка ${bagNumber} уже существует`);
              });

              setHasBagNumber((prevState: { id: number; has: boolean }[]) => {
                const newState = [...prevState];
                duplicates.forEach(({ recordId }) => {
                  const exists = newState.some(
                    (item: { id: number; has: boolean }) => item.id === recordId
                  );
                  if (!exists) {
                    newState.push({ id: recordId, has: true });
                  }
                });
                return newState;
              });
            }

            if (valid.length > 0) {
              setHasBagNumber((prevState: { id: number; has: boolean }[]) =>
                prevState.filter(
                  (item: { id: number; has: boolean }) =>
                    !valid.some((v: any) => v.recordId === item.id)
                )
              );
            }

            if (batches.indexOf(batch) < batches.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        } finally {
          setIsCheckingBagNumbers(false);
          if (bagNumbersData.length > 1) {
            message.success(
              `Проверка номеров мешков завершена (${bagNumbersData.length} номеров)`
            );
          }
        }
      },
      [values?.destination_id, setIsCheckingBagNumbers, setHasBagNumber]
    );

    const checkIndividualDiscount = useCallback(
      (
        destinationId: number,
        productTypeId: number,
        counterpartyId: number
      ): { discount: number; discountId: number | null } => {
        try {
          const discountData = discounts.find(
            (discount) =>
              discount.destination_id === destinationId &&
              discount.product_type_id === productTypeId &&
              discount.counter_party_id === counterpartyId &&
              discount.is_active
          );
          if (discountData) {
            const discountValue = discountData.discount
              ? Number(discountData.discount)
              : 0;
            return {
              discount: discountValue,
              discountId: discountData.id,
            };
          }

          return { discount: 0, discountId: discountData.id };
        } catch (error) {
          console.error("Ошибка при поиске индивидуальной скидки:", error);
          return { discount: 0, discountId: null };
        }
      },
      [discounts]
    );

    const updateItemTariffAndPrice = useCallback(
      (item: GoodItem, branchId: number): GoodItem => {
        if (!item.type_id) return item;

        const productTypeId = Number(item.type_id);
        const selectedType = tariffTableProps?.dataSource?.find(
          (type: any) =>
            type.branch_id === branchId &&
            type.product_type_id === productTypeId
        );

        if (!selectedType) return item;

        const newItem = { ...item };
        const tariffValue = Number(selectedType.tariff);
        newItem.tariff = tariffValue;

        const { discount: individualDiscount, discountId } =
          checkIndividualDiscount(
            branchId,
            productTypeId,
            values?.discount_id || 0
          );

        newItem.individual_discount = individualDiscount;
        newItem.discount_id = discountId;

        const discountToApply = newItem.individual_discount || 0;
        newItem.price = tariffValue - discountToApply;

        if (newItem.weight) {
          newItem.sum = calculateSum(newItem.weight, newItem.price);
        }

        return newItem;
      },
      [
        tariffTableProps?.dataSource,
        values?.discount_id,
        checkIndividualDiscount,
        calculateSum,
      ]
    );

    const updateItemField = useCallback(
      (id: number, field: string, value: any, index?: number) => {
        const updatedServices = services.map((item) => {
          if (item.id === id) {
            const newItem = { ...item, [field]: value };

            if (field === "type_id" || field === "weight") {
              return updateItemTariffAndPrice(newItem, values?.destination_id);
            }

            if (field === "price" && item.is_price_editable && newItem.weight) {
              newItem.sum = calculateSum(newItem.weight, value);
            }

            return newItem;
          }
          return item;
        });

        setServices(updatedServices);
      },
      [services, values?.destination_id, updateItemTariffAndPrice, calculateSum]
    );

    const addNewItem = useCallback(() => {
      const newItem: GoodItem = {
        id: nextId,
        barcode: generateBarcode(),
        bag_number_numeric: getNextBagNumber(),
        is_price_editable: false,
      };
      setServices([...services, newItem]);
      setNextId(nextId + 1);

      if (newItem.bag_number_numeric) {
        checkBagNumberWithDebounce(newItem.bag_number_numeric, newItem.id);
      }
    }, [
      services,
      nextId,
      generateBarcode,
      getNextBagNumber,
      checkBagNumberWithDebounce,
    ]);

    const copySelectedItems = useCallback(() => {
      const selectedItems = services.filter((item) =>
        selectedRowKeys.includes(item.id)
      );

      const newBagNumbers = generateConsecutiveBagNumbers(selectedItems.length);

      const newItems = selectedItems.map((item, index) => {
        const newId = nextId + index;
        return {
          ...item,
          id: newId,
          barcode: generateBarcode(),
          bag_number_numeric: newBagNumbers[index],
          is_price_editable: item.is_price_editable || false,
        };
      });

      setServices([...services, ...newItems]);
      setNextId(nextId + selectedItems.length);
      setSelectedRowKeys([]);

      const bagNumbersToCheck = newItems
        .filter((item) => item.bag_number_numeric)
        .map((item) => ({
          bagNumber: item.bag_number_numeric!,
          recordId: item.id,
        }));

      if (bagNumbersToCheck.length > 0) {
        checkMultipleBagNumbersAsync(bagNumbersToCheck);
      }

      message.success(`Скопировано ${selectedItems.length} товаров`);
    }, [
      services,
      selectedRowKeys,
      nextId,
      generateBarcode,
      generateConsecutiveBagNumbers,
      checkMultipleBagNumbersAsync,
    ]);

    const createItemsByCount = useCallback(() => {
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

        const totalItemsToCreate = count * selectedItems.length;
        const newBagNumbers = generateConsecutiveBagNumbers(totalItemsToCreate);
        let bagNumberIndex = 0;

        for (let i = 0; i < count; i++) {
          const itemsToAdd = selectedItems.map((item, index) => {
            const newId = nextId + i * selectedItems.length + index;
            return {
              ...item,
              id: newId,
              barcode: generateBarcode(),
              bag_number_numeric: newBagNumbers[bagNumberIndex++],
              is_price_editable: item.is_price_editable || false,
            };
          });
          newItems = [...newItems, ...itemsToAdd];
        }

        setNextId(nextId + count * selectedItems.length);
      } else {
        const newBagNumbers = generateConsecutiveBagNumbers(count);

        newItems = Array.from({ length: count }, (_, i) => {
          const newId = nextId + i;
          return {
            id: newId,
            barcode: generateBarcode(),
            bag_number_numeric: newBagNumbers[i],
            is_price_editable: false,
          };
        });

        setNextId(nextId + count);
      }

      setServices([...services, ...newItems]);
      setSelectedRowKeys([]);

      const bagNumbersToCheck = newItems
        .filter((item) => item.bag_number_numeric)
        .map((item) => ({
          bagNumber: item.bag_number_numeric!,
          recordId: item.id,
        }));

      if (bagNumbersToCheck.length > 0) {
        checkMultipleBagNumbersAsync(bagNumbersToCheck);
      }
    }, [
      services,
      nextId,
      generateBarcode,
      generateConsecutiveBagNumbers,
      copyCount,
    ]);

    const copyWhileCount = useCallback(() => {
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
    }, [copyCount, selectedRowKeys.length, createItemsByCount]);

    const removeSelectedItems = useCallback(() => {
      if (selectedRowKeys.length === 0) {
        message.warning("Выберите товары для удаления");
        return;
      }
      const remainingItems = services.filter(
        (item) => !selectedRowKeys.includes(item.id)
      );
      setServices(remainingItems);
      setSelectedRowKeys([]);

      message.success(`Удалено ${selectedRowKeys.length} товаров`);
    }, [services, selectedRowKeys.length]);

    const removeItem = useCallback(
      (id: number) => {
        setServices(services.filter((item) => item.id !== id));
      },
      [services]
    );

    const rowSelection = useMemo(
      () => ({
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
          setSelectedRowKeys(newSelectedRowKeys);
        },
        getCheckboxProps: (
          record:
            | GoodItem
            | { id: string; weight: number; price: number; quantity: number; sum: number }
        ) => ({
          disabled: record.id === "summary", // Отключаем чекбокс для строки итогов
          style: {
            display: record.id === "summary" ? "none" : "", // Скрываем чекбокс для строки итогов
          },
        }),
      }),
      [selectedRowKeys]
    );

    const lastGoods = useMemo(
      () => [
        {
          id: "summary", // Добавляем уникальный id для строки итогов
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

    useEffect(() => {
      const updateServicesWithTariffsAndDiscounts = async () => {
        if (values?.destination_id && services.length > 0) {
          const branchId = Number(values.destination_id);

          const updatedServices = await Promise.all(
            services.map(async (item) => {
              return updateItemTariffAndPrice(item, branchId);
            })
          );

          setServices(updatedServices);
        }
      };

      updateServicesWithTariffsAndDiscounts();
    }, [
      values?.destination_id,
      values?.discount_id,
      tariffs,
      updateItemTariffAndPrice,
    ]);

    return (
      <>
        <Title level={5}>
          Услуги
          {isCheckingBagNumbers && (
            <span
              style={{ marginLeft: 10, fontSize: "12px", color: "#1890ff" }}
            >
              (Идет проверка номеров мешков...)
            </span>
          )}
        </Title>
        <Row gutter={[16, 8]} style={{ marginBottom: 10 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Tooltip
              color="red"
              title={
                !values?.destination_id
                  ? "Сначала выберите город назначения"
                  : isCheckingBagNumbers
                  ? "Идет проверка номеров мешков..."
                  : ""
              }
            >
              <Button
                disabled={!values?.destination_id || isCheckingBagNumbers}
                loading={isCheckingBagNumbers}
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
                disabled={Number(copyCount || 0) === 0 || isCheckingBagNumbers}
                loading={isCheckingBagNumbers}
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
              disabled={selectedRowKeys.length === 0 || isCheckingBagNumbers}
              loading={isCheckingBagNumbers}
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
          size="small"
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
                      const newValue = e.target.value;
                      setServices(
                        services.map((item: any, serviceIndex: number) => {
                          if (serviceIndex === index) {
                            return {
                              ...item,
                              bag_number_numeric: newValue,
                            };
                          } else {
                            return item;
                          }
                        })
                      );

                      checkBagNumberWithDebounce(newValue, record.id);
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
      </>
    );
  }
);
