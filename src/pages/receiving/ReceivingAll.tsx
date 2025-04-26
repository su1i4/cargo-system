import React, { useState } from "react";
import {
  Show,
  TextField,
  List,
  ShowButton,
  DeleteButton,
} from "@refinedev/antd";
import {
  useUpdateMany,
  useShow,
  useCustom,
  useNavigation,
  BaseRecord,
} from "@refinedev/core";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Space,
  Card,
  Form,
  Dropdown,
  Input,
  Modal,
} from "antd";
import { data, useParams, useSearchParams } from "react-router";
import { API_URL } from "../../App";
import { catchDateTable, translateStatus } from "../../lib/utils";
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CustomTooltip } from "../../shared";
import dayjs from "dayjs";
import { ResendModal } from "./modal/resend-modal";

const ReceivingAll = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [open, setOpen] = useState(false);
  const [quckShipment, setQuickShipment] = useState(false);
  const [customKeys, setCustomKeys] = useState<number[]>([]);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [...searchFilters, { status: { $eq: "В пути" } }],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const {
    data: ReceivingData,
    isLoading: ReceivingLoading,
    refetch,
  } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const { push } = useNavigation();

  const postIds = async (ids: Record<string, number[]>) => {
    const token = localStorage.getItem("access_token");

    await fetch(`${API_URL}/goods-processing/send-notification-tg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ids),
    });
    refetch();
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [transformData, setTransformData] = useState<Record<string, number[]>>(
    {}
  );

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (newSelectedKeys: React.Key[], newSelectedRows: any[]) => {
      setSelectedRowKeys(newSelectedKeys);
      setSelectedRows(newSelectedRows);

      let tpsIds: Record<string, number[]> = {};

      newSelectedRows.forEach((item) => {
        const clientCode = item.counterparty?.clientCode;
        const itemId = item.id;

        if (!clientCode) return;

        if (!tpsIds[clientCode]) {
          tpsIds[clientCode] = [];
        }

        if (tpsIds[clientCode].includes(itemId)) {
          tpsIds[clientCode] = tpsIds[clientCode].filter((id) => id !== itemId);
        } else {
          tpsIds[clientCode].push(itemId);
        }
      });

      setTransformData(tpsIds);
    },
  };

  const { mutate, isLoading: isUpdating } = useUpdateMany();

  const handleSetReadyToIssue = () => {
    mutate(
      {
        resource: "goods-processing",
        // @ts-ignore
        ids: selectedRowKeys,
        values: { status: "Готов к выдаче" },
      },
      {
        onSuccess: () => {
          setSelectedRowKeys([]);
          postIds(transformData);
        },
      }
    );
  };

  const handleFilter = (values: any) => {
    const filters: any[] = [{ status: { $eq: "Готов к выдаче" } }];
    if (values.trackCode) {
      filters.push({
        $or: [
          { trackCode: { $contL: values.trackCode } },
          { "counterparty.clientCode": { $contL: values.trackCode } },
          { "counterparty.name": { $contL: values.trackCode } },
        ],
      });
    }
    if (values.dateRange) {
      filters.push({
        created_at: {
          $gte: dayjs(values.dateRange[0]).format("YYYY-MM-DD"),
          $lte: dayjs(values.dateRange[1]).format("YYYY-MM-DD"),
        },
      });
    }
    setSearchFilters(filters);
  };

  const sortContent = (
    <Card style={{ width: 200, padding: "0px" }}>
      <Modal open={open}></Modal>
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

  const dataSource = ReceivingData?.data?.data || [];

  const tableProps = {
    dataSource: dataSource,
    loading: ReceivingLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      //   total: ReceivingAll || 0,
    },
    onChange: handleTableChange,
  };

  return (
    <List headerButtons={() => false} title="Принять все">
      <ResendModal
        open={open}
        handleClose={() => {
          setOpen(false);
          setQuickShipment(false);
          setCustomKeys([]);
        }}
        selectedRowKeys={quckShipment ? customKeys : selectedRowKeys}
        onSuccess={() => refetch()}
      />

      <Row
        style={{
          marginBottom: 15,
          position: "sticky",
          top: 80,
          zIndex: 100,
        }}
      >
        <Col span={24}>
          <Form layout="inline" onFinish={handleFilter}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => push("/receiving")}
            >
              Назад
            </Button>
            <Space
              style={{
                marginRight: 10,
                backgroundColor: "white",
                marginLeft: 10,
                borderRadius: 10,
              }}
            >
              <Button
                onClick={handleSetReadyToIssue}
                disabled={selectedRowKeys.length === 0 || isUpdating}
              >
                Принять
              </Button>
            </Space>
            <Space
              style={{
                marginRight: 10,
                backgroundColor: "white",
                borderRadius: 10,
              }}
            >
              <Button
                onClick={() => setOpen(true)}
                disabled={selectedRowKeys.length === 0 || isUpdating}
              >
                Перенаправить
              </Button>
            </Space>
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
                />
              </Dropdown>
            </CustomTooltip>
            <Form.Item name="trackCode">
              <Input
                style={{ width: 600 }} // Fixed width issue
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
          </Form>
        </Col>
      </Row>

      {/* Таблица со списком товаров и чекбоксами */}
      <Table
        // pagination={{ showSizeChanger: true }}
        {...tableProps}
        rowKey="id"
        rowSelection={rowSelection}
        scroll={{ x: 1200 }}
      >
        <Table.Column
          title="Действие"
          dataIndex="actions"
          render={(_, record: BaseRecord) =>
            !rowSelection.selectedRowKeys.includes(record.id as number) && (
              <Button
                onClick={() => {
                  setCustomKeys([record?.id as number]);
                  setQuickShipment(true);
                  setOpen(true);
                }}
              >
                Перенаправить
              </Button>
            )
          }
        />
        {catchDateTable("Дата приемки", "В пути")}
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column dataIndex="trackCode" title="Треккод" />
        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
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
                width: "120px",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {`${value?.branch?.name}, ${value?.under_branch?.address || ""}`}
            </p>
          )}
          title="Пункт назначения, Пвз"
        />
        <Table.Column dataIndex="weight" title="Вес" />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
      </Table>
    </List>
  );
};

export default ReceivingAll;
