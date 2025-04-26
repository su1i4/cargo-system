import React, { useEffect } from "react";
import { Form, Modal, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useUpdate } from "@refinedev/core";

const messageTemplates = [{ label: "Собирать груз", value: "库存快递" }];

export const SmsModal: React.FC<{
  id: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  sms: string;
}> = ({ id, open, onClose, onSuccess, sms }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (id && open) {
      form.setFieldsValue({ counter_party_id: id, consolidated_message: sms });
    }
  }, [id, open, form]);

  const handleTemplateSelect = (value: string) => {
    form.setFieldsValue({ consolidated_message: value });
  };

  const { mutate } = useUpdate({
    resource: "counterparty",
    mutationOptions: {
      onSuccess: () => {
        onClose();
        onSuccess ? onSuccess() : () => false;
      },
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      mutate({
        id: id,
        values: {
          consolidated_message: values?.consolidated_message,
        },
      });
    } catch (error) {
      console.log("Validation failed", error);
    }
  };

  return (
    <Modal
      title="Создать уведомление"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Добавить"
      style={{ width: 800, maxWidth: 800 }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Шаблон сообщения">
          <Select
            placeholder="Выберите шаблон"
            options={messageTemplates}
            onSelect={handleTemplateSelect}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="consolidated_message"
          label="Текст"
          rules={[{ required: true, message: "Введите Контрагент" }]}
        >
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
