import { Show, TextField, useTable } from "@refinedev/antd";
import { useShow, useUpdateMany } from "@refinedev/core";
import {
  Typography,
  Row,
  Col,
  Table,
  Button,
  Flex,
  Dropdown,
  Menu,
  Input,
} from "antd";
import { useParams } from "react-router";
import { translateStatus } from "../../lib/utils";
import { useState } from "react";
import dayjs from "dayjs";
import { SearchOutlined } from "@ant-design/icons";
import { ArrowDownOutlined } from "@ant-design/icons";
import { ArrowUpOutlined } from "@ant-design/icons";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const { Title } = Typography;

const ReceivingShow = () => {
  const { id } = useParams();
  const { queryResult } = useShow({ resource: "shipments", id: Number(id) });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const { tableProps, setFilters, setSorters } = useTable({
    resource: "service",
    syncWithLocation: false,
    initialSorter: [
      {
        field: "id",
        order: "desc",
      },
    ],
    filters: {
      permanent: [
        {
          field: "shipment_id",
          operator: "eq",
          value: Number(id),
        },
        {
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
    queryOptions: {},
  });

  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedRows(selectedRows);
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  const { mutate: updateServices } = useUpdateMany({
    resource: "service",
  });

  const handleReceive = () => {
    updateServices({
      ids: selectedRowKeys as number[],
      values: {
        status: "Готов к выдаче",
      },
    });
  };

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("created_at");

  const handleSort = (field: string, direction: "ASC" | "DESC") => {
    setSortField(field);
    setSortDirection(direction);
    setSorters([
      {
        field,
        order: direction.toLowerCase() as "asc" | "desc",
      },
    ]);
  };

  const sortFields = [
    { key: "good.created_at", label: "Дата" },
    { key: "bag_number_numeric", label: "Номер мешка" },
  ];

  const getSortFieldLabel = () => {
    const field = sortFields.find((f) => f.key === sortField);
    return field ? field.label : "Дата приемки";
  };

  const sortMenu = (
    <Menu>
      {sortFields.map((field) => (
        <Menu.SubMenu key={field.key} title={field.label}>
          <Menu.Item
            key={`${field.key}-asc`}
            onClick={() => handleSort(field.key, "ASC")}
          >
            <ArrowUpOutlined /> По возрастанию
          </Menu.Item>
          <Menu.Item
            key={`${field.key}-desc`}
            onClick={() => handleSort(field.key, "DESC")}
          >
            <ArrowDownOutlined /> По убыванию
          </Menu.Item>
        </Menu.SubMenu>
      ))}
    </Menu>
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);

    if (value.trim() === "") {
      setFilters([], "replace");
    } else {
      setFilters(
        [
          {
            operator: "or",
            value: [
              {
                field: "bag_number_numeric",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "good.sender.name",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "good.recipient.name",
                operator: "contains",
                value: value.trim(),
              },
            ],
          },
        ],
        "replace"
      );
    }
  };

  return (
    <Show headerButtons={() => null} isLoading={isLoading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Title level={5}>Номер рейса</Title>
          <TextField value={record?.truck_number || "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Пункт погрузки</Title>
          <TextField value={record?.employee?.branch?.name || "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Пункт назначения</Title>
          <TextField value={record?.branch?.name || "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Сотрудник</Title>
          <TextField
            value={`${record?.employee?.firstName || ""} ${
              record?.employee?.lastName || ""
            }`}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Количество мест</Title>
          <TextField value={tableProps?.dataSource?.length ?? "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Вес кг</Title>
          <TextField
            value={tableProps?.dataSource?.reduce(
              (sum: any, i: any) => sum + Number(i.weight),
              0
            )}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Дата</Title>
          <TextField
            value={`${record?.created_at?.split("T")[0]} ${record?.created_at
              ?.split("T")[1]
              ?.slice(0, 5)}`}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Статус</Title>
          <TextField value={translateStatus(record?.status)} />
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 24 }}>
        Товары в этом рейсе
      </Title>
      <Flex
        style={{
          width: "100%",
          marginBottom: 10,
          gap: 10,
        }}
        gap={10}
      >
        <Button disabled={selectedRowKeys.length === 0} onClick={handleReceive}>
          Принять товары
        </Button>
        <Dropdown overlay={sortMenu} trigger={["click"]}>
          <Button
            icon={
              sortDirection === "ASC" ? (
                <ArrowUpOutlined />
              ) : (
                <ArrowDownOutlined />
              )
            }
          >
            {getSortFieldLabel()}
          </Button>
        </Dropdown>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Поиск по номеру мешка, отправителю, получателю"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </Flex>
      <Table
        {...tableProps}
        rowSelection={rowSelection}
        rowKey="id"
        loading={isLoading}
        style={{ marginTop: 20 }}
        onRow={(record) => ({
          onClick: () => {
            const id = record.id;
            if (id === undefined || id === null) return;
            setSelectedRowKeys((prev) => {
              if (prev.includes(id)) {
                return prev.filter((key) => key !== id);
              } else {
                return [...prev, id];
              }
            });
          },
        })}
      >
        <Table.Column
          title="№"
          dataIndex="index"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          title="Дата приемки"
          dataIndex="good"
          render={(value) =>
            dayjs.utc(value?.created_at).format("DD.MM.YYYY HH:mm")
          }
        />
        <Table.Column
          title="Отправитель"
          dataIndex="good"
          render={(value) =>
            `${value?.sender?.clientPrefix}-${value?.sender?.clientCode} ${value?.sender?.name}`
          }
        />
        <Table.Column title="Номер мешка" dataIndex="bag_number_numeric" />
        <Table.Column
          title="Тип товара"
          dataIndex="product_type"
          render={(value) => value?.name}
        />
        <Table.Column
          title="Получатель"
          dataIndex="good"
          render={(value) =>
            `${value?.recipient?.clientPrefix}-${value?.recipient?.clientCode} ${value?.recipient?.name}`
          }
        />
        <Table.Column title="Количество" dataIndex="quantity" />
        <Table.Column
          title="Вес"
          dataIndex="weight"
          render={(value) => String(value).replace(".", ",").slice(0, 5)}
        />
        <Table.Column title="Статус" dataIndex="status" />
        <Table.Column
          title="Пункт назначения"
          dataIndex="good"
          render={(value, record) =>
            `${value?.destination?.name}, ${record?.good?.sent_back?.name || ""}`
          }
        />
        <Table.Column title="Штрихкод" dataIndex="barcode" />
      </Table>
    </Show>
  );
};

export default ReceivingShow;
