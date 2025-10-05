import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Space,
  Button,
  Tag,
  Modal,
  Input,
  message,
  Form,
  Select,
  InputNumber,
} from "antd";
import { useList, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useState } from "react";
import { API_URL } from "../../../App";
import { PlusOutlined } from "@ant-design/icons";

interface ITransferRequest {
  id: number;
  request_type: "transfer" | "convert";
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  from_bank_id: number;
  to_bank_id: number;
  from_currency: string;
  amount: number;
  comment: string;
  created_by: number;
  created_at: string;
  from_bank: {
    id: number;
    name: string;
  };
  to_bank: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export const TransferRequestList = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ITransferRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [form] = Form.useForm();

  const invalidate = useInvalidate();
  const currentUserId = localStorage.getItem("cargo-system-id");

  const { tableProps, tableQuery } = useTable<ITransferRequest>({
    resource: "transfer-requests",
    syncWithLocation: true,
  });

  const { data: banksData } = useList({
    resource: "bank",
    pagination: { pageSize: 100 },
  });

  // Получаем все разрешения текущего пользователя
  const { data: bankPermissionsData } = useList({
    resource: "permission-bank",
    filters: [
      {
        field: "user_id",
        operator: "eq",
        value: currentUserId,
      },
    ],
  });

  const banks = banksData?.data || [];
  const bankPermissions = bankPermissionsData?.data || [];

  // Получаем ID банков, где пользователь является владельцем
  const ownedBankIds = bankPermissions
    .filter((permission: any) => permission.owner === true)
    .map((permission: any) => permission.bank_id);

  const { mutate: createRequest } = useCustomMutation();
  const { mutate: approveRequest } = useCustomMutation();
  const { mutate: rejectRequest } = useCustomMutation();
  const { mutate: cancelRequest } = useCustomMutation();

  const handleCreate = async () => {
    const values = await form.validateFields();
    await createRequest(
      {
        url: `${API_URL}/transfer-requests`,
        method: "post",
        values: {
          request_type: "transfer",
          ...values,
        },
      },
      {
        onSuccess: () => {
          message.success("Заявка создана");
          setCreateModalVisible(false);
          form.resetFields();
          invalidate({
            resource: "transfer-requests",
            invalidates: ["list"],
          });
        },
      }
    );
  };

  const handleApprove = async (record: ITransferRequest) => {
    await approveRequest(
      {
        url: `${API_URL}/transfer-requests/${record.id}/approve`,
        method: "patch",
        values: {
          comment: "Одобрено",
        },
      },
      {
        onSuccess: () => {
          message.success("Заявка одобрена");
          invalidate({
            resource: "transfer-requests",
            invalidates: ["list"],
          });
        },
      }
    );
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;

    await rejectRequest(
      {
        url: `${API_URL}/transfer-requests/${selectedRequest.id}/reject`,
        method: "patch",
        values: {
          rejection_reason: rejectionReason,
        },
      },
      {
        onSuccess: () => {
          message.success("Заявка отклонена");
          setRejectModalVisible(false);
          setSelectedRequest(null);
          setRejectionReason("");
          invalidate({
            resource: "transfer-requests",
            invalidates: ["list"],
          });
        },
      }
    );
  };

  const handleCancel = async (record: ITransferRequest) => {
    await cancelRequest(
      {
        url: `${API_URL}/transfer-requests/${record.id}/cancel`,
        method: "patch",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Заявка отменена");
          invalidate({
            resource: "transfer-requests",
            invalidates: ["list"],
          });
        },
      }
    );
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: "processing", text: "Ожидает" },
      approved: { color: "success", text: "Одобрено" },
      rejected: { color: "error", text: "Отклонено" },
      completed: { color: "success", text: "Выполнено" },
      cancelled: { color: "default", text: "Отменено" },
    };

    const config = statusConfig[status] || { color: "default", text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Проверяем, является ли пользователь владельцем банка-отправителя
  const canManageRequest = (record: ITransferRequest) => {
    return ownedBankIds.includes(record.from_bank_id);
  };

  // Проверяем, является ли пользователь создателем заявки
  const isRequestCreator = (record: ITransferRequest) => {
    return record.created_by.toString() === currentUserId;
  };

  const columns = [
    {
      title: "Дата создания",
      dataIndex: "created_at",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "Статус",
      dataIndex: "status",
      render: (value: string) => getStatusTag(value),
    },
    {
      title: "Банк отправитель",
      dataIndex: ["from_bank", "name"],
    },
    {
      title: "Банк получатель",
      dataIndex: ["to_bank", "name"],
    },
    {
      title: "Сумма",
      dataIndex: "amount",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Валюта",
      dataIndex: "from_currency",
    },
    {
      title: "Создал",
      render: (_: unknown, record: ITransferRequest) =>
        record.user ? `${record.user.firstName} ${record.user.lastName}` : "—",
    },
    {
      title: "Комментарий",
      dataIndex: "comment",
    },
    {
      title: "Действия",
      render: (_: unknown, record: ITransferRequest) => {
        const isPending = record.status === "pending";
        const canManage = canManageRequest(record);
        const isCreator = isRequestCreator(record);

        return (
          <Space>
            {/* Владелец банка-получателя может одобрить или отклонить */}
            {canManage && isPending && (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApprove(record)}
                >
                  Одобрить
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => {
                    setSelectedRequest(record);
                    setRejectModalVisible(true);
                  }}
                >
                  Отклонить
                </Button>
              </>
            )}
            {/* Только создатель может отменить свою заявку */}
            {isCreator && isPending && (
              <Button size="small" onClick={() => handleCancel(record)}>
                Отменить
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <List
        title="Заявки на переводы"
        headerButtons={[
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Создать заявку
          </Button>,
        ]}
      >
        <Table {...tableProps} columns={columns} rowKey="id" />
      </List>

      <Modal
        title="Создание заявки на перевод"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="from_bank_id"
            label="Банк отправитель"
            rules={[{ required: true, message: "Выберите банк отправитель" }]}
          >
            <Select>
              {banks.map((bank: any) => (
                <Select.Option key={bank.id} value={bank.id}>
                  {bank.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="to_bank_id"
            label="Банк получатель"
            rules={[
              { required: true, message: "Выберите банк получатель" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === getFieldValue("from_bank_id")) {
                    return Promise.reject(
                      "Банки отправитель и получатель должны быть разными"
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Select>
              {banks.map((bank: any) => (
                <Select.Option key={bank.id} value={bank.id}>
                  {bank.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Сумма"
            rules={[
              { required: true, message: "Введите сумму" },
              {
                type: "number",
                min: 0.01,
                message: "Сумма должна быть больше 0",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="from_currency"
            label="Валюта"
            rules={[{ required: true, message: "Выберите валюту" }]}
          >
            <Select>
              <Select.Option value="Сом">Сом</Select.Option>
              <Select.Option value="Доллар">Доллар</Select.Option>
              <Select.Option value="Рубль">Рубль</Select.Option>
              <Select.Option value="Тенге">Тенге</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="Комментарий"
            rules={[{ required: true, message: "Введите комментарий" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Отклонение заявки"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedRequest(null);
          setRejectionReason("");
        }}
        okText="Отклонить"
        cancelText="Отмена"
      >
        <Input.TextArea
          rows={4}
          placeholder="Укажите причину отклонения"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </Modal>
    </>
  );
};