import React, { useState } from "react";
import { useModalForm } from "@refinedev/antd";
import { Flex, Form, Input, Modal, Select } from "antd";
import { useSelect } from "@refinedev/antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export const MyCreateModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const { modalProps, formProps, submit } = useModalForm({
    resource: "counterparty",
    action: "create",
    onMutationSuccess: () => {
      onClose(); // Закрываем модальное окно после успешного создания
      if (onSuccess) {
        onSuccess(); // Вызываем функцию обновления данных
      }
    },
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    onSearch: (value) => {
      return [
        {
          field: "name",
          operator: "contains",
          value,
        },
      ];
    },
  });

  const { selectProps: underBranchSelectProps } = useSelect({
    resource: "under-branch",
    optionLabel: "address",
    filters: [
      {
        field: "branch_id",
        operator: "eq",
        value: selectedBranchId,
      },
    ],
    queryOptions: {
      enabled: !!selectedBranchId,
    },
  });

  const handleBranchChange = (value: any) => {
    setSelectedBranchId(value);
    formProps.form?.setFieldValue("under_branch_id", undefined);
  };

  return (
    <Modal
      {...modalProps}
      title="Создать контрагента"
      onOk={submit}
      open={open} // Управляем открытием через props
      onCancel={onClose} // Закрываем модалку
      okText="Добавить"
    >
      <Form {...formProps} layout="vertical">
        <Flex style={{ width: "100%" }} gap={10}>
          <Form.Item
            style={{ width: "100%" }}
            name="branch_id"
            label="Пунк назначения"
            rules={[{ required: true, message: "Введите Пунк назначения" }]}
          >
            <Select
              {...branchSelectProps}
              style={{ width: "100%" }}
              onChange={handleBranchChange}
            />
          </Form.Item>
          <Form.Item
            style={{ width: "100%" }}
            name="under_branch_id"
            label="Пвз"
            rules={[{ required: true, message: "Введите пвз" }]}
          >
            <Select {...underBranchSelectProps} style={{ width: "100%" }} />
          </Form.Item>
        </Flex>

        <Flex style={{ width: "100%" }} gap={10}>
          <Form.Item
            style={{ width: "100%" }}
            label="Фио"
            name="name"
            rules={[{ required: true, message: "Укажите Фио" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            style={{ width: "100%" }}
            label="Адрес"
            name="address"
            rules={[{ required: false }]}
          >
            <Input />
          </Form.Item>
        </Flex>

        <Flex style={{ width: "100%" }} gap={10}>
          <Form.Item
            style={{ width: "100%" }}
            label="Номер телефона"
            name="phoneNumber"
            rules={[{ required: true, message: "Введите номер телефона" }]}
          >
            <PhoneInput
              onlyCountries={["kg", "cn", "kz", "ru"]}
              inputStyle={{ width: "100%", height: 32 }}
              country={"kg"}
            />
          </Form.Item>
          <Form.Item
            style={{ width: "100%" }}
            label="Почта"
            name="email"
            rules={[{ type: "email", message: "Неверный формат email" }]}
          >
            <Input />
          </Form.Item>
        </Flex>

        <Form.Item label="Комментарий" name="comment">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};


