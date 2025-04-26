import { Show, TextField, DateField } from "@refinedev/antd";
import { useCustom, useOne } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Input,
  Row,
  Space,
  Table,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CustomTooltip } from "../../../shared";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { API_URL } from "../../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

export const IncomeShowReport: React.FC = () => {
  const { id } = useParams();
  const { data: incomeData, isLoading: incomeLoading } = useOne({
    resource: "cash-desk",
    id: id,
  });

  const record = incomeData?.data;

  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    "id" | "counterparty.name" | "operation_id"
  >("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [...searchFilters, { operation_id: { $eq: id } }],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: currentPage * pageSize,
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
    if (!searchparams.get("page") && !searchparams.get("size")) {
      searchparams.set("page", String(currentPage));
      searchparams.set("size", String(pageSize));
      setSearchParams(searchparams);
    } else {
      const page = searchparams.get("page");
      const size = searchparams.get("size");
      setCurrentPage(Number(page));
      setPageSize(Number(size));
    }
    refetch();
  }, [searchFilters, sortDirection, currentPage, pageSize]);

  useEffect(() => {
    const value = searchparams.get("value");
    if (value) {
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
    }
    setSearch(value || "");
  }, []);

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
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
        }
      }}
    />
  );

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
        {/* Сортировка по дате создания */}
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
          По фио{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "operation_id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("operation_id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По статусу оплаты{" "}
          {sortField === "operation_id" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    searchparams.set("page", pagination.current);
    searchparams.set("size", pagination.pageSize);
    setSearchParams(searchparams);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const dataSource = data?.data?.data || [];

  const tableProps = {
    dataSource: dataSource,
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  return (
    <Show
      title="Просмотр прихода"
      headerButtons={() => false}
      isLoading={incomeLoading}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={4}>
          <Title level={5}>Дата прихода</Title>
          <TextField
            value={dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
          />
        </Col>
        <Col span={4}>
          <Title level={5}>Код клиента</Title>
          <TextField
            value={`${record?.counterparty?.clientCode}-${record?.counterparty?.clientPrefix}`}
          />
        </Col>
        <Col span={4}>
          <Title level={5}>Фио клиента</Title>
          <TextField value={record?.counterparty?.name} />
        </Col>
        <Col span={4}>
          <Title level={5}>Номер клиента</Title>
          <TextField value={record?.counterparty?.phoneNumber} />
        </Col>
        <Col span={4}>
          <Title level={5}>Сумма оплаты</Title>
          <TextField value={`${record?.amount}-${record?.type_currency}`} />
        </Col>
      </Row>
      <Row
        gutter={[16, 16]}
        align="middle"
        style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
      >
        <Col>
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
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([{ trackCode: { $contL: "" } }], "replace");
                setSearch("");
                searchparams.set("value", "");
                setSearchParams(searchparams);
                return;
              }

              searchparams.set("page", "1");
              searchparams.set("size", String(pageSize));
              searchparams.set("value", value);
              setSearchParams(searchparams);
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
      <Table {...tableProps} rowKey="id" scroll={{ x: 1200 }}>
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
    </Show>
  );
};
