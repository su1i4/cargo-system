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

export const PartialPayment: React.FC<PartialPaymentProps> = ({ record, refetch }) => {
  const [isBalanceOperation, setIsBalanceOperation] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("Сом");
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

  // Получаем данные валют
  const { data: currencyData = { data: [] } } = useCustom<any>({
    url: `${API_URL}/currency`,
    method: "get",
  });

  // Получаем данные контрагента для операций с балансом
  const { data: selectedCounterpartyData } = useOne({
    resource: "counterparty",
    id: record?.sender?.id ?? "",
    queryOptions: {
      enabled: !!record?.sender?.id && isBalanceOperation,
    },
  });

  const { formProps, form, formLoading } = useForm({
    onMutationSuccess(data: any) {
      const id = data?.data?.id;
      if (record?.id) {
        updateManyGoods({
          ids: [record?.id],
          values: {
            operation_id: id,
          },
        });
      }
    },
    resource: "cash-desk",
    redirect: false,
    //@ts-ignore
    defaultValues: {
      type: "income",
      date: dayjs(),
      type_currency: "Сом",
      method_payment: "Оплата наличными",
    },
  });

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const { selectProps: currencySelectProps } = useSelect({
    resource: "currency",
    optionLabel: "name",
  });

  // Вычисляем общую сумму товаров
  const totalProductAmount = record?.products?.reduce(
    (acc: number, product: any) => acc + Number(product.sum || 0),
    0
  ) || 0;

  // Устанавливаем первый банк по умолчанию и инициализируем форму
  useEffect(() => {
    if (form && record) {
      const defaultValues: any = {
        type: "income",
        date: dayjs(),
        type_currency: "Сом",
        method_payment: "Оплата наличными",
      };

      // Устанавливаем первый банк
      if (bankSelectProps.options && bankSelectProps.options.length > 0) {
        defaultValues.bank_id = bankSelectProps.options[0].value;
      }

      // Подставляем сумму из products (уже в сомах)
      defaultValues.amount = totalProductAmount > 0 ? totalProductAmount : 0;

      form.setFieldsValue(defaultValues);
    }
  }, [form, record, bankSelectProps.options, totalProductAmount]);

  // Отслеживание изменений валюты в форме
  useEffect(() => {
    if (form) {
      const currentCurrency = form.getFieldValue("type_currency");
      if (currentCurrency && currentCurrency !== selectedCurrency) {
        setSelectedCurrency(currentCurrency);
      }
    }
  }, [form?.getFieldValue("type_currency")]);

  // Пересчитываем сумму при изменении валюты (БЕЗ конвертации - все в сомах)
  useEffect(() => {
    if (form && record) {
      const remainingToPay = totalProductAmount - (record?.paid_sum || 0);

      // Для операций с балансом ограничиваем сумму балансом контрагента
      if (isBalanceOperation && selectedCounterpartyData?.data?.ross_coin) {
        const counterpartyBalance = Number(selectedCounterpartyData.data.ross_coin);
        const amountToSet = Math.min(counterpartyBalance, remainingToPay);

        form.setFieldsValue({
          amount: amountToSet > 0 ? amountToSet : 0,
        });
      } else {
        form.setFieldsValue({
          amount: remainingToPay > 0 ? remainingToPay : 0,
        });
      }
    }
  }, [form, record, isBalanceOperation, selectedCounterpartyData, selectedCurrency, totalProductAmount]);

  const handleFormSubmit = async (values: any) => {
    // Валидация обязательных полей
    if (!values.type_currency) {
      message.error("Выберите валюту");
      return;
    }
    if (!values.method_payment) {
      message.error("Выберите метод оплаты");
      return;
    }
    if (!values.amount || values.amount <= 0) {
      message.error("Введите корректную сумму");
      return;
    }

    // НЕ конвертируем - все уже в сомах
    const remainingToPay = totalProductAmount - (record?.paid_sum || 0);

    // Валидация суммы
    if (values.amount > remainingToPay) {
      message.error("Сумма к оплате не может превышать оставшуюся сумму к доплате");
      return;
    }

    // Дополнительная валидация для операций с балансом
    if (
      values.method_payment === "Оплата балансом" &&
      selectedCounterpartyData?.data?.ross_coin
    ) {
      const counterpartyBalance = Number(selectedCounterpartyData.data.ross_coin);
      if (values.amount > counterpartyBalance) {
        message.error("Сумма к оплате не может превышать баланс контрагента");
        return;
      }
    }

    const finalValues = {
      ...values,
      type: "income",
      type_operation: values.method_payment === "Оплата балансом"
        ? "Контрагент частично с баланса"
        : "Контрагент частично",
      counterparty_id: record?.sender?.id,
      good_id: record?.id,
      paid_sum: remainingToPay,
      date: dayjs(),
    };

    formProps?.onFinish && formProps?.onFinish(finalValues);
  };

  return (
    <Dropdown
      trigger={["click"]}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      overlayStyle={{ width: "200px" }}
      overlay={
        <Card
          size="small"
          style={{
            width: 480,
            boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Form
            {...formProps}
            layout="vertical"
            onFinish={handleFormSubmit}
          >
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item
                  label="Банк"
                  name={["bank_id"]}
                  rules={[
                    {
                      required: true,
                      message: "Пожалуйста, выберите Банк",
                    },
                  ]}
                >
                  <Select
                    {...bankSelectProps}
                    placeholder="Выберите код банк"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Метод оплаты"
                  name="method_payment"
                  rules={[
                    {
                      required: true,
                      message: "Пожалуйста, выберите метод оплаты",
                    },
                  ]}
                >
                  <Select
                    options={paymentTypes.map((enumValue) => ({
                      label: enumValue,
                      value: enumValue,
                    }))}
                    placeholder="Выберите метод оплаты"
                    style={{ width: "100%" }}
                    onChange={(value) => {
                      setIsBalanceOperation(value === "Оплата балансом");
                      if (value === "Оплата балансом") {
                        form.setFieldValue("type_currency", "Рубль");
                        setSelectedCurrency("Рубль");
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type_currency"
                  label="Валюта"
                  rules={[{ required: true, message: "Выберите Валюту" }]}
                >
                  <Select
                    {...currencySelectProps}
                    showSearch
                    disabled={isBalanceOperation}
                    placeholder="Выберите валюту"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                {isBalanceOperation && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "-5px" }}>
                    ℹ️ Для операций с балансом доступны только рубли
                  </div>
                )}
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Сумма для прихода"
                  name="amount"
                  rules={[{ required: true, message: "Укажите сумму" }]}
                >
                  <Input
                    type="number"
                    min={0}
                    max={
                      isBalanceOperation && selectedCounterpartyData?.data?.ross_coin
                        ? Number(selectedCounterpartyData.data.ross_coin)
                        : undefined
                    }
                    placeholder="Введите сумму прихода"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              {isBalanceOperation && selectedCounterpartyData?.data && (
                <Col span={24}>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f0f2f5",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>Баланс контрагента:</strong>{" "}
                    {selectedCounterpartyData.data.ross_coin || 0} руб
                  </div>
                </Col>
              )}
              <Col span={24}>
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#666",
                    padding: "12px",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <strong>💰 Информация об оплате:</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <strong>Сумма товаров:</strong> {Number(totalProductAmount).toFixed(2)} сом
                    </div>
                    <div>
                      <strong>Уже оплачено:</strong> {Number(record?.paid_sum || 0).toFixed(2)} сом
                    </div>
                    <div>
                      <strong>К доплате:</strong>{" "}
                      {(() => {
                        const remainingToPay = totalProductAmount - (record?.paid_sum || 0);
                        return `${Number(remainingToPay > 0 ? remainingToPay : 0).toFixed(2)} сом`;
                      })()}
                    </div>
                    <div>
                      <strong>Валюта оплаты:</strong> {form?.getFieldValue("type_currency") || "Сом"}
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setIsModalOpen(false);
                    }}
                    disabled={formLoading}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={formLoading}
                    icon={formLoading ? undefined : "💳"}
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
      <Button type="default" style={{ backgroundColor: "#f0f8ff", borderColor: "#1890ff" }}>
        💳 Частичная оплата
      </Button>
    </Dropdown>
  );
}; 