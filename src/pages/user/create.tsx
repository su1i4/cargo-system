import { useEffect, useState } from "react";
import { Create, useForm, useSelect, useTable } from "@refinedev/antd";
import { Checkbox, Col, Form, Input, Row, Select, Table } from "antd";

export const UserCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const { tableProps } = useTable({
    resource: "endpoint",
    pagination: { mode: "off" as const },
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<any[]>([]);
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

  const handleFinish = async (values: any) => {
    const submitValues = {
      ...values,
      permission: selectedEndpoints
        .filter((item) => item.create || item.show || item.edit || item.delete)
        .map((item) => ({
          endpoint_id: item.endpoint_id,
          create: item.create,
          show: item.show,
          edit: item.edit,
          delete: item.delete,
        })),
    };

    if (formProps.onFinish) {
      await formProps.onFinish(submitValues);
    }
  };

  useEffect(() => {
    setSelectedEndpoints(
      tableProps.dataSource
        ?.filter((item) => item.name)
        .map((item) => ({
          ...item,
          key: item.id,
          edit: false,
          delete: false,
          create: false,
          show: false,
          endpoint_id: item.id,
        })) || []
    );
  }, [tableProps.dataSource]);

  return (
    <Create title="Создание сотрудника" saveButtonProps={saveButtonProps}>
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
        <Row style={{ marginBottom: 10 }} gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Email"
              name="email"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Имя"
              name="firstName"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Фамилия"
              name="lastName"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Роль"
              name="role"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "admin", label: "Админ" },
                  { value: "user", label: "Пользователь" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Пункт назначения"
              name="branch_id"
              rules={[{ required: true, message: "Введите пункт назначения" }]}
            >
              <Select {...branchSelectProps} onChange={handleBranchChange} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Филиал"
              name="under_branch_id"
              rules={[{ required: true, message: "Введите ПВЗ" }]}
            >
              <Select {...underBranchSelectProps} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              style={{ marginBottom: 5 }}
              label="Пароль"
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
        </Row>
        <Table dataSource={selectedEndpoints} rowKey="key" pagination={false}>
          <Table.Column dataIndex="name" title="Название" />
          <Table.Column
            dataIndex="create"
            title="Создание"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) => {
                  setSelectedEndpoints(
                    selectedEndpoints.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, create: e.target.checked }
                        : endpoint
                    )
                  );
                }}
              />
            )}
          />
          <Table.Column
            dataIndex="show"
            title="Просмотр"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) => {
                  setSelectedEndpoints(
                    selectedEndpoints.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, show: e.target.checked }
                        : endpoint
                    )
                  );
                }}
              />
            )}
          />
          <Table.Column
            dataIndex="edit"
            title="Редактирование"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) => {
                  setSelectedEndpoints(
                    selectedEndpoints.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, edit: e.target.checked }
                        : endpoint
                    )
                  );
                }}
              />
            )}
          />
          <Table.Column
            dataIndex="delete"
            title="Удаление"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) => {
                  setSelectedEndpoints(
                    selectedEndpoints.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, delete: e.target.checked }
                        : endpoint
                    )
                  );
                }}
              />
            )}
          />
        </Table>
      </Form>
    </Create>
  );
};
