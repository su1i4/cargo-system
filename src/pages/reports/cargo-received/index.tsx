import { List } from "@refinedev/antd";
import { Button, Table, Space, message, Divider, Checkbox } from "antd";
import { FileExcelOutlined, FileOutlined } from "@ant-design/icons";
import { useEffect, useState, useCallback } from "react";
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
  const [isWarehouse, setIsWarehouse] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [from, setFrom] = useState(
    dayjs().startOf("day").format("YYYY-MM-DDTHH:mm")
  );
  const [to, setTo] = useState(dayjs().endOf("day").format("YYYY-MM-DDTHH:mm"));

  // Безопасное форматирование дат
  const getFormattedDate = useCallback((dateString: string, label: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date for ${label}:`, dateString);
        return "Неверная дата";
      }
      return (
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " " +
        date.toLocaleDateString("ru-RU")
      );
    } catch (error) {
      console.error(`Error formatting date for ${label}:`, error);
      return "Ошибка даты";
    }
  }, []);

  const formattedFrom = getFormattedDate(from, "from");
  const formattedTo = getFormattedDate(to, "to");

  const { data, isLoading, refetch, error } = useCustom<any>({
    url: `${API_URL}/report/reportOnReceivedCargo`,
    method: "get",
    config: {
      query: {
        pagination: false,
        startDate: from.replace("T", " ") + ":00",
        endDate: to.replace("T", " ") + ":00",
        is_warehouse: isWarehouse,
      },
    },
  });

  // Улучшенная обработка изменения чекбокса
  const handleWarehouseChange = useCallback(async (checked: boolean) => {
    console.log("Warehouse checkbox changed:", checked);
    
    try {
      setIsProcessing(true);
      setHasError(false);
      setErrorMessage("");
      
      // Добавляем небольшую задержку для предотвращения слишком частых запросов
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setIsWarehouse(checked);
      console.log("Warehouse state updated successfully");
      
    } catch (error) {
      console.error("Error in handleWarehouseChange:", error);
      setHasError(true);
      setErrorMessage("Ошибка при изменении состояния склада");
      message.error("Произошла ошибка при изменении состояния");
      
      // Откатываем состояние при ошибке
      setIsWarehouse(!checked);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Улучшенная обработка данных с детальным логированием
  const processData = useCallback((responseData: any) => {
    console.log("Processing data:", responseData);
    
    try {
      setHasError(false);
      setErrorMessage("");

      if (!responseData) {
        console.warn("No response data received");
        setTableData([]);
        setTotalData([]);
        return;
      }

      if (!responseData.routes) {
        console.warn("No routes data in response");
        setTableData([]);
        setTotalData([]);
        return;
      }

      const grouped: GroupedData[] = [];
      
      // Безопасная обработка routes
      const routes = Array.isArray(responseData.routes) ? responseData.routes : [];
      console.log("Routes to process:", routes.length);

      const fromGroups = routes.reduce((acc: any, item: any) => {
        try {
          if (!item || typeof item.from !== 'string') {
            console.warn("Invalid route item:", item);
            return acc;
          }
          
          if (!acc[item.from]) {
            acc[item.from] = [];
          }
          acc[item.from].push(item);
          return acc;
        } catch (error) {
          console.error("Error processing route item:", item, error);
          return acc;
        }
      }, {} as Record<string, CargoItem[]>);

      console.log("Grouped data:", fromGroups);

      for (const [from, items] of Object.entries(fromGroups)) {
        try {
          const itemsArray = items as CargoItem[];
          
          const fromTotalCount = itemsArray.reduce(
            (sum, item) => sum + (Number(item.totalCount) || 0),
            0
          );
          
          const fromTotalWeight = itemsArray.reduce(
            (sum, item) => sum + (Number(item.totalWeight) || 0),
            0
          );
          
          const fromSewing = itemsArray.reduce(
            (sum, item) => sum + (Number(item.productTypes?.["Пошив"]) || 0),
            0
          );
          
          const fromImported = itemsArray.reduce(
            (sum, item) => sum + (Number(item.productTypes?.["К-Привозные"]) || 0),
            0
          );
          
          const fromBrand = itemsArray.reduce(
            (sum, item) => sum + (Number(item.productTypes?.["Брендированные"]) || 0),
            0
          );
          
          const fromMarking = itemsArray.reduce(
            (sum, item) => sum + (Number(item.productTypes?.["Маркировка"]) || 0),
            0
          );

          // Добавляем заголовок группы
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

          // Добавляем элементы группы
          itemsArray.forEach((item) => {
            try {
              grouped.push({
                isGroupHeader: false,
                region: item.to || "Неизвестно",
                totalCount: Number(item.totalCount) || 0,
                totalWeight: Number(item.totalWeight) || 0,
                sewing: Number(item.productTypes?.["Пошив"]) || 0,
                brand: Number(item.productTypes?.["Брендированные"]) || 0,
                imported: Number(item.productTypes?.["К-Привозные"]) || 0,
                marking: Number(item.productTypes?.["Маркировка"]) || 0,
              });
            } catch (itemError) {
              console.error("Error processing item:", item, itemError);
            }
          });
        } catch (groupError) {
          console.error("Error processing group:", from, groupError);
        }
      }

      console.log("Final grouped data:", grouped);
      setTableData(grouped);

      // Безопасная обработка cities
      const cities = Array.isArray(responseData.cities) ? responseData.cities : [];
      console.log("Cities to process:", cities.length);

      const totalDataArray: GroupedData[] = [];

      // Добавляем данные по городам
      cities.forEach((item: any) => {
        try {
          totalDataArray.push({
            isGroupHeader: false,
            region: `Всего ${item.toCity || "Неизвестно"}`,
            totalCount: Number(item.totalCount) || 0,
            totalWeight: Number(item.totalWeight) || 0,
            sewing: Number(item.productTypes?.["Пошив"]) || 0,
            brand: Number(item.productTypes?.["Брендированные"]) || 0,
            imported: Number(item.productTypes?.["К-Привозные"]) || 0,
            marking: Number(item.productTypes?.["Маркировка"]) || 0,
          });
        } catch (cityError) {
          console.error("Error processing city:", item, cityError);
        }
      });

      // Добавляем итоговую строку
      try {
        const totalCount = cities.reduce(
          (sum: number, item: any) => sum + (Number(item.totalCount) || 0),
          0
        );
        const totalWeight = cities.reduce(
          (sum: number, item: any) => sum + (Number(item.totalWeight) || 0),
          0
        );
        const totalSewing = cities.reduce(
          (sum: number, item: any) => sum + (Number(item.productTypes?.["Пошив"]) || 0),
          0
        );
        const totalBrand = cities.reduce(
          (sum: number, item: any) => sum + (Number(item.productTypes?.["Брендированные"]) || 0),
          0
        );
        const totalImported = cities.reduce(
          (sum: number, item: any) => sum + (Number(item.productTypes?.["К-Привозные"]) || 0),
          0
        );
        const totalMarking = cities.reduce(
          (sum: number, item: any) => sum + (Number(item.productTypes?.["Маркировка"]) || 0),
          0
        );

        totalDataArray.push({
          isGroupHeader: true,
          region: "Всего итого",
          totalCount,
          totalWeight,
          sewing: totalSewing,
          brand: totalBrand,
          imported: totalImported,
          marking: totalMarking,
        });
      } catch (totalError) {
        console.error("Error calculating totals:", totalError);
      }

      console.log("Final total data:", totalDataArray);
      setTotalData(totalDataArray);

    } catch (error) {
      console.error("Critical error in processData:", error);
      setHasError(true);
      setErrorMessage("Критическая ошибка при обработке данных");
      message.error("Критическая ошибка при обработке данных");
      setTableData([]);
      setTotalData([]);
    }
  }, []);

  // Улучшенный useEffect для запросов данных
  useEffect(() => {
    console.log("Effect triggered:", { isLoading, error, from, to, isWarehouse });
    
    if (!isLoading && !error) {
      const timeoutId = setTimeout(() => {
        console.log("Triggering refetch...");
        refetch().catch((refetchError) => {
          console.error("Refetch error:", refetchError);
          setHasError(true);
          setErrorMessage("Ошибка при обновлении данных");
        });
      }, 100);
      
      return () => {
        console.log("Clearing timeout");
        clearTimeout(timeoutId);
      };
    }
  }, [isLoading, refetch, from, to, isWarehouse, error]);

  // Обработка полученных данных
  useEffect(() => {
    console.log("Data effect triggered:", { hasData: !!data?.data, hasError: !!error });
    
    if (data?.data && !error) {
      processData(data.data);
    } else if (error) {
      console.error("API Error in effect:", error);
      setHasError(true);
      setErrorMessage("Ошибка API при загрузке данных");
    }
  }, [data, processData, error]);

  // Показать ошибку если есть
  useEffect(() => {
    if (error) {
      console.error("API Error:", error);
      setHasError(true);
      setErrorMessage("Ошибка загрузки данных с сервера");
      message.error("Ошибка загрузки данных");
    }
  }, [error]);

  const prepareExportData = useCallback(() => {
    try {
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
          Город: item.region || "",
          Место: String(item.totalCount || ""),
          "Общий тоннаж, кг": String(item.totalWeight || ""),
          Пошив: String(item.sewing || ""),
          Брендированные: String(item.brand || ""),
          Маркировка: String(item.marking || ""),
          "К-привозные": String(item.imported || ""),
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
          Город: item.region || "",
          Место: String(item.totalCount || ""),
          "Общий тоннаж, кг": String(item.totalWeight || ""),
          Пошив: String(item.sewing || ""),
          Брендированные: String(item.brand || ""),
          Маркировка: String(item.marking || ""),
          "К-привозные": String(item.imported || ""),
        });
      });

      return exportData;
    } catch (error) {
      console.error("Error preparing export data:", error);
      throw error;
    }
  }, [tableData, totalData, formattedFrom, formattedTo]);

  // Export to XLSX
  const exportToXLSX = useCallback(() => {
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

      const fileName = `Отчет_по_принятым_грузам_${formattedFrom.replace(/[:\s]/g, '_')}_${formattedTo.replace(/[:\s]/g, '_')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан!");
    } catch (error) {
      console.error("Error exporting to XLSX:", error);
      message.error("Ошибка при экспорте в XLSX");
    }
  }, [prepareExportData, formattedFrom, formattedTo]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    try {
      const exportData = prepareExportData();
      const headers = Object.keys(exportData[0] || {});

      if (headers.length === 0) {
        throw new Error("No data to export");
      }

      let csvContent = headers.join(",") + "\n";

      exportData.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header];
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
        `Отчет_по_принятым_грузам_${formattedFrom.replace(/[:\s]/g, '_')}_${formattedTo.replace(/[:\s]/g, '_')}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      message.success("Файл CSV успешно скачан!");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      message.error("Ошибка при экспорте в CSV");
    }
  }, [prepareExportData, formattedFrom, formattedTo]);

  const isLoadingOrProcessing = isLoading || isProcessing;

  // Логируем состояние для отладки
  console.log("Current state:", {
    isLoading,
    isProcessing,
    isWarehouse,
    hasError,
    errorMessage,
    tableDataLength: tableData.length,
    totalDataLength: totalData.length,
  });

  return (
    <div>
      {/* Отладочная информация - удалить в продакшене */}
      <div style={{ 
        fontSize: '10px', 
        color: '#666', 
        marginBottom: '8px',
        padding: '4px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        Debug: Loading={isLoading ? 'true' : 'false'}, Processing={isProcessing ? 'true' : 'false'}, 
        Warehouse={isWarehouse ? 'true' : 'false'}, Error={hasError ? 'true' : 'false'}
      </div>

      <List
        title={
          <p style={{ fontSize: 15, lineHeight: "18px" }}>
            Отчет по принятым грузам
            <br /> от {formattedFrom} до {formattedTo}
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
              loading={isLoadingOrProcessing}
              disabled={tableData.length === 0 || hasError}
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
              loading={isLoadingOrProcessing}
              disabled={tableData.length === 0 || hasError}
            >
              CSV
            </Button>
            <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
              <div style={{ position: "relative" }}>
                <p style={{ position: "absolute", top: -20 }}>От:</p>
                <input
                  type="datetime-local"
                  value={from}
                  onChange={(e) => {
                    console.log("From date changed:", e.target.value);
                    setFrom(e.target.value);
                  }}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#4096ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#d9d9d9")}
                  disabled={isLoadingOrProcessing}
                />
              </div>

              <div style={{ position: "relative" }}>
                <p style={{ position: "absolute", top: -20 }}>До:</p>
                <input
                  type="datetime-local"
                  value={to}
                  onChange={(e) => {
                    console.log("To date changed:", e.target.value);
                    setTo(e.target.value);
                  }}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#4096ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#d9d9d9")}
                  disabled={isLoadingOrProcessing}
                />
              </div>

              <div
                style={{ display: "flex", alignItems: "center", height: "32px" }}
              >
                <Checkbox
                  checked={isWarehouse}
                  onChange={(e) => {
                    console.log("Checkbox change event:", e.target.checked);
                    handleWarehouseChange(e.target.checked);
                  }}
                  style={{ fontSize: "14px" }}
                  disabled={isLoadingOrProcessing}
                >
                  В складе
                </Checkbox>
              </div>
            </div>
          </Space>
        )}
      >
        {(error || hasError) && (
          <div style={{ 
            color: 'red', 
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '4px'
          }}>
            {errorMessage || "Ошибка загрузки данных. Попробуйте обновить страницу."}
          </div>
        )}
        
        <Table
          columns={columns.map((item: any, index: number) => {
            if (index === 0) return { ...item, title: "Всего Кыргызстан" };
            return item;
          })}
          dataSource={tableData}
          loading={isLoadingOrProcessing}
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
          locale={{
            emptyText: (error || hasError) ? 'Ошибка загрузки данных' : 'Нет данных',
          }}
          rowKey={(record, index) => `table1-${index}-${record.region}`}
        />
        
        <Divider />
        
        <Table
          columns={columns.map((item: any, index: number) => {
            if (index === 0) return { ...item, title: "Всего Россия" };
            return item;
          })}
          dataSource={totalData}
          loading={isLoadingOrProcessing}
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
          locale={{
            emptyText: (error || hasError) ? 'Ошибка загрузки данных' : 'Нет данных',
          }}
          rowKey={(record, index) => `table2-${index}-${record.region}`}
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
    </div>
  );
};