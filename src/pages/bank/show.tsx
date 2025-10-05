import { Show } from "@refinedev/antd";
import { useShow, useCustom } from "@refinedev/core";
import {
  Typography,
  Table,
  Row,
  Col,
  Button,
  Dropdown,
  Card,
  DatePicker,
  Input,
} from "antd";
import {
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { API_URL } from "../../App";

const { Title } = Typography;
const { Column } = Table;

export const typeOperationMap: Record<string, string> = {
  supplier_payment: "Оплата поставщику",
  repair_payment: "Оплата за ремонт",
  salary_payment: "Выплата заработной платы",
  advance_payment: "Выдача подотчет",
  cash: "Наличные",
  "1": "Приход (1)",
};

export const BankShow = () => {
  const { queryResult } = useShow();
  const { data: showData, isLoading: showLoading } = queryResult;

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<any>("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [sorterVisible, setSorterVisible] = useState(false);
  const [searchText, setSearchText] = useState<string>("");

  // ✅ пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const record = showData?.data;
  const bankId = record?.id;

  const buildQueryParams = () => {
    return {
      s:
        searchFilters.length > 0
          ? JSON.stringify({ $and: searchFilters })
          : undefined,
      sort: `${sortField},${sortDirection}`,
      join: ["operation", "operation.good", "bank_permission", "operation.user"],
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/bank/${bankId}`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
    queryOptions: {
      enabled: !!bankId,
    },
  });

  const setFilters = (filters: any[], mode: "replace" | "append" = "append") => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
  };

  useEffect(() => {
    if (bankId) {
      refetch();
    }
  }, [searchFilters, sortDirection, sortField, bankId]);

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setFilters(
            [
              {
                date: {
                  $gte: dateStrings[0],
                  $lte: dateStrings[1],
                },
              },
            ],
            "replace"
          );
          setCurrentPage(1); // ✅ сбрасываем на первую страницу при фильтрации
        }
      }}
    />
  );

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
          onClick={() => {
            setSortField("id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "type" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("type");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Типу операции {sortField === "type" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const operations = data?.data?.operation || record?.operation || [];

  const filteredOperations = useMemo(() => {
    let result = [...operations];

    if (searchFilters.length > 0) {
      searchFilters.forEach((filter) => {
        if (filter.date) {
          const { $gte, $lte } = filter.date;
          if ($gte) {
            result = result.filter(
              (op) => new Date(op.date).getTime() >= new Date($gte).getTime()
            );
          }
          if ($lte) {
            result = result.filter(
              (op) => new Date(op.date).getTime() <= new Date($lte).getTime()
            );
          }
        }
      });
    }

    if (searchText) {
      result = result.filter(
        (op) =>
          (op.counterparty_id && op.counterparty_id.toString().includes(searchText)) ||
          (op.goods_id && op.goods_id.toString().includes(searchText))
      );
    }

    result.sort((a, b) => {
      if (sortField === "id") {
        return sortDirection === "ASC" ? a.id - b.id : b.id - a.id;
      } else if (sortField === "type") {
        const aValue = a.type || "";
        const bValue = b.type || "";
        return sortDirection === "ASC"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return result;
  }, [operations, searchFilters, sortField, sortDirection, searchText]);

  const total = filteredOperations.length;

  // ✅ пагинированный массив
  const paginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOperations.slice(startIndex, startIndex + pageSize);
  }, [filteredOperations, currentPage]);

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter && sorter.field) {
      setSortField(sorter.field === "type" ? "type" : "id");
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const resetAllFilters = () => {
    setSearchFilters([]);
    setSearchText("");
    setCurrentPage(1);
  };

  const { data: counterparty } = useCustom<any>({
    url: `${API_URL}/counterparty`,
    method: "get",
  });

  const counterparties = counterparty?.data || [];

  return (
    <Show isLoading={showLoading} headerButtons={() => false}>
      <Title level={5}>История операций: {record?.name}</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            placeholder="Поиск по коду клиента или трек-коду"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1); // ✅ сброс страницы при поиске
            }}
            allowClear
          />
        </Col>
        <Col>
          <Dropdown overlay={datePickerContent} trigger={["click"]} placement="bottomRight">
            <Button icon={<CalendarOutlined />}>Фильтр по дате</Button>
          </Dropdown>
        </Col>
        <Col>
          <Dropdown
            overlay={sortContent}
            trigger={["click"]}
            open={sorterVisible}
            onOpenChange={(visible) => setSorterVisible(visible)}
          >
            <Button>
              Сортировка{" "}
              {sortDirection === "ASC" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </Button>
          </Dropdown>
        </Col>
        {(searchFilters.length > 0 || searchText) && (
          <Col>
            <Button onClick={resetAllFilters}>Сбросить фильтры</Button>
          </Col>
        )}
        <Col>
          {(searchFilters.length > 0 || searchText) && (
            <Typography.Text type="secondary">Найдено: {total} записей</Typography.Text>
          )}
        </Col>
      </Row>

      <Table
        dataSource={paginatedOperations}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page) => setCurrentPage(page),
          showSizeChanger: false,
        }}
        onChange={handleTableChange}
        scroll={{ x: true }}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) =>
            (currentPage - 1) * pageSize + index + 1
          }
        />
        <Column
          title="Дата оплаты"
          dataIndex="date"
          render={(value) => (value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "-")}
        />
        <Column
          title="Код клиента"
          dataIndex="counterparty_id"
          render={(value) => {
            return (
              <p>{`${
                counterparties.find((item: any) => item.id === value)?.clientPrefix || ""
              }-${
                counterparties.find((item: any) => item.id === value)?.clientCode || ""
              }`}</p>
            );
          }}
        />
        <Column
          title="Номер накладной"
          dataIndex="good"
          render={(value) => value?.invoice_number || "-"}
        />
        <Column title="Валюта" dataIndex="type_currency" render={(value) => value || "-"} />
        <Column
          title="Сумма"
          dataIndex="amount"
          render={(value, record) => {
            const isIncome = record.type === "income";
            return (
              <span style={{ color: isIncome ? "green" : "red" }}>
                {isIncome ? "+" : "-"}
                {value?.toLocaleString() || 0} {record.type_currency}
              </span>
            );
          }}
        />
        <Column
          title="Тип операции"
          dataIndex="type"
          render={(value) => {
            const isIncome = value === "income";
            return (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  color: isIncome ? "green" : "red",
                  backgroundColor: isIncome
                    ? "rgba(0, 128, 0, 0.1)"
                    : "rgba(255, 0, 0, 0.1)",
                  border: `1px solid ${isIncome ? "green" : "red"}`,
                }}
              >
                {isIncome ? "Приход" : "Расход"}
              </span>
            );
          }}
        />
        <Column
          title="Вид прихода"
          dataIndex="type_operation"
          render={(value) => typeOperationMap[value] ?? value}
        />
        <Column
          title="Сотрудник"
          dataIndex="user"
          render={(value) => value?.firstName + " " + value?.lastName || "-"}
        />
        <Column title="Комментарий" dataIndex="comment" />
      </Table>
    </Show>
  );
};
