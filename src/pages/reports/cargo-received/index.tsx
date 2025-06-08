import { List } from "@refinedev/antd";
import {
  Button,
  DatePicker,
  Table,
  Dropdown,
  Space,
  message,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  FileExcelOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom } from "@refinedev/core";
import { API_URL } from "../../../App";
import * as XLSX from "xlsx";

const { Title } = Typography;

interface CargoItem {
  from: string;
  to: string;
  totalWeight: number;
  totalCount: number;
  productTypes: {
    Пошив?: number;
    Бренд?: number;
    "К-Привозные"?: number;
    Маркировка?: number;
    [key: string]: number | undefined;
  };
}

interface GroupedData {
  region: string;
  count: number;
  items: CargoItem[];
  totals: {
    totalWeight: number;
    totalCount: number;
    sewing: number; // Пошив
    brand: number; // Бренд
    imported: number; // К-Привозные
    marking: number; // Маркировка
  };
}

export const CargoReceivedReport = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10000);

  const { data, refetch } = useCustom<any>({
    url: `${API_URL}/report/reportOnReceivedCargo`,
    method: "get",
  });

  useEffect(() => {
    refetch();
  }, [searchFilters, sortDirection, currentPage, pageSize]);

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

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "350px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      showTime={{ format: "HH:mm" }}
      format="YYYY-MM-DD HH:mm"
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
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

  // Функция для извлечения города из адреса
  const extractCity = (address: string): string => {
    if (address.includes("Бишкек")) return "Бишкек";
    if (address.includes("Москва")) return "Москва";
    if (address.includes("Екатеринбург")) return "Екатеринбург";
    // Добавьте другие города по необходимости
    return address.split(" ")[0] || address;
  };

  // Функция для группировки данных по городам отправления
  const groupDataByCity = (dataSource: CargoItem[]): GroupedData[] => {
    const grouped: Record<string, CargoItem[]> = {};

    dataSource.forEach((item) => {
      const city = extractCity(item.from);
      if (!grouped[city]) {
        grouped[city] = [];
      }
      grouped[city].push(item);
    });

    return Object.entries(grouped).map(([region, items]) => {
      const totals = items.reduce(
        (acc, item) => ({
          totalWeight: acc.totalWeight + (item.totalWeight || 0),
          totalCount: acc.totalCount + (item.totalCount || 0),
          sewing: acc.sewing + (item.productTypes["Пошив"] || 0),
          brand: acc.brand + (item.productTypes["Бренд"] || 0),
          imported: acc.imported + (item.productTypes["К-Привозные"] || 0),
          marking: acc.marking + (item.productTypes["Маркировка"] || 0),
        }),
        {
          totalWeight: 0,
          totalCount: 0,
          sewing: 0,
          brand: 0,
          imported: 0,
          marking: 0,
        }
      );

      return {
        region,
        count: items.length,
        items,
        totals,
      };
    });
  };

  const dataSource = data?.data || [];
  const groupedData = groupDataByCity(dataSource);

  // Добавляем итого по России (если есть российские города)
  const russianCities = groupedData.filter((group) =>
    ["Москва", "Екатеринбург", "Новосибирск", "Красноярск", "Абакан"].includes(
      group.region
    )
  );

  const russianTotals =
    russianCities.length > 0
      ? {
          region: "Итого Россия",
          count: russianCities.reduce((sum, city) => sum + city.count, 0),
          items: russianCities.flatMap((city) => city.items),
          totals: russianCities.reduce(
            (acc, city) => ({
              totalWeight: acc.totalWeight + city.totals.totalWeight,
              totalCount: acc.totalCount + city.totals.totalCount,
              sewing: acc.sewing + city.totals.sewing,
              brand: acc.brand + city.totals.brand,
              imported: acc.imported + city.totals.imported,
              marking: acc.marking + city.totals.marking,
            }),
            {
              totalWeight: 0,
              totalCount: 0,
              sewing: 0,
              brand: 0,
              imported: 0,
              marking: 0,
            }
          ),
        }
      : null;

  // Подготовка данных для экспорта
  const prepareExportData = () => {
    const exportData: any[] = [];

    groupedData.forEach((group) => {
      if (group.region === "Бишкек") {
        // Для Бишкека показываем детали
        exportData.push({
          Город: group.region,
          Место: group.count,
          "Общий тоннаж, кг": group.totals.totalWeight.toFixed(2),
          "из них, кг": "",
          "из них А самолёшив, кг": group.totals.sewing.toFixed(2),
          "из них С Бренд, кг": group.totals.brand.toFixed(2),
          "из них D Марк, кг": group.totals.marking.toFixed(2),
          "из них Китай Турция, кг": group.totals.imported.toFixed(2),
        });
      }

      // Добавляем детали для каждого направления
      group.items.forEach((item) => {
        exportData.push({
          Город: "",
          Место: item.to,
          "Общий тоннаж, кг": item.totalWeight,
          "из них, кг": "",
          "из них А самолёшив, кг": item.productTypes["Пошив"] || "",
          "из них С Бренд, кг": item.productTypes["Бренд"] || "",
          "из них D Марк, кг": item.productTypes["Маркировка"] || "",
          "из них Китай Турция, кг": item.productTypes["К-Привозные"] || "",
        });
      });
    });

    // Добавляем итого по России
    if (russianTotals) {
      exportData.push({
        Город: russianTotals.region,
        Место: russianTotals.count,
        "Общий тоннаж, кг": russianTotals.totals.totalWeight.toFixed(2),
        "из них, кг": "",
        "из них А самолёшив, кг": russianTotals.totals.sewing.toFixed(2),
        "из них С Бренд, кг": russianTotals.totals.brand.toFixed(2),
        "из них D Марк, кг": russianTotals.totals.marking.toFixed(2),
        "из них Китай Турция, кг": russianTotals.totals.imported.toFixed(2),
      });
    }

    return exportData;
  };

  const exportToExcel = () => {
    const exportData = prepareExportData();

    if (exportData.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет");

    XLSX.writeFile(workbook, "grouped_cargo_report.xlsx");
    message.success("Файл Excel успешно сохранён");
  };

  const exportToGoogleSheets = () => {
    const exportData = prepareExportData();

    if (exportData.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "grouped_cargo_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("Файл CSV готов для Google Sheets");
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      message.error("Ошибка при экспорте данных");
    }
  };

  const columns = [
    {
      title: "Город",
      dataIndex: "location",
      key: "location",
      width: 200,
      render: (text: string, record: any) => {
        if (record.isGroupHeader) {
          return (
            <Title level={5} style={{ margin: 0, color: "#1890ff" }}>
              {text}
            </Title>
          );
        }
        return <span style={{ paddingLeft: 20 }}>{text}</span>;
      },
    },
    {
      title: "Место",
      dataIndex: "totalCount",
      key: "totalCount",
      width: 80,
      render: (value: number, record: any) => {
        if (record.isGroupHeader) {
          return <strong>{value}</strong>;
        }
        return value ? value.toLocaleString("ru-RU") : "";
      },
    },
    {
      title: "Общий тоннаж, кг",
      dataIndex: "totalWeight",
      key: "totalWeight",
      width: 150,
      render: (value: number, record: any) => {
        if (record.isGroupHeader) {
          return (
            <strong>
              {value?.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
            </strong>
          );
        }
        return value?.toLocaleString("ru-RU") || 0;
      },
    },
    {
      title: "Пошив",
      dataIndex: "sewing",
      key: "sewing",
      width: 150,
      render: (value: number, record: any) => {
        if (record.isGroupHeader) {
          return (
            <strong>
              {value
                ? value.toLocaleString("ru-RU", { minimumFractionDigits: 2 })
                : ""}
            </strong>
          );
        }
        return value ? value.toLocaleString("ru-RU") : "";
      },
    },
    {
      title: "Бренд",
      dataIndex: "brand",
      key: "brand",
      width: 130,
      render: (value: number, record: any) => {
        if (record.isGroupHeader) {
          return (
            <strong>
              {value
                ? value.toLocaleString("ru-RU", { minimumFractionDigits: 2 })
                : ""}
            </strong>
          );
        }
        return value ? value.toLocaleString("ru-RU") : "";
      },
    },
    {
      title: "Маркировка",
      dataIndex: "marking",
      key: "marking",
      width: 130,
      render: (value: number, record: any) => {
        if (record.isGroupHeader) {
          return (
            <strong>
              {value
                ? value.toLocaleString("ru-RU", { minimumFractionDigits: 2 })
                : ""}
            </strong>
          );
        }
        return value ? value.toLocaleString("ru-RU") : "";
      },
    },
    {
      title: "К-привозные",
      dataIndex: "imported",
      key: "imported",
      width: 150,
      render: (value: number, record: any) => {
        if (record.isGroupHeader) {
          return (
            <strong>
              {value
                ? value.toLocaleString("ru-RU", { minimumFractionDigits: 2 })
                : ""}
            </strong>
          );
        }
        return value ? value.toLocaleString("ru-RU") : "";
      },
    },
  ];

  // Подготовка данных для таблицы
  const tableData: any[] = [];

  // Добавляем Бишкек первым
  const bishkekGroup = groupedData.find((g) => g.region === "Бишкек");
  if (bishkekGroup) {
    tableData.push({
      key: `group-bishkek`,
      location: "Бишкек Суеркулова 27",
      count: bishkekGroup.count,
      totalWeight: bishkekGroup.totals.totalWeight,
      totalCount: bishkekGroup.totals.totalCount,
      sewing: bishkekGroup.totals.sewing,
      brand: bishkekGroup.totals.brand,
      marking: bishkekGroup.totals.marking,
      imported: bishkekGroup.totals.imported,
      isGroupHeader: true,
    });

    // Добавляем детали по направлениям
    bishkekGroup.items.forEach((item, index) => {
      tableData.push({
        key: `bishkek-${index}`,
        location: item.to,
        totalWeight: item.totalWeight,
        totalCount: item.totalCount,
        sewing: item.productTypes["Пошив"],
        brand: item.productTypes["Бренд"],
        marking: item.productTypes["Маркировка"],
        imported: item.productTypes["К-Привозные"],
        isGroupHeader: false,
      });
    });
  }

  // Добавляем Итого Россия если есть
  if (russianTotals) {
    tableData.push({
      key: `group-russia`,
      location: "Итого Россия",
      count: russianTotals.count,
      totalWeight: russianTotals.totals.totalWeight,
      sewing: russianTotals.totals.sewing,
      brand: russianTotals.totals.brand,
      marking: russianTotals.totals.marking,
      imported: russianTotals.totals.imported,
      isGroupHeader: true,
    });

    // Добавляем российские города с деталями
    russianCities.forEach((group) => {
      group.items.forEach((item, index) => {
        tableData.push({
          key: `${group.region}-${index}`,
          location: item.to,
          totalWeight: item.totalWeight,
          sewing: item.productTypes["Пошив"],
          brand: item.productTypes["Бренд"],
          marking: item.productTypes["Маркировка"],
          imported: item.productTypes["К-Привозные"],
          isGroupHeader: false,
        });
      });
    });
  }

  return (
    <List
      title="Отчет по принятым грузам"
      headerButtons={() => (
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
            type="primary"
            ghost
            style={{
              backgroundColor: "white",
              borderColor: "#28a745",
              color: "#28a745",
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
              borderColor: "#17a2b8",
              color: "#17a2b8",
            }}
          >
            CSV
          </Button>
          <Dropdown
            overlay={datePickerContent}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />}>Дата</Button>
          </Dropdown>
        </Space>
      )}
    >
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) =>
          record.isGroupHeader ? "group-header-row" : ""
        }
        scroll={{ x: 1200 }}
        style={{
          backgroundColor: "white",
        }}
      />

      <style>{`
        .group-header-row {
          background-color: #e6f7ff !important;
          font-weight: bold;
        }
        .group-header-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </List>
  );
};
