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
  Checkbox,
  Flex,
} from "antd";
import {
  BaseRecord,
  useNavigation,
  useCustom,
  useUpdate,
} from "@refinedev/core";
import { MyCreateModal } from "./modal/create-modal";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  FileAddOutlined,
  SearchOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { MyEditModal } from "./modal/edit-modal";
import { API_URL } from "../../App";
import { SmsModal } from "./modal/sms-modal";

export const CounterpartyList: React.FC = () => {
  const [sortField, setSortField] = useState<
    "name" | "clientCode" | "id" | "is_consolidated"
  >("id");
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sorterVisible, setSorterVisible] = useState(false);
  const [smsId, setSmsId] = useState(0);
  const [sms, setSms] = useState("");
  const [smsOpen, setSmsOpen] = useState(false);

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

  const { mutate } = useUpdate({
    resource: "counterparty",
    mutationOptions: {
      onSuccess(data, variables, context) {
        if (data?.data?.is_consolidated == true) {
          setSmsId(data?.data?.id as number);
          setSmsOpen(true);
        }
        refetch();
      },
    },
  });

  const changeIsValidate = async (id: string, checked: boolean) => {
    mutate({
      id: id,
      values: {
        is_consolidated: checked,
      },
    });
  };

  return (
    <List headerButtons={() => null}>
      <SmsModal
        id={smsId}
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        onSuccess={() => refetch()}
        sms={sms}
      />
      <MyCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => refetch()}
      />
      <MyEditModal
        id={editId}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={() => refetch()}
      />
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
            <Button
              icon={<FileAddOutlined />}
              style={{}}
              onClick={() => setOpen(true)}
            />

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
        <Table.Column
          title="Собирать груз"
          dataIndex="is_consolidated"
          render={(value, record) => (
            <Flex align="center" gap={10}>
              <Checkbox
                checked={value}
                onChange={(e) => changeIsValidate(record.id, e.target.checked)}
              />

              {value && (
                <EditOutlined
                  onClick={() => {
                    setSms(record?.consolidated_message);
                    setSmsId(record.id);
                    setSmsOpen(true);
                    console.log(smsOpen, "click");
                  }}
                />
              )}
            </Flex>
          )}
        />

        {/* <Table.Column dataIndex="consolidated_message" title="Смс" /> */}
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
            return (
              <p style={{ maxWidth: 70 }}>
                {(Number(value?.tarif) || 0) -
                  (Number(record?.discount?.discount) || 0)}
                $
              </p>
            );
          }}
          width={80}
        />
        {/* <Table.Column
          dataIndex="email"
          title="Почта"
          render={(value) => {
            return value ? value : "-";
          }}
        /> */}
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
