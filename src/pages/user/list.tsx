import { List, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Table } from "antd";

export const UserList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  const { show } = useNavigation();

  return (
    <List>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            show("users", record.id as number);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column dataIndex="id" title={"ID"} />
        <Table.Column dataIndex="email" title={"Email"} />
        <Table.Column dataIndex="role" title={"Роль"} />
        <Table.Column dataIndex="firstName" title={"Имя"} />
        <Table.Column dataIndex="lastName" title={"Фамилия"} />
        <Table.Column dataIndex="position" title={"Должность"} />
        <Table.Column dataIndex="photo" title={"Фото"} />
      </Table>
    </List>
  );
};
