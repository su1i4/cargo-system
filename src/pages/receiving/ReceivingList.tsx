import { CalendarOutlined, SearchOutlined } from "@ant-design/icons";
import { ArrowDownOutlined } from "@ant-design/icons";
import { ArrowUpOutlined } from "@ant-design/icons";
import { CreateButton, List, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Button, DatePicker, Dropdown, Flex, Input, Menu, Row, Table } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

const ReceivingList = () => {
  const { tableProps, setFilters, setSorters } = useTable({
    resource: "shipments",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
  });

  const { show } = useNavigation();

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates && dateStrings[0] && dateStrings[1]) {
      setFilters([
        {
          field: "created_at",
          operator: "gte",
          value: dateStrings[0],
        },
        {
          field: "created_at",
          operator: "lte",
          value: dateStrings[1],
        },
      ]);
    } else {
      setFilters([]);
    }
  };

  const handleSortChange = (
    field: "id" | "counterparty.name",
    direction: "asc" | "desc"
  ) => {
    setSorters([
      {
        field,
        order: direction,
      },
    ]);
  };

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={handleDateRangeChange}
    />
  );

  const [searchValue, setSearchValue] = useState("");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [sortField, setSortField] = useState<string>("id");

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
    const field = sortFields.find(f => f.key === sortField);
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

  return (
    <List headerButtons={() => null}>
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
          />
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
        </Flex>
      </Row>
      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              show("receiving", record.id as number);
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
          render={(value) => dayjs(value).format("DD.MM.YYYY HH:mm")}
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
        <Table.Column width={50} title="Вес" dataIndex="totalServiceWeight" />
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

export default ReceivingList;
