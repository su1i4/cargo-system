import React from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const DiscountCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();
  
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
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="counter_party_id"
          label="Контрагент"
          rules={[{ required: true, message: "Введите Контрагент" }]}
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
        <Form.Item name="product_type_id" label="Тип продукта">
          <Select {...productTypeSelectProps} />
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
