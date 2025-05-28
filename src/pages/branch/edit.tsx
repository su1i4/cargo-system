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
        <Form.Item
          name="is_sent"
          valuePropName="checked"
        >
          <Checkbox>Досыльный город</Checkbox>
        </Form.Item>
      </Form>
    </Edit>
  );
};
