import React from "react";
import { Form, Input, message, Modal, Select, Flex } from "antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { API_URL } from "../../../App";

export const MyCreateModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();

  const typeCounterparty = [
    { label: "Отправитель", value: "sender" },
    { label: "Получатель", value: "receiver" },
  ];

  const saveCounterparty = async () => {
    try {
      const data = await form.validateFields();

      const response = await fetch(`${API_URL}/counterparty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.status === 201) {
        message.success("Контрагент успешно создан");
        form.resetFields();
        onClose();
        onSuccess?.();
      } else {
        message.error(result.message || "Ошибка при создании");
      }
    } catch (error: any) {
      console.error("Ошибка:", error);
      message.error(error?.message || "Не удалось создать контрагента");
    }
  };

  return (
    <Modal
      title="Создать контрагента"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={saveCounterparty}
      okText="Добавить"
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
      >
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
    </Modal>
  );
};
