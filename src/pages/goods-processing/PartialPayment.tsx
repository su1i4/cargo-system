import React, { useState, useEffect } from "react";
import { useForm, useSelect } from "@refinedev/antd";
import { useUpdateMany, useCustom } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  message,
  Row,
  Select,
} from "antd";
import dayjs from "dayjs";
import { API_URL } from "../../App";
import { SelectProps } from "antd/es/select";
import { getHistoricalRate } from "./show";

const paymentTypes = [
  "Оплата наличными",
  "Оплата переводом",
  "Оплата перечислением",
  "Оплата балансом",
];

interface PartialPaymentProps {
  record: any;
  refetch: () => void;
}

export const PartialPayment: React.FC<PartialPaymentProps> = ({
  record,
  refetch,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: () => {
        refetch();
        setIsModalOpen(false);
        setIsSubmitting(false);
        message.success("Частичная оплата создана успешно");
      },
      onError: () => {
        setIsSubmitting(false);
      }
    },
  });

  const { data: currencyData = { data: [] } } = useCustom<any>({
    url: `${API_URL}/currency`,
    method: "get",
  });

  const { formProps, form, formLoading } = useForm({
    onMutationSuccess(data: any) {
      const id = data?.data?.id;
      if (record?.id) {
        updateManyGoods({
          ids: [record.id],
          values: { operation_id: id },
        });
      }
    },
    resource: "cash-desk",
    redirect: false,
    // @ts-ignore
    defaultValues: {
      type: "income",
      date: dayjs(),
      type_currency: "Сом",
      method_payment: "Оплата наличными",
    },
  });

  const values: any = Form.useWatch([], form);

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const { selectProps: currencySelectProps } = useSelect({
    resource: "currency",
    optionLabel: "name",
  });

  // Функция для конвертации суммы в базовую валюту (Сом)
  const convertToBaseCurrency = (amount: number, currencyName: string, createdAt: string): number => {
    const currency = currencyData?.data?.find((c: any) => c.name === currencyName);
    const rate = getHistoricalRate(currency, createdAt);
    
    // Если валюта "Сом" или курс равен 1, возвращаем как есть
    if (currencyName === "Сом" || rate === 1) {
      return amount;
    }
    
    // Конвертируем в базовую валюту (делим на курс)
    return amount / rate;
  };

  const totalProductAmount =
    record?.products?.reduce(
      (acc: number, p: any) => acc + Number(p.sum || 0),
      0
    ) || 0;

  // Получаем сумму уже оплаченную (может быть в разных валютах)
  const paidSum = Number(record?.paid_sum || 0);
  
  // Конвертируем обе суммы в базовую валюту для корректного сравнения
  const totalProductAmountInBaseCurrency = convertToBaseCurrency(
    totalProductAmount, 
    record?.currency || "Сом", // валюта товара
    record?.created_at
  );
  
  const paidSumInBaseCurrency = convertToBaseCurrency(
    paidSum,
    record?.payment_currency || "Сом", // валюта оплаты (если есть поле)
    record?.created_at
  );
  
  // Проверяем, полностью ли оплачен товар (сравниваем в базовой валюте)
  const isFullyPaid = paidSumInBaseCurrency >= totalProductAmountInBaseCurrency;
  
  // Оставшаяся сумма для оплаты (в базовой валюте)
  const remainingAmountInBaseCurrency = Math.max(0, totalProductAmountInBaseCurrency - paidSumInBaseCurrency);
  
  // Оставшаяся сумма в валюте формы
  const getRemainingAmountInFormCurrency = (): number => {
    const currency = currencyData?.data?.find(
      (c: any) => c.name === values?.type_currency
    );
    const rate = getHistoricalRate(currency, record?.created_at);
    
    return remainingAmountInBaseCurrency * rate;
  };

  const remainingAmount = getRemainingAmountInFormCurrency();
  
  console.log({
    paidSum, 
    totalProductAmount, 
    paidSumInBaseCurrency,
    totalProductAmountInBaseCurrency,
    remainingAmountInBaseCurrency,
    remainingAmount,
    isFullyPaid,
    formCurrency: values?.type_currency
  });

  useEffect(() => {
    const currency = currencyData?.data?.find(
      (c: any) => c.name === values?.type_currency
    );
    const rate = getHistoricalRate(currency, record?.created_at);
    
    // Устанавливаем оставшуюся сумму в выбранной валюте
    const amountToSet = remainingAmountInBaseCurrency > 0 
      ? Number(remainingAmountInBaseCurrency * rate).toFixed(2)
      : "0";
    
    form.setFieldValue("amount", amountToSet);
  }, [values?.type_currency, record?.created_at, remainingAmountInBaseCurrency]);

  useEffect(() => {
    if (form && record) {
      const currency = currencyData?.data?.find(
        (c: any) => c.name === values?.type_currency
      );
      const rate = getHistoricalRate(currency, record?.created_at);
      
      const amountToSet = remainingAmountInBaseCurrency > 0 
        ? Number(remainingAmountInBaseCurrency * rate).toFixed(2)
        : "0";

      const defaults: any = {
        type: "income",
        date: dayjs(),
        type_currency: "Сом",
        method_payment: "Оплата наличными",
        amount: amountToSet,
      };

      if (
        bankSelectProps?.options?.length &&
        bankSelectProps.options.length > 0
      ) {
        // @ts-ignore
        defaults.bank_id = bankSelectProps.options[0].value;
      }

      form.setFieldsValue(defaults);
    }
  }, [form, record, bankSelectProps.options, remainingAmountInBaseCurrency]);

  const handleFormSubmit = async (values: any) => {
    if (isSubmitting || formLoading) {
      return; // Предотвращаем повторную отправку
    }

    if (!values.type_currency || !values.method_payment || !values.amount) {
      return message.error("Пожалуйста, заполните все обязательные поля");
    }

    const paymentAmount = Number(values.amount);
    const currentRemainingAmount = getRemainingAmountInFormCurrency();
    
    // Проверяем, не превышает ли сумма оплаты оставшуюся сумму
    if (paymentAmount > currentRemainingAmount) {
      return message.error(`Сумма оплаты не может превышать оставшуюся сумму: ${currentRemainingAmount.toFixed(2)} ${values.type_currency}`);
    }

    if (paymentAmount <= 0) {
      return message.error("Сумма оплаты должна быть больше 0");
    }

    setIsSubmitting(true);

    const payload = {
      ...values,
      type: "income",
      type_operation: "Контрагент частично",
      counterparty_id: record?.sender?.id,
      good_id: record?.id,
      paid_sum: paymentAmount,
      date: dayjs(),
    };

    formProps?.onFinish?.(payload);
  };

  // Определяем, заблокирована ли кнопка
  const isButtonDisabled = isFullyPaid || isSubmitting || formLoading;

  return (
    <Dropdown
      trigger={["click"]}
      open={isModalOpen}
      onOpenChange={(open) => {
        // Не позволяем открыть dropdown если идет процесс оплаты или товар полностью оплачен
        if (!isButtonDisabled) {
          setIsModalOpen(open);
        }
      }}
      overlay={
        <Card size="small" style={{ width: 480 }}>
          <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
            {/* Информация о платеже */}
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <div style={{ 
                  padding: "8px 12px", 
                  backgroundColor: "#f6ffed", 
                  border: "1px solid #b7eb8f",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}>
                  <div>Общая сумма: <strong>{totalProductAmount.toFixed(2)} {record?.currency || "Сом"}</strong></div>
                  <div>Оплачено: <strong>{paidSum.toFixed(2)} {record?.payment_currency || "Сом"}</strong></div>
                  <div>К доплате: <strong>{remainingAmount.toFixed(2)} {values?.type_currency || "Сом"}</strong></div>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item
                  label="Банк"
                  name="bank_id"
                  rules={[{ required: true, message: "Выберите банк" }]}
                >
                  <Select {...bankSelectProps} placeholder="Банк" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Метод оплаты"
                  name="method_payment"
                  rules={[{ required: true, message: "Выберите метод" }]}
                >
                  <Select
                    options={paymentTypes.map((v) => ({
                      label: v,
                      value: v,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Валюта"
                  name="type_currency"
                  rules={[{ required: true, message: "Выберите валюту" }]}
                >
                  <Select
                    {...(currencySelectProps as SelectProps<string>)}
                    showSearch
                    placeholder="Выберите валюту"
                    onChange={(_, record: any) =>
                      form.setFieldValue("type_currency", record?.label)
                    }
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Сумма"
                  name="amount"
                  rules={[
                    { required: true, message: "Укажите сумму" },
                    {
                      validator: (_, value) => {
                        const amount = Number(value);
                        const currentRemainingAmount = getRemainingAmountInFormCurrency();
                        
                        if (amount <= 0) {
                          return Promise.reject(new Error('Сумма должна быть больше 0'));
                        }
                        if (amount > currentRemainingAmount) {
                          return Promise.reject(new Error(`Сумма не может превышать ${currentRemainingAmount.toFixed(2)} ${values?.type_currency || 'Сом'}`));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input 
                    type="number" 
                    min={0} 
                    max={remainingAmount}
                    step="0.01"
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  <Button
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
                    disabled={isSubmitting || formLoading}
                  >
                    Закрыть
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting || formLoading}
                    disabled={remainingAmountInBaseCurrency <= 0}
                  >
                    {isSubmitting || formLoading ? "Создание..." : "Создать частичную оплату"}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card>
      }
    >
      <Button
        type="default"
        style={{ 
          backgroundColor: isFullyPaid ? "#f5f5f5" : "#f0f8ff", 
          borderColor: isFullyPaid ? "#d9d9d9" : "#1890ff",
          color: isFullyPaid ? "#00000040" : undefined
        }}
        disabled={isButtonDisabled}
      >
        💳 {record?.products?.length > 0 ? isFullyPaid ? "Оплачено" : "Оплатить" : "Отсутствуют товары"}
      </Button>
    </Dropdown>
  );
};