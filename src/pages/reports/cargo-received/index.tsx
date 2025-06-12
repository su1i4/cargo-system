import { List } from "@refinedev/antd";
import { Button, Table, Space, message, Divider } from "antd";
import { FileExcelOutlined, FileOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom } from "@refinedev/core";
import { API_URL } from "../../../App";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

interface CargoItem {
  from: string;
  to: string;
  totalWeight: number;
  totalCount: number;
  productTypes: {
    Пошив?: number;
    Брендированные?: number;
    "К-Привозные"?: number;
    Маркировка?: number;
    [key: string]: number | undefined;
  };
}

interface GroupedData {
  region: string;
  totalWeight: number;
  totalCount: number;
  sewing: number; // Пошив
  brand: number; // Брендированные
  imported: number; // К-Привозные
  marking: number; // Маркировка
  isGroupHeader: boolean;
}

const columns = [
  {
    title: "Город",
    dataIndex: "region",
    key: "region",
    width: 240,
    render: (text: string, record: any) => {
      if (record.isGroupHeader) {
        return <strong style={{ fontSize: 15 }}>{text}</strong>;
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
    title: "Пошив, кг",
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
    title: "Брендированные, кг",
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
    title: "Маркировка, кг",
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
    title: "К-привозные, кг",
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

export const inputStyle = {
  padding: "4px 11px",
  fontSize: "14px",
  lineHeight: "1.5715",
  border: "1px solid #d9d9d9",
  borderRadius: "6px",
  width: "220px",
  outline: "none",
  transition: "all 0.3s",
  boxShadow: "none",
};

export const CargoReceivedReport = () => {
  const [tableData, setTableData] = useState<GroupedData[]>([]);
  const [totalData, setTotalData] = useState<GroupedData[]>([]);

  const [from, setFrom] = useState(
    dayjs().subtract(1, "month").format("YYYY-MM-DDTHH:mm")
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));

  const fromDate = new Date(from);

  const formattedFrom =
    fromDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " " +
    fromDate.toLocaleDateString("ru-RU");
  const toDate = new Date(from);

  const formattedTo =
    toDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " " +
    toDate.toLocaleDateString("ru-RU");

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/report/reportOnReceivedCargo`,
    method: "get",
    config: {
      query: {
        pagination: false,
        startDate: from.replace("T", " ") + ":00",
        endDate: to.replace("T", " ") + ":00",
      },
    },
  });

  useEffect(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isLoading, refetch, from, to]);

  useEffect(() => {
    if (data?.data) {
      const grouped: GroupedData[] = [];

      const fromGroups = data.data.routes?.reduce((acc: any, item: any) => {
        if (!acc[item.from]) {
          acc[item.from] = [];
        }
        acc[item.from].push(item);
        return acc;
      }, {} as Record<string, CargoItem[]>);

      for (const [from, items] of Object.entries(fromGroups || {})) {
        const itemsT: any = items;
        const fromTotalCount = itemsT?.reduce(
          (sum: any, i: any) => sum + i.totalCount,
          0
        );
        const fromTotalWeight = itemsT?.reduce(
          (sum: any, i: any) => sum + i.totalWeight,
          0
        );
        const fromSewing = itemsT?.reduce(
          (sum: any, i: any) => sum + (i.productTypes["Пошив"] || 0),
          0
        );
        const fromImported = itemsT?.reduce(
          (sum: any, i: any) => sum + (i.productTypes["К-Привозные"] || 0),
          0
        );
        const fromBrand = itemsT?.reduce(
          (sum: any, i: any) => sum + (i.productTypes["Брендированные"] || 0),
          0
        );
        const fromMarking = itemsT?.reduce(
          (sum: any, i: any) => sum + (i.productTypes["Маркировка"] || 0),
          0
        );

        grouped.push({
          isGroupHeader: true,
          region: from,
          totalCount: fromTotalCount,
          totalWeight: fromTotalWeight,
          sewing: fromSewing,
          brand: fromBrand,
          imported: fromImported,
          marking: fromMarking,
        });

        itemsT.forEach((item: any) => {
          grouped.push({
            isGroupHeader: false,
            region: item.to,
            totalCount: item.totalCount,
            totalWeight: item.totalWeight,
            sewing: item.productTypes["Пошив"] || 0,
            brand: item.productTypes["Брендированные"] || 0,
            imported: item.productTypes["К-Привозные"] || 0,
            marking: item.productTypes["Маркировка"] || 0,
          });
        });
      }

      setTableData(grouped);

      // Prepare total data
      const cities = data?.data?.cities || [];
      const totalDataArray: GroupedData[] = [
        ...cities.map((item: any) => {
          return {
            isGroupHeader: false,
            region: `Всего ${item.toCity}`,
            totalCount: item.totalCount,
            totalWeight: item.totalWeight,
            sewing: item.productTypes["Пошив"] || 0,
            brand: item.productTypes["Брендированные"] || 0,
            imported: item.productTypes["К-Привозные"] || 0,
            marking: item.productTypes["Маркировка"] || 0,
          };
        }),
        {
          isGroupHeader: true,
          region: "Всего итого",
          totalCount: cities?.reduce(
            (sum: any, i: any) => sum + i.totalCount,
            0
          ),
          totalWeight: cities?.reduce(
            (sum: any, i: any) => sum + i.totalWeight,
            0
          ),
          sewing: cities?.reduce(
            (sum: any, i: any) => sum + (i.productTypes["Пошив"] || 0),
            0
          ),
          brand: cities?.reduce(
            (sum: any, i: any) => sum + (i.productTypes["Брендированные"] || 0),
            0
          ),
          imported: cities?.reduce(
            (sum: any, i: any) => sum + (i.productTypes["К-Привозные"] || 0),
            0
          ),
          marking: cities?.reduce(
            (sum: any, i: any) => sum + (i.productTypes["Маркировка"] || 0),
            0
          ),
        },
      ];

      setTotalData(totalDataArray);
    }
  }, [data]);

  const prepareExportData = () => {
    const exportData: any[] = [];

    exportData.push({
      Город: "ОТЧЕТ ПО ПРИНЯТЫМ ГРУЗАМ",
      Место: "",
      "Общий тоннаж, кг": "",
      Пошив: "",
      Брендированные: "",
      Маркировка: "",
      "К-привозные": "",
    });

    exportData.push({
      Город: `Период: ${formattedFrom} - ${formattedTo}`,
      Место: "",
      "Общий тоннаж, кг": "",
      Пошив: "",
      Брендированные: "",
      Маркировка: "",
      "К-привозные": "",
    });

    exportData.push({
      Город: "",
      Место: "",
      "Общий тоннаж, кг": "",
      Пошив: "",
      Брендированные: "",
      Маркировка: "",
      "К-привозные": "",
    });

    tableData.forEach((item) => {
      exportData.push({
        Город: item.region,
        Место: item.totalCount || "",
        "Общий тоннаж, кг": item.totalWeight || "",
        Пошив: item.sewing || "",
        Брендированные: item.brand || "",
        Маркировка: item.marking || "",
        "К-привозные": item.imported || "",
      });
    });

    // Add separator
    exportData.push({
      Город: "",
      Место: "",
      "Общий тоннаж, кг": "",
      Пошив: "",
      Брендированные: "",
      Маркировка: "",
      "К-привозные": "",
    });

    // Add total data
    totalData.forEach((item) => {
      exportData.push({
        Город: item.region,
        Место: item.totalCount || "",
        "Общий тоннаж, кг": item.totalWeight || "",
        Пошив: item.sewing || "",
        Брендированные: item.brand || "",
        Маркировка: item.marking || "",
        "К-привозные": item.imported || "",
      });
    });

    return exportData;
  };

  // Export to XLSX
  const exportToXLSX = () => {
    try {
      const exportData = prepareExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();

      // Set column widths
      worksheet["!cols"] = [
        { wch: 30 }, // Город
        { wch: 10 }, // Место
        { wch: 18 }, // Общий тоннаж
        { wch: 15 }, // Пошив
        { wch: 18 }, // Брендированные
        { wch: 15 }, // Маркировка
        { wch: 15 }, // К-привозные
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет по грузам");

      const fileName = `Отчет_по_принятым_грузам_${formattedFrom}_${formattedTo}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан!");
    } catch (error) {
      console.error("Error exporting to XLSX:", error);
      message.error("Ошибка при экспорте в XLSX");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const exportData = prepareExportData();
      const headers = Object.keys(exportData[0]);

      let csvContent = headers.join(",") + "\n";

      exportData.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || "");
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvContent += values.join(",") + "\n";
      });

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Отчет_по_принятым_грузам_${formattedFrom}_${formattedTo}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Файл CSV успешно скачан!");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      message.error("Ошибка при экспорте в CSV");
    }
  };

  return (
    <List
      title={
        <p style={{ fontSize: 15, lineHeight: "18px" }}>
          Отчет по принятым грузам
          <br /> от {formattedTo} до {formattedFrom}
        </p>
      }
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
          >
            CSV
          </Button>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ position: "relative" }}>
              <p style={{ position: "absolute", top: -20 }}>От:</p>
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
              <p style={{ position: "absolute", top: -20 }}>До:</p>
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
        </Space>
      )}
    >
      <Table
        columns={columns.map((item: any, index: number) => {
          if (index === 0) return { ...item, title: "Всего Кыргызстан" };
          return item;
        })}
        dataSource={tableData}
        loading={isLoading}
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
      <Divider />
      <Table
        columns={columns.map((item: any, index: number) => {
          if (index === 0) return { ...item, title: "Всего Россия" };
          return item;
        })}
        dataSource={totalData}
        loading={isLoading}
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
          color: #FF5E5E;
        }
        .group-header-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </List>
  );
};
