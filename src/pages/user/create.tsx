import { useEffect, useState } from "react";
import { Create } from "@refinedev/antd";
import {
  Button,
  Checkbox,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Table,
  message,
} from "antd";
import { useSelect, useTable } from "@refinedev/antd";
import { API_URL } from "../../App";

export const UserCreate = () => {
  const [form] = Form.useForm();

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
    form.setFieldValue("under_branch_id", undefined);
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

    try {
      const response = await fetch(`${API_URL}/users/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify(submitValues),
      });

      if (!response.ok) {
        throw new Error("Ошибка при создании пользователя");
      }

      message.success("Пользователь успешно создан");
      form.resetFields();
      setSelectedEndpoints([]);
    } catch (error: any) {
      message.error(error?.message || "Ошибка при создании пользователя");
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
    <Create
      title="Создание сотрудника"
      saveButtonProps={{ style: { display: "none" } }}
    >
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Row style={{ marginBottom: 10 }} gutter={[16, 0]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="Email" name="email" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label="Имя"
              name="firstName"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label="Фамилия"
              name="lastName"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
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
              label="Город"
              name="branch_id"
              rules={[{ required: true, message: "Выберите город" }]}
            >
              <Select {...branchSelectProps} onChange={handleBranchChange} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label="Филиал"
              name="under_branch_id"
              rules={[{ required: true, message: "Выберите филиал" }]}
            >
              <Select {...underBranchSelectProps} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label="Пароль"
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item
              label="Представитель"
              name="representative"
              valuePropName="checked"
            >
              <Checkbox>Является представителем</Checkbox>
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
                onChange={(e) =>
                  setSelectedEndpoints((prev) =>
                    prev.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, create: e.target.checked }
                        : endpoint
                    )
                  )
                }
              />
            )}
          />
          <Table.Column
            dataIndex="show"
            title="Просмотр"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) =>
                  setSelectedEndpoints((prev) =>
                    prev.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, show: e.target.checked }
                        : endpoint
                    )
                  )
                }
              />
            )}
          />
          <Table.Column
            dataIndex="edit"
            title="Редактирование"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) =>
                  setSelectedEndpoints((prev) =>
                    prev.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, edit: e.target.checked }
                        : endpoint
                    )
                  )
                }
              />
            )}
          />
          <Table.Column
            dataIndex="delete"
            title="Удаление"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) =>
                  setSelectedEndpoints((prev) =>
                    prev.map((endpoint) =>
                      endpoint.endpoint_id === record.endpoint_id
                        ? { ...endpoint, delete: e.target.checked }
                        : endpoint
                    )
                  )
                }
              />
            )}
          />
        </Table>
        <Flex style={{ marginTop: 10 }} justify="end">
          <Button type="primary" htmlType="submit">
            Сохранить
          </Button>
        </Flex>
      </Form>
    </Create>
  );
};
