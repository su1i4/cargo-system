import React, { useState, useEffect, useCallback } from "react";
import { List, useSelect, useTable } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  Dropdown,
  Select,
  Card,
  Modal,
  message,
} from "antd";
import { useCustom, useUpdate } from "@refinedev/core";
import { expenseTypes, MyCreateModalOutcome } from "./modal/create-modal-outcome";
import {
  FileAddOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_URL } from "../../App";
import { debounce } from "lodash";

interface Filters {
  search?: string;
  userIds?: number[];
  bankIds?: number[];
  type_operation?: string[];
}

export const CashDeskOutcomeList: React.FC = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingComment, setEditingComment] = useState<string>("");
  const { mutate } = useUpdate();

  const { tableProps: bankTableProps } = useTable({
    resource: "bank",
  });

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  
  const [filters, setFilters] = useState<Filters>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorterVisible, setSorterVisible] = useState(false);

  const buildSearchFilters = useCallback(() => {
    const searchFilters: any[] = [{ type: { $eq: "outcome" } }];

    if (filters.search?.trim()) {
      searchFilters.push({
        $or: [
          { "good.invoice_number": { $contL: filters.search } },
          { "good.sender.name": { $contL: filters.search } },
          { "good.recipient.name": { $contL: filters.search } },
          { "good.sender.clientCode": { $contL: filters.search } },
          { "good.recipient.clientCode": { $contL: filters.search } },
        ],
      });
    }

    if (filters.userIds && filters.userIds.length > 0) {
      searchFilters.push({
        user_id: { $in: filters.userIds },
      });
    }

    if (filters.bankIds && filters.bankIds.length > 0) {
      searchFilters.push({
        bank_id: { $in: filters.bankIds },
      });
    }

    if (filters.type_operation && filters.type_operation.length > 0) {
      searchFilters.push({
        type_operation: { $in: filters.type_operation },
      });
    }

    return searchFilters;
  }, [filters]);

  const buildQueryParams = useCallback(() => {
    return {
      s: JSON.stringify({
        $and: buildSearchFilters(),
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  }, [buildSearchFilters, sortField, sortDirection, pageSize, currentPage]);

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/cash-desk`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  useEffect(() => {
    refetch();
  }, [filters, sortField, sortDirection, currentPage, pageSize, refetch]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters]);

  const [open, setOpen] = useState(false);

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setFilters(prev => ({
        ...prev,
        search: searchValue,
      }));
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  const handleUserChange = (userIds: number[]) => {
    setFilters(prev => ({
      ...prev,
      userIds: userIds.length > 0 ? userIds : undefined,
    }));
  };

  const handleBankChange = (bankIds: number[]) => {
    setFilters(prev => ({
      ...prev,
      bankIds: bankIds.length > 0 ? bankIds : undefined,
    }));
  };

  const handleExpenseTypeChange = (value: string[]) => {
    setFilters(prev => ({
      ...prev,
      type_operation: value.length > 0 ? value : undefined,
    }));
  };

  const handleSort = (field: "id" | "counterparty.name") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortDirection("DESC");
    }
  };

  const handleCommentUpdate = () => {
    if (!editingRecord) return;

    mutate(
      {
        resource: "cash-desk",
        id: editingRecord.id,
        values: {
          comment: editingComment,
        },
      },
      {
        onSuccess: () => {
          setEditModalVisible(false);
          setEditingRecord(null);
          setEditingComment("");
          refetch();
          message.success("Комментарий успешно обновлен");
        },
        onError: () => {
          message.error("Ошибка при обновлении комментария");
        },
      }
    );
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
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "id" ? "bold" : "normal",
          }}
          onClick={() => handleSort("id")}
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
          onClick={() => handleSort("counterparty.name")}
        >
          По контрагенту{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const tableProps = {
    dataSource: data?.data?.data || [],
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
    },
    onChange: handleTableChange,
  };

  const { selectProps: userSelectProps } = useSelect({
    resource: "users",
    optionLabel: (item: any) => `${item.firstName} ${item.lastName}`,
  });

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
              />
            </Dropdown>
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по номеру накладной, Фио клиента"
            prefix={<SearchOutlined />}
            onChange={handleSearchChange}
            allowClear
          />
        </Col>
        <Col>
          <Select
            mode="multiple"
            placeholder="Выберите сотрудника"
            style={{ width: 200 }}
            // @ts-ignore
            onChange={handleUserChange}
            allowClear
            maxTagCount="responsive"
            {...userSelectProps}
          />
        </Col>
        <Col>
          <Select
            mode="multiple"
            placeholder="Выберите банк"
            style={{ width: 200 }}
            onChange={handleBankChange}
            allowClear
            maxTagCount="responsive"
            options={bankTableProps?.dataSource?.map((bank: any) => ({
              label: bank.name,
              value: bank.id,
            }))}
          />
        </Col>
        <Col>
          <Select
            mode="multiple"
            placeholder="Выберите тип расхода"
            style={{ width: 200 }}
            onChange={handleExpenseTypeChange}
            allowClear
            maxTagCount="responsive"
            options={expenseTypes}
          />
        </Col>
      </Row>

      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (currentPage - 1) * pageSize + index + 1;
          }}
          width={60}
        />
        <Table.Column
          dataIndex="date"
          title="Дата расхода"
          render={(date) => dayjs(date).format("DD.MM.YYYY HH:mm")}
          width={120}
        />

        <Table.Column
          dataIndex="bank_id"
          title="Банк"
          render={(value) => {
            const bank = bankTableProps?.dataSource?.find(
              (bank) => bank.id === value
            );
            return bank?.name || "-";
          }}
          width={120}
        />

        <Table.Column
          dataIndex="type_operation"
          title="Вид расхода"
        />
        
        <Table.Column
          dataIndex="comment"
          title="Комментарий"
          render={(value, record: any) => (
            <Space>
              <span>{value || "-"}</span>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingRecord(record);
                  setEditingComment(value || "");
                  setEditModalVisible(true);
                }}
              />
            </Space>
          )}
        />

        <Table.Column 
          dataIndex="amount" 
          title="Сумма" 
          render={(value) => value ? `${value}` : "-"}
        />

        <Table.Column dataIndex="type_currency" title="Валюта" />

        <Table.Column
          dataIndex="user"
          title="Сотрудник"
          render={(value) =>
            value ? `${value.firstName || ""} ${value.lastName || ""}`.trim() || "-" : "-"
          }
        />
      </Table>

      <Modal
        title="Редактирование комментария"
        open={editModalVisible}
        onOk={handleCommentUpdate}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRecord(null);
          setEditingComment("");
        }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input.TextArea
          value={editingComment}
          onChange={(e) => setEditingComment(e.target.value)}
          rows={4}
          placeholder="Введите комментарий"
        />
      </Modal>
    </List>
  );
};