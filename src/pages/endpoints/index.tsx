import { EditOutlined } from "@ant-design/icons";
import {
  List,
  useTable,
  useModalForm,
} from "@refinedev/antd";
import { Table, Modal, Form, Button, Input, Space } from "antd";

export const EndpointList = () => {
  const { tableProps } = useTable({
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
  });

  return (
    <List title="Эндпоинты">
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="path" title="Путь" />
        <Table.Column dataIndex="name" title="Название" />
        <Table.Column<any>
          title="Действия"
          render={(record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record.id)}
              />
            </Space>
          )}
        />
      </Table>

      <Modal {...editModalProps} title="Редактировать название">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
