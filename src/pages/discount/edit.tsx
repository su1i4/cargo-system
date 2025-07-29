import React, { useEffect } from "react";
import {
  useTable,
  useForm,
  Edit,
  useSelect,
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
  
  useEffect(() => {
    if (record && form) {
      form.setFieldsValue({
        counter_party_id: record.counter_party_id,
        discount: record.discount,
      });
    }
  }, [record, form]);
  
  const counterpartyOptions = tableProps.dataSource
    ?.filter((item) => item.discount === null || item.id === record?.counter_party_id)
    .map((item) => ({
      label: `${item.name} - ${item.clientPrefix}-${String(item.clientCode).padStart(4, "0")}`,
      value: item.id,
    }));
  
  const { selectProps: destinationSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
  });

  const { selectProps: productTypeSelectProps } = useSelect({
    resource: "type-product",
    optionLabel: "name",
    optionValue: "id",
  });

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
          name="destination_id"
          label="Пункт назначения"
          rules={[{ required: true, message: "Введите Пункт назначения" }]}
        >
          <Select {...destinationSelectProps} />
        </Form.Item>
        <Form.Item
          name="product_type_id"
          label="Тип продукта"
        >
          <Select
            {...productTypeSelectProps}
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