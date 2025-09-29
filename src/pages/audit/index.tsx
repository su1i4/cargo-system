import { useEffect, useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { List } from "@refinedev/antd";
import { Table, Input, Select, DatePicker, Row, Col, Button } from "antd";
import dayjs from "dayjs";
import { API_URL } from "../../App";

const { RangePicker } = DatePicker;
const { Option } = Select;

const actionsTypes = {
  insert: "Создание",
  update: "Обновление",
  remove: "Удаление",
};

const entitiesTypes = {
  GoodsReception: "Спецификация",
  ProductRelEntity: "Товар",
  ServiceEntity: "Мешок",
  TrackingStatusEntity: "Отслеживание",
  Operation: "Операция",
  BankEntity: "Банк",
  Counterparty: "Контрагент",
  CurrencyEntity: "Валюта",
  CashBack: "Кэшбек",
  Endpoint: "Эндпоинт",
  DiscountEntity: "Скидка",
};

const columns = (users: any) => [
  { dataIndex: "id", title: "ID" },
  {
    dataIndex: "entity",
    title: "Раздел",
    render: (value: string) =>
      entitiesTypes[value as keyof typeof entitiesTypes] || value,
  },
  { dataIndex: "entityId", title: "Entity ID" },
  {
    dataIndex: "changes",
    title: "Изменения",
    render: (value: string) => {
      const changes = JSON.parse(value);
      return Object.entries(changes).map(([key, change]: any) => (
        <div key={key}>
          {key}:{" "}
          {typeof change.old === "object"
            ? JSON.stringify(change.old)
            : change.old}{" "}
          <ArrowRightOutlined />{" "}
          {typeof change.new === "object"
            ? JSON.stringify(change.new)
            : change.new}
        </div>
      ));
    },
  },
  {
    dataIndex: "action",
    title: "Действие",
    render: (value: string) =>
      actionsTypes[value as keyof typeof actionsTypes] || value,
  },
  {
    dataIndex: "userId",
    title: "Пользователь",
    render: (value: string) => {
      const user = users.find((user: any) => user.id === Number(value));
      return user ? user.firstName + " " + user.lastName : null;
    },
  },
  {
    dataIndex: "createdAt",
    title: "Дата",
    render: (value: string) => dayjs(value).utc().format("DD.MM.YYYY HH:mm"),
  },
];

export const Audit = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    entity: "",
    entityId: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });

  const getAudit = async () => {
    try {
      const response = await fetch(
        `${API_URL}/audit?${new URLSearchParams(filters).toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "cargo-system-token"
            )}`,
          },
        }
      );
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getUser = async () => {
    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
      },
    });
    const data = await response.json();
    setUsers(data);
  };

  useEffect(() => {
    getAudit();
  }, [filters]);

  useEffect(() => {
    getUser();
  }, []);

  console.log(users);

  return (
    <List title="Аудит">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Input
            placeholder="Entity"
            value={filters.entity}
            onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
          />
        </Col>
        <Col>
          <Input
            placeholder="Entity ID"
            value={filters.entityId}
            onChange={(e) =>
              setFilters({ ...filters, entityId: e.target.value })
            }
          />
        </Col>
        <Col>
          <Select
            placeholder="Действие"
            value={filters.action || undefined}
            onChange={(value) =>
              setFilters({ ...filters, action: value ?? "" })
            }
            style={{ width: 120 }}
            allowClear
          >
            <Option value={actionsTypes.insert}>{actionsTypes.insert}</Option>
            <Option value={actionsTypes.update}>{actionsTypes.update}</Option>
            <Option value={actionsTypes.remove}>{actionsTypes.remove}</Option>
          </Select>
        </Col>
        <Col>
          <RangePicker
            onChange={(dates) =>
              setFilters({
                ...filters,
                dateFrom: dates ? dates[0]?.toISOString() ?? "" : "",
                dateTo: dates ? dates[1]?.toISOString() ?? "" : "",
              })
            }
          />
        </Col>
      </Row>

      <Table columns={columns(users)} dataSource={data} rowKey="id" />
    </List>
  );
};
