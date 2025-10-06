import {
  List,
  useTable,
} from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Input, Row, Table } from "antd";
import { useState, useEffect } from "react";

export const BranchList = () => {
  const { tableProps, setFilters } = useTable({
    syncWithLocation: true,
    sorters: {
      permanent: [
        {
          field: "id",
          order: "asc",
        },
      ],
    },
  });

  const { push } = useNavigation();
  const [search, setSearch] = useState("");

  // 👇 Debounce для фильтрации
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters([
        {
          field: "name",
          operator: "contains",
          value: search || undefined,
        },
      ]);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, setFilters]);

  return (
    <List title="Города">
      <Row style={{ marginBottom: 16 }}>
        <Input
          placeholder="Поиск по названию города"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Row>

      <Table
        {...tableProps}
        rowKey="id"
        onRow={(record) => ({
          onDoubleClick: () => push(`/branch/show/${record?.id}`),
        })}
      >
        <Table.Column dataIndex="id" title="№" width={50} />
        <Table.Column dataIndex="name" title="Название города" />
        <Table.Column dataIndex="phone" title="Телефон" />
        <Table.Column dataIndex="address" title="Адрес" />
        <Table.Column
          dataIndex="is_sent"
          title="Досыльный город"
          render={(isSent: boolean) => (isSent ? "Да" : "Нет")}
        />
      </Table>
    </List>
  );
};
