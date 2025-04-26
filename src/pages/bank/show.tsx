import { Show } from "@refinedev/antd";
import { useShow, useCustom, useNavigation } from "@refinedev/core";
import {
  Typography,
  Table,
  Row,
  Col,
  Button,
  Dropdown,
  Card,
  DatePicker,
  Input,
} from "antd";
import { useSelect } from "@refinedev/antd";
import {
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { API_URL } from "../../App";

const { Title } = Typography;
const { Column } = Table;

// Словарь для "type_operation"
export const typeOperationMap: Record<string, string> = {
  supplier_payment: "Оплата поставщику",
  repair_payment: "Оплата за ремонт",
  salary_payment: "Выплата заработной платы",
  advance_payment: "Выдача подотчет",
  cash: "Наличные",
  "1": "Приход (1)", // если у вас встречаются "1" или иные значения
  // ... добавляйте при необходимости
};

export const BankShow = () => {
  const { queryResult } = useShow();
  const { data: showData, isLoading: showLoading } = queryResult;

  // Состояние для сортировки и фильтрации
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "type">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [sorterVisible, setSorterVisible] = useState(false);

  // Состояние для поиска (заменяем два поля на одно)
  const [searchText, setSearchText] = useState<string>("");

  // Данные банка
  const record = showData?.data;
  const bankId = record?.id;

  // Функция для построения параметров запроса
  const buildQueryParams = () => {
    return {
      s:
        searchFilters.length > 0
          ? JSON.stringify({ $and: searchFilters })
          : undefined,
      sort: `${sortField},${sortDirection}`,
    };
  };

  // Запрос операций с сортировкой и фильтрацией
  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/bank/${bankId}`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
    queryOptions: {
      enabled: !!bankId,
    },
  });

  // Функция для обновления фильтров
  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
  };

  // Обновление данных при изменении фильтров или сортировки
  useEffect(() => {
    if (bankId) {
      refetch();
    }
  }, [searchFilters, sortDirection, sortField, bankId]);

  // Компонент выбора даты
  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setFilters(
            [
              {
                date: {
                  $gte: dateStrings[0],
                  $lte: dateStrings[1],
                },
              },
            ],
            "replace"
          );
        }
      }}
    />
  );

  // Компонент сортировки
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
        {/* Сортировка по ID (дате создания) */}
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
        {/* Сортировка по типу операции */}
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "type" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("type");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Типу операции{" "}
          {sortField === "type" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  // Получаем данные операций
  const operations = data?.data?.operation || record?.operation || [];

  // Применяем сортировку и фильтрацию локально, если данные уже загружены
  const filteredOperations = useMemo(() => {
    let result = [...operations];

    // Применяем фильтры
    if (searchFilters.length > 0) {
      searchFilters.forEach((filter) => {
        // Фильтр по дате
        if (filter.date) {
          const { $gte, $lte } = filter.date;
          if ($gte) {
            result = result.filter(
              (op) => new Date(op.date).getTime() >= new Date($gte).getTime()
            );
          }
          if ($lte) {
            result = result.filter(
              (op) => new Date(op.date).getTime() <= new Date($lte).getTime()
            );
          }
        }
      });
    }

    // Применяем общий поиск по коду клиента и трек-коду
    if (searchText) {
      result = result.filter(
        (op) =>
          (op.counterparty_id &&
            op.counterparty_id.toString().includes(searchText)) ||
          (op.goods_id && op.goods_id.toString().includes(searchText))
      );
    }

    // Применяем сортировку
    result.sort((a, b) => {
      if (sortField === "id") {
        return sortDirection === "ASC" ? a.id - b.id : b.id - a.id;
      } else if (sortField === "type") {
        const aValue = a.type || "";
        const bValue = b.type || "";
        return sortDirection === "ASC"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return result;
  }, [operations, searchFilters, sortField, sortDirection, searchText]);

  // Убираем пагинацию - все операции отображаются сразу
  const total = filteredOperations.length;

  // Обработчик изменения таблицы (только сортировка)
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    // Обрабатываем сортировку, если она пришла из таблицы
    if (sorter && sorter.field) {
      setSortField(sorter.field === "type" ? "type" : "id");
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  // Функция для сброса всех фильтров и поиска
  const resetAllFilters = () => {
    setSearchFilters([]);
    setSearchText("");
  };

  const { data: counterparty } = useCustom<any>({
    url: `${API_URL}/counterparty`,
    method: "get",
  });

  const counterparties = counterparty?.data || [];

  const { push } = useNavigation();

  return (
    <Show isLoading={showLoading} headerButtons={() => false}>
      <Title level={5}>История операций: {record?.name}</Title>

      {/* Панель фильтров и сортировки */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            placeholder="Поиск по коду клиента или трек-коду"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            allowClear
          />
        </Col>
        <Col>
          <Dropdown
            overlay={datePickerContent}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />}>Фильтр по дате</Button>
          </Dropdown>
        </Col>
        <Col>
          <Dropdown
            overlay={sortContent}
            trigger={["click"]}
            open={sorterVisible}
            onOpenChange={(visible) => setSorterVisible(visible)}
          >
            <Button>
              Сортировка{" "}
              {sortDirection === "ASC" ? (
                <ArrowUpOutlined />
              ) : (
                <ArrowDownOutlined />
              )}
            </Button>
          </Dropdown>
        </Col>
        {(searchFilters.length > 0 || searchText) && (
          <Col>
            <Button onClick={resetAllFilters}>Сбросить фильтры</Button>
          </Col>
        )}
        <Col>
          {(searchFilters.length > 0 || searchText) && (
            <Typography.Text type="secondary">
              Найдено: {total} записей
            </Typography.Text>
          )}
        </Col>
      </Row>

      <Table
        dataSource={filteredOperations}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        onChange={handleTableChange}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (1 - 1) * 1000 + index + 1;
          }}
        />
        <Column
          title="Дата оплаты"
          dataIndex="date"
          render={(value) =>
            value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "-"
          }
        />
        <Column
          title="Код клиента"
          dataIndex="counterparty_id"
          render={(value) => {
            console.log(value);
            return (
              <p>{`${
                counterparties.find((item: any) => item.id === value)
                  ?.clientPrefix
              }-${
                counterparties.find((item: any) => item.id === value)
                  ?.clientCode
              }`}</p>
            );
          }}
        />
        <Column
          title="Трек-код"
          dataIndex="id"
          render={(value) => (
            <Button
              onClick={() => push(`/income/show/${value}?page=1&size=100`)}
            >
              Посмотреть
            </Button>
          )}
        />
        <Column
          title="Валюта"
          dataIndex="type_currency"
          render={(value) => value || "-"}
        />
        <Column
          title="Сумма"
          dataIndex="amount"
          render={(value, record) => {
            const isIncome = record.type === "income";
            return (
              <span style={{ color: isIncome ? "green" : "red" }}>
                {isIncome ? "+" : "-"}
                {value?.toLocaleString() || 0} {record.type_currency}
              </span>
            );
          }}
        />
        <Column
          title="Тип операции"
          dataIndex="type"
          render={(value) => {
            const isIncome = value === "income";
            return (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  color: isIncome ? "green" : "red",
                  backgroundColor: isIncome
                    ? "rgba(0, 128, 0, 0.1)"
                    : "rgba(255, 0, 0, 0.1)",
                  border: `1px solid ${isIncome ? "green" : "red"}`,
                }}
              >
                {isIncome ? "Приход" : "Расход"}
              </span>
            );
          }}
        />
        <Column
          title="Вид прихода"
          dataIndex="type_operation"
          render={(value) => typeOperationMap[value] ?? value}
        />
        <Column title="Комментарий" dataIndex="comment" />
      </Table>
    </Show>
  );
};
