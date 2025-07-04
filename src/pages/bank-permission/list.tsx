import { List, useTable, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag, Button } from "antd";
import { type BaseRecord, useNavigation } from "@refinedev/core";
import { PlusOutlined } from "@ant-design/icons";

interface IBankPermission extends BaseRecord {
  id: number;
  bank_id: number;
  user_id: number;
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

  const { push } = useNavigation();

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
        <Table.Column 
          dataIndex="id" 
          title="ID" 
          sorter={{ multiple: 2 }}
        />
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