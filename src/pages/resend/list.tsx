import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CreateButton, List, TextField, useTable } from "@refinedev/antd";
import { useNavigation, useCustom } from "@refinedev/core";
import { Button, Flex, Input, Table, Typography } from "antd";
import { useState, useEffect } from "react";
import { API_URL } from "../../App";
import { CustomTooltip } from "../../shared";
import { catchDateTable, translateStatus } from "../../lib/utils";
import { useSearchParams } from "react-router";

const ResendList = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [filters, setFilters] = useState<any[]>([]);
  const { show } = useNavigation();

  const buildQueryParams = () => ({
    sort: `id,${sortDirection}`,
    page: currentPage,
    limit: pageSize,
    offset: currentPage * pageSize,
    s: JSON.stringify({
      $and: [
        ...filters,
        { status: { $eq: "В пути" } },
        { reshipment: { $eq: true } },
      ],
    }),
  });

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/shipments`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const {
    data: statistic,
    isLoading: statisticLoading,
    refetch: statRefetch,
  } = useCustom({
    url: `${API_URL}/shipments/statistics`,
    method: "get",
    config: {
      query: { reshipment: true },
    },
  });

  useEffect(() => {
    if (!statisticLoading) {
      statRefetch();
    }
  }, []);

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
  }, [filters, sortDirection, currentPage, pageSize]);

  const dataSource = data?.data?.data || [];

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    searchparams.set("page", pagination.current);
    searchparams.set("size", pagination.pageSize);
    setSearchParams(searchparams);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

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

  const { push } = useNavigation();

  return (
    <List
      headerButtons={(createButtonProps) => {
        return (
          <>
            <Button onClick={() => push("/resend/history")}>
              История отправлений
            </Button>
            {createButtonProps && (
              <CreateButton {...createButtonProps} meta={{ foo: "bar" }} />
            )}
          </>
        );
      }}
    >
      <Flex gap={10} style={{ width: "100%" }}>
        <CustomTooltip title="Сортировка">
          <Button
            icon={
              sortDirection === "ASC" ? (
                <ArrowUpOutlined />
              ) : (
                <ArrowDownOutlined />
              )
            }
            onClick={() => {
              setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
            }}
            style={{ height: 33, width: 33, minWidth: 33 }}
          />
        </CustomTooltip>
        <Input
          placeholder="Поиск по номеру рейса, коду коробки и по номеру фуры"
          prefix={<SearchOutlined />}
          style={{ width: "40%", height: 33 }}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              setFilters([]);
              return;
            }
            setCurrentPage(1);
            searchparams.set("page", "1");
            setSearchParams(searchparams);

            setFilters([
              {
                $or: [
                  { id: { $contL: value } },
                  { boxCode: { $contL: value } },
                  { truck_number: { $contL: value } },
                ],
              },
            ]);
          }}
        />
        <div
          style={{
            border: "1px dashed gainsboro",
            padding: "4px 10px",
            borderRadius: 5,
            marginBottom: 10,
            backgroundColor: "#f9f9f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            width: "60%",
            height: 33,
            boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          {false ? (
            <Typography.Title level={5} style={{ fontWeight: 400, margin: 0 }}>
              Загрузка итогов...
            </Typography.Title>
          ) : (
            <>
              <Typography.Text style={{ fontSize: 14 }}>
                Общий вес:{" "}
                <strong>
                  {Number(statistic?.data?.totalWeight).toFixed(2)} кг
                </strong>
              </Typography.Text>
              <Typography.Text style={{ fontSize: 14 }}>
                {/* @ts-ignore */}
                Количество рейсов:{" "}
                <strong>{statistic?.data?.totalShipments}</strong>
              </Typography.Text>
              <Typography.Text style={{ fontSize: 14 }}>
                Количество посылок:{" "}
                <strong>{statistic?.data?.totalParcels}</strong>
              </Typography.Text>
            </>
          )}
        </div>
      </Flex>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            show("resend", record.id as number);
          },
        })}
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1500 }}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (data?.data?.page - 1) * pageSize + index + 1;
          }}
        />
        {catchDateTable("Дата отправки", "В пути")}
        <Table.Column
          dataIndex="id"
          title={"Номер рейса"}
          render={(value) => (
            <TextField
              style={{
                padding: 5,
                textDecoration: "underline",
                cursor: "pointer",
              }}
              value={value}
            />
          )}
        />
        <Table.Column dataIndex="boxCode" title={"Код коробки"} />
        <Table.Column dataIndex="truck_number" title={"Номер фуры"} />
        <Table.Column
          dataIndex="employee"
          title={"Место погрузки"}
          render={(value) => value?.branch?.name}
        />
        <Table.Column dataIndex="count" title={"Количество посылок"} />
        <Table.Column
          dataIndex="weight"
          title={"Вес"}
          render={(value, record) => (
            <p
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {Number(value) + Number(record?.box_weight)} кг
            </p>
          )}
        />
        <Table.Column
          dataIndex="Dimensions"
          title={"Размеры (Д × Ш × В)"}
          render={(value, record) => {
            return `${record?.length} x ${record?.width} x ${record?.height}`;
          }}
        />
        <Table.Column dataIndex="cube" title={"Куб"} />
        <Table.Column dataIndex="density" title={"Плотность"} />
        <Table.Column dataIndex="box_weight" title={"Вес коробки"} />
        <Table.Column dataIndex="type" title={"Тип"} />
        <Table.Column
          render={(value) => value?.name}
          dataIndex="branch"
          title={"Пункт назначения"}
        />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
        <Table.Column
          dataIndex="employee"
          title={"Сотрудник"}
          render={(value) => {
            return `${value?.firstName || ""}-${value?.lastName || ""}`;
          }}
        />
      </Table>
    </List>
  );
};

export default ResendList;
