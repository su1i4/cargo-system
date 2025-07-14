import { useState } from "react";
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ArrowUpOutlined } from "@ant-design/icons";
import {  List, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import {
  Button,
  Dropdown,
  Flex,
  Input,
  Menu,
  Row,
  Table,
  Typography,
} from "antd";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentHistory = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("created_at");

  const { tableProps, setSorters, setFilters } = useTable({
    resource: "shipments",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "Выгрузили",
        },
      ],
    },
    sorters: {
      initial: [{ field: "created_at", order: "desc" }],
    },
    syncWithLocation: false,
  });

  const { push, show } = useNavigation();

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

  const handleSortClick = () => {
    const newDirection = sortDirection === "ASC" ? "DESC" : "ASC";
    handleSort(sortField, newDirection);
  };

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
                field: "truck_number",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "employee.firstName",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "employee.lastName",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "branch.name",
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

  const sortFields = [
    { key: "created_at", label: "Дата отправки" },
    { key: "truck_number", label: "Номер рейса" },
  ];

  const getSortFieldLabel = () => {
    const field = sortFields.find((f) => f.key === sortField);
    return field ? field.label : "Дата отправки";
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

  const [isHovered, setIsHovered] = useState(false);

  return (
    <List
      title={
        <Flex
          justify="center"
          align="center"
          gap={20}
          style={{ width: "100%" }}
        >
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => push("/shipments")}
            style={{
              padding: "8px 10px",
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: isHovered ? "#e0e0e0" : "transparent",
              transition: "background-color 0.2s",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: 16 }} />
          </div>
          <Typography.Title style={{ marginTop: 7 }} level={5}>
            История отправлений
          </Typography.Title>
        </Flex>
      }
      headerButtons={false}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 10, gap: 10 }}>
        <Flex style={{ width: "100%", padding: "0px 10px" }} gap={10}>
          <Dropdown overlay={sortMenu} trigger={["click"]}>
            <Button
              icon={
                sortDirection === "ASC" ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
              // onClick={handleSortClick}
            >
              {getSortFieldLabel()}
            </Button>
          </Dropdown>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Поиск по номеру рейса, сотруднику, пункту назначения..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ width: "50%" }}
          />
        </Flex>
      </Row>
      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              push(`/shipments/history/show/${record.id}`);
            },
          };
        }}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          width={10}
          title="№"
          dataIndex="number"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          title="Дата отправки"
          dataIndex="created_at"
          width={50}
          render={(value) => dayjs(value).utc().format("DD.MM.YYYY HH:mm")}
        />
        <Table.Column width={50} title="Номер рейса" dataIndex="truck_number" />
        <Table.Column
          width={50}
          title="Пункт погрузки"
          dataIndex="employee"
          render={(value) => value?.branch?.name}
        />
        <Table.Column
          width={50}
          title="Количество мест"
          dataIndex="totalService"
        />
        <Table.Column
          width={50}
          title="Вес (кг)"
          dataIndex="totalServiceWeight"
        />
        <Table.Column
          width={50}
          title="Водитель"
          dataIndex="driver"
        />
        <Table.Column
          width={50}
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column
          width={50}
          title="Сотрудник"
          dataIndex="employee"
          render={(value) => `${value?.firstName} ${value?.lastName}`}
        />
        <Table.Column width={50} title="Статус" dataIndex="status" />
      </Table>
    </List>
  );
};

export default ShipmentHistory;
