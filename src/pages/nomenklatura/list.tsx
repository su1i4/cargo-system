import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { List, useTable, useModalForm, CreateButton } from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import { Table, Modal, Form, Input, Button, Space, Popconfirm } from "antd";

export const NomenklaturaList = () => {
  const { tableProps } = useTable({
    resource: "nomenclature",
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "nomenclature",
    action: "create",
    redirect: false,
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "nomenclature",
    action: "edit",
    redirect: false,
  });

  const { mutate: deleteOne } = useDelete();

  return (
    <List headerButtons={<CreateButton onClick={() => showCreateModal()} />}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="Наименование" />
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
                    resource: "nomenclature",
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
      <Modal {...createModalProps} title="Создание номенклатуры">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: "Введите наименование" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка редактирования */}
      <Modal {...editModalProps} title="Редактирование номенклатуры">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Наименование"
            name="name"
            rules={[{ required: true, message: "Введите наименование" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
