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
  totalWeight: number;
  totalCount: number;
  sewing: number; // Пошив
  brand: number; // Бренд
  imported: number; // К-Привозные
  marking: number; // Маркировка
  isGroupHeader: boolean;
}

const columns = [
  {
    title: "Город",
    dataIndex: "region",
    key: "region",
    width: 200,
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
    title: "Брендированные",
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

export const CargoReceivedReport = () => {
  const [tableData, setTableData] = useState<GroupedData[]>([]);

  const { data, isLoading } = useCustom<any>({
    url: `${API_URL}/report/reportOnReceivedCargo`,
    method: "get",
    config: {
      query: {
        pagination: false,
      },
    },
  });

  useEffect(() => {
    if (data?.data) {
      const grouped: GroupedData[] = [];

      const fromGroups = data.data.reduce((acc: any, item: any) => {
        if (!acc[item.from]) {
          acc[item.from] = [];
        }
        acc[item.from].push(item);
        return acc;
      }, {} as Record<string, CargoItem[]>);

      for (const [from, items] of Object.entries(fromGroups)) {
        const itemsT: any = items;
        const fromTotalCount = itemsT.reduce(
          (sum: any, i: any) => sum + i.totalCount,
          0
        );
        const fromTotalWeight = itemsT.reduce(
          (sum: any, i: any) => sum + i.totalWeight,
          0
        );
        const fromSewing = itemsT.reduce(
          (sum: any, i: any) => sum + (i.productTypes["Пошив"] || 0),
          0
        );
        const fromImported = itemsT.reduce(
          (sum: any, i: any) => sum + (i.productTypes["К-Привозные"] || 0),
          0
        );
        const fromBrand = itemsT.reduce(
          (sum: any, i: any) => sum + (i.productTypes["Брендированные"] || 0),
          0
        );
        const fromMarking = itemsT.reduce(
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
    }
  }, [data]);

  console.log(tableData, "thsi is console.l");

  return (
    <List
      title="Отчет по принятым грузам"
      headerButtons={() => (
        <Space>
          {/* <Button
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
          </Button> */}
        </Space>
      )}
    >
      <Table
        columns={columns}
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
