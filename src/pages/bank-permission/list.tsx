import { List, useTable, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag, Button, Checkbox } from "antd";
import { type BaseRecord, useNavigation, useUpdate } from "@refinedev/core";
import { PlusOutlined } from "@ant-design/icons";

interface IBankPermission extends BaseRecord {
  id: number;
  bank_id: number;
  user_id: number;
  owner: boolean;
  bank: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const BankPermissionList = () => {
  const { tableProps } = useTable<IBankPermission>({
    syncWithLocation: true,
    resource: "permission-bank",
  });

  const { mutate } = useUpdate();
  const { push } = useNavigation();

  const handleOwnerChange = (checked: boolean, record: IBankPermission) => {
    mutate({
      resource: "permission-bank",
      id: record.id,
      values: {
        owner: checked,
      },
    });
  };

  const role = localStorage.getItem("cargo-system-role");

  return (
    <List
      headerButtons={() => (
        <>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => push("/bank-permission/create")}
          >
            Добавить разрешение
          </Button>
        </>
      )}
      title="Разрешения на банк"
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter={{ multiple: 2 }} />
        <Table.Column
          dataIndex={["user", "firstName"]}
          title="Пользователь"
          render={(value, record: IBankPermission) => (
            <Space>
              <span>
                {record.user.firstName} {record.user.lastName}
              </span>
              <Tag color="blue">{record.user.email}</Tag>
            </Space>
          )}
        />
        <Table.Column
          dataIndex={["bank", "name"]}
          title="Банк"
          render={(value, record: IBankPermission) => (
            <Tag color="green">{record.bank.name}</Tag>
          )}
        />
        {role === "admin" && (
          <Table.Column
            dataIndex="owner"
            title="Владелец"
            render={(value, record: IBankPermission) => (
              <Checkbox
                checked={record.owner}
                onChange={(e) => handleOwnerChange(e.target.checked, record)}
              />
            )}
          />
        )}
        <Table.Column
          title="Действия"
          dataIndex="actions"
          render={(_, record: IBankPermission) => (
            <Space>
              <DeleteButton
                hideText
                size="small"
                recordItemId={record.id}
                resource="permission-bank"
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
