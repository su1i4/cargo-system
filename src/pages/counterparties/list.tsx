import React, { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import { Space, Table, Button, Row, Col } from "antd";
import { BaseRecord, useNavigation } from "@refinedev/core";
import { MyCreateModal } from "./modal/create-modal";
import { FileAddOutlined } from "@ant-design/icons";
import { MyEditModal } from "./modal/edit-modal";
import { SearchFilter } from "../../shared/search-input";
import { SortContent } from "../../shared/sort-content";
import { CustomTooltip } from "../../shared/custom-tooltip";

export const CounterpartyList: React.FC = () => {
  const { tableProps, setFilters, setSorters, sorters } = useTable({
    resource: "counterparty",
    syncWithLocation: false,
    pagination: {
      pageSize: 10,
      current: 1,
    },
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
  });

  const [open, setOpen] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { show } = useNavigation();

  const sortFields = [
    { label: "Дате создания", field: "id" },
    { label: "Имени", field: "name" },
    { label: "Коду клиента", field: "clientCode" },
  ];

  return (
    <List headerButtons={() => null}>
      <MyCreateModal open={open} onClose={() => setOpen(false)} />
      <MyEditModal
        id={editId}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
      />
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
            <Button
              icon={<FileAddOutlined />}
              onClick={() => setOpen(true)}
              title="Добавить контрагента"
            />

            <SortContent
              sorters={sorters}
              setSorters={setSorters}
              fields={sortFields}
            />
          </Space>
        </Col>
        <Col flex="auto">
          <SearchFilter
            setFilters={setFilters}
            searchFields={[
              { field: "name", operator: "containss" },
              { field: "phoneNumber", operator: "containss" },
            ]}
            combinedFields={[
              {
                fields: ["clientPrefix", "clientCode"],
                separator: "-",
                operator: "containss",
              },
            ]}
            placeholder="Поиск по фио, номеру телефона или коду клиента (формат: префикс-код)"
            allowEmpty={false}
            useOrLogic={true}
          />
        </Col>
      </Row>

      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            show("counterparty", record.id as number);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            const { current = 1, pageSize = 10 } = tableProps.pagination || {};
            return (current - 1) * pageSize + index + 1;
          }}
        />
        <Table.Column
          dataIndex="codeClientAndPrefix"
          title="Код клиента"
          render={(_, record: BaseRecord) => {
            if (!record.clientPrefix || !record.clientCode) return "";
            return (
              <CustomTooltip
                title={`Префикс: ${record.clientPrefix}, Код: ${record.clientCode}`}
              >
                <span>{record.clientPrefix + "-" + record.clientCode}</span>
              </CustomTooltip>
            );
          }}
          width={120}
        />
        <Table.Column dataIndex="name" title="Фио" />
        <Table.Column dataIndex="phoneNumber" title="Номер телефона" />
        <Table.Column
          dataIndex="ross_coin"
          title="Баланс"
          render={(value) => {
            return value ? <span>{value}</span> : "-";
          }}
        />
        <Table.Column
          dataIndex="comment"
          title="Комментарий"
          render={(value) => {
            return value ? (
              <CustomTooltip title={value}>
                <span>{value}</span>
              </CustomTooltip>
            ) : (
              "-"
            );
          }}
        />
      </Table>
    </List>
  );
};
