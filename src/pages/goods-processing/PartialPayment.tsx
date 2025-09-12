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

  const convertToBaseCurrency = (amount: number, currencyName: string, createdAt: string): number => {
    const currency = currencyData?.data?.find((c: any) => c.name === currencyName);
    const rate = getHistoricalRate(currency, createdAt);
    
    if (currencyName === "Сом" || rate === 1) {
      return amount;
    }
    
    return amount / rate;
  };

  const totalProductAmount =
    record?.products?.reduce(
      (acc: number, p: any) => acc + Number(p.sum || 0),
      0
    ) || 0;

  const paidSum = Number(record?.paid_sum || 0);
  
  const totalProductAmountInBaseCurrency = convertToBaseCurrency(
    totalProductAmount, 
    record?.currency || "Сом",
    record?.created_at
  );
  
  const paidSumInBaseCurrency = convertToBaseCurrency(
    paidSum,
    record?.payment_currency || "Сом",
    record?.created_at
  );
  
  const isFullyPaid = paidSumInBaseCurrency >= totalProductAmountInBaseCurrency;
  
  const remainingAmountInBaseCurrency = Math.max(0, totalProductAmountInBaseCurrency - paidSumInBaseCurrency);
  
  const getRemainingAmountInFormCurrency = (): number => {
    const currency = currencyData?.data?.find(
      (c: any) => c.name === values?.type_currency
    );
    const rate = getHistoricalRate(currency, record?.created_at);
  
    return Math.ceil(remainingAmountInBaseCurrency * rate);
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
      return;
    }

    if (!values.type_currency || !values.method_payment || !values.amount) {
      return message.error("Пожалуйста, заполните все обязательные поля");
    }

    const paymentAmount = Number(values.amount);
    
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

  const isButtonDisabled = isFullyPaid || isSubmitting || formLoading;

  return (
    <Dropdown
      trigger={["click"]}
      open={isModalOpen}
      onOpenChange={(open) => {
        // if (!isButtonDisabled) {
          setIsModalOpen(open);
        // }
      }}
      overlay={
        <Card size="small" style={{ width: 480 }}>
          <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
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

                        console.log(amount, currentRemainingAmount);
                        
                        if (amount <= 0) {
                          return Promise.reject(new Error('Сумма должна быть больше 0'));
                        }
                        // if (amount > record?.amount) {
                        //   return Promise.reject(new Error(`Сумма не может превышать ${record?.amount} ${values?.type_currency || 'Сом'}`));
                        // }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input 
                    type="number" 
                    min={0} 
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
        // style={{ 
        //   backgroundColor: isFullyPaid ? "#f5f5f5" : "#f0f8ff", 
        //   borderColor: isFullyPaid ? "#d9d9d9" : "#1890ff",
        //   color: isFullyPaid ? "#00000040" : undefined
        // }}
        // disabled={isButtonDisabled}
      >
        💳 {record?.products?.length > 0 ? isFullyPaid ? "Оплачено" : "Оплатить" : "Отсутствуют товары"}
      </Button>
    </Dropdown>
  );
};