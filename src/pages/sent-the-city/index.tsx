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
  InputNumber,
  Select,
} from "antd";

export const SentTheCityList = () => {
  const { tableProps } = useTable({
    resource: "sent-the-city",
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
  });

  return (
    <List
      title
      headerButtons={<CreateButton onClick={() => showCreateModal()} />}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="city_id"
          title="Город"
          render={(_, record) =>
            branchSelectProps?.options?.find(
              (item: any) => item.value === record.city_id
            )?.label || "-"
          }
        />

        <Table.Column
          dataIndex="sent_city_id"
          title="Досыльный город"
          render={(_, record) =>
            branchSelectProps?.options?.find(
              (item: any) => item.value === record.sent_city_id
            )?.label || "-"
          }
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
                    resource: "sent-the-city",
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
            label="Филиал"
            name="sent_city_id"
            rules={[{ required: true, message: "Выберите филиал" }]}
          >
            <Select {...branchSelectProps} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка редактирования */}
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
            label="Филиал"
            name="sent_city_id"
            rules={[{ required: true, message: "Выберите филиал" }]}
          >
            <Select {...branchSelectProps} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
