import React, { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import {
  Space,
  Table,
  Form,
  Input,
  Button,
  Row,
  Col,
  Dropdown,
  Select,
  Card,
} from "antd";
import { useCustom } from "@refinedev/core";
import { MyCreateModalOutcome } from "./modal/create-modal-outcome";
import {
  FileAddOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_URL } from "../../App";
import { typeOperationMap } from "../bank";

export const CashDeskOutcomeList: React.FC = () => {
  const { tableProps: bankTableProps } = useTable({
    resource: "bank",
  });

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    { type: { $eq: "outcome" } },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorterVisible, setSorterVisible] = useState(false);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({ $and: searchFilters }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/cash-desk`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [open, setOpen] = useState(false);

  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
  };

  const sortContent = (
    <Card style={{ width: 200, padding: "0px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            marginBottom: "8px",
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Сортировать по
        </div>
        {/* Сортировка по дате создания */}
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "counterparty.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("counterparty.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По контрагенту{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  // Создаем функции для пагинации
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Формируем пропсы для таблицы из данных useCustom
  const tableProps = {
    dataSource: data?.data?.data || [],
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  return (
    <List headerButtons={() => null}>
      <MyCreateModalOutcome
        onSuccess={() => refetch()}
        open={open}
        onClose={() => setOpen(false)}
      />

      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
            <Button
              icon={<FileAddOutlined />}
              style={{}}
              onClick={() => setOpen(true)}
            />
            <Dropdown
              overlay={sortContent}
              trigger={["click"]}
              placement="bottomLeft"
              open={sorterVisible}
              onOpenChange={(visible) => {
                setSorterVisible(visible);
              }}
            >
              <Button
                icon={
                  sortDirection === "ASC" ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )
                }
              ></Button>
            </Dropdown>
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по трек-коду или коду клиента"
            prefix={<SearchOutlined />}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([{ type: { $eq: "outcome" } }], "replace");
                return;
              }

              setFilters(
                [
                  {
                    $and: [
                      { type: { $eq: "outcome" } },
                      {
                        $or: [
                          { trackCode: { $contL: value } },
                          { "counterparty.clientCode": { $contL: value } },
                        ],
                      },
                    ],
                  },
                ],
                "replace"
              );
            }}
          />
        </Col>
        <Col>
          <Select
            mode="multiple"
            placeholder="Выберите банк"
            style={{ width: 200 }}
            onChange={(value) => {
              if (!value || value.length === 0) {
                setFilters([{ type: { $eq: "outcome" } }], "replace");
                return;
              }

              setFilters(
                [
                  {
                    $and: [
                      { type: { $eq: "outcome" } },
                      { bank_id: { $in: value } },
                    ],
                  },
                ],
                "replace"
              );
            }}
            options={bankTableProps?.dataSource?.map((bank: any) => ({
              label: bank.name,
              value: bank.id,
            }))}
          />
        </Col>
      </Row>

      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (data?.data?.page - 1) * pageSize + index + 1;
          }}
        />
        <Table.Column
          dataIndex="date"
          title="Дата расхода"
          render={(date) => dayjs(date).format("DD.MM.YYYY HH:mm")}
        />

        <Table.Column
          dataIndex="bank_id"
          title="Банк"
          render={(value) => {
            const bank = bankTableProps?.dataSource?.find(
              (bank) => bank.id === value
            );
            return bank?.name;
          }}
        />

        <Table.Column
          dataIndex="type_operation"
          title="Вид расхода"
          render={(value) => typeOperationMap[value] || value}
        />

        <Table.Column dataIndex="id" title="Трек-код" />

        <Table.Column dataIndex="amount" title="Сумма" />

        <Table.Column dataIndex="type_currency" title="валюта" />

        <Table.Column dataIndex="comment" title="Комментарий" />
      </Table>
    </List>
  );
};
