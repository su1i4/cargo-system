import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Button,
  Row,
  Col,
  message,
  Checkbox,
  Modal,
  Dropdown,
  Card,
  Select,
} from "antd";
import {
  FileOutlined,
  FileExcelOutlined,
  PlusOutlined,
  MinusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useDocumentTitle } from "@refinedev/react-router";
import { useSelect } from "@refinedev/antd";
import { API_URL } from "../../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import * as XLSX from "xlsx";

export interface Shipment {
  id: number;
  truck_number: string;
  driver: string;
  destination: string;
}

dayjs.extend(utc);
dayjs.extend(timezone);

export const WarehouseStockGoodsReport = () => {
  const setTitle = useDocumentTitle();

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

  const [data, setData] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [shipmentData, setShipmentData] = useState<Shipment | null>(null);
  const [showBags, setShowBags] = useState(false);
  const [showTagan, setShowTagan] = useState(false);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [sortField, setSortField] = useState<
    "id" | "created_at" | "sender.name" | "recipient.name" | "bag_number"
  >("recipient.name");
  const [sorterVisible, setSorterVisible] = useState(false);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
  });

  useEffect(() => {
    setTitle("Все товары");
  }, []);

  const [downloadLoading, setDownloadLoading] = useState(false);

  const getShipmentData = async () => {
    let url = `${API_URL}/report/reportGoodInFlight?shipment_id=${shipmentData?.id}`;

    const response = await fetch(url);
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    if (shipmentData) {
      getShipmentData().then((data) => {
        setData(data);
      });
    }
  }, [shipmentData]);

  const prepareExportData = () => {
    const dataSource = selectedCity
      ? sortedData.filter((item: any) => item.destination?.id === selectedCity)
      : sortedData;

    const exportData: any[] = [];
    let totalSum = 0;
    let totalBagSum = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let totalBagsCount = 0;
    let totalWeight = 0;

    dataSource.forEach((record: any, index: number) => {
      const taganSum =
        record.products
          ?.filter((item: any) => item.name.includes("Таганский рынок"))
          ?.reduce((acc: number, item: any) => acc + Number(item.sum), 0) || 0;

      const mainRow: any = {
        "№": index + 1,
        "Фио отправителя": record.sender?.name || "",
        "Фио получателя": record.recipient?.name || "",
        Город: record.destination?.name || "",
        "Номер получателя": record.recipient?.phoneNumber || "",
        "Номера мешков":
          record.services
            ?.map((item: any) => item.bag_number_numeric)
            .join(", ") || "",
        "Вес, кг": record.weight
          ? Number(record.weight).toFixed(2).toString().replace(".", ",")
          : "",
        "Кол-во мешков": record.services?.length || 0,
        Сумма: Number(record.amount || 0)
          .toFixed(2)
          .toString()
          .replace(".", ","),
        "Сумма за мешки": Number(record.avgProductPrice || 0)
          .toFixed(2)
          .toString()
          .replace(".", ","),
        Оплачено: Number(record.paid_sum || 0)
          .toFixed(2)
          .toString()
          .replace(".", ","),
        "Долг без Таганского рынка": (
          Number(record.amount || 0) - Number(record.paid_sum || 0)
        )
          .toFixed(2)
          .toString()
          .replace(".", ","),
        Статус: record.status || "",
      };

      if (showTagan) {
        mainRow["Сумма за Таганский рынок"] = Number(taganSum)
          .toFixed(2)
          .toString()
          .replace(".", ",");

        mainRow["Долг с Таганским рынком"] = (
          Number(record.amount || 0) -
          (Number(record.paid_sum || 0) + (taganSum || 0))
        )
          .toFixed(2)
          .toString()
          .replace(".", ",");
      }

      totalSum += Number(record.amount || 0);
      totalBagSum +=
        record.products?.reduce(
          (acc: number, item: any) => acc + Number(item.sum),
          0
        ) || 0;
      totalPaid += Number(record.paid_sum || 0);
      totalDebt += Number(record.amount || 0) - Number(record.paid_sum || 0);
      totalBagsCount += record.services?.length || 0;
      totalWeight += Number(record.weight || 0);

      exportData.push(mainRow);

      if (showBags && record.services && record.services.length > 0) {
        record.services.forEach((service: any) => {
          const serviceRow = {
            "№": "",
            "Фио отправителя": "",
            "Фио получателя": "",
            Город: "",
            "Номер получателя": "",
            "Номера мешков": service.bag_number_numeric || "",
            "Вес, кг": service.weight
              ? Number(service.weight).toFixed(2).toString().replace(".", ",")
              : "",
            "Кол-во мешков": 1,
            Сумма: Number(service.sum || 0)
              .toFixed(2)
              .toString()
              .replace(".", ","),
            "Сумма за мешки": 0,
            Оплачено: Number(service.paid_sum || 0)
              .toFixed(2)
              .toString()
              .replace(".", ","),
            Долг: (Number(service.sum || 0) - Number(service.paid_sum || 0))
              .toFixed(2)
              .toString()
              .replace(".", ","),
          };

          totalSum += service.sum || 0;
          totalBagsCount += 1;

          exportData.push(serviceRow);
        });
      }
    });

    const totalRow = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": totalWeight,
      "Кол-во мешков": totalBagsCount,
      Сумма: totalSum,
      "Сумма за мешки": totalBagSum,
      Оплачено: totalPaid,
      Долг: totalDebt,
      Статус: "",
    };

    const totalRow2 = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": "",
      "Кол-во мешков": "",
      Сумма: "",
      "Сумма за мешки": "",
      Оплачено: "",
      Долг: "",
      Статус: "",
    };

    const totalRow3 = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": "",
      "Кол-во мешков": "",
      Сумма: "",
      "Сумма за мешки": "",
      Оплачено: "",
      Долг: "",
      Статус: "",
    };

    const totalRow4 = {
      "№": "",
      "Фио отправителя": "",
      "Фио получателя": "",
      Город: "",
      "Номер получателя": "",
      "Номера мешков": "",
      "Вес, кг": "",
      "Кол-во мешков": "",
      Сумма: "",
      "Сумма за мешки": "",
      Оплачено: "",
      Долг: "",
      Статус: "",
    };

    exportData.push(totalRow, totalRow2, totalRow3, totalRow4);

    return exportData;
  };

  const downloadXLSX = async () => {
    try {
      setDownloadLoading(true);
      const exportData = prepareExportData();

      if (!exportData || exportData.length === 0) {
        message.warning("Нет данных для экспорта");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

      const colWidths: any[] = [];
      const headers = Object.keys(exportData[0] || {});

      headers.forEach((header, colIndex) => {
        let maxLength = header.length;
        exportData.forEach((row) => {
          const cellValue = String(row[header] || "");
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });
        colWidths.push({ wch: Math.min(Math.max(maxLength + 2, 10), 50) });
      });

      worksheet["!cols"] = colWidths;

      try {
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            if (!worksheet[cellAddress]) continue;

            if (typeof worksheet[cellAddress].v === "number") {
              worksheet[cellAddress].z = "#,##0.00";
            }
          }
        }
      } catch (styleError) {}

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет");

      const truckNumber =
        tableShipmentProps.dataSource?.find((item: any) => {
          return item.id === shipmentData?.id;
        })?.truck_number || "report";

      const fileName = `${
        shipmentData?.destination
      } #${truckNumber} ${driverName} от (${dayjs().format(
        "DD.MM.YYYY.HH-mm"
      )}).xlsx`;

      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан");
    } catch (error) {
      console.error("Ошибка при скачивании XLSX файла:", error);
      message.error("Ошибка при скачивании XLSX файла");
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const exportData = prepareExportData();

      if (!exportData || exportData.length === 0) {
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
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      const truckNumber =
        tableShipmentProps.dataSource?.find((item: any) => {
          return item.id === shipmentData?.id;
        })?.truck_number || "report";

      link.setAttribute(
        "download",
        `${
          shipmentData?.destination
        } #${truckNumber} ${driverName} от (${dayjs().format(
          "DD.MM.YYYY.HH-mm"
        )}).csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Файл CSV успешно скачан");
    } catch (error) {
      console.error("Ошибка при скачивании CSV файла:", error);
      message.error("Ошибка при скачивании CSV файла");
    }
  };

  const sortData = (data: any, sortField: any, sortDirection: any) => {
    if (!data || data.length === 0) return data;

    return [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "created_at":
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case "sender.name":
          aValue = a.sender?.name || "";
          bValue = b.sender?.name || "";
          break;
        case "recipient.name":
          aValue = a.recipient?.name || "";
          bValue = b.recipient?.name || "";
          break;
        case "bag_number":
          aValue =
            a.services
              ?.map((item: any) => item.bag_number_numeric)
              .join(", ") || "";
          bValue =
            b.services
              ?.map((item: any) => item.bag_number_numeric)
              .join(", ") || "";
          break;
        case "id":
        default:
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue, "ru", {
          numeric: true,
        });
        return sortDirection === "ASC" ? comparison : -comparison;
      }

      if (aValue < bValue) {
        return sortDirection === "ASC" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "ASC" ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedData = useMemo(() => {
    return sortData(data, sortField, sortDirection);
  }, [data, sortField, sortDirection]);

  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortDirection("ASC");
    }
    setSorterVisible(false);
  };

  const sortContent = (
    <Card style={{ width: 200, padding: "0px !important" }}>
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
            fontWeight: sortField === "created_at" ? "bold" : "normal",
          }}
          onClick={() => handleSort("created_at")}
        >
          Дате создания{" "}
          {sortField === "created_at" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "sender.name" ? "bold" : "normal",
          }}
          onClick={() => handleSort("sender.name")}
        >
          По фио отправителя{" "}
          {sortField === "sender.name" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "recipient.name" ? "bold" : "normal",
          }}
          onClick={() => handleSort("recipient.name")}
        >
          По фио получателя{" "}
          {sortField === "recipient.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "bag_number" ? "bold" : "normal",
          }}
          onClick={() => handleSort("bag_number")}
        >
          По номеру мешка{" "}
          {sortField === "bag_number" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  return (
    <List
      title="Отчет по задолженности представительств по рейсам"
      headerButtons={() => false}
    >
      <Modal
        title="Отчет по задолженности представительств по рейсам"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCity(null);
        }}
        footer={null}
        width={1800}
      >
        <Row
          gutter={[16, 16]}
          align="middle"
          style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
        >
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
            ></Button>
          </Dropdown>
          <Col>
            <Select
              placeholder="Выберите город"
              allowClear
              style={{ width: 200 }}
              value={selectedCity}
              onChange={(value) => setSelectedCity(value as number)}
              onClear={() => setSelectedCity(null)}
              options={branchSelectProps.options}
              loading={branchSelectProps.loading}
            />
          </Col>
          <Col>
            <Checkbox
              checked={showBags}
              onChange={(e) => setShowBags(e.target.checked)}
              style={{ marginRight: 8 }}
            >
              Показать мешки
            </Checkbox>
          </Col>
          <Col>
            <Checkbox
              checked={showTagan}
              onChange={(e) => setShowTagan(e.target.checked)}
              style={{ marginRight: 8 }}
            >
              Таганский рынок
            </Checkbox>
          </Col>
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
              onClick={downloadCSV}
            >
              CSV
            </Button>
          </Col>
        </Row>
        <Table
          size="small"
          dataSource={
            selectedCity
              ? sortedData.filter(
                  (item: any) => item.destination?.id === selectedCity
                )
              : sortedData
          }
          pagination={false}
          rowKey="id"
          scroll={{ x: 1000 }}
          expandable={
            showBags
              ? {
                  expandedRowRender: (record: any) => {
                    if (!record.services || record.services.length === 0) {
                      return (
                        <div style={{ padding: "10px", color: "#666" }}>
                          Нет информации о мешках
                        </div>
                      );
                    }

                    const columns = [
                      {
                        title: "№",
                        key: "index",
                        render: (_: any, __: any, index: number) => index + 1,
                        width: 50,
                      },
                      {
                        title: "Номер мешка",
                        dataIndex: "bag_number_numeric",
                        key: "bag_number_numeric",
                        width: 120,
                      },
                      {
                        title: "Вес, кг",
                        dataIndex: "weight",
                        key: "weight",
                        render: (value: any) =>
                          value
                            ? String(value).replace(".", ",").slice(0, 5)
                            : "",
                        width: 100,
                      },
                      {
                        title: "Сумма",
                        dataIndex: "sum",
                        key: "sum",
                        width: 100,
                      },
                      {
                        title: "Описание",
                        dataIndex: "description",
                        key: "description",
                        render: (value: any) => value || "-",
                      },
                    ];

                    return (
                      <Table
                        columns={columns}
                        dataSource={record.services}
                        pagination={false}
                        rowKey={(item: any) =>
                          `${record.id}-${item.bag_number_numeric}`
                        }
                        size="small"
                        style={{ margin: "10px 0" }}
                      />
                    );
                  },
                  expandIcon: ({ expanded, onExpand, record }: any) => (
                    <Button
                      type="text"
                      size="small"
                      icon={expanded ? <MinusOutlined /> : <PlusOutlined />}
                      onClick={(e) => onExpand(record, e)}
                    />
                  ),
                }
              : undefined
          }
        >
          <Table.Column
            title="№"
            width={50}
            render={(value, record, index) => index + 1}
          />
          <Table.Column
            dataIndex="sender"
            title="Фио отправителя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="recipient"
            title="Фио получателя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="recipient"
            title="Номер получателя"
            render={(value) => value?.phoneNumber}
          />
          <Table.Column
            dataIndex="destination"
            render={(value) => value?.name}
            title="Город"
          />
          <Table.Column
            dataIndex="services"
            title="Номера мешков"
            render={(value) =>
              value?.map((item: any) => item.bag_number_numeric).join(", ") ||
              ""
            }
            width={200}
          />
          <Table.Column
            dataIndex="weight"
            title="Вес, кг"
            render={(value) => String(value).replace(".", ",").slice(0, 5)}
          />
          <Table.Column
            dataIndex="services"
            title="Кол-во мешков"
            render={(value) => value?.length}
          />
          <Table.Column
            dataIndex="amount"
            title="Сумма"
            render={(value) => {
              return value;
            }}
          />
          <Table.Column
            dataIndex="avgProductPrice"
            title="Сумма за мешки"
            render={(value) => {
              return value.toFixed(2).toString().replace(".", ",");
            }}
          />
          {showTagan && (
            <Table.Column
              dataIndex="avgProductPrice"
              title="Сумма за Таганский рынок"
              render={(value, record) => {
                const taganSum =
                  record.products
                    ?.filter((item: any) =>
                      item.name.includes("Таганский рынок")
                    )
                    ?.reduce(
                      (acc: number, item: any) => acc + Number(item.sum),
                      0
                    ) || 0;
                return taganSum.toFixed(2).toString().replace(".", ",");
              }}
            />
          )}
          <Table.Column dataIndex="paid_sum" title="Оплачено" />

          <Table.Column
            dataIndex="id"
            title="Долг без Таганского рынка"
            render={(_, record) => {
              return (
                Number(record?.amount || 0) - Number(record?.paid_sum || 0)
              )
                .toFixed(2)
                .toString()
                .replace(".", ",");
            }}
          />

          {showTagan && (
            <Table.Column
              dataIndex="id"
              title="Долг с Таганским рынком"
              render={(_, record) => {
                const taganSum =
                  record.products
                    ?.filter((item: any) =>
                      item.name.includes("Таганский рынок")
                    )
                    ?.reduce(
                      (acc: number, item: any) => acc + Number(item.sum),
                      0
                    ) || 0;

                return (
                  Number(record?.amount) -
                  Number(Number(record?.paid_sum) + taganSum)
                )
                  .toFixed(2)
                  .toString()
                  .replace(".", ",");
              }}
            />
          )}
        </Table>
      </Modal>
      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              setShipmentData({
                id: record.id as number,
                truck_number: record.truck_number as string,
                driver: record.driver as string,
                destination: record.branch?.name as string,
              });
              setDriverName(record.driver);
              setModalVisible(true);
            },
          };
        }}
        {...tableShipmentProps}
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
          title="Вес (кг)"
          dataIndex="totalServiceWeight"
          render={(value) => value?.toFixed(2)}
        />
        <Table.Column
          width={50}
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column width={50} title="Водитель" dataIndex="driver" />
        <Table.Column width={50} title="Статус" dataIndex="status" />
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
