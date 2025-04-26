import React, { useEffect } from "react";
import {
  useTable,
  useForm,
  Edit,
} from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const DiscountEdit: React.FC = () => {
  const { formProps, saveButtonProps, form, queryResult } = useForm();
  
  const record = queryResult?.data?.data;
  
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
  
  // Use useEffect to set the form values after the record data is available
  useEffect(() => {
    if (record && form) {
      // Set the counter_party_id with the correct format
      form.setFieldsValue({
        counter_party_id: record.counter_party_id,
        discount: record.discount,
      });
    }
  }, [record, form]);
  
  // Create options for the Select component
  const counterpartyOptions = tableProps.dataSource
    ?.filter((item) => item.discount === null || item.id === record?.counter_party_id)
    .map((item) => ({
      label: `${item.name} - ${item.clientPrefix}-${String(item.clientCode).padStart(4, "0")}`,
      value: item.id,
    }));
  
  return (
    <Edit headerButtons={() => false} saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="counter_party_id"
          label="Контрагент"
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={counterpartyOptions}
            loading={!tableProps.dataSource}
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
    </Edit>
  );
};