import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { List, useTable, useModalForm, CreateButton } from "@refinedev/antd";
import { useDelete, useUpdate } from "@refinedev/core";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  Space,
  Popconfirm,
  InputNumber,
  Checkbox,
} from "antd";

export const ProductsList = () => {
  const { tableProps } = useTable({
    resource: "products",
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "products",
    action: "create",
    redirect: false,
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "products",
    action: "edit",
    redirect: false,
  });

  const { mutate: deleteOne } = useDelete();
  const { mutate, isLoading: isUpdating } = useUpdate();

  return (
    <List headerButtons={<CreateButton onClick={() => showCreateModal()} />}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Наименование" />
        <Table.Column
          dataIndex="edit"
          title="Активен"
          render={(value, record: { id: React.Key }) => (
            <Checkbox
              checked={value}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                mutate({
                  resource: "products",
                  id: String(record.id),
                  values: {
                    edit: e.target.checked,
                  },
                });
              }}
            />
          )}
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
                title="Удалить эту номенклатуру?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() =>
                  deleteOne({
                    resource: "products",
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
      <Modal {...createModalProps} title="Создание продукта">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: "Введите наименование" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Цена"
            name="price"
            rules={[{ required: true, message: "Введите цену" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка редактирования */}
      <Modal {...editModalProps} title="Редактирование продукта">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: "Введите наименование" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Цена"
            name="price"
            rules={[{ required: true, message: "Введите цену" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
