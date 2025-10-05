import React, { useEffect } from "react";
import { Modal, Form, InputNumber, Select, Input } from "antd";
import { API_URL } from "../../App";

interface CurrencyConvertModalProps {
  open: boolean;
  onClose: () => void;
  bankId?: number;
  bankName?: string;
  onSuccess?: () => void;
}

const CURRENCIES = ["Сом", "Рубль", "Доллар", "Юань"];

export const CurrencyConvertModal: React.FC<CurrencyConvertModalProps> = ({
  open,
  onClose,
  bankId,
  bankName,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (bankId) {
      form.setFieldsValue({ bank_id: bankId });
    }
  }, [bankId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Рассчитываем конвертированную сумму
      const convertedAmount = Number((values.amount * values.exchange_rate).toFixed(2));
      
      const response = await fetch(`${API_URL}/cash-desk/currency-convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify({
          ...values,
          bank_id: bankId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при конвертации");
      }

      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Modal.error({
        title: "Ошибка",
        content: error.message || "Произошла ошибка при конвертации",
      });
    }
  };

  return (
    <Modal
      open={open}
      title={`Конвертация валюты (${bankName})`}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Конвертировать"
      cancelText="Отмена"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="from_currency"
          label="Исходная валюта"
          rules={[
            { required: true, message: "Выберите исходную валюту" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value === getFieldValue("to_currency")) {
                  return Promise.reject("Валюты должны быть разными для конвертации");
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Select placeholder="Выберите валюту">
            {CURRENCIES.map(currency => (
              <Select.Option key={currency} value={currency}>
                {currency}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="to_currency"
          label="Целевая валюта"
          rules={[
            { required: true, message: "Выберите целевую валюту" },
          ]}
        >
          <Select placeholder="Выберите валюту">
            {CURRENCIES.map(currency => (
              <Select.Option key={currency} value={currency}>
                {currency}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Сумма для конвертации"
          rules={[
            { required: true, message: "Введите сумму" },
            { type: "number", min: 0.01, message: "Сумма должна быть больше 0" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Введите сумму"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="exchange_rate"
          label="Курс обмена"
          rules={[
            { required: true, message: "Введите курс обмена" },
            { type: "number", min: 0.000001, message: "Курс должен быть больше 0" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Введите курс обмена"
            precision={6}
          />
        </Form.Item>

        <Form.Item
          name="comment"
          label="Комментарий"
        >
          <Input.TextArea
            rows={4}
            placeholder="Введите комментарий к конвертации"
          />
        </Form.Item>

        <Form.Item
          shouldUpdate={(prevValues, currentValues) =>
            prevValues?.amount !== currentValues?.amount ||
            prevValues?.exchange_rate !== currentValues?.exchange_rate ||
            prevValues?.from_currency !== currentValues?.from_currency ||
            prevValues?.to_currency !== currentValues?.to_currency
          }
        >
          {({ getFieldsValue }) => {
            const { amount, exchange_rate, from_currency, to_currency } = getFieldsValue();
            const convertedAmount = amount && exchange_rate
              ? (amount * exchange_rate).toFixed(2)
              : null;

            return convertedAmount && from_currency && to_currency ? (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <strong>Расчет: </strong>
                {amount} {from_currency} × {exchange_rate} = {convertedAmount} {to_currency}
              </div>
            ) : null;
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}; 