import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { List, useTable, useModalForm, CreateButton } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  Space,
  Popconfirm,
  InputNumber,
} from "antd";

export const PackersList = () => {
  const { tableProps } = useTable({
    resource: "packers",
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "packers",
    action: "create",
    redirect: false,
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "packers",
    action: "edit",
    redirect: false,
  });

  const { mutate: deleteOne } = useDelete();

  return (
    <List headerButtons={<CreateButton onClick={() => showCreateModal()} />}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="first_name" title="Имя" />
        <Table.Column dataIndex="last_name" title="Фамилия" />
        <Table.Column dataIndex="weight_amount" title="Общий вес" />
        <Table.Column<any>
          title="Действия"
          render={(record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record.id)}
              />
              <Popconfirm
                title="Удалить этого упаковщика?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() =>
                  deleteOne({
                    resource: "packers",
                    id: record.id,
                  })
                }
              >
                <Button icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      {/* Модалка создания */}
      <Modal {...createModalProps} title="Создание упаковщика">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Имя"
            name="first_name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Фамилия"
            name="last_name"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка редактирования */}
      <Modal {...editModalProps} title="Редактирование упаковщика">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Имя"
            name="first_name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Фамилия"
            name="last_name"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
