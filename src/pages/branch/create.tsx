import { Create, useForm } from "@refinedev/antd";
import { Checkbox, Form, Input } from "antd";
import PhoneInput from "react-phone-input-2";

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
        <Form.Item label="Телефон" name="phone" rules={[{ required: true }]}>
          <PhoneInput
            onlyCountries={["kg", "cn", "kz", "ru"]}
            inputStyle={{ width: "100%", height: 32 }}
            country={"kg"}
          />
        </Form.Item>
        <Form.Item label="Адрес" name="address" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="is_sent" valuePropName="checked">
          <Checkbox>Досыльный город</Checkbox>
        </Form.Item>
      </Form>
    </Create>
  );
};
