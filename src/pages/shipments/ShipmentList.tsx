import { useState } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CreateButton, List, useSelect, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Button, Dropdown, Flex, Input, Menu, Row, Select, Table } from "antd";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentList = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [selectedCity, setSelectedCity] = useState<string | undefined>(
    undefined
  );

  const { tableProps, setSorters, setFilters } = useTable({
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
      initial: [{ field: "created_at", order: "desc" }],
    },
    syncWithLocation: true,
    meta: {
      join: ["branch"],
    },
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

  const { selectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
    optionValue: "id",
    pagination: { mode: "off" },
  });

  const handleCityFilter = (cityId: string | undefined) => {
    setSelectedCity(cityId);

    const filters: any[] = [
      {
        field: "status",
        operator: "eq",
        value: "В пути",
      },
    ];

    console.log(cityId);

    if (cityId) {
      filters.push({
        field: "branch.id",
        operator: "eq",
        value: cityId,
      });
    }

    if (searchValue.trim() !== "") {
      filters.push({
        operator: "or",
        value: [
          {
            field: "truck_number",
            operator: "contains",
            value: searchValue.trim(),
          },
          {
            field: "employee.firstName",
            operator: "contains",
            value: searchValue.trim(),
          },
          {
            field: "employee.lastName",
            operator: "contains",
            value: searchValue.trim(),
          },
          {
            field: "branch.name",
            operator: "contains",
            value: searchValue.trim(),
          },
        ],
      });
    }

    setFilters(filters, "replace");
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    handleCityFilter(selectedCity); // применяем фильтрацию снова с учетом нового поиска
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

  return (
    <List
      headerButtons={(createButtonProps) => (
        <>
          <Button onClick={() => push("/shipments/history")}>
            История отправлений
          </Button>
          {createButtonProps && <CreateButton {...createButtonProps} />}
        </>
      )}
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
            style={{ width: "100%" }}
          />
          <Select
            {...selectProps}
            allowClear
            placeholder="Фильтр по городу / пункту назначения"
            style={{ width: "100%" }}
            onChange={(value) => {
              handleCityFilter(value as any);
            }}
          />
        </Flex>
      </Row>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => show("shipments", record.id as number),
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          width={10}
          title="№"
          dataIndex="number"
          render={(_, __, index) => index + 1}
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
          render={(value) => value?.toFixed(2)}
        />
        <Table.Column
          width={50}
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column width={50} title="Водитель" dataIndex="driver" />
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

export default ShipmentList;
