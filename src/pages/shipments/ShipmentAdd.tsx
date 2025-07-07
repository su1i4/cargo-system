import { useState, useEffect } from "react";
import { Show, useTable, useSelect } from "@refinedev/antd";
import { useUpdateMany, useNavigation } from "@refinedev/core";
import {
  Input,
  Row,
  Col,
  Table,
  Button,
  Dropdown,
  DatePicker,
  Card,
  Form,
  message,
  Flex,
  Menu,
  Select,
} from "antd";
import { useParams } from "react-router";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { CustomTooltip } from "../../shared/custom-tooltip";

dayjs.extend(utc);

const ShipmentAdd = () => {
  const { id } = useParams();
  const { push } = useNavigation();
  const [form] = Form.useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { tableProps, setFilters, setSorters } = useTable({
    resource: "service",
    pagination: {
      pageSize: 200,
    },
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "На складе",
        },
        {
          field: "shipment_id",
          operator: "eq",
          value: null,
        },
      ],
    },
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  // Состояния для отдельных фильтров
  const [productTypeFilter, setProductTypeFilter] = useState<any>(null);
  const [destinationFilter, setDestinationFilter] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState<any>(null);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "service",
  });

  const { selectProps: productTypeSelectProps } = useSelect({
    resource: "type-product",
    optionLabel: "name",
    optionValue: "id",
  });

  const { selectProps: destinationSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name", 
    optionValue: "id",
  });

  const handleSave = async () => {
    if (selectedRowKeys.length === 0) {
      message.error("Выберите хотя бы один товар");
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.all(
        selectedRowKeys.map(async (key) => {
          await updateManyGoods({
            ids: [key],
            values: {
              id: Number(key),
              shipment_id: Number(id),
              status: "В пути",
              adding: true,
            },
          });
        })
      );

      message.success("Товары успешно добавлены к отгрузке");

      setTimeout(() => {
        push(`/shipments/edit/${id}`);
      }, 500);
    } catch (error) {
      message.error("Ошибка при сохранении: " + error);
      setIsSubmitting(false);
    }
  };

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

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys as number[]);
      setSelectedRows(rows);
    },
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
    { key: "bag_number", label: "Номер мешка" },
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



  // Объединение всех фильтров
  useEffect(() => {
    const allFilters = [
      productTypeFilter,
      destinationFilter,
      searchFilter,
    ].filter(Boolean);
    
    if (allFilters.length > 0) {
      setFilters(
        [
          {
            operator: "and",
            value: allFilters,
          },
        ],
        "replace"
      );
    } else {
      setFilters([], "replace");
    }
  }, [productTypeFilter, destinationFilter, searchFilter]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (value.trim() === "") {
      setSearchFilter(null);
    } else {
      setSearchFilter({
        operator: "or",
        value: [
          {
            field: "bag_number",
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
          {
            field: "good.invoice_number",
            operator: "contains",
            value: value.trim(),
          },
        ],
      });
    }
  };

  const handleProductTypeChange = (value: string | null) => {
    setSelectedProductType(value);
    
    if (!value) {
      setProductTypeFilter(null);
    } else {
      setProductTypeFilter({
        field: "product_type.id",
        operator: "eq",
        value: value,
      });
    }
  };

  const handleDestinationChange = (value: string | null) => {
    setSelectedDestination(value);
    
    if (!value) {
      setDestinationFilter(null);
    } else {
      setDestinationFilter({
        field: "good.destination_id",
        operator: "eq",
        value: value,
      });
    }
  };

  const filterContent = (
    <Card style={{ width: 300, padding: "0px !important" }}>
      <Select
        options={productTypeSelectProps.options}
        loading={productTypeSelectProps.loading}
        placeholder="Выберите тип товара"
        allowClear
        value={selectedProductType}
        onChange={handleProductTypeChange}
        style={{ width: "100%", marginBottom: 20 }}
      />
      <Select
        options={destinationSelectProps.options}
        loading={destinationSelectProps.loading}
        placeholder="Выберите город назначения"
        allowClear
        value={selectedDestination}
        onChange={handleDestinationChange}
        style={{ width: "100%" }}
      />
    </Card>
  );

  return (
    <Show
      headerButtons={() => (
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => push(`/shipments/edit/${id}`)}
        >
          Назад
        </Button>
      )}
      title="Добавление товаров к отгрузке"
    >
      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]} style={{ marginBottom: 10, gap: 10 }}>
          <Flex style={{ width: "100%", padding: "0px 10px" }} gap={10} wrap>
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
            <CustomTooltip title="Фильтры">
              <Dropdown
                overlay={filterContent}
                trigger={["click"]}
                placement="bottomLeft"
                open={filterVisible}
                onOpenChange={(visible) => {
                  setFilterVisible(visible);
                }}
              >
                <Button icon={<FilterOutlined />} />
              </Dropdown>
            </CustomTooltip>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Поиск по номеру мешка, отправителю, получателю"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ minWidth: "300px", maxWidth: "400px" }}
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
            <Button
              type="primary"
              onClick={handleSave}
              loading={isSubmitting}
              disabled={isSubmitting || selectedRowKeys.length === 0}
            >
              Добавить выбранные товары
            </Button>
          </Flex>
        </Row>
        <Table
          {...tableProps}
          rowKey="id"
          rowSelection={rowSelection}
          locale={{
            emptyText: "Нет доступных товаров для добавления",
          }}
          scroll={{ x: 1000 }}
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
          <Table.Column title="Номер мешка" dataIndex="bag_number" />
          <Table.Column
            title="Тип"
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
      </Form>
    </Show>
  );
};

export default ShipmentAdd;
