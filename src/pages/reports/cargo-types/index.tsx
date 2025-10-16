import { useEffect, useState } from "react";
import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Button,
  Space,
  Row,
  Flex,
  Dropdown,
  Input,
  Menu,
  Radio,
  Divider,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  FileExcelOutlined,
  FileOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bishkek");

interface GroupedNomenclature {
  id: number;
  name: string;
  quantity: number;
  count: number;
  totalWeight: number;
}

export const CargoTypesReport = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [selectedKey, setSelectedKey] = useState(0);
  const [nomenclatures, setNomenclatures] = useState<GroupedNomenclature[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>([]);

  const { tableProps, setSorters, setFilters } = useTable({
    resource: "shipments",
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    syncWithLocation: false,
    pagination: {
      pageSize: 10,
    },
  });

  const { tableProps: serviceTableProps } = useTable({
    resource: "service",
    syncWithLocation: false,
    initialSorter: [
      {
        field: "id",
        order: "desc",
      },
    ],
    filters: {
      permanent: [
        {
          field: "shipment_id",
          operator: "eq",
          value: Number(selectedKey),
        },
      ],
    },
    pagination: {
      mode: "off",
    },
  });

  useEffect(() => {
    if (selectedKey > 0) {
    }
  }, [selectedKey]);

  const handleSearch = (value: string) => {
    setSearchValue(value);

    if (value.trim() === "") {
      setFilters([], "replace");
    } else {
      setFilters(
        [
          {
            operator: "or",
            value: [
              {
                field: "truck_number",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "employee.firstName",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "employee.lastName",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "branch.name",
                operator: "contains",
                value: value.trim(),
              },
            ],
          },
        ],
        "replace"
      );
    }
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
          String(index + 1),
          `"${item.name}"`,
          String(item.quantity),
          String(item.totalWeight),
          String(item.count),
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
      `отчет-упаковочный лист номер рейса-${
        selectedShipment?.truck_number
      }-${dayjs().format("DD-MM-YYYY")}.csv`
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
          String(index + 1),
          item.name,
          String(item.quantity),
          String(item.totalWeight),
          String(item.count),
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Настройка ширины колонок
      const columnWidths = [
        { wch: 50 }, // Наименование
        { wch: 15 }, // Количество
        { wch: 15 }, // Вес
        { wch: 25 }, // Количество мест
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Номенклатуры");

      const fileName = `отчет-упаковочный лист номер рейса-${
        selectedShipment?.truck_number
      }-${dayjs().format("DD-MM-YYYY")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("XLSX файл скачан успешно");
    } catch (error) {
      console.error("Ошибка при создании XLSX файла:", error);
      message.error("Ошибка при скачивании XLSX файла");
    }
  };

  const sortFields = [
    { key: "created_at", label: "Дата отправки" },
    { key: "truck_number", label: "Номер рейса" },
  ];

  const getSortFieldLabel = () => {
    const field = sortFields.find((f) => f.key === sortField);
    return field ? field.label : "Дата отправки";
  };

  const handleSort = (field: string, direction: "ASC" | "DESC") => {
    setSortField(field);
    setSortDirection(direction);
    setSorters([
      {
        field,
        order: direction.toLowerCase() as "asc" | "desc",
      },
    ]);
  };

  const sortMenu = (
    <Menu>
      {sortFields.map((field) => (
        <Menu.SubMenu key={field.key} title={field.label}>
          <Menu.Item
            key={`${field.key}-asc`}
            onClick={() => handleSort(field.key, "ASC")}
          >
            <ArrowUpOutlined /> По возрастанию
          </Menu.Item>
          <Menu.Item
            key={`${field.key}-desc`}
            onClick={() => handleSort(field.key, "DESC")}
          >
            <ArrowDownOutlined /> По убыванию
          </Menu.Item>
        </Menu.SubMenu>
      ))}
    </Menu>
  );

  const services = serviceTableProps?.dataSource;

  useEffect(() => {
    if (services) {
      const nomenclatureMap = new Map<string, GroupedNomenclature>();

      services.forEach((item: any) => {
        const id = item.nomenclature.id;
        const name = item.nomenclature.name;
        const quantity = item.quantity;
        const weight = Number(item.weight);

        if (nomenclatureMap.has(id)) {
          const existing = nomenclatureMap.get(id)!;
          existing.count += 1;
          existing.quantity += quantity;
          existing.totalWeight += weight;
        } else {
          nomenclatureMap.set(id, {
            id,
            name,
            quantity,
            count: 1,
            totalWeight: weight,
          });
        }
      });

      const nomenclature: GroupedNomenclature[] = Array.from(
        nomenclatureMap.values()
      );

      setNomenclatures(nomenclature);
    }
  }, [services]);

  return (
    <List
      title="Отчет по упаковочному листу"
      headerButtons={() => {
        return (
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
      <Table loading={false} dataSource={nomenclatures} pagination={false}>
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
        <Table.Column dataIndex="quantity" title="Количество" />
        <Table.Column dataIndex="totalWeight" title="Вес" />
        <Table.Column
          dataIndex="count"
          title="Количество мест, коробки, мешки"
        />
      </Table>
      <Divider />
      <Row gutter={[16, 16]} style={{ marginBottom: 10, gap: 10 }}>
        <Flex style={{ width: "100%", padding: "0px 10px" }} gap={10}>
          <Dropdown overlay={sortMenu} trigger={["click"]}>
            <Button
              icon={
                sortDirection === "ASC" ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
            >
              {getSortFieldLabel()}
            </Button>
          </Dropdown>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Поиск по номеру рейса, сотруднику, пункту назначения..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </Flex>
      </Row>
      <Table
        onRow={(record) => {
          return {
            onClick: () => {
              setSelectedKey(record.id as number);
              setSelectedShipment(record as any);
            },
          };
        }}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          title=""
          dataIndex="id"
          render={(value) => (
            <Radio type="radio" checked={selectedKey === value} />
          )}
          width={10}
        />
        <Table.Column
          width={10}
          title="№"
          dataIndex="number"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          title="Дата отправки"
          dataIndex="created_at"
          width={50}
          render={(value) => dayjs(value).utc().format("DD.MM.YYYY HH:mm")}
        />
        <Table.Column width={50} title="Номер рейса" dataIndex="truck_number" />
        <Table.Column width={50} title="Водитель" dataIndex="driver" />
        <Table.Column
          width={50}
          title="Пункт погрузки"
          dataIndex="employee"
          render={(value) => value?.branch?.name}
        />
        <Table.Column
          width={50}
          title="Количество мест"
          dataIndex="totalService"
        />
        <Table.Column
          width={50}
          title="Вес"
          dataIndex="totalServiceWeight"
          render={(value) => String(value).replace(".", ",").slice(0, 5)}
        />
        <Table.Column
          width={50}
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column
          width={50}
          title="Сотрудник"
          dataIndex="employee"
          render={(value) => `${value?.firstName} ${value?.lastName}`}
        />
        <Table.Column width={50} title="Статус" dataIndex="status" />
      </Table>
    </List>
  );
};
