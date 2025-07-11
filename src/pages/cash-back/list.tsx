import React, { useState, useEffect } from "react";
import { List, useTable } from "@refinedev/antd";
import { useNavigation, useUpdate } from "@refinedev/core";
import { Table, Row, Checkbox, Button, Modal, Form, InputNumber } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);

export const CashBackList: React.FC = () => {
  const { tableProps, tableQueryResult } = useTable({
    resource: "cash-back",
    syncWithLocation: false,
  });

  const { push } = useNavigation();
  const { mutate, isLoading: isUpdating } = useUpdate();
  const [form] = Form.useForm();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue({
        amount: editingRecord.amount,
      });
    } else {
      form.resetFields();
    }
  }, [editingRecord, form]);

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingRecord) {
        mutate(
          {
            resource: "cash-back",
            id: String(editingRecord.id),
            values: {
              amount: values.amount,
            },
          },
          {
            onSuccess: () => {
              setIsModalVisible(false);
              setEditingRecord(null);
              tableQueryResult.refetch();
            },
          }
        );
      }
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  return (
    <List>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}></Row>

      <Table
        onRow={(record) => ({
          onClick: () => {
            push(`/cash-back/show/${record.id}`);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column title="Дата создания" dataIndex="created_at" render={(value) => dayjs(value).utc().format("DD.MM.YYYY HH:mm")} />
        <Table.Column
          dataIndex="counterparty"
          title="ФИО клиента"
          render={(counterparty) => (counterparty ? counterparty.name : "")}
        />
        <Table.Column dataIndex="counterparty" title="Код клиента" render={(counterparty) => (counterparty ? `${counterparty.clientPrefix}-${counterparty.clientCode}` : "")} />
        <Table.Column
          dataIndex="amount"
          title="Сумма"
          render={(value, record: any) => (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{value}</span>
              <Button
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(record);
                }}
              />
            </div>
          )}
        />
        <Table.Column dataIndex="counterparty" title="Баланс" render={(value) => value?.ross_coin} />
        <Table.Column
          dataIndex="is_active"
          title="Активен"
          render={(value, record: { id: React.Key }) => (
            <Checkbox
              checked={value}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                mutate({
                  resource: "cash-back",
                  id: String(record.id),
                  values: {
                    is_active: e.target.checked,
                  },
                });
              }}
            />
          )}
        />
      </Table>
      <Modal
        title="Редактировать сумму"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={isUpdating}
      >
        <Form form={form} layout="vertical" initialValues={{ amount: editingRecord?.amount }}>
          <Form.Item
            name="amount"
            label="Сумма"
            rules={[{ required: true, message: "Пожалуйста, введите сумму" }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};
