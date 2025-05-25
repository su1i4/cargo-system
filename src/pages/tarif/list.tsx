import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  List,
  useTable,
  useModalForm,
  CreateButton,
  useSelect,
} from "@refinedev/antd";
import { useDelete } from "@refinedev/core";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  Space,
  Popconfirm,
  Select,
  InputNumber,
} from "antd";

export const TariffList = () => {
  const { tableProps } = useTable({
    resource: "tariff",
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm({
    resource: "tariff",
    action: "create",
    redirect: false,
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    resource: "tariff",
    action: "edit",
    redirect: false,
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
  });

  const { selectProps: productTypeSelectProps } = useSelect({
    resource: "type-product",
    optionLabel: "name",
    optionValue: "id",
  });

  const { mutate: deleteOne } = useDelete();

  return (
    <List headerButtons={<CreateButton onClick={() => showCreateModal()} />}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="branch" width={250} title="Название города" render={(value) => value.name} />
        <Table.Column dataIndex="product_type" width={250} title="Тип товара" render={(value) => value.name} />
        <Table.Column<any>
          title="Действия"
          render={(record) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => showEditModal(record.id)}
              />
              <Popconfirm
                title="Удалить этот тариф?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() =>
                  deleteOne({
                    resource: "tariff",
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

      <Modal {...createModalProps} title="Создание тарифа">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Название города"
            name="branch_id"
            rules={[{ required: true, message: "Выберите город" }]}
          >
            <Select {...branchSelectProps} />
          </Form.Item>
          <Form.Item
            label="Тип товара"
            name="product_type_id"
            rules={[{ required: true, message: "Выберите тип товара" }]}
          >
            <Select {...productTypeSelectProps} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal {...editModalProps} title="Редактирование тарифа">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Название города"
            name="branch_id"
            rules={[{ required: true, message: "Выберите город" }]}
          >
            <Select {...branchSelectProps} />
          </Form.Item>
          <Form.Item
            label="Тип товара"
            name="product_type_id"
            rules={[{ required: true, message: "Выберите тип товара" }]}
          >
            <Select {...productTypeSelectProps} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
