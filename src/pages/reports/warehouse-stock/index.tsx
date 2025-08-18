import { useEffect, useState } from "react";
import { useApiUrl, useCustom } from "@refinedev/core";
import { List, useSelect } from "@refinedev/antd";
import { Table, Button, Space, message, Select } from "antd";
import { FileExcelOutlined, FileOutlined, SearchOutlined } from "@ant-design/icons";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bishkek");

interface WarehouseReportItem {
  id: number;
  name: string;
  totalQuantity: number;
  packageCount: number;
  totalWeight: number;
}

export const WarehouseStockReport = () => {
  const [nomenclatures, setNomenclatures] = useState<WarehouseReportItem[]>([]);
  const apiUrl = useApiUrl();

  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [shouldFetch, setShouldFetch] = useState(true); // Первоначальная загрузка
  const [currentUrl, setCurrentUrl] = useState("");

  // Формируем URL с параметрами branch_ids
  const buildUrl = () => {
    const baseUrl = `${apiUrl}/report/reportInWarehouse`;
    if (branchIds.length > 0) {
      const params = branchIds.map(id => `branch_ids=${id}`).join('&');
      return `${baseUrl}?${params}`;
    }
    return baseUrl;
  };

  const { data, isLoading, refetch } = useCustom<WarehouseReportItem[]>({
    url: currentUrl,
    method: "get",
    queryOptions: {
      enabled: shouldFetch && currentUrl !== "", // Запрос выполняется только при shouldFetch = true и наличии URL
    },
  });

  // Инициализация первоначального запроса
  useEffect(() => {
    const initialUrl = buildUrl();
    setCurrentUrl(initialUrl);
  }, []); // Выполняется только при монтировании компонента

  useEffect(() => {
    if (data?.data) {
      setNomenclatures(data.data);
    }
  }, [data]);

  // Сбрасываем shouldFetch после выполнения запроса
  useEffect(() => {
    if (shouldFetch && !isLoading) {
      setShouldFetch(false);
    }
  }, [shouldFetch, isLoading]);

  // Функция для применения фильтров и выполнения запроса
  const handleApplyFilters = () => {
    const url = buildUrl();
    setCurrentUrl(url);
    setShouldFetch(true);
  };

  // Функция для скачивания CSV
  const downloadCSV = () => {
    if (nomenclatures.length === 0) {
      message.warning("Нет данных для экспорта");
      return;
    }

    const headers = [
      "№",
      "Наименование товара, артикул, состав, размер",
      "Количество",
      "Вес",
      "Количество мест, коробки, мешки",
    ];

    const csvContent = [
      headers.join(";"),
      ...nomenclatures.map((item, index) =>
        [
          `${index + 1}`,
          `"${item.name}"`,
          item.totalQuantity,
          item.totalWeight,
          item.packageCount,
        ].join(";")
      ),
    ].join("\n");

    const BOM = "\uFEFF"; // Для корректного отображения кириллицы
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `отчет-товары-на-складе-${dayjs().format("DD-MM-YYYY")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("CSV файл скачан успешно");
  };

  // Функция для скачивания XLSX
  const downloadXLSX = async () => {
    if (nomenclatures.length === 0) {
      message.warning("Нет данных для экспорта");
      return;
    }

    try {
      // Динамический импорт библиотеки xlsx
      const XLSX = await import("xlsx");

      const workbook = XLSX.utils.book_new();

      // Подготовка данных для Excel
      const worksheetData = [
        [
          "№",
          "Наименование товара, артикул, состав, размер",
          "Количество",
          "Вес",
          "Количество мест, коробки, мешки",
        ],
        ...nomenclatures.map((item, index) => [
          index + 1,
          item.name,
          item.totalQuantity,
          item.totalWeight,
          item.packageCount,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Настройка ширины колонок
      const columnWidths = [
        { wch: 5 },  // №
        { wch: 50 }, // Наименование
        { wch: 15 }, // Количество
        { wch: 15 }, // Вес
        { wch: 25 }, // Количество мест
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Номенклатуры на складе"
      );

      const fileName = `отчет-товары-на-складе-${dayjs().format(
        "DD-MM-YYYY"
      )}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("XLSX файл скачан успешно");
    } catch (error) {
      console.error("Ошибка при создании XLSX файла:", error);
      message.error("Ошибка при скачивании XLSX файла");
    }
  };

  const { selectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <List
      title="Отчет по упаковочным листам со статусом 'В складе'"
      headerButtons={() => {
        return (
          <Space>
            <Select
              mode="multiple"
              placeholder="Выберите пункты назначения"
              {...selectProps}
              onChange={(value) => {
                setBranchIds(value as unknown as number[]);
              }}
              style={{
                width: 300,
              }}
              allowClear
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleApplyFilters}
              loading={isLoading}
            >
              Применить
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              type="primary"
              ghost
              style={{
                backgroundColor: "white",
                borderColor: "#28a745",
                color: "#28a745",
              }}
              onClick={downloadXLSX}
              loading={false}
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
        );
      }}
    >
      <Table loading={isLoading} dataSource={nomenclatures} pagination={false}>
        <Table.Column
          width={10}
          title="№"
          dataIndex="number"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          dataIndex="name"
          title="Наименование товара, артикул, состав, размер"
        />
        <Table.Column dataIndex="totalQuantity" title="Общ количество" />
        <Table.Column
          dataIndex="totalWeight"
          title="Общ вес"
          render={(value) => `${value} кг`}
        />
        <Table.Column
          dataIndex="packageCount"
          title="Количество мест, коробки, мешки"
        />
      </Table>
    </List>
  );
};