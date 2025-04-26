import { List } from "@refinedev/antd";
import {
  Table,
  Button,
  DatePicker,
  Dropdown,
  Card,
  Space,
  message,
} from "antd";
import {
  CalendarOutlined,
  FileExcelOutlined,
  GoogleOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom, useNavigation } from "@refinedev/core";
import dayjs from "dayjs";
import { API_URL } from "../../../App";
import * as XLSX from "xlsx";

export const CargoTypesReport = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10000);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [...searchFilters, { status: { $eq: "В пути" } }],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  // Fixed: Update filters function that properly formats filters
  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }

    // We'll refetch in useEffect after state updates
  };

  // Fixed: Add effect to trigger refetch when filters or sorting changes
  useEffect(() => {
    refetch();
  }, [searchFilters, sortDirection, currentPage, pageSize]);

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "350px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      showTime={{ format: "HH:mm" }}
      format="YYYY-MM-DD HH:mm"
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          // Fixed: Use consistent filter format
          setFilters(
            [
              {
                created_at: {
                  $gte: dateStrings[0],
                  $lte: dateStrings[1],
                },
              },
            ],
            "replace"
          );
        } else {
          setFilters([], "replace");
        }
      }}
    />
  );

  const dataSource = data?.data?.data || [];

  const { show } = useNavigation();

  // Создаем функции для пагинации, которые обычно предоставляет tableProps
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    // Обрабатываем сортировку, если она пришла из таблицы
    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  // Формируем пропсы для таблицы из данных useCustom
  const tableProps = {
    dataSource: dataSource,
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  // Функция для экспорта данных в Excel
  const exportToExcel = () => {
    if (!dataSource || dataSource.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    // Преобразование данных для экспорта
    const exportData = dataSource.map((item: any) => ({
      "Дата приемки": item.created_at
        ? dayjs(item.created_at).format("DD.MM.YYYY HH:MM")
        : "",
      "Трек-код": item.trackCode,
      "Тип груза": item.cargoType,
      "Код получателя": item.counterparty
        ? `${item.counterparty.clientPrefix}-${item.counterparty.clientCode}`
        : "",
      "ФИО получателя": item.counterparty ? item.counterparty.name : "",
      "Пункт назначения, Пвз": item.counterparty
        ? `${item.counterparty.branch?.name},${
            item.counterparty.under_branch?.address || ""
          }`
        : "",
      Вес: item.weight,
      Сумма: item.amount,
      Скидка: item.discount,
      Сотрудник: item.employee
        ? `${item.employee.firstName}-${item.employee.lastName}`
        : "",
      Комментарий: item.comments,
    }));

    // Создание Excel файла
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Отчет по принятым грузам"
    );

    // Сохранение файла
    XLSX.writeFile(workbook, "cargo_received_report.xlsx");
  };

  // Функция для экспорта данных в Google Sheets
  const exportToGoogleSheets = () => {
    if (!dataSource || dataSource.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    try {
      // Преобразование данных для экспорта
      const exportData = dataSource.map((item: any) => ({
        "Дата приемки": item.created_at
          ? dayjs(item.created_at).format("DD.MM.YYYY HH:MM")
          : "",
        "Трек-код": item.trackCode,
        "Тип груза": item.cargoType,
        "Код получателя": item.counterparty
          ? `${item.counterparty.clientPrefix}-${item.counterparty.clientCode}`
          : "",
        "ФИО получателя": item.counterparty ? item.counterparty.name : "",
        "Пункт назначения, Пвз": item.counterparty
          ? `${item.counterparty.branch?.name},${
              item.counterparty.under_branch?.address || ""
            }`
          : "",
        Вес: item.weight,
        Сумма: item.amount,
        Скидка: item.discount,
        Сотрудник: item.employee
          ? `${item.employee.firstName}-${item.employee.lastName}`
          : "",
        Комментарий: item.comments,
      }));

      // Создание CSV для Google Sheets
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Создание Blob и ссылки для скачивания
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Создание элемента для скачивания
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "cargo_received_report.csv");
      document.body.appendChild(link);

      // Имитация клика для скачивания
      link.click();

      // Очистка
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("Файл готов для импорта в Google Sheets");
    } catch (error) {
      console.error("Ошибка при экспорте в Google Sheets:", error);
      message.error("Ошибка при экспорте данных");
    }
  };

  return (
    <List
      title="Отчет по полученным товаром"
      headerButtons={() => {
        return (
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              type="primary"
              ghost
              style={{
                backgroundColor: "white",
                borderColor: "#4285F4",
                color: "#4285F4",
              }}
            >
              XLSX
            </Button>
            <Button
              icon={<FileOutlined />}
              onClick={exportToGoogleSheets}
              type="primary"
              ghost
              style={{
                backgroundColor: "white",
                borderColor: "#4285F4",
                color: "#4285F4",
              }}
            >
              CSV
            </Button>
            <Dropdown
              overlay={datePickerContent}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                icon={<CalendarOutlined />}
                className="date-picker-button"
              >
                Дата
              </Button>
            </Dropdown>
          </Space>
        );
      }}
    >
      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          onDoubleClick: () => {
            show("goods-processing", record.id as number);
          },
        })}
        pagination={false}
      >
        <Table.Column
          dataIndex="created_at"
          title="Дата приемки"
          render={(value) =>
            value ? dayjs(value).format("DD.MM.YYYY HH:MM") : ""
          }
        />
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
          render={(value) => {
            return value?.clientPrefix + "-" + value?.clientCode;
          }}
        />
        <Table.Column
          dataIndex="counterparty"
          title="ФИО получателя"
          render={(value) => value?.name}
        />
        <Table.Column
          dataIndex="counterparty"
          render={(value) =>
            `${value?.branch?.name},${value?.under_branch?.address || ""}`
          }
          title="Пункт назначения, Пвз"
        />
        <Table.Column dataIndex="weight" title="Вес" />
        <Table.Column dataIndex="amount" title="Сумма" />
        <Table.Column dataIndex="discount" title="Скидка" />
        {/* <Table.Column dataIndex="paymentMethod" title="Способ оплаты" /> */}
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName}-${value?.lastName}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </List>
  );
};
