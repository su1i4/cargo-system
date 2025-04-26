import React, { useState } from "react";
import {
  List,
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
  useSelect,
  useForm,
  Edit,
} from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const CurrencyEdit: React.FC = () => {
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

  return (
    <Edit headerButtons={() => false} saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="name"
          label="Валюта"
          rules={[{ required: true, message: "Выберите Валюту" }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={tableProps.dataSource
              ?.filter((item: any) => item.currency === null)
              .map((item: any) => ({
                label: `${item.name} - ${item.clientPrefix}-${String(item.clientCode).padStart(4, '0')}`,
                value: item.id,
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
    </Edit>
  );
};
