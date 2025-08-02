import { useEffect, useState, useMemo } from "react";
import { Edit, useForm, useTable } from "@refinedev/antd";
import { useApiUrl, useCustom, useNavigation } from "@refinedev/core";
import { Form, message } from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { GoodsProcessingEditRequisites } from "./requisites";
import { GoodsProcessingEditServices } from "./services";
import { GoodsProcessingEditProducts } from './products'

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

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  sum?: number;
  edit?: boolean;
  isSelected?: boolean;
  updated?: boolean;
  is_created?: boolean;
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

export const GoodsProcessingEdit = () => {
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
    pagination: {
      mode: "off",
    },
  });

  const { tableProps: tariffTableProps } = useTable({
    resource: "tariff",
    pagination: {
      mode: "off",
    },
  });

  // Состояния
  const [services, setServices] = useState<GoodItem[]>([]);
  const [nextId, setNextId] = useState(1);
  const [typeProducts, setTypeProducts] = useState<TypeProduct[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>([]);
  const [deletedServices, setDeletedServices] = useState<GoodItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [copyCount, setCopyCount] = useState(0);
  const [sentCityData, setSentCityData] = useState<any[]>([]);
  const [cashBacks, setCashBacks] = useState<CashBackItem[]>([]);
  const [discountCashBackOptions, setDiscountCashBackOptions] = useState<DiscountOrCashBackItem[]>([]);
  const [counterpartiesWithDiscounts, setCounterpartiesWithDiscounts] = useState<any[]>([]);
  const [selectedDiscountOption, setSelectedDiscountOption] = useState<DiscountOrCashBackItem | null>(null);

  const values: any = Form.useWatch([], form);
  const record = queryResult?.data?.data;

  // API запросы
  const { refetch: refetchTariffs } = useCustom({
    url: `${apiUrl}/tariff`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        setTariffs(data?.data || []);
      },
    },
  });

  const { refetch: refetchTypeProducts } = useCustom({
    url: `${apiUrl}/type-product`,
    method: "get",
    queryOptions: {
      onSuccess: (data: any) => {
        setTypeProducts(data?.data || []);
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

  const { tableProps: branchNomenclatureTableProps, tableQuery } = useTable({
    resource: "branch-nomenclature",
    pagination: {
      mode: "off",
    },
    filters: {
      permanent: [
        {
          field: "destination_id",
          operator: "eq",
          value: values?.destination_id ?? record?.destination_id ?? 16,
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

  // Эффекты
  useEffect(() => {
    refetchTariffs();
    refetchTypeProducts();
    refetchSentCity();
    refetchCounterpartiesWithDiscounts();
  }, []);

  useEffect(() => {
    if (values?.sender_id || values?.recipient_id) {
      refetchCounterpartiesWithDiscounts();
    }
    if (values?.sender_id && values?.recipient_id) {
      refetchCashBacks();
    }
  }, [values?.sender_id, values?.recipient_id]);

  // Загрузка данных из записи
  useEffect(() => {
    if (record?.services) {
      const formattedServices = record.services.map((service: any, index: number) => ({
        ...service,
        id: service.id || nextId + index,
        updated: false,
        is_created: false,
      }));
      setServices(formattedServices);
      setNextId(Math.max(...formattedServices.map((s: any) => s.id)) + 1);
    }
  }, [record?.services]);

  useEffect(() => {
    if (branchProducts.length > 0 && record?.products) {
      const existingProductIds = record.products.map((p: any) => p.id);
      const allProducts = branchProducts.map((item: any) => {
        const existingProduct = record.products.find((p: any) => p.id === item.id);
        return existingProduct || {
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: 0,
          sum: 0,
          edit: item.edit || false,
          isSelected: false,
          updated: false,
          is_created: false,
        };
      });
      setProducts(allProducts);
    } else if (branchProducts.length > 0) {
      const formattedProducts = branchProducts.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: 0,
        sum: 0,
        edit: item.edit || false,
        isSelected: false,
        updated: false,
        is_created: false,
      }));
      setProducts(formattedProducts);
    }
  }, [branchProducts, record?.products, tableQuery.isLoading]);

  // Расчет комиссии
  useEffect(() => {
    if (values?.declared_value && values?.commission) {
      const declaredValue = Number(values.declared_value);
      const commissionPercent = Number(values.commission);

      if (!isNaN(declaredValue) && !isNaN(commissionPercent)) {
        const commissionAmount = (declaredValue * commissionPercent) / 100;
        formProps.form?.setFieldsValue({
          amount_commission: commissionAmount,
        });
      }
    }
  }, [values?.declared_value, values?.commission]);

  // Обработка формы
  const handleFormSubmit = async (values: any) => {
    if (services.length === 0) {
      message.warning("Выберите услуги");
      return;
    }

    let hasInvalidFields = false;
    services.forEach((service, index) => {
      if (!service.type_id || !service.weight || service.weight <= 0) {
        hasInvalidFields = true;
        let missingFields = [];
        if (!service.type_id) missingFields.push("Тип товара");
        if (!service.weight || service.weight <= 0) missingFields.push("Вес");
        message.warning(
          `Услуга #${index + 1}: Заполните все обязательные поля (${missingFields.join(", ")})`
        );
      }
    });

    if (hasInvalidFields) {
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

    const baseAmount = services.reduce((acc, curr) => acc + Number(curr.sum), 0) +
                     products.reduce((acc, curr) => acc + Number(curr.sum), 0);

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
      deleted_services: deletedServices.filter(service => !service.is_created),
      products: products
        .filter((product) => Number(product.quantity) > 0)
        .map(product => ({
          ...product,
          quantity: Number(product.quantity),
          price: Number(product.price),
          sum: Number(product.sum),
        })),
      amount: Number(finalAmount.toFixed(2)),
      sent_back_id: sentCityData.find((item: any) => item.id === values.sent_back_id)?.sent_city_id || null,
    };

    if (submitValues.created_at) {
      if (typeof submitValues.created_at === "object") {
        if (submitValues.created_at.$d) {
          submitValues.created_at = submitValues.created_at.format("YYYY-MM-DDTHH:mm:ss") + ".100Z";
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

    const loadingMessage = message.loading('Сохранение изменений...', 0);

    try {
      if (formProps.onFinish) {
        await formProps.onFinish(submitValues);
        loadingMessage();
        message.success("Изменения успешно сохранены!");
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
        message.error("Произошла ошибка при сохранении");
      }
    }
  };

  const sharedProps = {
    values,
    record,
    tariffs,
    typeProducts,
    sentCityData,
    cashBacks,
    counterpartiesWithDiscounts,
    discountCashBackOptions,
    selectedDiscountOption,
    setSelectedDiscountOption,
    setDiscountCashBackOptions,
    form: formProps.form,
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
        <GoodsProcessingEditRequisites {...sharedProps} />
        <GoodsProcessingEditServices 
          services={services}
          setServices={setServices}
          selectedRowKeys={selectedRowKeys}
          setSelectedRowKeys={setSelectedRowKeys}
          deletedServices={deletedServices}
          setDeletedServices={setDeletedServices}
          nextId={nextId}
          setNextId={setNextId}
          copyCount={copyCount}
          setCopyCount={setCopyCount}
          tariffTableProps={tariffTableProps}
          {...sharedProps}
        />
        <GoodsProcessingEditProducts 
          products={products}
          setProducts={setProducts}
          selectedProductKeys={selectedProductKeys}
          setSelectedProductKeys={setSelectedProductKeys}
          branchProducts={branchProducts}
          {...sharedProps}
        />
      </Form>
    </Edit>
  );
}; 