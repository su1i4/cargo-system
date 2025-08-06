import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import { API_URL } from "../../App";

interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [underBranches, setUnderBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Загрузка пользователя
  useEffect(() => {
    if (!open || !userId) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
          },
        });
        const result = await res.json();
        if (result?.data) {
          form.setFieldsValue(result.data);
          setSelectedBranchId(result.data.branch_id);
        } else {
          message.error("Ошибка при загрузке данных пользователя");
        }
      } catch (error) {
        message.error("Ошибка запроса");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [open, userId]);

  // Загрузка веток и подветок
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_URL}/branch`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
          },
        });
        const data = await res.json();
        setBranches(data?.data || []);
      } catch (err) {
        message.error("Не удалось загрузить пункты");
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchUnderBranches = async () => {
      if (!selectedBranchId) return;

      try {
        const res = await fetch(
          `${API_URL}/under-branch?s=${encodeURIComponent(
            JSON.stringify({ field: "branch_id", operator: "eq", value: selectedBranchId })
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
            },
          }
        );
        const data = await res.json();
        setUnderBranches(data?.data || []);
      } catch (err) {
        message.error("Не удалось загрузить ПВЗ");
      }
    };

    fetchUnderBranches();
  }, [selectedBranchId]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch(`${API_URL}/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (result.status === 200) {
        message.success("Сотрудник обновлён");
        onClose();
        onSuccess?.();
      } else {
        message.error(result.message || "Ошибка при обновлении");
      }
    } catch (error: any) {
      message.error(error?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="Сохранить"
      confirmLoading={saving}
      title="Редактировать сотрудника"
      width={800}
    >
      {loading ? (
        <Spin size="large" />
      ) : (
        <Form layout="vertical" form={form}>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Роль"
                name="role"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "admin", label: "Администратор" },
                    { value: "user", label: "Пользователь" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="Имя"
                name="firstName"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Фамилия"
                name="lastName"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item label="Должность" name="position">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Фото" name="photo">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                label="Пункт назначения"
                name="branch_id"
                rules={[{ required: true }]}
              >
                <Select
                  options={branches.map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                  onChange={(value) => {
                    setSelectedBranchId(value);
                    form.setFieldValue("under_branch_id", undefined);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ПВЗ"
                name="under_branch_id"
                rules={[{ required: true }]}
              >
                <Select
                  options={underBranches.map((b) => ({
                    value: b.id,
                    label: b.address,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  );
};
