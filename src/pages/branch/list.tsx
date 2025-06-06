import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  MarkdownField,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, useMany, useNavigation } from "@refinedev/core";
import { Checkbox, Space, Table } from "antd";

export const BranchList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
    initialSorter: [
      {
        field: "id",
        order: "desc",
      },
    ],
  });

  const { push } = useNavigation();

  return (
    <List title="Города">
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            push(`/branch/show/${record?.id}`);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column dataIndex="id" title="№" width={50} />
        <Table.Column dataIndex="name" title="Название города" />
        <Table.Column dataIndex="phone" title="Телефон" />
        <Table.Column dataIndex="address" title="Адрес" />
        <Table.Column
          dataIndex="is_sent"
          title="Досыльный город"
          render={(record) => (record ? "Да" : "Нет")}
        />
      </Table>
    </List>
  );
};
