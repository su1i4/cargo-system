import { List, useTable } from "@refinedev/antd";
import {
  Table,
  Image,
  DatePicker,
  Card,
  Button,
  Row,
  Col,
  Form,
  Dropdown,
  Input,
} from "antd";
import dayjs from "dayjs";
import { API_URL } from "../../App";
import { catchDateTable, translateStatus } from "../../lib/utils";
import { useState } from "react";
import { useCustom } from "@refinedev/core";
import { useSearchParams } from "react-router";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CustomTooltip } from "../../shared";

export const IssueProcessingListReceived = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [...searchFilters, { status: { $eq: "Выдали" } }],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    searchparams.set("page", pagination.current);
    searchparams.set("size", pagination.pageSize);
    setSearchParams(searchparams);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    // Обрабатываем сортировку, если она пришла из таблицы
    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

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
          По фио{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          // Fixed: Use consistent filter format
          setSearchFilters([
            ...searchFilters,
            {
              created_at: {
                $gte: dateStrings[0],
                $lte: dateStrings[1],
              },
            },
          ]);
        }
      }}
    />
  );

  // Получаем актуальные данные из хука useCustom
  const dataSource = data?.data?.data || [];

  // Формируем пропсы для таблицы из данных useCustom
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
    <List>
      <Row style={{ marginBottom: 15 }}>
        <Col span={24}>
          <Form layout="inline">
            <CustomTooltip title="Сортировка">
              <Dropdown overlay={sortContent} trigger={["click"]}>
                <Button
                  style={{ marginRight: 8 }}
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
            <Form.Item name="trackCode">
              <Input
                style={{ width: 500 }}
                placeholder="Поиск по трек-коду, ФИО получателя или по коду получателя"
                prefix={<SearchOutlined />}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSearchFilters([]);
                    return;
                  }
                  setSearchFilters([
                    {
                      $or: [
                        { trackCode: { $contL: value } },
                        { "counterparty.clientCode": { $contL: value } },
                        { "counterparty.name": { $contL: value } },
                      ],
                    },
                  ]);
                }}
              />
            </Form.Item>
            <Form.Item name="dateRange">
              <Dropdown
                overlay={datePickerContent}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  icon={<CalendarOutlined />}
                  className="date-picker-button"
                >
                  Дата
                </Button>
              </Dropdown>
            </Form.Item>
          </Form>
        </Col>
      </Row>
      <Table {...tableProps} scroll={{ x: 1300 }}>
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (
              //@ts-ignore
              (tableProps?.pagination?.current - 1) *
                tableProps?.pagination?.pageSize +
              index +
              1
            );
          }}
        />
        {catchDateTable("Дата выдачи", "Выдали")}
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
          render={(value) => {
            return `${value?.clientPrefix}-${value?.clientCode}`;
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
          minWidth={100}
          render={(value) => value + " кг"}
        />

        <Table.Column
          dataIndex="amount"
          title="Сумма"
          minWidth={100}
          render={(value) => value + " $"}
        />
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName || ""}-${value?.lastName || ""}`;
          }}
        />
        <Table.Column
          dataIndex="employee"
          title="Филиал"
          render={(value) => value?.branch?.name}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
        <Table.Column
          dataIndex="photo"
          title="Фото"
          render={(photo) =>
            photo ? (
              <Image width={30} height={30} src={API_URL + "/" + photo} />
            ) : null
          }
        />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
      </Table>
    </List>
  );
};
