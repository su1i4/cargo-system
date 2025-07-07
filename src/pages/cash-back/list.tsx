import React from "react";
import { List, useTable } from "@refinedev/antd";
import { useNavigation, useShow } from "@refinedev/core";
import { Table, Row, Button } from "antd";

export const CashBackList: React.FC = () => {
  const { tableProps, setFilters } = useTable({
    resource: "cash-back",
    syncWithLocation: false,
  });

  const { push } = useNavigation();

  // @ts-ignore
  return (
    <List
    //   headerButtons={() => (
    //     <Button type="primary" icon={<PlusOutlined />} href="/cash-back/create">
    //       Создать
    //     </Button>
    //   )}
    >
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}></Row>

      <Table onRow={(record) => ({
        onClick: () => {
          push(`/cash-back/show/${record.id}`);
        },
      })} {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="counterparty"
          title="Клиент"
          render={(counterparty) => (counterparty ? counterparty.name : "")}
        />
        <Table.Column dataIndex="amount" title="Сумма" render={(value) => `${value} ₽`} />
      </Table>
    </List>
  );
};
