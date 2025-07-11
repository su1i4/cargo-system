import React from "react";
import { List, useTable } from "@refinedev/antd";
import { Col, Row, Table, Button, Input, Checkbox } from "antd";
import { FileAddOutlined } from "@ant-design/icons";
import { SearchOutlined } from "@ant-design/icons";
import { BaseRecord, useNavigation, useUpdate } from "@refinedev/core";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);

export const DiscountList: React.FC = () => {
  const { tableProps, setFilters } = useTable({
    resource: "discount",
    syncWithLocation: false,
    pagination: {
      mode: "off",
    },
  });

  const { mutate, isLoading: isUpdating } = useUpdate();

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
          title="Дата создания"
          dataIndex="created_at"
          render={(value) => dayjs(value).utc().format("DD.MM.YYYY HH:mm")}
        />
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
          title="Фио клиента"
          render={(_, record: BaseRecord) => {
            return record.counter_party.name;
          }}
        />
        <Table.Column dataIndex="discount" title="Скидка" />
        <Table.Column
          dataIndex="is_active"
          title="Активен"
          render={(value, record: { id: React.Key }) => (
            <Checkbox
              checked={value}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                mutate({
                  resource: "discount",
                  id: String(record.id),
                  values: {
                    is_active: e.target.checked,
                  },
                });
              }}
            />
          )}
        />
      </Table>
    </List>
  );
};
