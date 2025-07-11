import React from "react";
import { List, useTable } from "@refinedev/antd";
import { Row, Table, Button } from "antd";
import { FileAddOutlined } from "@ant-design/icons";
import { useNavigation } from "@refinedev/core";

export const CurrencyList: React.FC = () => {
  const { tableProps } = useTable({
    resource: "currency",
    syncWithLocation: false,
    pagination: {
      mode: "off",
    },
  });

  const { show, push } = useNavigation();

  return (
    <List headerButtons={() => null}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Button
          icon={<FileAddOutlined />}
          style={{}}
          onClick={() => push("/currency/create")}
        />
      </Row>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => show("currency", record.id as number),
        })}
        {...tableProps}
      >
        <Table.Column dataIndex="name" title="Валюта" />
        <Table.Column dataIndex="rate" title="Курс" />
      </Table>
    </List>
  );
};
