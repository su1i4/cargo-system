import { List } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Dropdown,
  Card,
  message,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom } from "@refinedev/core";
import { useDocumentTitle } from "@refinedev/react-router";
import { API_URL } from "../../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import * as XLSX from "xlsx";

dayjs.extend(utc);
dayjs.extend(timezone);

// Маппинг типов операций для расходов
const typeOperationMap: Record<string, string> = {
  supplier_payment: "Оплата поставщику",
  repair_payment: "Оплата за ремонт",
  salary_payment: "Выплата заработной платы",
  advance_payment: "Выдача подотчет",
  cash: "Наличные",
};

export const CashDeskOutcomeReport = () => {
  const setTitle = useDocumentTitle();

  useEffect(() => {
    setTitle("Отчет по расходам");
  }, []);

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "date" | "amount">("date");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    { type: { $eq: "outcome" } }, // Только расходы
  ]);
  const [search, setSearch] = useState("");

  // Состояния для дат
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Стили для инпутов дат
  const inputStyle: React.CSSProperties = {
    padding: "4px 8px",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    fontSize: "14px",
    width: "160px",
    height: "32px",
    transition: "border-color 0.2s ease",
  };

  const buildQueryParams = () => {
    let filters = [...searchFilters];

    // Добавляем фильтр по датам если они заданы
    if (from && to) {
      filters.push({
        date: {
          $gte: dayjs(from).utc().format(),
          $lte: dayjs(to).utc().format(),
        },
      });
    }

    return {
      s: JSON.stringify({ $and: filters }),
      sort: `${sortField},${sortDirection}`,
      page: 1,
      limit: 10000,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/cash-desk`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [sorterVisible, setSorterVisible] = useState(false);

  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      // Всегда сохраняем фильтр на тип outcome
      setSearchFilters([{ type: { $eq: "outcome" } }, ...filters]);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
  };

  // Получаем банки
  const { data: banksData } = useCustom({
    url: `${API_URL}/bank`,
    method: "get",
  });

  const banks = banksData?.data || [];

  // Функция для подготовки данных для экспорта
  const prepareExportData = () => {
    const dataSource = data?.data?.data || [];

    return dataSource.map((record: any, index: number) => ({
      "№": index + 1,
      "Дата расхода": record.date
        ? dayjs(record.date).utc().format("DD.MM.YYYY HH:mm")
        : "",
      "Вид расхода": typeOperationMap[record.type_operation] || record.type_operation || "",
      "Банк": banks.find((bank: any) => bank.id === record.bank_id)?.name || "",
      "Код клиента": record.counterparty
        ? `${record.counterparty.clientPrefix || ""}-${record.counterparty.clientCode || ""}`
        : "",
      "ФИО клиента": record.counterparty?.name || "",
      "Телефон клиента": record.counterparty?.phoneNumber || "",
      "Номер накладной": record.good?.invoice_number || "",
      "Сумма": `${record.amount || 0} ${record.type_currency || ""}`,
      "Валюта": record.type_currency || "",
      "Способ оплаты": record.method_payment || "",
      "Сотрудник": record.user
        ? `${record.user.firstName || ""} ${record.user.lastName || ""}`
        : "",
      "Комментарий": record.comment || "",
    }));
  };

  // Функция для скачивания XLSX
  const downloadXLSX = async () => {
    try {
      setDownloadLoading(true);
      const exportData = prepareExportData();

      if (exportData.length === 0) {
        message.warning("Нет данных для экспорта");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет по расходам");

      const fileName = `отчет_расходы_${dayjs().format(
        "DD-MM-YYYY_HH-mm"
      )}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан");
    } catch (error) {
      message.error("Ошибка при скачивании XLSX файла");
      console.error("XLSX download error:", error);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Функция для скачивания CSV
  const downloadCSV = async () => {
    try {
      const exportData = prepareExportData();

      if (exportData.length === 0) {
        message.warning("Нет данных для экспорта");
        return;
      }

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header];
              // Экранируем запятые в значениях
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `отчет_расходы_${dayjs().format("DD-MM-YYYY_HH-mm")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Файл CSV успешно скачан");
    } catch (error) {
      message.error("Ошибка при скачивании CSV файла");
      console.error("CSV download error:", error);
    }
  };

  // Обновляем данные при изменении фильтров
  useEffect(() => {
    refetch();
  }, [from, to, searchFilters, sortDirection, sortField, refetch]);

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
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "date" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("date");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате расхода{" "}
          {sortField === "date" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "amount" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("amount");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Сумме{" "}
          {sortField === "amount" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
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
          ID{" "}
          {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  return (
    <List
      title="Отчет по расходам"
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
            loading={downloadLoading}
            onClick={downloadXLSX}
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
            onClick={downloadCSV}
          >
            CSV
          </Button>
        </Space>
      )}
    >
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
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
        <Col>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>От:</span>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={inputStyle}
            />
          </div>
        </Col>
        <Col>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>До:</span>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={inputStyle}
            />
          </div>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по комментарию или коду клиента"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              if (!value) {
                setFilters([], "replace");
                return;
              }

              setFilters(
                [
                  {
                    $or: [
                      { comment: { $contL: value } },
                      { "counterparty.clientCode": { $contL: value } },
                      { "counterparty.name": { $contL: value } },
                    ],
                  },
                ],
                "replace"
              );
            }}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      <Table
        dataSource={data?.data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
        }}
        scroll={{ x: true }}
      >
        <Table.Column
          title="№"
          render={(_, __, index) => index + 1}
          width={60}
        />
        <Table.Column
          dataIndex="date"
          title="Дата расхода"
          render={(date) =>
            date ? dayjs(date).utc().format("DD.MM.YYYY HH:mm") : ""
          }
          width={140}
        />
        <Table.Column
          dataIndex="type_operation"
          title="Вид расхода"
          render={(value) => typeOperationMap[value] || value || "-"}
          width={180}
        />
        <Table.Column
          dataIndex="bank_id"
          title="Банк"
          render={(value) => {
            const bank = banks.find((bank: any) => bank.id === value);
            return bank?.name || "-";
          }}
          width={120}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Код клиента"
          render={(value) =>
            value
              ? `${value.clientPrefix || ""}-${value.clientCode || ""}`
              : "-"
          }
          width={120}
        />
        <Table.Column
          dataIndex="counterparty"
          title="ФИО клиента"
          render={(value) => value?.name || "-"}
          width={180}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Телефон"
          render={(value) => value?.phoneNumber || "-"}
          width={120}
        />
        <Table.Column
          dataIndex="good"
          title="Номер накладной"
          render={(value) => value?.invoice_number || "-"}
          width={140}
        />
        <Table.Column
          dataIndex="amount"
          title="Сумма"
          render={(value, record: any) => (
            <span
              style={{
                color: "#ff4d4f",
                fontWeight: "500",
              }}
            >
              -{value?.toLocaleString() || 0} {record.type_currency || ""}
            </span>
          )}
          width={120}
        />
        <Table.Column
          dataIndex="method_payment"
          title="Способ оплаты"
          render={(value) => value || "-"}
          width={140}
        />
        <Table.Column
          dataIndex="user"
          title="Сотрудник"
          render={(value) =>
            value ? `${value.firstName || ""} ${value.lastName || ""}` : "-"
          }
          width={150}
        />
        <Table.Column
          dataIndex="comment"
          title="Комментарий"
          render={(value) => value || "-"}
          ellipsis={{ showTitle: false }}
        />
      </Table>
    </List>
  );
}; 