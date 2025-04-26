List;
import React, { useState, useEffect } from "react";
import { List, useTable, useSelect } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  Dropdown,
  Card,
  Select,
} from "antd";
import { BaseRecord, useNavigation, useCustom } from "@refinedev/core";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  FileAddOutlined,
  SearchOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../../App";

export const EmployeesReport: React.FC = () => {
  const [sortField, setSortField] = useState<"name" | "clientCode" | "id">(
    "id"
  );
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sorterVisible, setSorterVisible] = useState(false);

  const { tableProps: defaultTableProps, setFilters } = useTable({
    resource: "counterparty",
    syncWithLocation: false,
    pagination: {
      mode: "off",
    },
  });

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const buildQueryParams = () => {
    const params: any = {
      sort: `${sortField},${sortDirection}`,
    };

    if (searchValue) {
      params.s = JSON.stringify({
        $or: [
          { name: { $contL: searchValue } },
          { clientCode: { $contL: searchValue } },
          { clientPrefix: { $contL: searchValue } },
        ],
      });
    }

    if (selectedBranch) {
      params.s = JSON.stringify({
        $or: [{ branch_id: { $eq: selectedBranch } }],
      });
    }

    return params;
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/counterparty`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  useEffect(() => {
    refetch();
  }, [sortDirection, sortField, searchValue]);

  useEffect(() => {
    refetch();
  }, []);

  const dataSource = data?.data || [];
  const tableProps = {
    ...defaultTableProps,
    dataSource: dataSource,
    loading: isLoading,
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const { show } = useNavigation();

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
        {/* Сортировка по имени */}
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
            fontWeight: sortField === "name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
            // setSorterVisible(false);
          }}
        >
          Имени {sortField === "name" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "clientCode" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("clientCode");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
            // setSorterVisible(false);
          }}
        >
          Коду клиента{" "}
          {sortField === "clientCode" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  return (
    <List title="Отчет по контрагентам" headerButtons={() => null}>
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
              />
            </Dropdown>
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по фио или по коду клиента"
            prefix={<SearchOutlined />}
            onChange={(e) => {
              const value = e.target.value;
              setSearchValue(value);
            }}
            value={searchValue}
            suffix={
              searchValue ? (
                <CloseCircleOutlined
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSearchValue("");
                  }}
                />
              ) : isLoading ? (
                <SyncOutlined spin />
              ) : null
            }
          />
        </Col>
        <Col>
          <Select
            {...branchSelectProps}
            placeholder="Выберите филиал"
            style={{ width: 300 }}
            value={selectedBranch?.id || undefined}
            allowClear
            onChange={(branch) => {
              if (!branch) {
                setSelectedBranch(null);
                setFilters([], "replace");
                return;
              }
              setSelectedBranch(branch);
              setFilters(
                [
                  {
                    field: "branch_id",
                    operator: "eq",
                    value: branch.id,
                  },
                ],
                "replace"
              );
            }}
          />
        </Col>
      </Row>

      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            show("counterparty", record.id as number);
          },
        })}
        {...tableProps}
        rowKey="id"
        locale={{
          emptyText: searchValue
            ? "По вашему запросу ничего не найдено"
            : "Нет данных",
        }}
      >
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="codeClientAndPrefix"
          title="Код клиента"
          render={(_, record: BaseRecord) => {
            if (!record.clientPrefix || !record.clientCode) return "";
            return record.clientPrefix + "-" + record.clientCode;
          }}
          width={120}
        />
        <Table.Column dataIndex="name" title="Фио" />
        <Table.Column
          dataIndex="address"
          title="Пвз"
          render={(value, record) =>
            `${record?.branch?.name}, ${record?.under_branch?.address || ""}`
          }
        />
        <Table.Column dataIndex="phoneNumber" title="Номер телефона" />
        <Table.Column
          dataIndex="branch"
          title="Тариф клиента"
          render={(value, record) => {
            return `${
              (Number(value?.tarif) || 0) -
              (Number(record?.discount?.discount) || 0)
            }$`;
          }}
        />
        <Table.Column
          dataIndex="email"
          title="Почта"
          render={(value) => {
            return value ? value : "-";
          }}
        />
        <Table.Column
          dataIndex="discount"
          title="Скидка"
          render={(value) => {
            return value ? value?.discount + "$" : "0$";
          }}
        />

        <Table.Column
          dataIndex="goods"
          title="Общий вес кг"
          render={(value) => {
            return `${value
              .reduce((acc: number, curr: any) => acc + Number(curr.weight), 0)
              .toFixed(2)} кг`;
          }}
        />
        <Table.Column
          dataIndex="goods"
          title="Общая сумма USD"
          render={(value) => {
            return `${value
              .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
              .toFixed(2)}$`;
          }}
        />
        <Table.Column
          dataIndex="comment"
          title="Комментарий"
          render={(value) => {
            return value ? value : "-";
          }}
        />
      </Table>
    </List>
  );
};
