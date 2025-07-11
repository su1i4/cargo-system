import React from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, InputNumber, Select } from "antd";

export const CashBackCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "cash-back",
  });

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) => `${item.name}`, 
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Сумма" name="amount">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item label="Клиент" name="counterparty_id">
          <Select {...counterpartySelectProps} />
        </Form.Item>
      </Form>
    </Create>
  );
};
