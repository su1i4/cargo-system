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
  individual_discount?: number;
  discount_id?: number | null;
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
  const [selectedDiscountOption, setSelectedDiscountOption] = useState<DiscountOrCashBackItem | null>(null);
  const [checkTimeouts, setCheckTimeouts] = useState<{ [key: number]: NodeJS.Timeout }>({});
  const [isCheckingBagNumbers, setIsCheckingBagNumbers] = useState(false);

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
        setCounterpartiesWithDiscounts(data?.data || []);
      },
      enabled: false,
    },
  });

  useEffect(() => {
    refetchTariffs();
    refetchSentCity();
    refetchCounterpartiesWithDiscounts();
  }, []);

  useEffect(() => { 
    return () => {
      Object.values(checkTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [checkTimeouts]);

  useEffect(() => {
    if (values?.sender_id || values?.recipient_id) {
      refetchCounterpartiesWithDiscounts();
    }
    if (values?.sender_id && values?.recipient_id) {
      refetchCashBacks();
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
    const checkBagNumbers = async () => {
      if (values?.destination_id && services.length > 0) {
        setHasBagNumber([]);

        const checkPromises = services
          .filter((service) => service.bag_number_numeric)
          .map(async (service) => {
            try {
              const response = await fetch(
                `${API_URL}/service/checking-service-number?destination_id=${values.destination_id}&bag_number=${service.bag_number_numeric}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
                  },
                }
              );

              const data = await response.json();
              if (data) {
                message.error(
                  `Номер мешка ${service.bag_number_numeric} уже существует для выбранного города назначения`
                );
                return { id: service.id, has: true };
              }
              return null;
            } catch (error) {
              console.error("Ошибка при проверке номера мешка:", error);
              return null;
            }
          });

        const results = await Promise.all(checkPromises);
        const invalidBags = results.filter((result) => result !== null);

        if (invalidBags.length > 0) {
          setHasBagNumber(invalidBags);
        }
      }
    };

    checkBagNumbers();
  }, [values?.destination_id]);

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

  const getNextBagNumber = (): string => {
    const existingNumbers = services
      .map(item => item.bag_number_numeric)
      .filter(num => num && !isNaN(Number(num)))
      .map(num => Number(num))
      .sort((a, b) => a - b);
    
    if (existingNumbers.length === 0) {
      return "1";
    }
    
    const maxNumber = Math.max(...existingNumbers);
    return (maxNumber + 1).toString();
  };

  const generateConsecutiveBagNumbers = (count: number): string[] => {
    const existingNumbers = services
      .map(item => item.bag_number_numeric)
      .filter(num => num && !isNaN(Number(num)))
      .map(num => Number(num))
      .sort((a, b) => a - b);
    
    let startNumber = 1;
    if (existingNumbers.length > 0) {
      startNumber = Math.max(...existingNumbers) + 1;
    }
    
    return Array.from({ length: count }, (_, i) => (startNumber + i).toString());
  };

  const checkBagNumberAsync = async (bagNumber: string, recordId: number) => {
    if (!values?.destination_id || !bagNumber) return;
    
    try {
      const response = await fetch(
        `${API_URL}/service/checking-service-number?destination_id=${values.destination_id}&bag_number=${bagNumber}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
          },
        }
      );

      const data = await response.json();
      if (data) {
        message.error(
          `Номер мешка ${bagNumber} уже существует`
        );

        setHasBagNumber((prevState) => {
          const exists = prevState.some((item) => item.id === recordId);
          if (!exists) {
            return [...prevState, { id: recordId, has: true }];
          }
          return prevState;
        });
      } else {
        setHasBagNumber((prevState) =>
          prevState.filter((item) => item.id !== recordId)
        );
      }
    } catch (error) {
      console.error("Ошибка при проверке номера мешка:", error);
    }
  };

  const checkBagNumberWithDebounce = (bagNumber: string, recordId: number) => { 
    if (checkTimeouts[recordId]) {
      clearTimeout(checkTimeouts[recordId]);
    }

    const timeoutId = setTimeout(() => {
      checkBagNumberAsync(bagNumber, recordId);
      setCheckTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[recordId];
        return newTimeouts;
      });
    }, 500); 

    setCheckTimeouts(prev => ({
      ...prev,
      [recordId]: timeoutId
    }));
  };

  const checkMultipleBagNumbersAsync = async (bagNumbersData: { bagNumber: string; recordId: number }[]) => {
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
                  Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
                },
              }
            );

            const data = await response.json();
            return { recordId, bagNumber, exists: !!data };
          } catch (error) {
            console.error(`Ошибка при проверке номера мешка ${bagNumber}:`, error);
            return { recordId, bagNumber, exists: false };
          }
        });

        const results = await Promise.all(promises);
        
        const duplicates = results.filter(result => result.exists);
        const valid = results.filter(result => !result.exists);

        if (duplicates.length > 0) {
          duplicates.forEach(({ bagNumber }) => {
            message.error(`Номер мешка ${bagNumber} уже существует`);
          });

          setHasBagNumber(prevState => {
            const newState = [...prevState];
            duplicates.forEach(({ recordId }) => {
              const exists = newState.some(item => item.id === recordId);
              if (!exists) {
                newState.push({ id: recordId, has: true });
              }
            });
            return newState;
          });
        }

        if (valid.length > 0) {
          setHasBagNumber(prevState => 
            prevState.filter(item => !valid.some(v => v.recordId === item.id))
          );
        }

        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
             }
     } finally {
       setIsCheckingBagNumbers(false);
       if (bagNumbersData.length > 1) {
         message.success(`Проверка номеров мешков завершена (${bagNumbersData.length} номеров)`);
       }
     }
  };

  const addNewItem = () => {
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
  };

  const copySelectedItems = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Выберите товары для копирования");
      return;
    }

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
      };
    });

    setServices([...services, ...newItems]);
    setNextId(nextId + selectedItems.length);
    setSelectedRowKeys([]);

    const bagNumbersToCheck = newItems
      .filter(item => item.bag_number_numeric)
      .map(item => ({ bagNumber: item.bag_number_numeric!, recordId: item.id }));
      
    if (bagNumbersToCheck.length > 0) {
      checkMultipleBagNumbersAsync(bagNumbersToCheck);
    }

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

    // Батчинг проверки новых номеров мешков
    const bagNumbersToCheck = newItems
      .filter(item => item.bag_number_numeric)
      .map(item => ({ bagNumber: item.bag_number_numeric!, recordId: item.id }));
      
    if (bagNumbersToCheck.length > 0) {
      checkMultipleBagNumbersAsync(bagNumbersToCheck);
    }
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

  const checkIndividualDiscount = async (
    destinationId: number,
    productTypeId: number,
    counterpartyId: number
  ): Promise<{ discount: number; discountId: number | null }> => {
    try {
      console.log('Проверка индивидуальной скидки:', {
        destinationId,
        productTypeId,
        counterpartyId
      });

      const filters = {
        $and: [
          { destination_id: { $eq: destinationId } },
          { product_type_id: { $eq: productTypeId } },
          { counter_party_id: { $eq: counterpartyId } },
        ],
      };

      const encodedFilters = encodeURIComponent(JSON.stringify(filters));
      const url = `${apiUrl}/discount?s=${encodedFilters}`;
      
      console.log('URL запроса скидки:', url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const discountData = data[0];
        
        console.log('Ответ API для индивидуальной скидки:', data);
        
        const discountValue = discountData?.discount ? Number(discountData.discount) : 0;
        
        return {
          discount: discountValue,
          discountId: discountData?.id || null,
        };
      }
      console.log('Ошибка ответа API:', response.status, response.statusText);
      return { discount: 0, discountId: null };
    } catch (error) {
      console.error("Ошибка при проверке индивидуальной скидки:", error);
      return { discount: 0, discountId: null };
    }
  };

  const updateItemField = async (
    id: number,
    field: string,
    value: any,
    index?: number
  ) => {
    const updatedServices = await Promise.all(
      services.map(async (item) => {
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

              if (field === "type_id" && values?.destination_id) {
                const counterpartyId = selectedDiscountOption?.counterpartyId;
                if (counterpartyId) {
                  const { discount: individualDiscount, discountId } = await checkIndividualDiscount(
                    values.destination_id,
                    value,
                    counterpartyId
                  );
                  newItem.individual_discount = individualDiscount;
                  newItem.discount_id = discountId;
                }
              }

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
      })
    );

    setServices(updatedServices);
  };

  useEffect(() => {
    const updateServicesWithTariffs = async () => {
      if (values?.destination_id && services.length > 0) {
        const branchId = Number(values.destination_id);

        const updatedServices = await Promise.all(
          services.map(async (item) => {
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

                return newItem;
              }
            }
            return item;
          })
        );

        setServices(updatedServices);
      }
    };

    updateServicesWithTariffs();
  }, [values?.destination_id, tariffs]);

  useEffect(() => {
    const updateIndividualDiscounts = async () => {
      if (values?.destination_id && selectedDiscountOption?.counterpartyId && services.length > 0) {
        const counterpartyId = selectedDiscountOption.counterpartyId;
        
        const updatedServices = await Promise.all(
          services.map(async (item, index) => {
            if (item.type_id) {
              const { discount: individualDiscount, discountId } = await checkIndividualDiscount(
                values.destination_id,
                Number(item.type_id),
                counterpartyId
              );
              
              const newItem = { ...item };
              newItem.individual_discount = individualDiscount;
              newItem.discount_id = discountId;

              const selectedType = tariffTableProps?.dataSource?.find(
                (type: any) =>
                  type.branch_id === values?.destination_id &&
                  type.product_type_id === Number(item.type_id)
              );

              if (selectedType && !item.is_price_editable) {
                const discountToApply = individualDiscount || 0;
                newItem.price = Number(selectedType.tariff) - discountToApply;
                if (newItem.weight) {
                  newItem.sum = calculateSum(newItem.weight, newItem.price);
                }
              }

              return newItem;
            }
            return item;
          })
        );

        setServices(updatedServices);
      }
    };

    updateIndividualDiscounts();
  }, [values?.destination_id, selectedDiscountOption]);

  const isProductAvailableForBranch = (product: ProductItem): boolean => {
    if (branchProducts?.length) {
      return true;
    }

    return branchProducts.some(
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

  const handleFormSubmit = async (values: any) => {
    
    if (services.length === 0) {
      message.warning("Выберите услуги");
      return;
    }

    if (hasBagNumber.length > 0) {
      message.error("Обнаружены дублированные номера мешков. Исправьте перед отправкой.");
      return;
    }
    
    let hasInvalidFields = false;
    services.forEach((service, index) => {
      if (
        !service.type_id ||
        !service.weight ||
        service.weight <= 0
      ) {
        hasInvalidFields = true;
        let missingFields = [];
        if (!service.type_id) missingFields.push("Тип товара");
        if (!service.weight || service.weight <= 0) missingFields.push("Вес");
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

    if (isCheckingBagNumbers) {
      message.warning("Дождитесь завершения проверки номеров мешков");
      return;
    }

    if (!values.destination_id) {
      message.error("Выберите город назначения");
      return;
    }
    if (!values.sender_id) {
      message.error("Выберите отправителя");
      return;
    }
    if (!values.recipient_id) {
      message.error("Выберите получателя");
      return;
    }
    if (!values.payment_method) {
      message.error("Выберите способ оплаты");
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
      services: services.map(service => ({
        ...service,
        type_id: service.type_id || null,
        weight: service.weight || 0,
        price: service.price || 0,
        sum: service.sum || 0,
        quantity: service.quantity || 1,
        bag_number_numeric: service.bag_number_numeric || null,
        individual_discount: service.individual_discount || 0,
        discount_id: service.discount_id || null,
      })),
      products: products
        .filter((product) => Number(product.quantity) > 0)
        .map(product => ({
          ...product,
          quantity: Number(product.quantity),
          price: Number(product.price),
          sum: Number(product.sum),
        })),
      amount: Number(finalAmount.toFixed(2)),
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


    const loadingMessage = message.loading('Сохранение документа...', 0);

    try {
      if (formProps.onFinish) {
        await formProps.onFinish(submitValues);
        loadingMessage();
        message.success("Документ успешно создан!");
        
        setServices([]);
        setProducts([]);
        setSelectedRowKeys([]);
        setHasBagNumber([]);
      }
    } catch (error) {
      loadingMessage();
      
      const errorObj = error as any;
      if (errorObj?.response?.data?.message) {
        message.error(`Ошибка: ${errorObj.response.data.message}`);
      } else if (errorObj?.response?.status) {
        message.error(`Ошибка сервера: ${errorObj.response.status}`);
      } else if (errorObj?.message) {
        message.error(`Ошибка: ${errorObj.message}`);
      } else {
        message.error("Произошла ошибка при сохранении документа");
      }
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

  const { tableProps: branchNomenclatureTableProps, tableQuery } = useTable({
    resource: "branch-nomenclature",
    filters: {
      permanent: [
        {
          field: "destination_id",
          operator: "eq",
          value: values?.destination_id ?? 16,
        },
      ],
    },
  });

  const branchProducts = useMemo(() => {
    if (!branchNomenclatureTableProps?.dataSource) return [];

    const allProductTypes = branchNomenclatureTableProps.dataSource.flatMap(
      (item: any) => item?.product_types || []
    );
    return allProductTypes;
  }, [branchNomenclatureTableProps?.dataSource]);

  useEffect(() => {
    if (branchProducts.length > 0) {
      const formattedProducts = branchProducts.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: 0,
        sum: 0,
        edit: item.edit || false,
        isSelected: false,
      }));
      setProducts(formattedProducts);
    } else {
      setProducts([]);
    }
  }, [branchProducts, tableQuery.isLoading]);

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

    console.log('Создание опций скидок и кешбека:', {
      counterpartiesWithDiscounts,
      cashBacks,
      sender_id: values?.sender_id,
      recipient_id: values?.recipient_id
    });

    // Фильтруем контрагентов со скидками по выбранным отправителю и получателю
    const relevantCounterparties = counterpartiesWithDiscounts.filter((record: any) => {
      const hasDiscount = record?.discount?.discount > 0;
      const isSelectedParty = record.id === values?.sender_id || record.id === values?.recipient_id;
      
      console.log('Проверка контрагента:', {
        id: record.id,
        name: record.name,
        hasDiscount,
        discountAmount: record?.discount?.discount,
        isSelectedParty,
        sender_id: values?.sender_id,
        recipient_id: values?.recipient_id
      });
      
      return hasDiscount && isSelectedParty;
    });

    console.log('Найдено релевантных контрагентов со скидками:', relevantCounterparties);

    relevantCounterparties.forEach((record: any) => {
      options.push({
        id: `discount-${record.id}`,
        type: "discount",
        label: `Скидка: ${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, '${record?.discount?.discount}' руб`,
        value: record.discount.discount,
        counterpartyId: record.id,
        originalData: record,
      });
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

    console.log('Итоговые опции скидок и кешбека:', options);
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
        setSelectedDiscountOption(cashBackOption);
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
          setSelectedDiscountOption(discountOption);
          formProps.form?.setFieldsValue({
            discount_cashback_id: discountOption.id,
            cash_back_target: null,
            discount_id: discountOption.originalData.id,
          });
        }
      }
    } else if (discountCashBackOptions.length === 0) {
      setSelectedDiscountOption(null);
      formProps.form?.setFieldsValue({
        discount_cashback_id: null,
        cash_back_target: null,
        discount_id: null,
      });
    }
  }, [discountCashBackOptions, values?.sender_id, values?.recipient_id]);

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
    <Create 
      saveButtonProps={{
        ...saveButtonProps,
        disabled: isCheckingBagNumbers || saveButtonProps.disabled,
        loading: isCheckingBagNumbers || saveButtonProps.loading,
      }}
    >
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
                  
                  setSelectedDiscountOption(selectedOption || null);
                  
                  if (selectedOption) {
                    if (selectedOption.type === "discount") {
                      formProps.form?.setFieldsValue({
                        cash_back_target: null,
                        discount_id: selectedOption.originalData.id,
                      });
                    } else if (selectedOption.type === "cashback") {
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

        <Title level={5}>
          Услуги
          {isCheckingBagNumbers && (
            <span style={{ marginLeft: 10, fontSize: '12px', color: '#1890ff' }}>
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
                    onChange={(e) => {
                      const newValue = e.target.value;
                      
                      // Обновляем состояние немедленно
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

                      // Асинхронная проверка с задержкой без блокировки UI
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
