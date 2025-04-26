import { Edit, useForm, useSelect } from "@refinedev/antd";
import MDEditor from "@uiw/react-md-editor";
import { Checkbox, Form, Input, Select } from "antd";

export const BranchEdit = () => {
  const { formProps, saveButtonProps, formLoading } = useForm({});

  return (
    <Edit
      headerButtons={() => false}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Филиал"}
          name={["name"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={"Тариф"}
          name={["tarif"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={"Префикс"}
          name={["prefix"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Показать в тг боте"
          name="visible"
          valuePropName="checked" // 👈 Фикс
        >
          <Checkbox />
        </Form.Item>
      </Form>
    </Edit>
  );
};
