import React, { useState, useEffect } from "react";
import { Show, useTable, useSelect } from "@refinedev/antd";
import { useUpdateMany, useNavigation, useCustom } from "@refinedev/core";
import {
  Input,
  Table,
  Button,
  Dropdown,
  DatePicker,
  Form,
  message,
  Flex,
  Menu,
  Select,
} from "antd";
import { useParams } from "react-router";
import {
  ArrowLeftOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { API_URL } from "../../App";

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
    syncWithLocation: false,
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

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
    setFilters([
      {
        operator: "and",
        value: [
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
              {
                field: "weight",
                operator: "contains",
                value: value.trim(),
              },
              {
                field: "quantity",
                operator: "contains",
                value: value.trim(),
              },
            ],
          },
        ],
      },
    ]);
  };

  const { data: branch } = useCustom({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const { data: typeProduct } = useCustom({
    url: `${API_URL}/type-product`,
    method: "get",
  });

  const branchIds = React.useMemo(
    () => branch?.data?.map((branch: any) => branch.id),
    [branch]
  );

  const typeProductIds = React.useMemo(
    () => typeProduct?.data?.map((typeProduct: any) => typeProduct.id),
    [typeProduct]
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
        <Flex style={{ width: "100%", marginBottom: 10 }} gap={10} wrap>
          <Dropdown overlay={sortMenu} trigger={["click"]}>
            <Button
              style={{ width: 35 }}
              icon={
                sortDirection === "ASC" ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
            />
          </Dropdown>
          <Select
            placeholder="Выберите пункт назначения"
            options={branch?.data?.map((branch: any) => ({
              label: branch.name,
              value: branch.id,
            }))}
            onChange={(value) => {
              if (value.length === 0) {
                setFilters([
                  {
                    field: "good.destination_id",
                    operator: "in",
                    value: branchIds,
                  },
                ]);
                return;
              }
              setFilters([
                {
                  field: "good.destination_id",
                  operator: "in",
                  value: value,
                },
              ]);
            }}
            mode="multiple"
            style={{ minWidth: 200 }}
            allowClear
          />
          <Select
            title="Выберите тип тов"
            placeholder="Выберите тип товара"
            options={typeProduct?.data?.map((branch: any) => ({
              label: branch.name,
              value: branch.id,
            }))}
            allowClear
            onChange={(value) => {
              if (value.length === 0) {
                setFilters([
                  {
                    field: "product_type.id",
                    operator: "in",
                    value: typeProductIds,
                  },
                ]);
              } else {
                setFilters([
                  {
                    field: "product_type.id",
                    operator: "in",
                    value: value,
                  },
                ]);
              }
            }}
            mode="multiple"
            style={{ minWidth: 200 }}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Поиск по номеру мешка, отправителю, получателю, весу, количеству"
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ minWidth: "200px", maxWidth: "200px" }}
          />
          <Button
            type="primary"
            onClick={handleSave}
            loading={isSubmitting}
            disabled={isSubmitting || selectedRowKeys.length === 0}
          >
            Добавить
          </Button>
        </Flex>
        <Table
          {...tableProps}
          rowKey="id"
          rowSelection={rowSelection}
          locale={{
            emptyText: "Нет доступных товаров для добавления",
          }}
          onRow={(record) => ({
            onClick: () => {
              const id = record.id;
              if (id === undefined || id === null) return;
              setSelectedRowKeys((prev: any[]) => {
                if (prev.includes(id)) {
                  return prev.filter((key) => key !== id);
                } else {
                  return [...prev, id];
                }
              });
            },
          })}
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
          <Table.Column title="Номер мешка" dataIndex="bag_number_numeric" />
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
              `${value?.destination?.name}, ${
                record?.good?.sent_back?.name || ""
              }`
            }
          />
          <Table.Column title="Штрихкод" dataIndex="barcode" />
        </Table>
      </Form>
    </Show>
  );
};

export default ShipmentAdd;
