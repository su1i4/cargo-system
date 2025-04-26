import React from "react";
import { useModalForm } from "@refinedev/antd";
import { Form, Input, Modal } from "antd";
import InputMask from "react-input-mask";
import PhoneInput from "react-phone-input-2";

export const MyEditModal: React.FC<{
  id?: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ id, open, onClose, onSuccess }) => {
  const { modalProps, formProps, submit } = useModalForm({
    resource: "counterparty",
    action: "edit",
    // @ts-ignore
    id, // Передаем ID редактируемого элемента
    onMutationSuccess: () => {
      onClose(); // Закрываем модальное окно после успешного обновления
      if (onSuccess) {
        onSuccess(); // Вызываем функцию обновления данных
      }
    },
  });

  return (
    <Modal
      {...modalProps}
      title="Редактировать контрагента"
      onOk={submit}
      open={open} // Управляем открытием через props
      onCancel={onClose} // Закрываем модалку
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Фио"
          name="name"
          rules={[{ required: true, message: "Укажите Фио" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Адрес" name="address" rules={[{ required: false }]}>
          <Input />
        </Form.Item>

        <Form.Item
          label="Номер телефона"
          name="phoneNumber"
          rules={[{ required: true, message: "Введите номер телефона" }]}
        >
          <PhoneInput onlyCountries={["kg", "cn", "kz", "ru"]} country={"kg"} />
        </Form.Item>

        <Form.Item
          label="Почта"
          name="email"
          rules={[{ type: "email", message: "Неверный формат email" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Комментарий" name="comment">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

