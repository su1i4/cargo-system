import React from "react";
import {
  useTable,
  Create,
  useForm,
} from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const DiscountCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();
  const { tableProps } = useTable({
    resource: "counterparty",
    filters: {
      initial: [
        {
          field: "discount",
          operator: "null",
          value: null,
        },
      ],
    },
    pagination: {
      mode: "off",
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="counter_party_id"
          label="Контрагент"
          rules={[{ required: true, message: "Введите Контрагент" }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={tableProps.dataSource
              ?.filter((item: any) => item.discount === null)
              .map((item: any) => ({
                label: `${item.name} - ${item.clientPrefix}-${String(
                  item.clientCode
                ).padStart(4, "0")}`,
                value: item.id,
              }))}
          />
        </Form.Item>
        <Form.Item
          name="discount"
          label="Скидка"
          rules={[{ required: true, message: "Введите Скидку" }]}
        >
          <Input min={0} max={100} type="number" />
        </Form.Item>
      </Form>
    </Create>
  );
};
