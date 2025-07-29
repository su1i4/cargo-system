import React from "react";
import { useTable, Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const DiscountCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();
  const { tableProps } = useTable({
    resource: "counterparty",
    pagination: {
      mode: "off",
    },
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
