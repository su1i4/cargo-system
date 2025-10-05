import { Modal, Form, Input, Select, InputNumber, message } from "antd";
import { useEffect, useState } from "react";
import { useCreate, useList } from "@refinedev/core";

interface BankTransferModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  fromBankId?: number;
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  fromBankId,
}) => {
  const [form] = Form.useForm();
  const { mutate } = useCreate();
  
  const { data: banksData } = useList({
    resource: "bank",
    pagination: { pageSize: 100 },
  });

  const banks = banksData?.data || [];

  useEffect(() => {
    if (visible && fromBankId) {
      form.setFieldsValue({ from_bank_id: fromBankId });
    }
  }, [visible, fromBankId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      mutate(
        {
          resource: "cash-desk/transfer-between-banks",
          values: {
            request_type: "transfer",
            ...values,
          },
        },
        {
          onSuccess: () => {
            message.success("Заявка на перевод создана");
            form.resetFields();
            onSuccess();
            onCancel();
          },
          onError: (error) => {
            message.error("Ошибка при создании заявки");
          },
        }
      );
    } catch (error) {
      // Form validation error
    }
  };

  return (
    <Modal
      title="Создание заявки на перевод"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Создать заявку"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="from_bank_id"
          label="Банк отправитель"
          rules={[{ required: true }]}
        >
          <Select disabled={!!fromBankId}>
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
          rules={[{ required: true }]}
        >
          <Select>
            {banks
              .filter((bank: any) => bank.id !== form.getFieldValue("from_bank_id"))
              .map((bank: any) => (
                <Select.Option key={bank.id} value={bank.id}>
                  {bank.name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Сумма"
          rules={[{ required: true }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            formatter={(value) => 
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            // parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          name="type_currency"
          label="Валюта"
          rules={[{ required: true }]}
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
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 