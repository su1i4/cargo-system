import { useState, useMemo } from "react";
import {
  ArrowDownOutlined,
  SearchOutlined,
  FileExcelOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { ArrowUpOutlined } from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import {
  Button,
  Dropdown,
  Flex,
  Input,
  Menu,
  Modal,
  Row,
  Table,
  Space,
} from "antd";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

export const ShipmentReport = () => {
  // Main shipments table state
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("created_at");

  // Services modal state
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Services table separate state
  const [servicesSortDirection, setServicesSortDirection] = useState<
    "ASC" | "DESC"
  >("DESC");
  const [servicesSearchValue, setServicesSearchValue] = useState("");
  const [servicesSortField, setServicesSortField] = useState("created_at");

  const { tableProps, setSorters, setFilters } = useTable({
    resource: "shipments",
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    syncWithLocation: false,
    pagination: {
      pageSize: 100,
    },
  });

  const {
    tableProps: servicesTableProps,
    setSorters: setServicesSorters,
    setFilters: setServicesFilters,
  } = useTable({
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
          value: selectedShipment?.id || 0,
        },
        {
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
    pagination: {
      pageSize: 1000,
    },
  });

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

  // Services table handlers
  const handleServicesSort = (field: string, direction: "ASC" | "DESC") => {
    setServicesSortField(field);
    setServicesSortDirection(direction);
    setServicesSorters([
      {
        field,
        order: direction.toLowerCase() as "asc" | "desc",
      },
    ]);
  };

  // Мемоизированные отсортированные данные для таблицы услуг
  const sortedServicesData = useMemo(() => {
    const data = servicesTableProps.dataSource || [];
    
    if (servicesSortField === "bag_number") {
      return [...data].sort((a: any, b: any) => {
        const aValue = a.bag_number ? a.bag_number.split("|")[1] || "" : "";
        const bValue = b.bag_number ? b.bag_number.split("|")[1] || "" : "";
        const result = aValue.localeCompare(bValue);
        return servicesSortDirection === "ASC" ? result : -result;
      });
    }
    
    return data;
  }, [servicesTableProps.dataSource, servicesSortField, servicesSortDirection]);

  const handleServicesSearch = (value: string) => {
    setServicesSearchValue(value);

    const permanentFilters = [
      {
        field: "shipment_id",
        operator: "eq",
        value: selectedShipment?.id || 0,
      },
      {
        field: "status",
        operator: "eq",
        value: "В пути",
      },
    ];

    if (value.trim() === "") {
      setServicesFilters([], "replace");
    } else {
      setServicesFilters(
        [
          {
            operator: "or",
            value: [
              {
                field: "bag_number",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "good.sender.name",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "good.recipient.name",
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

  const handleShipmentSelect = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
    // Reset services search and sort when opening modal
    setServicesSearchValue("");
    setServicesSortField("created_at");
    setServicesSortDirection("DESC");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedShipment(null);
    // Reset services search and sort when closing modal
    setServicesSearchValue("");
    setServicesSortField("created_at");
    setServicesSortDirection("DESC");
  };

  const prepareExportData = () => {
    const services = servicesTableProps.dataSource || [];
    return services.map((service: any, index: number) => ({
      "№": index + 1,
      "Дата приемки": dayjs(service.good?.created_at)
        .utc()
        .format("DD.MM.YYYY HH:mm"),
      Отправитель: `${service.good?.sender?.clientPrefix}-${service.good?.sender?.clientCode} ${service.good?.sender?.name}`,
      "Номер мешка": service.bag_number || "",
      Получатель: `${service.good?.recipient?.clientPrefix}-${service.good?.recipient?.clientCode} ${service.good?.recipient?.name}`,
      Количество: service.quantity || "",
      Вес: service.weight
        ? String(service.weight).replace(".", ",").slice(0, 5)
        : "",
      Статус: service.status || "",
      "Пункт назначения": service.good?.destination?.name || "",
      Штрихкод: service.barcode || "",
    }));
  };

  const exportToXLSX = () => {
    setIsLoading(true);
    try {
      const data = prepareExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Услуги");

      const fileName = `shipment_${
        selectedShipment?.truck_number || "report"
      }_${dayjs().format("DD-MM-YYYY")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Ошибка экспорта XLSX:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    setIsLoading(true);
    try {
      const data = prepareExportData();
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(";"),
        ...data.map((row) =>
          //@ts-ignore
          headers.map((header) => `"${row[header] || ""}"`).join(";")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `shipment_${
          selectedShipment?.truck_number || "report"
        }_${dayjs().format("DD-MM-YYYY")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Ошибка экспорта CSV:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Main shipments sort fields
  const sortFields = [
    { key: "created_at", label: "Дата отправки" },
    { key: "truck_number", label: "Номер рейса" },
  ];

  // Services sort fields
  const servicesSortFields = [
    { key: "created_at", label: "Дата приемки" },
    { key: "bag_number", label: "Номер мешка" },
    { key: "quantity", label: "Количество" },
    { key: "weight", label: "Вес" },
  ];

  const getSortFieldLabel = () => {
    const field = sortFields.find((f) => f.key === sortField);
    return field ? field.label : "Дата отправки";
  };

  const getServicesSortFieldLabel = () => {
    const field = servicesSortFields.find((f) => f.key === servicesSortField);
    return field ? field.label : "Дата приемки";
  };

  // Main shipments sort menu
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

  // Services sort menu
  const servicesSortMenu = (
    <Menu>
      {servicesSortFields.map((field) => (
        <Menu.SubMenu key={field.key} title={field.label}>
          <Menu.Item
            key={`${field.key}-asc`}
            onClick={() => handleServicesSort(field.key, "ASC")}
          >
            <ArrowUpOutlined /> По возрастанию
          </Menu.Item>
          <Menu.Item
            key={`${field.key}-desc`}
            onClick={() => handleServicesSort(field.key, "DESC")}
          >
            <ArrowDownOutlined /> По убыванию
          </Menu.Item>
        </Menu.SubMenu>
      ))}
    </Menu>
  );

  const modalTitle = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "97%",
      }}
    >
      <span>
        Услуги рейса {selectedShipment?.truck_number}
        {selectedShipment?.created_at && (
          <span
            style={{
              fontSize: "14px",
              fontWeight: "normal",
              marginLeft: "8px",
            }}
          >
            (
            {dayjs(selectedShipment.created_at)
              .utc()
              .format("DD.MM.YYYY HH:mm")}
            )
          </span>
        )}
      </span>
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
      </Space>
    </div>
  );

  return (
    <List title="Отчеты по получению" headerButtons={() => false}>
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={handleModalClose}
        width={1300}
        footer={null}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 10, gap: 10 }}>
          <Flex style={{ width: "100%", padding: "0px 10px" }} gap={10}>
            <Dropdown overlay={servicesSortMenu} trigger={["click"]}>
              <Button
                icon={
                  servicesSortDirection === "ASC" ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )
                }
              >
                {getServicesSortFieldLabel()}
              </Button>
            </Dropdown>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Поиск по номеру мешка, отправителю, получателю"
              value={servicesSearchValue}
              onChange={(e) => handleServicesSearch(e.target.value)}
              allowClear
              style={{ width: "50%" }}
            />
          </Flex>
        </Row>
        <Table 
          {...servicesTableProps} 
          dataSource={sortedServicesData}
          rowKey="id" 
          scroll={{ x: true }}
        >
          <Table.Column
            title="№"
            dataIndex="number"
            width={50}
            render={(value, record, index) => index + 1}
          />
          <Table.Column
            title="Дата приемки"
            dataIndex="good"
            width={150}
            render={(value) =>
              dayjs(value?.created_at).utc().format("DD.MM.YYYY HH:mm")
            }
          />
          <Table.Column
            title="Отправитель"
            dataIndex="good"
            width={200}
            render={(value) =>
              `${value?.sender?.clientPrefix}-${value?.sender?.clientCode} ${value?.sender?.name}`
            }
          />
          <Table.Column
            title="Номер мешка"
            dataIndex="bag_number"
            width={120}
            render={(value) => value.split("|")[1]}
          />
          <Table.Column
            title="Получатель"
            dataIndex="good"
            width={200}
            render={(value) =>
              `${value?.recipient?.clientPrefix}-${value?.recipient?.clientCode} ${value?.recipient?.name}`
            }
          />
          <Table.Column title="Количество" dataIndex="quantity" width={100} />
          <Table.Column
            title="Вес"
            dataIndex="weight"
            width={100}
            render={(value) => String(value).replace(".", ",").slice(0, 5)}
          />
          <Table.Column title="Статус" dataIndex="status" width={100} />
          <Table.Column
            title="Пункт назначения"
            dataIndex="good"
            width={150}
            render={(value) => value?.destination?.name}
          />
          <Table.Column title="Штрихкод" dataIndex="barcode" width={150} />
        </Table>
      </Modal>

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
            style={{ width: "50%" }}
          />
        </Flex>
      </Row>

      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              handleShipmentSelect(record);
            },
          };
        }}
        {...tableProps}
        rowKey="id"
      >
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
