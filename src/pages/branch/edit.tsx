import { Edit, useForm, useSelect } from "@refinedev/antd";
import MDEditor from "@uiw/react-md-editor";
import { Checkbox, Form, Input, Select } from "antd";
import PhoneInput from "react-phone-input-2";

export const BranchEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      headerButtons={() => false}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
      title="Редактирование города"
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Название города"
          name={["name"]}
          rules={[
            {
              required: true,
            },
          ]}
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
        <Form.Item label="latitude" name="latitude">
          <Input />
        </Form.Item>
        <Form.Item label="longitude" name="longitude">
          <Input />
        </Form.Item>
        <Form.Item
          label="Рабочее время"
          name="workingHours"
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
