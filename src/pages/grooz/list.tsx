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
import { API_URL } from "../../App";

export const CounterpartyGrooz: React.FC = () => {
  const [sortField, setSortField] = useState<
    "name" | "clientCode" | "id" | "is_consolidated"
  >("id");
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sorterVisible, setSorterVisible] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  const { tableProps: defaultTableProps, setFilters } = useTable({
    resource: "counterparty",
    syncWithLocation: false,
    pagination: {
      mode: "off",
    },
  });

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
          { is_consolidated: { $eq: true } },
        ],
      });
    }

    if (selectedBranch) {
      params.s = JSON.stringify({
        $and: [
          { branch_id: { $eq: selectedBranch } },
          { is_consolidated: { $eq: true } },
        ],
      });
    }

    if (!selectedBranch && !searchValue) {
      params.s = JSON.stringify({
        $and: [{ is_consolidated: { $eq: true } }],
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
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "is_consolidated" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("is_consolidated");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
            // setSorterVisible(false);
          }}
        >
          Сборным грузам{" "}
          {sortField === "is_consolidated" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  return (
    <List headerButtons={() => null}>
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
            show("grooz", record.id as number);
          },
        })}
        {...tableProps}
        rowKey="id"
        locale={{
          emptyText: searchValue
            ? "По вашему запросу ничего не найдено"
            : "Нет данных",
        }}
        scroll={{ x: 1000 }}
      >
        <Table.Column
          dataIndex="codeClientAndPrefix"
          title="Код клиента"
          render={(_, record: BaseRecord) => {
            if (!record.clientPrefix || !record.clientCode) return "";
            return record.clientPrefix + "-" + record.clientCode;
          }}
          width={120}
        />
        <Table.Column dataIndex="name" title="Фио клиента" width={250} />
        <Table.Column
          dataIndex="address"
          title="Пвз"
          render={(value, record) =>
            `${record?.branch?.name}, ${record?.under_branch?.address || ""}`
          }
          width={250}
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
