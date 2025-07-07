import React from "react";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Select, InputNumber } from "antd";

export const CashBackEdit: React.FC = () => {
  const { formProps, saveButtonProps, formLoading } = useForm();

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) => `${item.name}`,
  });

  return (
    <Edit
      headerButtons={() => null}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="Сумма" name="amount">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item label="Клиент" name="counterparty_id">
          <Select {...counterpartySelectProps} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
