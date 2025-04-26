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
  });

  const { push } = useNavigation();

  return (
    <List>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            push(`/branch/show/${record?.id}`);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column dataIndex="id" title={"ID"} />
        <Table.Column dataIndex="name" title={"Филиал"} />
        <Table.Column dataIndex="tarif" title={"Тариф"} />
        <Table.Column dataIndex="prefix" title={"Префикс"} />
        <Table.Column
          dataIndex="visible"
          title="Показать в тг боте"
          render={(value) => <Checkbox checked={value} />}
        />
      </Table>
    </List>
  );
};
