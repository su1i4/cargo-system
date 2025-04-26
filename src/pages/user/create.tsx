import { Create, useForm, useSelect } from "@refinedev/antd";
import MDEditor from "@uiw/react-md-editor";
import { Col, Form, Input, Row, Select } from "antd";
import React, { useState } from "react";

export const UserCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const { selectProps: underBranchSelectProps } = useSelect({
    resource: "under-branch",
    optionLabel: "address",
    filters: [
      {
        field: "branch_id",
        operator: "eq",
        value: selectedBranchId,
      },
    ],
    queryOptions: {
      enabled: !!selectedBranchId,
    },
  });

  const handleBranchChange = (value: any) => {
    setSelectedBranchId(value);
    formProps.form?.setFieldValue("under_branch_id", undefined);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Email"}
          name={["email"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={"Имя"}
          name="firstName"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={"Фамилия"}
          name="lastName"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={"Роль"}
          name={"role"}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              { value: "admin", label: "Админ" },
              { value: "user", label: "Пользователь " },
            ]}
          />
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item
              style={{ width: "100%" }}
              name="branch_id"
              label="Пунк назначения"
              rules={[{ required: true, message: "Введите Пунк назначения" }]}
            >
              <Select
                {...branchSelectProps}
                style={{ width: "100%" }}
                onChange={handleBranchChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              style={{ width: "100%" }}
              name="under_branch_id"
              label="Пвз"
              rules={[{ required: true, message: "Введите пвз" }]}
            >
              <Select {...underBranchSelectProps} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={"Пароль"}
          name="password"
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
