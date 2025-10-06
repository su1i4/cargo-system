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
  const [loading, setLoading] = useState(false); // ← добавили состояние загрузки

  const { data: banksData } = useList({
    resource: "bank",
    pagination: { pageSize: 100 },
  });

  const banks = banksData?.data || [];

  useEffect(() => {
    if (visible && fromBankId) {
      form.setFieldsValue({ from_bank_id: fromBankId });
    } else {
      form.resetFields(); // сбрасываем при открытии заново
    }
  }, [visible, fromBankId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true); // ← блокируем кнопку сразу после клика

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
          onError: () => {
            message.error("Ошибка при создании заявки");
          },
          onSettled: () => {
            setLoading(false); // ← разблокируем кнопку после завершения
          },
        }
      );
    } catch (error) {
      // Ошибка валидации формы — не отправляем запрос
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
      confirmLoading={loading} // ← встроенный способ анта показать загрузку и заблокировать кнопку
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
              .filter(
                (bank: any) => bank.id !== form.getFieldValue("from_bank_id")
              )
              .map((bank: any) => (
                <Select.Option key={bank.id} value={bank.id}>
                  {bank.name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item name="amount" label="Сумма" rules={[{ required: true }]}>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
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
