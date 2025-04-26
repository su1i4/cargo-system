import { Create, useForm, useSelect } from "@refinedev/antd";
import MDEditor from "@uiw/react-md-editor";
import { Form, Input, Select } from "antd";

export const BankCreate = () => {
  const { formProps, saveButtonProps } = useForm({});


  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">

        <Form.Item
          label={"Банк"}
          name={["name"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
