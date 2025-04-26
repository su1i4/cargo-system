import React, { useState } from "react";
import {
  List,
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
} from "@refinedev/antd";
import { Col, Row, Space, Table, Button, Input, Select } from "antd";
import { FileAddOutlined } from "@ant-design/icons";
import { UnorderedListOutlined } from "@ant-design/icons";
import { SearchOutlined } from "@ant-design/icons";
import { SyncOutlined } from "@ant-design/icons";
import { BaseRecord, useNavigation } from "@refinedev/core";

export const DiscountList: React.FC = () => {
  const { tableProps, setFilters } = useTable({
    resource: "discount",
    syncWithLocation: false,
    pagination: {
      mode: "off",
    },
  });

  const { show, push } = useNavigation();

  return (
    <List headerButtons={() => null}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button
            icon={<FileAddOutlined />}
            style={{}}
            onClick={() => push("/discount/create")}
          />
        </Col>
        <Col>
          <Input
            style={{ width: 500 }}
            placeholder="Поиск по коду клиента, фио контрагента"
            prefix={<SearchOutlined />}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([], "replace");
                return;
              }
              setFilters(
                [
                  {
                    operator: "or",
                    value: [
                      {
                        field: "counter_party.clientCode",
                        operator: "contains",
                        value,
                      },
                      {
                        field: "counter_party.name",
                        operator: "contains",
                        value,
                      },
                    ],
                  },
                ],
                "replace"
              );
            }}
          />
        </Col>
      </Row>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => show("discount", record.id as number),
        })}
        {...tableProps}
      >
        <Table.Column
          dataIndex="counter_party"
          title="Код клиента"
          render={(value) => {
            if (!value.clientPrefix || !value.clientCode) return "";
            return value.clientPrefix + "-" + value.clientCode;
          }}
        />
        <Table.Column
          dataIndex="counter_party"
          title="Фио Контрагент"
          render={(_, record: BaseRecord) => {
            return record.counter_party.name;
          }}
        />
        <Table.Column dataIndex="discount" title="Скидка" />
        {/* <Table.Column dataIndex="created_at" title="Дата создания" />
        <Table.Column dataIndex="updated_at" title="Дата обновления" />
        <Table.Column dataIndex="status" title="Статус" />
        <Table.Column dataIndex="action" title="Действие" /> */}
      </Table>
    </List>
  );
};
