import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Button,
  Row,
  Col,
  message,
} from "antd";
import {
  FileOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useDocumentTitle } from "@refinedev/react-router";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import * as XLSX from "xlsx";

dayjs.extend(utc);
dayjs.extend(timezone);

export const KudaList = () => {
  const setTitle = useDocumentTitle();
  const [downloadLoading, setDownloadLoading] = useState(false);

  const { tableProps: tableShipmentProps } = useTable({
    resource: "shipments",
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    syncWithLocation: false,
    pagination: {
      pageSize: 1000,
    },
  });

  // Преобразование данных для экспорта
  const prepareData = () => {
    return (tableShipmentProps?.dataSource || []).map((item: any, index: number) => ({
      "№": String(index + 1),
      "Номер рейса": item.truck_number || "",
      "Пункт направления": item.branch?.name || "",
      "Водитель": item.driver || "",
      "Дата отправки": dayjs(item.created_at).utc().format("DD.MM.YYYY HH:mm"),
      "Вес (кг)": item.totalServiceWeight ? String(item.totalServiceWeight.toFixed(2)) : "0",
      "Сумма рейса (руб)": String((item.services || []).reduce((acc: number, s: any) => acc + Number(s.sum || 0), 0)),
      "Расходы рейса": "", // Можешь заполнить если есть данные
      "Прибыль рейса": "",
      "Фрахт": "",
      "Проход КЗ": "",
      "Проход РФ": "",
    }));
  };

  // Скачать XLSX
  const downloadXLSX = () => {
    setDownloadLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(prepareData());
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Отчет");
      XLSX.writeFile(wb, `Отчет_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    } catch (err) {
      message.error("Ошибка при генерации XLSX");
    }
    setDownloadLoading(false);
  };

  // Скачать CSV
  const downloadCSV = () => {
    setDownloadLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(prepareData());
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Отчет_${dayjs().format("YYYY-MM-DD")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      message.error("Ошибка при генерации CSV");
    }
    setDownloadLoading(false);
  };

  return (
    <List title="Отчет по рейсам" headerButtons={() => false}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}>
        <Col>
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
        </Col>
        <Col>
          <Button
            icon={<FileOutlined />}
            type="primary"
            ghost
            style={{
              backgroundColor: "white",
              borderColor: "#17a2b8",
              color: "#17a2b8",
            }}
            loading={downloadLoading}
            onClick={downloadCSV}
          >
            CSV
          </Button>
        </Col>
      </Row>

      <Table {...tableShipmentProps} rowKey="id">
        <Table.Column width={10} title="№" render={(_, __, index) => index + 1} />
        <Table.Column width={50} title="Номер рейса" dataIndex="truck_number" />
        <Table.Column width={50} title="Пункт направления" dataIndex="branch" render={(value) => value?.name} />
        <Table.Column width={50} title="Водитель" dataIndex="driver" />
        <Table.Column
          title="Дата отправки"
          dataIndex="created_at"
          width={50}
          render={(value) => dayjs(value).utc().format("DD.MM.YYYY HH:mm")}
        />
        <Table.Column width={50} title="Вес (кг)" dataIndex="totalServiceWeight" render={(value) => value?.toFixed(2)} />
        <Table.Column
          width={50}
          title="Сумма рейса (руб)"
          dataIndex="services"
          render={(value) => value?.reduce((acc: number, item: any) => acc + Number(item.sum), 0)}
        />
        <Table.Column width={50} title="Расходы рейса" />
        <Table.Column width={50} title="Прибыль рейса" />
        <Table.Column width={50} title="Фрахт" />
        <Table.Column width={50} title="Проход КЗ" />
        <Table.Column width={50} title="Проход РФ" />
      </Table>
    </List>
  );
};
