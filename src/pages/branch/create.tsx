import { Create, useForm } from "@refinedev/antd";
import { Checkbox, Form, Input } from "antd";

export const BranchCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Филлиал"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Тариф"
          name="tarif"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Префикс"
          name="prefix"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {/* ✅ Чекбокс теперь работает */}
        <Form.Item 
          label="Показать в тг боте" 
          name="visible" 
          valuePropName="checked" // 👈 Фикс
        >
          <Checkbox />
        </Form.Item>
      </Form>
    </Create>
  );
};
