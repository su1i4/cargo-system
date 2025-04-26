import React, { useEffect } from "react";
import { useModalForm, useSelect } from "@refinedev/antd";
import { Form, Input, Modal, Select } from "antd";

export const DiscountModal: React.FC<{
  id: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ id, open, onClose, onSuccess }) => {
  const { modalProps, formProps, submit } = useModalForm({
    resource: "discount",
    action: "create",
    onMutationSuccess: () => {
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const { selectProps } = useSelect({
    resource: "counterparty",
    optionLabel: "name",
    optionValue: "id",
  });

  useEffect(() => {
    if (id) {
      formProps.form?.setFieldsValue({ counter_party_id: id });
    }
  }, [id, formProps.form]);

  return (
    <Modal
      {...modalProps}
      title="Создать контрагента"
      onOk={submit}
      open={open}
      onCancel={onClose}
      okText="Добавить"
      style={{ width: 500, maxWidth: 500 }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="counter_party_id"
          label="Контрагент"
          rules={[{ required: true, message: "Введите Контрагент" }]}
        >
          <Select {...selectProps} disabled />
        </Form.Item>
        <Form.Item
          name="discount"
          label="Скидка"
          rules={[{ required: true, message: "Введите Скидку" }]}
        >
          <Input min={0} max={100} type="number" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
