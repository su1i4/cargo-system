import { Create, useForm } from "@refinedev/antd";
import { Checkbox, Form, Input } from "antd";

export const BranchCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create title="Создать город" saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Название города"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="is_sent"
          valuePropName="checked"
        >
          <Checkbox>Досыльный город</Checkbox>
        </Form.Item>
      </Form>
    </Create>
  );
};
