import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Button,
  Row,
  Col,
  Card,
  Select,
  message,
  Checkbox,
  Modal,
} from "antd";
import {
  FileOutlined,
  FileExcelOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom } from "@refinedev/core";
import { useDocumentTitle } from "@refinedev/react-router";
import { API_URL } from "../../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import * as XLSX from "xlsx";

dayjs.extend(utc);
dayjs.extend(timezone);

export const WarehouseStockGoodsReport = () => {
  const setTitle = useDocumentTitle();

  const { tableProps: tableShipmentProps } = useTable({
    resource: "shipments",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
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
  const [shipmentId, setShipmentId] = useState<number | null>(null);

  useEffect(() => {
    setTitle("Все товары");
  }, []);

  const [showBags, setShowBags] = useState(false);

  const [downloadLoading, setDownloadLoading] = useState(false);

  const getShipmentData = async () => {
    const response = await fetch(
      `${API_URL}/report/reportGoodInFlight?shipment_id=${shipmentId}`
    );
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    if (shipmentId) {
      getShipmentData().then((data) => {
        setData(data);
      });
    }
  }, [shipmentId]);

  const prepareExportData = () => {
    const dataSource = data || [];
    const exportData: any[] = [];

    dataSource.forEach((record: any, index: number) => {
      const mainRow = {
        "№": index + 1,
        "Дата приемки": record.created_at
          ? dayjs(record.created_at).utc().format("DD.MM.YYYY HH:mm")
          : "",
        "Дата отправки": record.created_at
          ? dayjs(record.created_at).utc().format("DD.MM.YYYY HH:mm")
          : "",
        "Дата получения": record.created_at
          ? dayjs(record.created_at).utc().format("DD.MM.YYYY HH:mm")
          : "",
        "Дата выдачи": (() => {
          const issuedStatus = Array.isArray(record.tracking_status)
            ? record.tracking_status.find(
                (item: any) => item.status === "Выдали"
              )
            : null;
          return issuedStatus?.createdAt
            ? dayjs(issuedStatus.createdAt).utc().format("DD.MM.YYYY HH:mm")
            : "";
        })(),
        "Номер машины": record.truck_number || "",
        "№ накладной": record.invoice_number || "",
        "Код отправителя": record.sender
          ? `${record.sender.clientPrefix}-${record.sender.clientCode}`
          : "",
        "Фио отправителя": record.sender?.name || "",
        "Код получателя": record.recipient
          ? `${record.recipient.clientPrefix}-${record.recipient.clientCode}`
          : "",
        "Фио получателя": record.recipient?.name || "",
        "Номер получателя": record.recipient?.phoneNumber || "",
        "Город (с досыслом если есть)": record.destination?.name || "",
        "Номер мешков":
          record.services
            ?.map((item: any) => item.bag_number_numeric)
            .join(", ") || "",
        "Вес, кг": record.totalServiceWeight
          ? String(record.totalServiceWeight).replace(".", ",").slice(0, 5)
          : "",
        "Кол-во мешков": record.services?.length || 0,
        Сумма: record.totalServiceAmountSum || 0,
        "Сумма за мешки": record.totalProductAmountSum || 0,
        Оплачено: record.paid_sum || 0,
        Долг:
          Number(record.totalServiceAmountSum || 0) +
          Number(record.totalProductAmountSum || 0) -
          Number(record.paid_sum || 0),
        "Тип строки": "Основная",
      };

      exportData.push(mainRow);

      if (showBags && record.services && record.services.length > 0) {
        record.services.forEach((service: any, serviceIndex: number) => {
          const serviceRow = {
            "№": `${index + 1}.${serviceIndex + 1}`,
            "Дата приемки": "",
            "Дата отправки": "",
            "Дата получения": "",
            "Дата выдачи": "",
            "Номер машины": "",
            "№ накладной": "",
            "Код отправителя": "",
            "Фио отправителя": "",
            "Код получателя": "",
            "Фио получателя": "",
            "Номер получателя": "",
            "Город (с досыслом если есть)": "",
            "Номер мешков": service.bag_number_numeric || "",
            "Вес, кг": service.weight
              ? String(service.weight).replace(".", ",").slice(0, 5)
              : "",
            "Кол-во мешков": 1,
            Сумма: service.sum || 0,
            "Сумма за мешки": 0,
            Оплачено: 0,
            Долг: 0,
            "Тип строки": "Детали мешка",
          };
          exportData.push(serviceRow);
        });
      }
    });

    return exportData;
  };

  const downloadXLSX = async () => {
    try {
      setDownloadLoading(true);
      const exportData = prepareExportData();

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет");

      const fileName = `отчет_задолженность_${dayjs().format(
        "DD-MM-YYYY_HH-mm"
      )}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success("Файл XLSX успешно скачан");
    } catch (error) {
      message.error("Ошибка при скачивании XLSX файла");
      console.error("XLSX download error:", error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const exportData = prepareExportData();

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
      link.setAttribute(
        "download",
        `отчет_задолженность_${dayjs().format("DD-MM-YYYY_HH-mm")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Файл CSV успешно скачан");
    } catch (error) {
      message.error("Ошибка при скачивании CSV файла");
      console.error("CSV download error:", error);
    }
  };

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
        }}
        footer={null}
        width={1800}
      >
        <Row
          gutter={[16, 16]}
          align="middle"
          style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
        >
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
          dataSource={data}
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
            render={(_: any, __: any, index: number) => {
              return index + 1;
            }}
          />
          <Table.Column
            dataIndex="created_at"
            title="Дата приемки"
            render={(value) =>
              value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
            }
          />
          <Table.Column
            dataIndex="created_at"
            title="Дата отправки"
            render={(value) =>
              value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
            }
          />
          <Table.Column
            dataIndex="created_at"
            title="Дата получения"
            render={(value) =>
              value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
            }
          />
          <Table.Column
            dataIndex="tracking_status"
            title="Дата выдачи"
            render={(value) => {
              const issuedStatus = Array.isArray(value)
                ? value.find((item: any) => item.status === "Выдали")
                : null;

              return issuedStatus?.createdAt
                ? dayjs(issuedStatus.createdAt).utc().format("DD.MM.YYYY HH:mm")
                : "";
            }}
          />

          <Table.Column dataIndex="truck_number" title="Номер машины" />
          <Table.Column dataIndex="invoice_number" title="№ накладной" />
          <Table.Column
            dataIndex="sender"
            title="Код отправителя"
            render={(value) => {
              return value?.clientPrefix + "-" + value?.clientCode;
            }}
          />
          <Table.Column
            dataIndex="sender"
            title="Фио отправителя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="recipient"
            title="Код получателя"
            render={(value) => {
              return value?.clientPrefix + "-" + value?.clientCode;
            }}
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
            title="Город (с досыслом если есть)"
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
            render={(value, record) => {
              return (
                value -
                record?.products?.reduce(
                  (acc: number, item: any) => acc + Number(item.sum),
                  0
                )
              );
            }}
          />
          <Table.Column
            dataIndex="products"
            title="Сумма за мешки"
            render={(value) =>
              value?.reduce(
                (acc: number, item: any) => acc + Number(item.sum),
                0
              )
            }
          />
          <Table.Column dataIndex="paid_sum" title="Оплачено" />
          <Table.Column
            dataIndex="id"
            title="Долг"
            render={(_, record) =>
              `${Number(record?.amount) + Number(record?.paid_sum)}`
            }
          />
        </Table>
      </Modal>
      {/* <Row gutter={[16, 16]} style={{ marginBottom: 10, gap: 10 }}>
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
              // onClick={handleSortClick}
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
      </Row> */}
      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              setShipmentId(record.id as number);
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
        />
        <Table.Column
          width={50}
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column width={50} title="Водитель" dataIndex="driver" />
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
