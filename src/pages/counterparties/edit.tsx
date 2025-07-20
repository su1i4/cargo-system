import React from "react";
import { Edit, useForm, useSelect, useTable } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import InputMask from "react-input-mask";
import PhoneInput from "react-phone-input-2";

export const CounterpartyEdit: React.FC = () => {
  const { formProps, saveButtonProps, formLoading, queryResult } = useForm();

  const typeCounterparty = [
    {
      label: "Отправитель",
      value: "sender",
    },
    {
      label: "Получатель",
      value: "receiver",
    },
  ];

  return (
    <Edit
      headerButtons={() => false}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
    >
      <Form
        {...formProps}
        layout="vertical"
        initialValues={queryResult?.data?.data}
      >
        <Form.Item
          label="Имя"
          name="name"
          rules={[{ required: true, message: "Пожалуйста, введите имя" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          style={{ width: "100%" }}
          label="Номер телефона"
          name="phoneNumber"
          rules={[{ required: true, message: "Введите номер телефона" }]}
        >
          <PhoneInput
            inputStyle={{ width: "100%", height: 32 }}
            country={"kg"}
          />
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
          label="Email"
          name="email"
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

        <Form.Item label="Комментарий" name="comment">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
