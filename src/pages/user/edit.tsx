import { DeleteButton, Edit, useForm, useSelect } from "@refinedev/antd";
import { Col, Form, Input, Row, Select } from "antd";
import { useEffect, useState } from "react";

export const UserEdit = () => {
  const { formProps, saveButtonProps, queryResult, formLoading } = useForm({});

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  useEffect(() => {
    const branchId = formProps.form?.getFieldValue("branch_id");
    setSelectedBranchId(branchId);
  }, [formLoading, formProps]);

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
    <Edit
      headerButtons={({ deleteButtonProps }: any) => (
        <>
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} meta={{ foo: "bar" }} />
          )}
        </>
      )}
      saveButtonProps={saveButtonProps}
      isLoading={formLoading}
    >
      <Form {...formProps} style={{ gap: 0 }} layout="vertical">
        <Row gutter={[16, 0]}>
          <Col span={12}></Col>
          <Col span={12}></Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item
              label={"Роль"}
              name={["role"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item
              label={"Имя"}
              name={["firstName"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={"Фамилия"}
              name={["lastName"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item
              label={"Должность"}
              name={["position"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={"Фото"}
              name={["photo"]}
            //   rules={[
            //     {
            //       required: true,
            //     },
            //   ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

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
      </Form>
    </Edit>
  );
};
