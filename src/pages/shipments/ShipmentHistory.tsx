import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { List } from "@refinedev/antd";
import { useNavigation, useCustom } from "@refinedev/core";
import { Button, Flex, Input, Table } from "antd";
import { useState, useEffect } from "react";
import { API_URL } from "../../App";
import { catchDateTable, translateStatus } from "../../lib/utils";
import { useSearchParams } from "react-router";

export const ShipmentHistory = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [filters, setFilters] = useState<any[]>([]);

  const buildQueryParams = () => ({
    sort: `id,${sortDirection}`,
    page: currentPage,
    limit: pageSize,
    offset: currentPage * pageSize,
    s: JSON.stringify({
      $and: [
        ...filters,
        { status: { $eq: "Выгрузили" } },
        { reshipment: { $eq: false } },
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
    <List headerButtons={() => false}>
      <Flex gap={10} style={{ width: "100%", marginBottom: 10 }}>
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
        >
          {/* {sortField === "id" ? "Дата" : "Имя"} */}
        </Button>
        <Input
          placeholder="Поиск по номеру рейса, коду коробки и по номеру фуры"
          prefix={<SearchOutlined />}
          style={{ width: "50%", height: 33 }}
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
      </Flex>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            push(`/shipments/history/show/${record.id}`);
          },
        })}
        {...tableProps}
        rowKey="id"
        scroll={{ x: "max-content" }}
      >
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
        {catchDateTable("Дата отправки")}
        <Table.Column dataIndex="id" title={"Номер рейса"} />
        <Table.Column dataIndex="boxCode" title={"Код коробки"} />
        <Table.Column
          dataIndex="employee"
          title={"Место погрузки"}
          render={(value) => value?.branch?.name}
        />
        <Table.Column dataIndex="count" title={"Количество посылок"} />
        <Table.Column dataIndex="weight" title={"Вес"} />
        <Table.Column
          dataIndex="Dimensions"
          title={"Размеры (Д × Ш × В)"}
          render={(value, record) => {
            return `${record?.length} x ${record?.width} x ${record?.height}`;
          }}
        />
        <Table.Column dataIndex="cube" title={"Куб"} />
        <Table.Column dataIndex="density" title={"Плотность"} />
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
