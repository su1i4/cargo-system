import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, message, Spin, Flex } from "antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { API_URL } from "../../../App";

interface Props {
  open: boolean;
  onClose: () => void;
  counterpartyId: string;
  onSuccess?: () => void;
}

export const CounterpartyEditModal: React.FC<Props> = ({
  open,
  onClose,
  counterpartyId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const typeCounterparty = [
    { label: "Отправитель", value: "sender" },
    { label: "Получатель", value: "receiver" },
  ];

  useEffect(() => {
    if (!open || !counterpartyId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/counterparty/${counterpartyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "cargo-system-token"
            )}`,
          },
        });
        const result = await res.json();
        if (res.status === 200) {
          form.setFieldsValue(result);
        } else {
          message.error("Ошибка при загрузке контрагента");
        }
      } catch (e) {
        message.error("Ошибка запроса");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, counterpartyId, form]);

  // Сохранение изменений
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch(`${API_URL}/counterparty/${counterpartyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (res.status === 200) {
        message.success("Контрагент обновлён");
        onClose();
        onSuccess?.();
      } else {
        message.error(result.message || "Ошибка при обновлении");
      }
    } catch (error: any) {
      message.error(error?.message || "Ошибка при обновлении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleSave}
      okText="Сохранить"
      confirmLoading={saving}
      title="Редактировать контрагента"
      width={800}
    >
      {loading ? (
        <Spin size="large" />
      ) : (
        <Form layout="vertical" form={form}>
          <Flex style={{ width: "100%" }} gap={10}>
            <Form.Item
              style={{ width: "100%" }}
              label="Фио"
              name="name"
              rules={[{ required: true, message: "Укажите Фио" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              style={{ width: "100%" }}
              label="Адрес"
              name="address"
              rules={[{ required: false }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ width: "100%" }}
              label="Инн"
              name="inn"
              rules={[{ required: false }]}
            >
              <Input />
            </Form.Item>
          </Flex>

          <Flex style={{ width: "100%" }} gap={10}>
            <Form.Item
              style={{ width: "100%" }}
              label="Номер телефона"
              name="phoneNumber"
              rules={[{ required: true, message: "Введите номер телефона" }]}
            >
              <PhoneInput
                onlyCountries={["kg", "cn", "kz", "ru"]}
                inputStyle={{ width: "100%", height: 32 }}
                country={"kg"}
              />
            </Form.Item>
            <Form.Item
              style={{ width: "100%" }}
              label="Почта"
              name="email"
              rules={[{ type: "email", message: "Неверный формат email" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ width: "100%" }}
              label="Тип контрагента"
              name="type"
              rules={[{ required: true, message: "Выберите тип контрагента" }]}
              initialValue={typeCounterparty[0].value}
            >
              <Select options={typeCounterparty} />
            </Form.Item>
          </Flex>

          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};
