import React, { useEffect } from "react";
import {
  useForm,
  Edit,
  useSelect,
} from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const DiscountEdit: React.FC = () => {
  const { formProps, saveButtonProps, form, queryResult } = useForm();
  
  const record = queryResult?.data?.data;
  
  useEffect(() => {
    if (record && form) {
      form.setFieldsValue({
        counter_party_id: record.counter_party_id,
        discount: record.discount,
      });
    }
  }, [record, form]);
  
  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: "name",
    optionValue: "id",
  });
  
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
            {...counterpartySelectProps}
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