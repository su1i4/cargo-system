import React, { useState, useEffect } from "react";
import {
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
  Show,
  TextField,
} from "@refinedev/antd";
import { 
  Typography, 
  Table, 
  Space, 
  Row, 
  Col, 
  Input, 
  Button, 
  Dropdown, 
  Card, 
  DatePicker 
} from "antd";
import { useShow, useCustom } from "@refinedev/core";
import { 
  SearchOutlined, 
  CalendarOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  FilterOutlined 
} from "@ant-design/icons";
import { operationStatus, CustomTooltip } from "../../shared/custom-tooltip";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { API_URL } from "../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

export const DiscountShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  const record = data?.data;

  // Состояния для фильтрации и сортировки
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    | "id"
    | "created_at"
    | "sender.clientCode"
    | "sender.name"
    | "destination.name"
  >("created_at");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorterVisible, setSorterVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const buildQueryParams = () => {
    const filters = [
      { discount_id: { $eq: record?.id } },
      ...searchFilters
    ];
    return {
      s: JSON.stringify({ $and: filters }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data: specificationsData, isLoading: specificationsLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
    queryOptions: {
      enabled: !!record?.id,
    },
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
    if (record?.id) {
      refetch();
    }
  }, [searchFilters, sortDirection, sortField, currentPage, pageSize, record?.id]);

  const { data: branch } = useCustom({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const filterContent = (
    <Card style={{ width: 300, padding: "0px !important" }}>
      <Input
        placeholder="Поиск по номеру накладной"
        prefix={<SearchOutlined />}
        onChange={(e) => {
          const value = e.target.value;
          if (!value) {
            setFilters([], "replace");
            return;
          }
          setFilters(
            [
              {
                invoice_number: { $contL: value },
              },
            ],
            "replace"
          );
        }}
        style={{ width: "100%", marginBottom: 10 }}
      />
    </Card>
  );

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      showTime={{ format: "HH:mm" }}
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
        } else {
          setFilters([], "replace");
        }
      }}
    />
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

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const dataSource = specificationsData?.data?.data || [];

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          {editButtonProps && (
            <EditButton {...editButtonProps} meta={{ foo: "bar" }} />
          )}
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} meta={{ foo: "bar" }} />
          )}
        </>
      )}
      isLoading={isLoading}
    >
      <Title level={5}>Код клиента</Title>
      <TextField
        value={`${record?.counter_party.clientPrefix}-${String(
          record?.counter_party.clientCode
        ).padStart(4, "0")}`}
      />

      <Title level={5}>Фио</Title>
      <TextField value={record?.counter_party.name} />

      <Title level={5}>Скидка</Title>
      <TextField value={record?.discount} />

      <Title level={5}>Пункт назначения</Title>
      <TextField value={record?.destination?.name} />

      <Title level={5}>Тип продукта</Title>
      <TextField value={record?.product_type?.name} />

      <Title level={4} style={{ marginTop: 32 }}>
        Спецификации
      </Title>
      
      <Row
        gutter={[16, 16]}
        align="middle"
        style={{ marginBottom: 16, marginTop: 16 }}
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
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по номеру накладной, фио получателя или по коду получателя"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([], "replace");
                setSearch("");
                return;
              }

              setSearch(value);
              setFilters(
                [
                  {
                    $or: [
                      { invoice_number: { $contL: value } },
                      { "sender.name": { $contL: value } },
                      { "recipient.name": { $contL: value } },
                      { "sender.clientCode": { $contL: value } },
                      { "recipient.clientCode": { $contL: value } },
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

      <Table
        dataSource={dataSource}
        loading={specificationsLoading}
        rowKey="id"
        scroll={{ x: 1000 }}
        style={{ marginTop: 16 }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: specificationsData?.data?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
        }}
        onChange={handleTableChange}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (currentPage - 1) * pageSize + index + 1;
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="Дата приемки"
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
        {operationStatus()}
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName}-${value?.lastName}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
        <Table.Column
          title="Действия"
          key="actions"
          render={(_, record) => (
            <Space size="middle">
              <ShowButton hideText size="small" recordItemId={record.id} resource="goods-processing" />
              <EditButton hideText size="small" recordItemId={record.id} resource="goods-processing" />
            </Space>
          )}
        />
      </Table>
    </Show>
  );
};
