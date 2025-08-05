import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { List, useTable } from "@refinedev/antd";
import { Space, Table, Button, Row, Col, Popconfirm, message } from "antd";
import { BaseRecord } from "@refinedev/core";
import { MyCreateModal } from "./modal/create-modal";
import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { CounterpartyEditModal } from "./modal/edit-modal";
import { SearchFilter } from "../../shared/search-input";
import { SortContent } from "../../shared/sort-content";
import { CustomTooltip } from "../../shared/custom-tooltip";
import { API_URL } from "../../App";
import dayjs from "dayjs";

export const CounterpartyList: React.FC = () => {
  const { tableProps, setFilters, setSorters, sorters, tableQuery } = useTable({
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

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Накладная ${dayjs().format("DD.MM.YYYY HH:mm")}`,
    onBeforePrint: async () => {
      const el = printRef.current;
      if (el) {
        el.style.fontSize = `15px`;
      }
    },
  })

  const [open, setOpen] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const sortFields = [
    { label: "Дате создания", field: "id" },
    { label: "Имени", field: "name" },
    { label: "Коду клиента", field: "clientCode" },
  ];

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/counterparty/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
        },
      });
      if (res.status === 200) {
        message.success("Контрагент успешно удален");
        tableQuery.refetch();
      } else {
        message.error("Ошибка при удалении контрагента");
      }
    } catch (error: any) {
      message.error(error?.message || "Ошибка при удалении контрагента");
    }
  };

  return (
    <List headerButtons={() => null}>
      <MyCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          tableQuery.refetch();
        }}
      />
      <CounterpartyEditModal
        counterpartyId={editId?.toString() || ""}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={() => {
          setOpenEdit(false);
          tableQuery.refetch();
        }}
      />
      <Row ref={printRef} gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
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

      <Table {...tableProps} rowKey="id">
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
        <Table.Column
          dataIndex="action"
          title="Действие"
          render={(_, record: BaseRecord) => {
            return (
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  title="Печать"
                />
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditId(record.id as number);
                    setOpenEdit(true);
                  }}
                />
                <Popconfirm
                  title="Вы уверены, что хотите удалить этого контрагента?"
                  onConfirm={handleDelete}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setDeleteId(record.id as number)}
                  />
                </Popconfirm>
              </Space>
            );
          }}
        />
      </Table>
    </List>
  );
};
