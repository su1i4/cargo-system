import { List, useSelect } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Dropdown,
  Card,
  Select,
  message,
  Flex,
} from "antd";
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FilterOutlined,
  FileOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom } from "@refinedev/core";
import { useDocumentTitle } from "@refinedev/react-router";
import { API_URL } from "../../../App";
import { CustomTooltip, operationStatus } from "../../../shared/custom-tooltip";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import * as XLSX from "xlsx";

dayjs.extend(utc);
dayjs.extend(timezone);

export const IssueReport = () => {
  const setTitle = useDocumentTitle();

  useEffect(() => {
    setTitle("Все товары");
  }, []);

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    | "id"
    | "created_at"
    | "sender.clientCode"
    | "sender.name"
    | "destination.name"
    | "counterparty.name"
  >("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    padding: "4px 8px",
    border: "1px solid #d9d9d9",
    borderRadius: "6px",
    fontSize: "14px",
    width: "160px",
    height: "32px",
    transition: "border-color 0.2s ease",
  };

  const buildQueryParams = () => {
    const filters = [...searchFilters];

    if (from && to) {
      filters.push({
        created_at: {
          $gte: dayjs(from).utc().format(),
          $lte: dayjs(to).utc().format(),
        },
      });
    }

    return {
      s: JSON.stringify({
        $and: [...filters, { status: { $eq: "Готов к выдаче" } }],
      }),
      sort: `${sortField},${sortDirection}`,
      page: 1,
      limit: 10000,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [sorterVisible, setSorterVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

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

  const { data: branch } = useCustom({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const prepareExportData = () => {
    const dataSource = data?.data?.data || [];

    return dataSource.map((record: any, index: number) => ({
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
          ? record.tracking_status.find((item: any) => item.status === "Выдали")
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
      "Город (с досыслом если есть)": record.destination?.name || "",
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
    }));
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
              // Экранируем запятые в значениях
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

  useEffect(() => {
    refetch();
  }, [from, to, refetch]);

  const filterContent = (
    <Card style={{ width: 300, padding: "0px !important" }}>
      <Select
        title="Выберите пункт назначения"
        placeholder="Выберите пункт назначения"
        options={branch?.data?.map((branch: any) => ({
          label: branch.name,
          value: branch.id,
        }))}
        allowClear
        mode="multiple"
        onChange={(value) => {
          setFilters(
            [
              {
                $or: value.map((item: any) => ({
                  destination_id: { $eq: item },
                })),
              },
            ],
            "replace"
          );
        }}
        style={{ width: "100%", marginBottom: 20 }}
      />
      <Select
        placeholder="Оплаченные / Не оплаченные"
        options={[
          {
            label: "Оплаченные",
            value: "paid",
          },
          {
            label: "Не оплаченные",
            value: "unpaid",
          },
        ]}
        mode="multiple"
        allowClear
        onChange={(value) => {
          const filters = [];

          if (value.includes("paid")) {
            filters.push({ operation_id: { $ne: null } });
          }

          if (value.includes("unpaid")) {
            filters.push({ operation_id: { $eq: null } });
          }

          if (filters.length === 0) {
            setFilters([], "replace");
          } else {
            setFilters([{ $or: filters }], "replace");
          }
        }}
        style={{ width: "100%" }}
      />
    </Card>
  );

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
          onClick={() => {
            setSortField("created_at");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "created_at" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "sender.clientCode" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("sender.clientCode");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По коду отправителя{" "}
          {sortField === "sender.clientCode" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "sender.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("sender.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По фио отправителя{" "}
          {sortField === "sender.name" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "destination.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("destination.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По пункту назначения{" "}
          {sortField === "destination.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (value) => value?.name,
  });

  const dataSource = data?.data?.data || [];

  return (
    <List title="Отчет выданным товарам" headerButtons={() => false}>
      <Flex
        gap={10}
        style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
      >
        <Space size="middle">
          <CustomTooltip title="Сортировка">
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
          </CustomTooltip>
          <CustomTooltip title="Фильтры">
            <Dropdown
              overlay={filterContent}
              trigger={["click"]}
              placement="bottomLeft"
              open={filterVisible}
              onOpenChange={(visible) => {
                setFilterVisible(visible);
              }}
            >
              <Button icon={<FilterOutlined />} />
            </Dropdown>
          </CustomTooltip>
        </Space>
        <Input
          placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              setFilters([{ trackCode: { $contL: "" } }], "replace");
              setSearch("");
              return;
            }

            setSearch(value);
            setFilters(
              [
                {
                  $or: [
                    { trackCode: { $contL: value } },
                    { "counterparty.clientCode": { $contL: value } },
                    { "counterparty.name": { $contL: value } },
                  ],
                },
              ],
              "replace"
            );
          }}
          style={{ width: "100%" }}
        />
        <Select
          {...branchSelectProps}
          onChange={(value) =>
            setFilters([{ "employee.branch_id": { $eq: value } }], "replace")
          }
          style={{ width: "200px", minWidth: "200px" }}
        />
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
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <p
              style={{
                position: "absolute",
                top: -20,
                margin: 0,
                fontSize: "12px",
                color: "#666",
              }}
            >
              От:
            </p>
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
            <p
              style={{
                position: "absolute",
                top: -20,
                margin: 0,
                fontSize: "12px",
                color: "#666",
              }}
            >
              До:
            </p>
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
      </Flex>
      <Table
        dataSource={dataSource}
        loading={isLoading}
        pagination={false}
        rowKey="id"
        scroll={{ x: 1000 }}
      >
        <Table.Column
          dataIndex="created_at"
          title="Дата получения"
          render={(value) =>
            value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
          }
        />
        <Table.Column dataIndex="invoice_number" title="№ накладной" />
        <Table.Column
          dataIndex="employee"
          title="Пункт приема"
          render={(value) =>
            `${value?.branch?.name}, ${value?.under_branch?.address || ""}`
          }
        />
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
          title="Тел-номер получателя"
          render={(value) => value?.phoneNumber}
        />
        <Table.Column
          dataIndex="destination"
          render={(value) => value?.name}
          title="Пункт назначения"
        />
        <Table.Column
          dataIndex="totalServiceWeight"
          title="Вес"
          render={(value) =>
            String(value).replace(".", ",").slice(0, 5) + " кг"
          }
        />
        <Table.Column
          dataIndex="services"
          title="Номер мешков"
          render={(value) => value?.map((item: any) => item.bag_number).join(', ')}
        />
        <Table.Column
          dataIndex="services"
          title="Кол-во мешков"
          render={(value) => value?.length + " шт"}
        />
        <Table.Column
          dataIndex="totalServiceAmountSum"
          title="Сумма"
          render={(_, record: any) =>
            `${
              Number(record.totalServiceAmountSum) +
              Number(record.totalProductAmountSum)
            } руб`
          }
        />
        <Table.Column dataIndex="payment_method" title="Способ оплаты" />
        {operationStatus()}
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName}-${value?.lastName}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </List>
  );
};
