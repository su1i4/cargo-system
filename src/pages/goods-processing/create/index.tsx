import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Create, useForm, useTable } from "@refinedev/antd";
import { Checkbox, Flex, Form, message, Tooltip } from "antd";
import Title from "antd/es/typography/Title";
import { GoodsProcessingCreateRequisites } from "./requisites";
import { GoodsProcessingCreateServices } from "./services";
import { GoodsProcessingCreateProducts } from "./products";
import { GoodsProcessingCreateOthers } from "./others";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  GoodItem,
  ProductItem,
  TariffItem,
  CashBackItem,
  DiscountOrCashBackItem,
} from "./interface";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bishkek");

export const GoodsProcessingCreate = memo(() => {
  const { formProps, saveButtonProps, form } = useForm();
  const [showOthers, setShowOthers] = useState(false);

  const [state, setState] = useState({
    services: [] as GoodItem[],
    products: [] as ProductItem[],
    tariffs: [] as TariffItem[],
    sentCityData: [] as any[],
    cashBacks: [] as CashBackItem[],
    discounts: [] as DiscountOrCashBackItem[],
    hasBagNumber: [] as { id: number; has: boolean }[],
    selectedDiscountOption: null as DiscountOrCashBackItem | null,
    checkTimeouts: {} as { [key: number]: NodeJS.Timeout },
    isCheckingBagNumbers: false,
    isSubmitting: false,
  });

  const updateState = useCallback(
    <K extends keyof typeof state>(
      key: K,
      value:
        | (typeof state)[K]
        | ((prev: (typeof state)[K]) => (typeof state)[K])
    ) => {
      setState((prev) => ({
        ...prev,
        [key]:
          typeof value === "function" ? (value as Function)(prev[key]) : value,
      }));
    },
    []
  );

  const { tableProps: tariffTableProps } = useTable({
    resource: "tariff",
    pagination: { mode: "off" as const },
  });

  const { tableProps: sentCityTableProps } = useTable({
    resource: "sent-the-city",
    pagination: { mode: "off" as const },
  });

  const { tableProps: cashBacksTableProps } = useTable({
    resource: "cash-back",
    pagination: { mode: "off" as const },
  });

  const { tableProps: discountsTableProps } = useTable({
    resource: "discount",
    pagination: { mode: "off" as const },
  });

  useEffect(() => {
    if (tariffTableProps.dataSource) {
      updateState("tariffs", [...tariffTableProps.dataSource] as TariffItem[]);
    }
  }, [tariffTableProps.dataSource, updateState]);

  useEffect(() => {
    if (sentCityTableProps.dataSource) {
      updateState("sentCityData", [...sentCityTableProps.dataSource]);
    }
  }, [sentCityTableProps.dataSource, updateState]);

  useEffect(() => {
    if (cashBacksTableProps.dataSource) {
      updateState("cashBacks", [
        ...cashBacksTableProps.dataSource,
      ] as CashBackItem[]);
    }
  }, [cashBacksTableProps.dataSource, updateState]);

  useEffect(() => {
    if (discountsTableProps.dataSource) {
      updateState("discounts", [
        ...discountsTableProps.dataSource,
      ] as DiscountOrCashBackItem[]);
    }
  }, [discountsTableProps.dataSource, updateState]);

  const setServices = useCallback(
    (services: GoodItem[] | ((prev: GoodItem[]) => GoodItem[])) => {
      updateState("services", services);
    },
    [updateState]
  );

  const setProducts = useCallback(
    (products: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])) => {
      updateState("products", products);
    },
    [updateState]
  );

  const setHasBagNumber = useCallback(
    (
      hasBagNumber:
        | { id: number; has: boolean }[]
        | ((
            prev: { id: number; has: boolean }[]
          ) => { id: number; has: boolean }[])
    ) => {
      updateState("hasBagNumber", hasBagNumber);
    },
    [updateState]
  );

  const setIsCheckingBagNumbers = useCallback(
    (isChecking: boolean) => {
      updateState("isCheckingBagNumbers", isChecking);
    },
    [updateState]
  );

  const setCheckTimeouts = useCallback(
    (
      timeouts:
        | { [key: number]: NodeJS.Timeout }
        | ((prev: { [key: number]: NodeJS.Timeout }) => {
            [key: number]: NodeJS.Timeout;
          })
    ) => {
      updateState("checkTimeouts", timeouts);
    },
    [updateState]
  );

  const setSelectedDiscountOption = useCallback(
    (option: DiscountOrCashBackItem | null) => {
      updateState("selectedDiscountOption", option);
    },
    [updateState]
  );

  const rawValues: any = Form.useWatch([], form);

  const stableValues = useMemo(
    () => ({
      sender_id: rawValues?.sender_id,
      recipient_id: rawValues?.recipient_id,
      destination_id: rawValues?.destination_id,
      declared_value: rawValues?.declared_value,
      commission: rawValues?.commission,
    }),
    [
      rawValues?.sender_id,
      rawValues?.recipient_id,
      rawValues?.destination_id,
      rawValues?.declared_value,
      rawValues?.commission,
    ]
  );

  const values = useMemo(() => rawValues, [rawValues]);
  const currentDateDayjs = useMemo(() => dayjs().utc().tz("Asia/Bishkek"), []);

  const { tableProps: branchNomenclatureTableProps, tableQuery } = useTable({
    resource: "branch-nomenclature",
    pagination: { mode: "off" as const },
    filters: {
      permanent: [
        {
          field: "destination_id",
          operator: "eq" as const,
          value: stableValues.destination_id ?? 16,
        },
      ],
    },
    queryOptions: {
      enabled: !!stableValues.destination_id,
    },
  });

  const branchProducts = useMemo(() => {
    if (!branchNomenclatureTableProps?.dataSource || tableQuery.isLoading) {
      return [];
    }
    return branchNomenclatureTableProps.dataSource
      .flatMap((item: any) => item?.product_types || [])
      .filter(Boolean);
  }, [branchNomenclatureTableProps?.dataSource, tableQuery.isLoading]);

  useEffect(() => {
    if (formProps.form && !formProps.form.getFieldValue("created_at")) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, [formProps.form, currentDateDayjs]);

  useEffect(() => {
    if (branchProducts.length > 0) {
      const formattedProducts = branchProducts.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: 0,
        sum: 0,
        edit: Boolean(item.edit),
        isSelected: false,
      }));
      setProducts(formattedProducts);
    } else {
      setProducts([]);
    }
  }, [branchProducts, setProducts]);

  const handleFormSubmit = useCallback(
    async (values: any) => {
      // Защита от множественных отправок
      if (state.isSubmitting) {
        message.warning("Форма уже отправляется, пожалуйста подождите");
        return;
      }

      if (state.services.length === 0) {
        message.warning("Выберите услуги");
        return;
      }

      if (state.hasBagNumber.length > 0) {
        message.error(
          "Обнаружены дублированные номера мешков. Исправьте перед отправкой."
        );
        return;
      }

      const invalidServices = state.services.filter((service) => {
        return !service.type_id || !service.weight || service.weight <= 0;
      });

      if (invalidServices.length > 0) {
        invalidServices.forEach((service) => {
          const serviceIndex = state.services.indexOf(service);
          const missingFields = [];
          if (!service.type_id) missingFields.push("Тип товара");
          if (!service.weight || service.weight <= 0) missingFields.push("Вес");
          message.warning(
            `Услуга #${
              serviceIndex + 1
            }: Заполните все обязательные поля (${missingFields.join(", ")})`
          );
        });
        return;
      }

      if (state.isCheckingBagNumbers) {
        message.warning("Дождитесь завершения проверки номеров мешков");
        return;
      }

      const requiredFields = [
        { field: "destination_id", message: "Выберите город назначения" },
        { field: "sender_id", message: "Выберите отправителя" },
        { field: "recipient_id", message: "Выберите получателя" },
        { field: "payment_method", message: "Выберите способ оплаты" },
      ];

      for (const { field, message: errorMessage } of requiredFields) {
        if (!values[field]) {
          message.error(errorMessage);
          return;
        }
      }

      const baseAmount =
        state.services.reduce((acc, curr) => acc + Number(curr.sum || 0), 0) +
        state.products.reduce((acc, curr) => acc + Number(curr.sum || 0), 0);

      const markup = Number(values.markup) || 0;
      const finalAmount = baseAmount + (baseAmount * markup) / 100;

      const submitValues = {
        ...values,
        services: state.services.map((service) => ({
          ...service,
          type_id: service.type_id || null,
          weight: Number(service.weight) || 0,
          price: Number(service.price) || 0,
          sum: Number(service.sum) || 0,
          quantity: Number(service.quantity) || 1,
          bag_number_numeric: service.bag_number_numeric || null,
          individual_discount: Number(service.individual_discount) || 0,
          discount_id: service.discount_id || null,
        })),
        products: state.products
          .filter((product) => Number(product.quantity) > 0)
          .map((product) => ({
            ...product,
            quantity: Number(product.quantity),
            price: Number(product.price),
            sum: Number(product.sum),
          })),
        amount: Math.round(finalAmount * 100) / 100,
        sent_back_id:
          state.sentCityData.find(
            (item: any) => item.id === values.sent_back_id
          )?.sent_city_id || null,
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

      if (submitValues.photo?.file?.response?.filePath) {
        submitValues.photo = {
          file: {
            response: {
              filePath: submitValues.photo.file.response.filePath,
            },
          },
        };
      }

      try {
        // Устанавливаем флаг отправки
        updateState("isSubmitting", true);
        
        if (formProps.onFinish) {
          await formProps.onFinish(submitValues);
        }
      } catch (error) {
        console.error("Ошибка при отправке формы:", error);
        message.error("Произошла ошибка при отправке формы");
      } finally {
        // Сбрасываем флаг отправки в любом случае
        updateState("isSubmitting", false);
      }
    },
    [state, formProps.onFinish, updateState]
  );

  const sharedProps = useMemo(
    () => ({
      values,
      tariffs: state.tariffs,
      sentCityData: state.sentCityData,
      cashBacks: state.cashBacks,
      discounts: state.discounts,
      selectedDiscountOption: state.selectedDiscountOption,
      setSelectedDiscountOption,
      form: formProps.form,
    }),
    [
      values,
      state.tariffs,
      state.sentCityData,
      state.cashBacks,
      state.discounts,
      state.selectedDiscountOption,
      setSelectedDiscountOption,
      formProps.form,
    ]
  );

  const optimizedSaveButtonProps = useMemo(
    () => ({
      ...saveButtonProps,
      disabled: state.isCheckingBagNumbers || state.isSubmitting || saveButtonProps.disabled,
      loading: state.isCheckingBagNumbers || state.isSubmitting || saveButtonProps.loading,
    }),
    [saveButtonProps, state.isCheckingBagNumbers, state.isSubmitting]
  );

  // Создаём кастомные formProps без оригинального onFinish
  const customFormProps = useMemo(() => {
    const { onFinish, ...restFormProps } = formProps;
    return restFormProps;
  }, [formProps]);

  return (
    <Create saveButtonProps={optimizedSaveButtonProps}>
      <Form {...customFormProps} layout="vertical" onFinish={handleFormSubmit}>
        <GoodsProcessingCreateRequisites {...sharedProps} />
        <GoodsProcessingCreateServices
          services={state.services}
          setServices={setServices}
          hasBagNumber={state.hasBagNumber}
          setHasBagNumber={setHasBagNumber}
          checkTimeouts={state.checkTimeouts}
          setCheckTimeouts={setCheckTimeouts}
          isCheckingBagNumbers={state.isCheckingBagNumbers}
          setIsCheckingBagNumbers={setIsCheckingBagNumbers}
          tariffTableProps={tariffTableProps}
          {...sharedProps}
        />
        <GoodsProcessingCreateProducts
          products={state.products}
          setProducts={setProducts}
          branchProducts={branchProducts}
          {...sharedProps}
        />
        <Flex gap={10} align="center" style={{ marginTop: 10 }}>
          <Title style={{ marginTop: 5 }} level={5}>
            Прочее
          </Title>
          <Tooltip title="Показывать прочее">
            <Checkbox
              checked={showOthers}
              onChange={(e) => setShowOthers(e.target.checked)}
            />
          </Tooltip>
        </Flex>
        {showOthers && (
          <GoodsProcessingCreateOthers values={values} form={formProps.form} />
        )}
      </Form>
    </Create>
  );
});

GoodsProcessingCreate.displayName = "GoodsProcessingCreate";
