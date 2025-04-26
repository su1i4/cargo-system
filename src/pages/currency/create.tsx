import React, { useState } from "react";
import {
  List,
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
  useSelect,
  Create,
  useForm,
} from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const CurrencyCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();
  const { tableProps } = useTable({
    resource: "counterparty",
    filters: {
      initial: [
        {
          field: "currency",
          operator: "null",
          value: null,
        },
      ],
    },
  });

  enum CurrencyType {
    Usd = "Доллар",
    Rub = "Рубль",
    Som = "Сом",
    Eur = "Евро",
  }

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="name"
          label="Валюта"
          rules={[{ required: true, message: "Выберите Валюту" }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={Object.values(CurrencyType).map((item: any) => ({
              label: `${item}`,
              value: item,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="rate"
          label="Курс"
          rules={[{ required: true, message: "Введите Курс" }]}
        >
          <Input min={0} max={100} type="number" />
        </Form.Item>
      </Form>
    </Create>
  );
};
