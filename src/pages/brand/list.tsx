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

export const BrandList = () => {
  const { tableProps } = useTable({
    resource: "type-product",
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "type-product",
    action: "create",
    redirect: false,
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "type-product",
    action: "edit",
    redirect: false,
  });

  const { mutate: deleteOne } = useDelete();

  return (
    <List headerButtons={<CreateButton onClick={() => showCreateModal()} />}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Наименование" />
        <Table.Column dataIndex="tariff" title="Тариф" />
        <Table.Column<any>
          title="Действия"
          render={(record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record.id)}
              />
              <Popconfirm
                title="Удалить этот бренд?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() =>
                  deleteOne({
                    resource: "type-product",
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
      <Modal {...createModalProps} title="Создание бренда">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: "Введите наименование" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Тариф"
            name="tariff"
            rules={[{ required: true, message: "Введите тариф" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} precision={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка редактирования */}
      <Modal {...editModalProps} title="Редактирование бренда">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: "Введите наименование" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Тариф"
            name="tariff"
            rules={[{ required: true, message: "Введите тариф" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} precision={2} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
