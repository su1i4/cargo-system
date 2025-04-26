import React from "react";
import { Edit, useForm, useTable } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import PhoneInput from "react-phone-input-2";

export const TasksEdit: React.FC = () => {
  const { formProps, saveButtonProps, formLoading, queryResult } = useForm();

  const { tableProps } = useTable({
    resource: "under-branch",
    pagination: {
      mode: "off",
    },
  });

  // const { selectProps: underBranchSelectProps } = useSelect({
  //   resource: "under-branch",
  //   optionLabel: "address",
  //   defaultValue: formProps.initialValues?.under_branch_id,
  //   pagination: {
  //     mode: "off",
  //   },
  // });

  return (
    <Edit
      headerButtons={() => false}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
    >
      <Form
        {...formProps}
        layout="vertical"
        initialValues={queryResult?.data?.data}
      >
        <Form.Item
          style={{ width: "100%" }}
          name="under_branch_id"
          label="Пвз"
          rules={[{ required: true, message: "Введите пвз" }]}
        >
          <Select
            options={tableProps?.dataSource
              ?.filter(
                (option) =>
                  option.branch_id === formProps.initialValues?.branch_id
              )
              ?.map((option) => ({
                label: option.address,
                value: option.id,
              }))}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Имя"
          name="name"
          rules={[{ required: true, message: "Пожалуйста, введите имя" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          style={{ width: "100%" }}
          label="Номер телефона"
          name="phoneNumber"
          rules={[{ required: true, message: "Введите номер телефона" }]}
        >
          <PhoneInput
            inputStyle={{ width: "100%", height: 32 }}
            country={"kg"}
          />
        </Form.Item>
        <Form.Item
          style={{ width: "100%" }}
          label="Адрес"
          name="address"
          rules={[{ required: false }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
        >
          <Input />
        </Form.Item>

        <Form.Item label="Комментарий" name="comment">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
