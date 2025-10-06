import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { List, useTable, useModalForm, CreateButton } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  Space,
  Popconfirm,
  Select,
  Row,
} from "antd";
import { useState, useEffect } from "react";

export const SentTheCityList = () => {
  const { tableProps, setFilters } = useTable({
    resource: "sent-the-city",
    pagination: {
      mode: "off",
    },
    syncWithLocation: false,
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "sent-the-city",
    action: "create",
    redirect: false,
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "sent-the-city",
    action: "edit",
    redirect: false,
  });

  const { mutate: deleteOne } = useDelete();

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    filters: [{ field: "is_sent", operator: "eq", value: false }],
  });

  const { selectProps: sentCitySelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    filters: [{ field: "is_sent", operator: "eq", value: true }],
  });

  // 🔍 Поиск
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters([
        {
          field: "city.name",
          operator: "contains",
          value: search || undefined,
        },
      ]);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, setFilters]);

  return (
    <List
      title="Досыльные города"
      headerButtons={<CreateButton onClick={() => showCreateModal()} />}
    >
      <Row style={{ marginBottom: 16 }}>
        <Input
          placeholder="Поиск по названию города"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Row>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="city_id"
          title="Город"
          render={(_, record) => record.city?.name}
        />
        <Table.Column
          dataIndex="sent_city_id"
          title="Досыльный город"
          render={(_, record) => record.sent_city?.name}
        />
        <Table.Column<any>
          title="Действия"
          render={(record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record.id)}
              />
              <Popconfirm
                title="Удалить эту запись?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() =>
                  deleteOne({
                    resource: "sent-the-city",
                    id: record.id,
                  })
                }
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      {/* 🟢 Модалка создания */}
      <Modal {...createModalProps} title="Создание досыльного города">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Город"
            name="city_id"
            rules={[{ required: true, message: "Выберите город" }]}
          >
            <Select {...branchSelectProps} />
          </Form.Item>
          <Form.Item
            label="Досыльный город"
            name="sent_city_id"
            rules={[{ required: true, message: "Выберите досыльный город" }]}
          >
            <Select {...sentCitySelectProps} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 🟡 Модалка редактирования */}
      <Modal {...editModalProps} title="Редактирование досыльного города">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Город"
            name="city_id"
            rules={[{ required: true, message: "Выберите город" }]}
          >
            <Select {...branchSelectProps} />
          </Form.Item>
          <Form.Item
            label="Досыльный город"
            name="sent_city_id"
            rules={[{ required: true, message: "Выберите досыльный город" }]}
          >
            <Select {...sentCitySelectProps} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
