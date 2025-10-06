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
  Image,
  message,
  Modal,
} from "antd";
import { useCustom, useNavigation, useUpdate } from "@refinedev/core";
import {
  FileAddOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_URL } from "../../App";
import { typeOperationMap } from "../bank";
import { debounce } from "lodash";

interface IncomeFilters {
  search?: string;
  userIds?: number[];
  bankIds?: number[];
}

export const CashDeskList: React.FC = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingComment, setEditingComment] = useState<string>("");
  const { mutate } = useUpdate();

  const { tableProps: bankTableProps } = useTable({
    resource: "bank",
    pagination: {
      mode: "off",
    },
  });

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");

  // Отдельные состояния для каждого типа фильтра
  const [filters, setFilters] = useState<IncomeFilters>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorterVisible, setSorterVisible] = useState(false);

  const buildSearchFilters = useCallback(() => {
    const searchFilters: any[] = [{ type: { $eq: "income" } }];

    // Фильтр поиска
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

    // Фильтр по пользователям
    if (filters.userIds && filters.userIds.length > 0) {
      searchFilters.push({
        user_id: { $in: filters.userIds },
      });
    }

    // Фильтр по банкам
    if (filters.bankIds && filters.bankIds.length > 0) {
      searchFilters.push({
        bank_id: { $in: filters.bankIds },
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

  // Перезагружаем данные при изменении фильтров, сортировки или пагинации
  useEffect(() => {
    refetch();
  }, [filters, sortDirection, sortField, currentPage, pageSize, refetch]);

  // Сбрасываем пагинацию при изменении фильтров
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters]);

  const [open, setOpen] = useState(false);

  // Debounced функция для поиска
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setFilters((prev) => ({
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
    setFilters((prev) => ({
      ...prev,
      userIds: userIds.length > 0 ? userIds : undefined,
    }));
  };

  const handleBankChange = (bankIds: number[]) => {
    setFilters((prev) => ({
      ...prev,
      bankIds: bankIds.length > 0 ? bankIds : undefined,
    }));
  };

  const handleSort = (field: "id" | "counterparty.name") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDirection("DESC");
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
      showSizeChanger: true,
      showQuickJumper: true,
    },
    onChange: handleTableChange,
  };

  const handleDownloadPhoto = async (photo: string) => {
    if (photo) {
      try {
        const photoUrl = `${API_URL}/${photo}`;

        // Fetch the image as a blob
        const response = await fetch(photoUrl);
        const blob = await response.blob();

        // Create object URL from blob
        const objectUrl = URL.createObjectURL(blob);

        // Create a link element
        const link = document.createElement("a");
        link.href = objectUrl;

        // Extract filename from path
        const filename = photo.split("/").pop() || "photo.jpg";
        link.download = filename;

        // Append to the document, click and then remove
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
        }, 100);
      } catch (error) {
        console.error("Error downloading photo:", error);
        // You could add notification here if desired
      }
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

  const { selectProps: userSelectProps } = useSelect({
    resource: "users",
    optionLabel: (item: any) => `${item.firstName} ${item.lastName}`,
    onSearch: (value: string) => [
      {
        operator: "or",
        value: [
          { field: "firstName", operator: "contains", value },
          { field: "lastName", operator: "contains", value },
        ],
      },
    ],
  });

  const { push, show } = useNavigation();

  // @ts-ignore
  return (
    <List headerButtons={() => null}>
      {/* <MyCreateModal open={open} onClose={() => setOpen(false)} /> */}

      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
            <Button
              icon={<FileAddOutlined />}
              style={{}}
              onClick={() => push("create")}
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
            placeholder="Выберите банк"
            style={{ width: 300 }}
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
            placeholder="Выберите сотрудника"
            style={{ width: 300 }}
            // @ts-ignore
            onChange={handleUserChange}
            allowClear
            maxTagCount="responsive"
            {...userSelectProps}
          />
        </Col>
      </Row>

      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        size="small"
        onRow={(record) => ({
          onDoubleClick: () => {
            show("income", record.id as number);
          },
        })}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (currentPage - 1) * pageSize + index + 1;
          }}
          width={60}
        />
        <Table.Column
          dataIndex="date"
          title="Дата оплаты"
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
          dataIndex="method_payment"
          title="Метод оплаты"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="type_operation"
          title="Вид прихода"
          render={(value) => typeOperationMap[value] || value}
        />

        <Table.Column
          dataIndex="good"
          title="Код отправителя"
          render={(value) =>
            value
              ? `${value?.sender?.clientPrefix || ""}-${
                  value?.sender?.clientCode || ""
                }`
              : "-"
          }
        />

        <Table.Column
          dataIndex="good"
          title="Фио отправителя"
          render={(good) => good?.sender?.name || "-"}
        />

        <Table.Column
          dataIndex="good"
          title="Код получателя"
          render={(value) =>
            value
              ? `${value?.recipient?.clientPrefix || ""}-${
                  value?.recipient?.clientCode || ""
                }`
              : "-"
          }
        />

        <Table.Column
          dataIndex="good"
          title="Фио получателя"
          render={(good) => good?.recipient?.name || "-"}
        />

        <Table.Column
          title="Номер накладной"
          dataIndex="good"
          render={(value) => value?.invoice_number || "-"}
        />

        <Table.Column
          dataIndex="amount"
          title="Сумма"
          render={(value) => value || "-"}
        />

        <Table.Column
          dataIndex="type_currency"
          title="Валюта"
          render={(value) => value || "-"}
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
          dataIndex="check_file"
          title="Чек"
          width={150}
          render={(check_file) => {
            const downloadUrl = `${API_URL}/${check_file}`;
            return check_file ? (
              <Space direction="vertical" align="center" size="small">
                {downloadUrl.endsWith(".pdf") ? (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 Открыть PDF
                  </a>
                ) : (
                  <Image
                    style={{ objectFit: "cover" }}
                    width={50}
                    height={50}
                    src={downloadUrl}
                    preview={{ src: downloadUrl }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Yk1xkE8A8uJBNLkYjkLuLSJpJO4GLNBXiFx8r0Cu7d+gC7bJf3vJnZZo2b12t5FPv5+/v7X+I8AYHAhwlwAwKBL2AAgYDgIhD4MgZ..."
                  />
                )}
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadPhoto(check_file)}
                  size="small"
                >
                  Скачать
                </Button>
              </Space>
            ) : (
              "Нет"
            );
          }}
        />
        <Table.Column
          title="Сотрудник"
          dataIndex="user"
          render={(value) =>
            value
              ? `${value?.firstName || ""} ${value?.lastName || ""}`.trim() ||
                "-"
              : "-"
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
