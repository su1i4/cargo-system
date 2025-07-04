import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Select } from "antd";
import { useNavigation } from "@refinedev/core";

interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface IBank {
  id: number;
  name: string;
}

export const BankPermissionCreate = () => {
  const { list } = useNavigation();
  
  const { formProps, saveButtonProps } = useForm({
    resource: "permission-bank",
    redirect: "list",
    successNotification: (data, values, resource) => {
      return {
        message: "Разрешение успешно создано",
        type: "success",
      };
    },
    onMutationSuccess: () => {
      list("/bank-permission");
    },
  });

  const { selectProps: userSelectProps } = useSelect<IUser>({
    resource: "users",
    optionLabel: (item) => `${item.firstName} ${item.lastName} (${item.email})`,
    optionValue: "id",
  });

  const { selectProps: bankSelectProps } = useSelect<IBank>({
    resource: "bank",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Create
      title="Создание разрешения на банк"
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Пользователь"
          name="user_id"
          rules={[
            {
              required: true,
              message: "Пожалуйста, выберите пользователя",
            },
          ]}
        >
          <Select
            placeholder="Выберите пользователя"
            {...userSelectProps}
            showSearch
          />
        </Form.Item>

        <Form.Item
          label="Банк"
          name="bank_id"
          rules={[
            {
              required: true,
              message: "Пожалуйста, выберите банк",
            },
          ]}
        >
          <Select
            placeholder="Выберите банк"
            {...bankSelectProps}
            showSearch
          />
        </Form.Item>
      </Form>
    </Create>
  );
}; 