import { DeleteButton, Edit, useForm, useSelect } from "@refinedev/antd";
import {
  Col,
  Form,
  Input,
  Row,
  Select,
  Table,
  Checkbox,
  Button,
  message,
  Flex,
} from "antd";
import { useEffect, useState } from "react";
import { API_URL } from "../../App";
import { useNavigate } from "react-router";

export const UserEdit = () => {
  const { formProps, saveButtonProps, queryResult, formLoading } = useForm();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [permissionData, setPermissionData] = useState<any[]>([]);
  const navigate = useNavigate();

  const userId = queryResult?.data?.data?.id;

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

  // Загрузить и объединить endpoint + permission
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("cargo-system-token");

        const [endpointsRes, userRes] = await Promise.all([
          fetch(`${API_URL}/endpoint`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const endpoints = await endpointsRes.json();
        const user = await userRes.json();

        const merged = endpoints.map((endpoint: any) => {
          const found = user?.permission?.find(
            (p: any) => p.endpoint_id === endpoint.id
          );

          return {
            key: endpoint.id,
            name: endpoint.name,
            endpoint_id: endpoint.id,
            create: found?.create || false,
            show: found?.show || false,
            edit: found?.edit || false,
            delete: found?.delete || false,
          };
        });

        setPermissionData(merged);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      }
    };

    if (userId) {
      fetchPermissions();
    }
  }, [userId]);

  const handlePermissionChange = (
    endpointId: number,
    key: string,
    checked: boolean
  ) => {
    setPermissionData((prev) =>
      prev.map((item) =>
        item.endpoint_id === endpointId ? { ...item, [key]: checked } : item
      )
    );
  };

  const handleFinish = async (values: any) => {
    const updatedValues = {
      ...values,
      permission: permissionData
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
      const response = await fetch(`${API_URL}/users/edit-user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify(updatedValues),
      });

      if (!response.ok) {
        throw new Error("Ошибка при обновлении пользователя");
      }

      message.success("Пользователь успешно обновлен");
      setTimeout(() => {
        navigate("/users");
      }, 500);
    } catch (error: any) {
      message.error(error?.message || "Ошибка при обновлении");
    }
  };

  useEffect(() => {
    const branchId = formProps.form?.getFieldValue("branch_id");
    setSelectedBranchId(branchId);
  }, [formLoading, formProps]);

  return (
    <Edit
      headerButtons={({ deleteButtonProps }: any) =>
        deleteButtonProps && <DeleteButton {...deleteButtonProps} />
      }
      saveButtonProps={{ style: { display: "none" } }}
      isLoading={formLoading}
    >
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
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

          {/* <Col xs={24} sm={12} md={6}>
            <Form.Item label="Пароль" name="password">
              <Input.Password />
            </Form.Item>
          </Col> */}

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

        <Table
          dataSource={permissionData.filter((item) => item.name)}
          rowKey="key"
          pagination={false}
        >
          <Table.Column dataIndex="name" title="Название" />
          <Table.Column
            dataIndex="create"
            title="Создание"
            render={(value, record) => (
              <Checkbox
                checked={value}
                onChange={(e) =>
                  handlePermissionChange(
                    record.endpoint_id,
                    "create",
                    e.target.checked
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
                  handlePermissionChange(
                    record.endpoint_id,
                    "show",
                    e.target.checked
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
                  handlePermissionChange(
                    record.endpoint_id,
                    "edit",
                    e.target.checked
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
                  handlePermissionChange(
                    record.endpoint_id,
                    "delete",
                    e.target.checked
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
    </Edit>
  );
};
