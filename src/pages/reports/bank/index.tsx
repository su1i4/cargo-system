import { useSelect, List } from "@refinedev/antd";
import { useCustom } from "@refinedev/core";
import {
  Table,
  Row,
  Col,
  Button,
  Dropdown,
  Card,
  Input,
  Select,
  Space,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  FileExcelOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { API_URL } from "../../../App";
import * as XLSX from "xlsx";

const { Column } = Table;

export const typeOperationMap: Record<string, string> = {
  supplier_payment: "Оплата поставщику",
  repair_payment: "Оплата за ремонт",
  salary_payment: "Выплата заработной платы",
  advance_payment: "Выдача подотчет",
  cash: "Наличные",
  "1": "Приход (1)",
};

export const BankReport = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<any>("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [sorterVisible, setSorterVisible] = useState(false);
  const [bankId, setBankId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // Стили для инпутов дат
  const inputStyle = {
    padding: "6px 11px",
    fontSize: "14px",
    lineHeight: "1.5715",
    color: "rgba(0, 0, 0, 0.88)",
    backgroundColor: "#ffffff",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    transition: "all 0.2s",
    width: "160px",
  };

  const buildQueryParams = () => {
    const params: any = {
      sort: `${sortField},${sortDirection}`,
    };

    // Добавляем фильтры по датам если они заданы
    if (from || to) {
      const dateFilter: any = {};
      if (from) dateFilter.$gte = from;
      if (to) dateFilter.$lte = to;

      const filters = [...searchFilters];
      if (Object.keys(dateFilter).length > 0) {
        filters.push({ date: dateFilter });
      }

      if (filters.length > 0) {
        params.s = JSON.stringify({ $and: filters });
      }
    } else if (searchFilters.length > 0) {
      params.s = JSON.stringify({ $and: searchFilters });
    }

    return params;
  };

  // Получаем список банков
  const { selectProps, query: bankQuery } = useSelect({
    resource: "bank",
    optionLabel: (value) => value?.name,
  });

  // Автовыбор первого банка при загрузке
  useEffect(() => {
    if (
      bankQuery.data?.data &&
      bankQuery.data.data.length > 0 &&
      bankId === null
    ) {
      //@ts-ignore
      setBankId(bankQuery.data.data[0].id);
    }
  }, [bankQuery.data, bankId]);

  // Запрос операций с сортировкой и фильтрацией
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

  // Функция для обновления фильтров
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

  // Обновление данных при изменении фильтров или сортировки
  useEffect(() => {
    if (bankId) {
      refetch();
    }
  }, [searchFilters, sortDirection, sortField, bankId, from, to]);

  // Компонент сортировки
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
        {/* Сортировка по ID (дате создания) */}
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "operation.id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("operation.id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "operation.id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        {/* Сортировка по типу операции */}
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "operation.type" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("operation.type");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Типу операции{" "}
          {sortField === "operation.type" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  // Получаем данные операций
  const operations = data?.data?.operation || [];

  // Применяем локальную фильтрацию по поиску
  const filteredOperations = useMemo(() => {
    let result = [...operations];

    // Применяем общий поиск по коду клиента и трек-коду
    if (searchText) {
      result = result.filter(
        (op) =>
          (op.counterparty_id &&
            op.counterparty_id.toString().includes(searchText)) ||
          (op.goods_id && op.goods_id.toString().includes(searchText)) ||
          (op.good?.invoice_number &&
            op.good.invoice_number
              .toString()
              .toLowerCase()
              .includes(searchText.toLowerCase()))
      );
    }

    return result;
  }, [operations, searchText]);

  const total = filteredOperations.length;

  // Обработчик изменения таблицы (только сортировка)
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter && sorter.field) {
      setSortField(sorter.field === "operation.type" ? "operation.type" : "operation.id");
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  // Функция для сброса всех фильтров и поиска
  const resetAllFilters = () => {
    setSearchFilters([]);
    setSearchText("");
    setFrom("");
    setTo("");
  };

  // Получаем контрагентов
  const { data: counterparty } = useCustom<any>({
    url: `${API_URL}/counterparty`,
    method: "get",
  });

  const counterparties = counterparty?.data || [];

  // Функция экспорта в XLSX
  const exportToXLSX = () => {
    if (!filteredOperations.length) {
      return;
    }

    const exportData = filteredOperations.map((op, index) => {
      const counterpartyInfo = counterparties.find(
        (item: any) => item.id === op.counterparty_id
      );
      const clientCode = counterpartyInfo
        ? `${counterpartyInfo.clientPrefix || ""}-${
            counterpartyInfo.clientCode || ""
          }`
        : "";

      return {
        "№": index + 1,
        "Дата оплаты": op.date
          ? dayjs(op.date).format("DD.MM.YYYY HH:mm")
          : "-",
        "Код клиента": clientCode,
        "Номер накладной": op.good?.invoice_number || "-",
        Валюта: op.type_currency || "-",
        Сумма: `${op.type === "income" ? "+" : "-"}${
          op.amount?.toLocaleString() || 0
        } ${op.type_currency || ""}`,
        "Тип операции": op.type === "income" ? "Приход" : "Расход",
        "Вид прихода": typeOperationMap[op.type_operation] ?? op.type_operation,
        Комментарий: op.comment || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Банковский отчет");

    const fileName = `bank_report_${dayjs().format("DD-MM-YYYY_HH-mm")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Функция экспорта в CSV
  const exportToCSV = () => {
    if (!filteredOperations.length) {
      return;
    }

    const exportData = filteredOperations.map((op, index) => {
      const counterpartyInfo = counterparties.find(
        (item: any) => item.id === op.counterparty_id
      );
      const clientCode = counterpartyInfo
        ? `${counterpartyInfo.clientPrefix || ""}-${
            counterpartyInfo.clientCode || ""
          }`
        : "";

      return {
        "№": index + 1,
        "Дата оплаты": op.date
          ? dayjs(op.date).format("DD.MM.YYYY HH:mm")
          : "-",
        "Код клиента": clientCode,
        "Номер накладной": op.good?.invoice_number || "-",
        Валюта: op.type_currency || "-",
        Сумма: `${op.type === "income" ? "+" : "-"}${
          op.amount?.toLocaleString() || 0
        } ${op.type_currency || ""}`,
        "Тип операции": op.type === "income" ? "Приход" : "Расход",
        "Вид прихода": typeOperationMap[op.type_operation] ?? op.type_operation,
        Комментарий: op.comment || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bank_report_${dayjs().format("DD-MM-YYYY_HH-mm")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <List
      title="Отчеты по банку"
      headerButtons={() => (
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            type="primary"
            ghost
            style={{
              backgroundColor: "white",
              borderColor: "#28a745",
              color: "#28a745",
            }}
            onClick={exportToXLSX}
            loading={isLoading}
            disabled={!filteredOperations.length}
          >
            XLSX
          </Button>
          <Button
            icon={<FileOutlined />}
            type="primary"
            ghost
            style={{
              backgroundColor: "white",
              borderColor: "#17a2b8",
              color: "#17a2b8",
            }}
            onClick={exportToCSV}
            loading={isLoading}
            disabled={!filteredOperations.length}
          >
            CSV
          </Button>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ position: "relative" }}>
              <p
                style={{
                  position: "absolute",
                  top: -20,
                  margin: 0,
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                От:
              </p>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#4096ff")}
                onBlur={(e) => (e.target.style.borderColor = "#d9d9d9")}
              />
            </div>

            <div style={{ position: "relative" }}>
              <p
                style={{
                  position: "absolute",
                  top: -20,
                  margin: 0,
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                До:
              </p>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#4096ff")}
                onBlur={(e) => (e.target.style.borderColor = "#d9d9d9")}
              />
            </div>
          </div>

          {(from || to || searchText || searchFilters.length > 0) && (
            <Button onClick={resetAllFilters} type="default">
              Сбросить фильтры
            </Button>
          )}
        </Space>
      )}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <Dropdown
            overlay={sortContent}
            trigger={["click"]}
            open={sorterVisible}
            onOpenChange={(visible) => setSorterVisible(visible)}
          >
            <Button>
              Сортировка{" "}
              {sortDirection === "ASC" ? (
                <ArrowUpOutlined />
              ) : (
                <ArrowDownOutlined />
              )}
            </Button>
          </Dropdown>
        </Col>
        <Col span={8}>
          <Input
            placeholder="Поиск по коду клиента, номеру накладной или трек-коду"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            allowClear
          />
        </Col>
        <Col>
          <Select
            {...selectProps}
            value={bankId}
            onChange={(value: any) => setBankId(value as number)}
            placeholder="Выберите банк"
            style={{ minWidth: 200 }}
          />
        </Col>
      </Row>

      <div style={{ marginBottom: 16, fontSize: "14px", color: "#666" }}>
        Найдено записей: {total}
      </div>

      <Table
        dataSource={filteredOperations}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      >
        <Table.Column
          title="№"
          width={60}
          render={(_: any, __: any, index: number) => {
            return index + 1;
          }}
        />
        <Column
          title="Дата оплаты"
          dataIndex="date"
          width={150}
          render={(value) =>
            value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "-"
          }
        />
        <Column
          title="Код клиента"
          dataIndex="counterparty_id"
          width={120}
          render={(value) => {
            const counterpartyInfo = counterparties.find(
              (item: any) => item.id === value
            );
            return counterpartyInfo ? (
              <span>{`${counterpartyInfo.clientPrefix || ""}-${
                counterpartyInfo.clientCode || ""
              }`}</span>
            ) : (
              "-"
            );
          }}
        />
        <Column
          title="Номер накладной"
          dataIndex="good"
          width={150}
          render={(value) => value?.invoice_number || "-"}
        />
        <Column
          title="Валюта"
          dataIndex="type_currency"
          width={80}
          render={(value) => value || "-"}
        />
        <Column
          title="Сумма"
          dataIndex="amount"
          width={150}
          render={(value, record: any) => {
            const isIncome = record.type === "income";
            return (
              <span
                style={{
                  color: isIncome ? "#52c41a" : "#ff4d4f",
                  fontWeight: "500",
                }}
              >
                {isIncome ? "+" : "-"}
                {value?.toLocaleString() || 0} {record.type_currency}
              </span>
            );
          }}
        />
        <Column
          title="Тип операции"
          dataIndex="type"
          width={120}
          render={(value) => {
            const isIncome = value === "income";
            return (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: isIncome ? "#52c41a" : "#ff4d4f",
                  backgroundColor: isIncome
                    ? "rgba(82, 196, 26, 0.1)"
                    : "rgba(255, 77, 79, 0.1)",
                  border: `1px solid ${isIncome ? "#52c41a" : "#ff4d4f"}`,
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
          width={180}
          render={(value) => typeOperationMap[value] ?? value ?? "-"}
        />
        <Column
          title="Комментарий"
          dataIndex="comment"
          ellipsis={{ showTitle: false }}
          render={(value) => value || "-"}
        />
      </Table>
    </List>
  );
};
