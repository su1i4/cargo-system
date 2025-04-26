import React, { useState, useEffect } from "react";
import { List, useTable } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  Dropdown,
  Select,
  Card,
  Image,
  DatePicker,
  message,
} from "antd";
import { useCustom, useNavigation } from "@refinedev/core";
import {
  FileAddOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownloadOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  FileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { API_URL } from "../../../App";
import { typeOperationMap } from "../../bank";
import * as XLSX from "xlsx";

export const IncomingFundsReport: React.FC = () => {
  const { tableProps: bankTableProps } = useTable({
    resource: "bank",
  });

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    { type: { $eq: "income" } },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);
  const [sorterVisible, setSorterVisible] = useState(false);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({ $and: searchFilters }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/cash-desk`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const {
    data: goods,
    isLoading: goodsLoading,
    refetch: goodsRefetch,
  } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
  });

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

  useEffect(() => {
    refetch();
  }, [searchFilters, sortDirection, sortField, currentPage, pageSize]);

  const sortContent = (
    <Card style={{ width: 200, padding: "0px" }}>
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
            fontWeight: sortField === "id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "counterparty.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("counterparty.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По контрагенту{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "350px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      showTime={{ format: "HH:mm" }}
      format="YYYY-MM-DD HH:mm"
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          // Fixed: Use consistent filter format
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

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const tableProps = {
    dataSource: data?.data?.data || [],
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  const handleDownloadPhoto = async (photo: string) => {
    if (photo) {
      try {
        const photoUrl = `${API_URL}/${photo}`;

        const response = await fetch(photoUrl);
        const blob = await response.blob();

        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;

        const filename = photo.split("/").pop() || "photo.jpg";
        link.download = filename;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
        }, 100);
      } catch (error) {
        console.error("Error downloading photo:", error);
      }
    }
  };

  const { push } = useNavigation();

  const expandedRowRender = (record: any) => {
    const dataSource = goods?.data.filter(
      (item: any) => item.operation_id === record?.id
    );
    return (
      <Table
        dataSource={dataSource}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={false}
      >
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column
          dataIndex="counterparty"
          title="Код клиента"
          render={(value) => {
            return value?.clientPrefix + "-" + value?.clientCode;
          }}
        />
        <Table.Column
          dataIndex="counterparty"
          title="ФИО получателя"
          render={(value) => value?.name}
        />
        <Table.Column
          dataIndex="counterparty"
          render={(value) => (
            <p
              style={{
                width: "200px",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {`${value?.branch?.name}, ${value?.under_branch?.address || ""}`}
            </p>
          )}
          title="Пункт назначения, Пвз"
        />
        <Table.Column
          dataIndex="weight"
          title="Вес"
          render={(value) => value + " кг"}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Тариф клиента"
          render={(value, record) => {
            return `${(
              Number(value?.branch?.tarif || 0) -
              Number(record?.counterparty?.discount?.discount || 0)
            ).toFixed(2)}$`;
          }}
        />

        <Table.Column
          dataIndex="amount"
          title="Сумма"
          render={(value) => value + " $"}
        />
        <Table.Column
          dataIndex="discount"
          title="Скидка"
          render={(value, record) => {
            return `${(Number(value) + Number(record?.discount_custom)).toFixed(
              2
            )}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    );
  };

  const exportToExcel = () => {
    const dataSource = data?.data?.data || [];
    if (!dataSource || dataSource.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    let allExportData = [];

    for (const item of dataSource) {
      const bank = bankTableProps?.dataSource?.find(
        (bank) => bank.id === item.bank_id
      );

      // Add parent row data
      const parentRow = {
        "Дата оплаты": item.date
          ? dayjs(item.date).format("DD.MM.YYYY HH:MM")
          : "",
        Банк: bank?.name || "",
        "Метод оплаты": item.method_payment || "",
        "Вид прихода":
          typeOperationMap[item.type_operation] || item.type_operation || "",
        "Код клиента": item.counterparty
          ? `${item.counterparty.clientPrefix}-${item.counterparty.clientCode}`
          : "",
        "Фио клиента": item.counterparty ? item.counterparty.name : "",
        Сумма: item.amount || "",
        Валюта: item.type_currency || "",
        Комментарий: item.comment || "",
        "Тип строки": "Основная",
        "Трек-код": "",
        "Тип груза": "",
        "Пункт назначения": "",
        Вес: "",
        "Тариф клиента": "",
        Скидка: "",
      };

      allExportData.push(parentRow);

      const childRows =
        goods?.data.filter((goodItem: any) => goodItem.operation_id === item.id) ||
        [];

      for (const childItem of childRows) {
        const childRow = {
          "Дата оплаты": item.date
            ? dayjs(item.date).format("DD.MM.YYYY HH:MM")
            : "",
          Банк: bank?.name || "",
          "Метод оплаты": item.method_payment || "",
          "Вид прихода":
            typeOperationMap[item.type_operation] || item.type_operation || "",
          "Код клиента": childItem.counterparty
            ? `${childItem.counterparty.clientPrefix}-${childItem.counterparty.clientCode}`
            : "",
          "Фио клиента": childItem.counterparty
            ? childItem.counterparty.name
            : "",
          Сумма: childItem.amount || "",
          Валюта: item.type_currency || "",
          Комментарий: childItem.comments || "",
          // Add child-specific data
          "Тип строки": "Детализация",
          "Трек-код": childItem.trackCode || "",
          "Тип груза": childItem.cargoType || "",
          "Пункт назначения": childItem.counterparty
            ? `${childItem.counterparty.branch?.name || ""}, ${
                childItem.counterparty.under_branch?.address || ""
              }`
            : "",
          Вес: childItem.weight ? `${childItem.weight} кг` : "",
          "Тариф клиента":
            childItem.counterparty && childItem.counterparty.branch
              ? `${(
                  Number(childItem.counterparty.branch.tarif || 0) -
                  Number(childItem.counterparty?.discount?.discount || 0)
                ).toFixed(2)}$`
              : "",
          Скидка: `${(
            Number(childItem.discount || 0) +
            Number(childItem.discount_custom || 0)
          ).toFixed(2)}`,
        };

        allExportData.push(childRow);
      }
    }

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(allExportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Отчет по входящим средствам"
    );

    // Set column widths for better readability
    const columnsWidths = [
      { wch: 18 }, // Дата оплаты
      { wch: 15 }, // Банк
      { wch: 15 }, // Метод оплаты
      { wch: 15 }, // Вид прихода
      { wch: 12 }, // Код клиента
      { wch: 20 }, // Фио клиента
      { wch: 10 }, // Сумма
      { wch: 10 }, // Валюта
      { wch: 30 }, // Комментарий
      { wch: 12 }, // Тип строки
      { wch: 15 }, // Трек-код
      { wch: 15 }, // Тип груза
      { wch: 30 }, // Пункт назначения
      { wch: 10 }, // Вес
      { wch: 15 }, // Тариф клиента
      { wch: 10 }, // Скидка
    ];
    worksheet["!cols"] = columnsWidths;

    // Save file
    XLSX.writeFile(workbook, "incoming_funds_report.xlsx");

    message.success("Отчет успешно экспортирован");
  };

  // Modify the exportToGoogleSheets function to include expandable data
  const exportToGoogleSheets = () => {
    const dataSource = data?.data?.data || [];
    if (!dataSource || dataSource.length === 0) {
      message.error("Нет данных для экспорта");
      return;
    }

    try {
      // Create array to hold all export data (parent and child rows)
      let allExportData = [];

      // Process each parent row
      for (const item of dataSource) {
        const bank = bankTableProps?.dataSource?.find(
          (bank) => bank.id === item.bank_id
        );

        // Add parent row data
        const parentRow = {
          "Дата оплаты": item.date
            ? dayjs(item.date).format("DD.MM.YYYY HH:MM")
            : "",
          Банк: bank?.name || "",
          "Метод оплаты": item.method_payment || "",
          "Вид прихода":
            typeOperationMap[item.type_operation] || item.type_operation || "",
          "Код клиента": item.counterparty
            ? `${item.counterparty.clientPrefix}-${item.counterparty.clientCode}`
            : "",
          "Фио клиента": item.counterparty ? item.counterparty.name : "",
          Сумма: item.amount || "",
          Валюта: item.type_currency || "",
          Комментарий: item.comment || "",
          // Add empty values for child-specific columns to maintain consistent structure
          "Тип строки": "Основная",
          "Трек-код": "",
          "Тип груза": "",
          "Пункт назначения": "",
          Вес: "",
          "Тариф клиента": "",
          Скидка: "",
        };

        allExportData.push(parentRow);

        // Find and add child rows
        const childRows =
          goods?.data.filter((goodItem: any) => goodItem.operation_id === item.id) ||
          [];

        for (const childItem of childRows) {
          const childRow = {
            "Дата оплаты": item.date
              ? dayjs(item.date).format("DD.MM.YYYY HH:MM")
              : "",
            Банк: bank?.name || "",
            "Метод оплаты": item.method_payment || "",
            "Вид прихода":
              typeOperationMap[item.type_operation] ||
              item.type_operation ||
              "",
            "Код клиента": childItem.counterparty
              ? `${childItem.counterparty.clientPrefix}-${childItem.counterparty.clientCode}`
              : "",
            "Фио клиента": childItem.counterparty
              ? childItem.counterparty.name
              : "",
            Сумма: childItem.amount || "",
            Валюта: item.type_currency || "",
            Комментарий: childItem.comments || "",
            // Add child-specific data
            "Тип строки": "Детализация",
            "Трек-код": childItem.trackCode || "",
            "Тип груза": childItem.cargoType || "",
            "Пункт назначения": childItem.counterparty
              ? `${childItem.counterparty.branch?.name || ""}, ${
                  childItem.counterparty.under_branch?.address || ""
                }`
              : "",
            Вес: childItem.weight ? `${childItem.weight} кг` : "",
            "Тариф клиента":
              childItem.counterparty && childItem.counterparty.branch
                ? `${(
                    Number(childItem.counterparty.branch.tarif || 0) -
                    Number(childItem.counterparty?.discount?.discount || 0)
                  ).toFixed(2)}$`
                : "",
            Скидка: `${(
              Number(childItem.discount || 0) +
              Number(childItem.discount_custom || 0)
            ).toFixed(2)}`,
          };

          allExportData.push(childRow);
        }
      }

      // Create CSV for Google Sheets
      const worksheet = XLSX.utils.json_to_sheet(allExportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Create Blob and link for download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Create element for download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "incoming_funds_report.csv");
      document.body.appendChild(link);

      // Simulate click for download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("Файл готов для импорта в Google Sheets");
    } catch (error) {
      console.error("Ошибка при экспорте в Google Sheets:", error);
      message.error("Ошибка при экспорте данных");
    }
  };

  // @ts-ignore
  return (
    <List
      title="Отчет по приходам"
      headerButtons={() => (
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
            type="primary"
            ghost
            style={{
              backgroundColor: "white",
              borderColor: "#4285F4",
              color: "#4285F4",
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
              borderColor: "#4285F4",
              color: "#4285F4",
            }}
          >
            CSV
          </Button>
        </Space>
      )}
    >
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
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
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по трек-коду или коду клиента"
            prefix={<SearchOutlined />}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([{ type: { $eq: "income" } }], "replace");
                return;
              }

              setFilters(
                [
                  {
                    $and: [
                      { type: { $eq: "income" } },
                      {
                        $or: [
                          { trackCode: { $contL: value } },
                          { "counterparty.clientCode": { $contL: value } },
                        ],
                      },
                    ],
                  },
                ],
                "replace"
              );
            }}
          />
        </Col>
        <Col>
          <Select
            mode="multiple"
            placeholder="Выберите банк"
            style={{ width: 200 }}
            onChange={(value) => {
              if (!value || value.length === 0) {
                setFilters([{ type: { $eq: "income" } }], "replace");
                return;
              }

              setFilters(
                [
                  {
                    $and: [
                      { type: { $eq: "income" } },
                      { bank_id: { $in: value } },
                    ],
                  },
                ],
                "replace"
              );
            }}
            options={bankTableProps?.dataSource?.map((bank: any) => ({
              label: bank.name,
              value: bank.id,
            }))}
          />
        </Col>
        <Col>
          <Dropdown
            overlay={datePickerContent}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />} className="date-picker-button">
              Дата
            </Button>
          </Dropdown>
        </Col>
      </Row>

      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        expandable={{
          expandedRowRender,
          rowExpandable: (record: any) => !!record?.counterparty,
          expandRowByClick: true,
        }}
        onRow={(record) => ({
          onClick: (e) => {},
        })}
        loading={isLoading || goodsLoading}
      >
        <Table.Column
          dataIndex="date"
          title="Дата оплаты"
          render={(date) => dayjs(date).format("DD.MM.YYYY HH:mm")}
        />

        <Table.Column
          dataIndex="bank_id"
          title="Банк"
          render={(value) => {
            const bank = bankTableProps?.dataSource?.find(
              (bank) => bank.id === value
            );
            return bank?.name;
          }}
        />
        <Table.Column dataIndex="method_payment" title="Метод оплаты" />
        <Table.Column
          dataIndex="type_operation"
          title="Вид прихода"
          render={(value) => typeOperationMap[value] || value}
        />

        <Table.Column
          dataIndex="counterparty"
          title="Код клиента"
          render={(value) => `${value?.clientPrefix}-${value?.clientCode}`}
        />

        <Table.Column
          dataIndex="counterparty"
          title="Фио клиента"
          render={(counterparty) => (counterparty ? counterparty.name : "")}
        />

        <Table.Column dataIndex="amount" title="Сумма" />

        <Table.Column dataIndex="type_currency" title="валюта" />

        <Table.Column dataIndex="comment" title="Комментарий" />
        <Table.Column
          dataIndex="check_file"
          title="Чек"
          render={(check_file) => {
            const downloadUrl = `http://192.168.5.158:5001/${check_file}`;
            return (
              <Space direction="vertical" align="center">
                <Image
                  style={{ objectFit: "cover" }}
                  width={50}
                  height={50}
                  src={downloadUrl}
                  preview={{
                    src: downloadUrl,
                  }}
                />
                {check_file && (
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadPhoto(check_file)}
                    size="small"
                  >
                    Скачать
                  </Button>
                )}
              </Space>
            );
          }}
        />
      </Table>
    </List>
  );
};
