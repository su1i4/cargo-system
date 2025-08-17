import React, { useState, useEffect } from "react";
import { useForm, useSelect } from "@refinedev/antd";
import { useUpdateMany, useOne, useCustom } from "@refinedev/core";
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

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: () => {
        refetch();
        setIsModalOpen(false);
        message.success("Частичная оплата создана успешно");
      },
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

  const totalProductAmount =
    record?.products?.reduce(
      (acc: number, p: any) => acc + Number(p.sum || 0),
      0
    ) || 0;

  useEffect(() => {
    const currency = currencyData?.data?.find(
      (c: any) => c.name === values?.type_currency
    );
    const rate = getHistoricalRate(currency, record?.created_at);
    form.setFieldValue("amount", Number(totalProductAmount * rate).toFixed(2));
  }, [values?.type_currency, record?.created_at]);

  useEffect(() => {
    if (form && record) {
      const currency = currencyData?.data?.find(
        (c: any) => c.name === values?.type_currency
      );
      const rate = getHistoricalRate(currency, record?.created_at);
      const defaults: any = {
        type: "income",
        date: dayjs(),
        type_currency: "Сом",
        method_payment: "Оплата наличными",
        amount: Number(totalProductAmount * rate).toFixed(2),
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
  }, [form, record, bankSelectProps.options, totalProductAmount]);

  const handleFormSubmit = async (values: any) => {
    if (!values.type_currency || !values.method_payment || !values.amount) {
      return message.error("Пожалуйста, заполните все обязательные поля");
    }

    const payload = {
      ...values,
      type: "income",
      type_operation: "Контрагент частично",
      counterparty_id: record?.sender?.id,
      good_id: record?.id,
      paid_sum: values.amount,
      date: dayjs(),
    };

    formProps?.onFinish?.(payload);
  };

  return (
    <Dropdown
      trigger={["click"]}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
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
                  rules={[{ required: true, message: "Укажите сумму" }]}
                >
                  <Input type="number" min={0} />
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
                    disabled={formLoading}
                  >
                    Закрыть
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={formLoading}
                  >
                    {formLoading ? "Создание..." : "Создать частичную оплату"}
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
        style={{ backgroundColor: "#f0f8ff", borderColor: "#1890ff" }}
      >
        💳 Частичная оплата
      </Button>
    </Dropdown>
  );
};
