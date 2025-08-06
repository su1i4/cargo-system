import { List, useTable, useModalForm } from "@refinedev/antd";
import {
  Table,
  Modal,
  Form,
  Button,
  Input,
  Space,
  message,
  Popconfirm,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

import { useDelete } from "@refinedev/core";

export const EndpointList = () => {
  const { tableProps, tableQuery } = useTable({
    resource: "endpoint",
    pagination: { mode: "off" as const },
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "endpoint",
    action: "edit",
    redirect: false,
    onMutationSuccess: () => {
      message.success("Обновлено успешно");
      tableQuery.refetch();
    },
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "endpoint",
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      message.success("Добавлено успешно");
      tableQuery.refetch();
    },
  });

  const { mutate: deleteOne } = useDelete();

  const handleDelete = async (id: number) => {
    deleteOne(
      {
        resource: "endpoint",
        id,
        successNotification: () => false,
        errorNotification: () => false,
      },
      {
        onSuccess: () => {
          message.success("Удалено успешно");
          tableQuery.refetch();
        },
        onError: () => {
          message.error("Ошибка при удалении");
        },
      }
    );
  };

  return (
    <List
      title="Эндпоинты"
      headerButtons={({ defaultButtons }) => (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showCreateModal()}
        >
          Добавить
        </Button>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="path" title="Путь" />
        <Table.Column dataIndex="name" title="Название" />
        <Table.Column
          title="Действия"
          render={(record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record.id)}
              />
              <Popconfirm
                title="Вы уверены, что хотите удалить?"
                onConfirm={() => handleDelete(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      <Modal {...editModalProps} title="Редактировать эндпоинт">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Путь"
            name="path"
            rules={[{ required: true, message: "Введите путь" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal {...createModalProps} title="Добавить эндпоинт">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Путь"
            name="path"
            rules={[{ required: true, message: "Введите путь" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
