import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { ArrowDownOutlined } from "@ant-design/icons";
import { ArrowUpOutlined } from "@ant-design/icons";
import { Create, useForm, useTable, useSelect } from "@refinedev/antd";
import {
  useUpdateMany,
  useCreate,
  useNavigation,
  useCustom,
} from "@refinedev/core";
import {
  Col,
  Form,
  Input,
  Row,
  Select,
  Table,
  Button,
  message,
  Flex,
  Dropdown,
  Menu,
  Card,
} from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import { CustomTooltip } from "../../shared/custom-tooltip";
import { API_URL } from "../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentCreate = () => {
  const { form, saveButtonProps, formProps } = useForm({
    redirect: "list",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { list } = useNavigation();

  const { tableProps, setSorters, setFilters } = useTable({
    resource: "service",
    filters: {
      permanent: [
        {
          operator: "or",
          value: [
            {
              field: "status",
              operator: "eq",
              value: "На складе",
            },
          ],
        },
      ],
    },
    pagination: {
      pageSize: 100,
    },
    syncWithLocation: false,
  });

  const { mutate: updateServices } = useUpdateMany({
    resource: "service",
  });

  const { selectProps: typeSelectProps } = useSelect({
    resource: "type-product",
    optionLabel: (record: any) => record.name,
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => record.name,
    onSearch(value) {
      return value
        ? [
            {
              field: "name",
              operator: "contains",
              value: value,
            },
          ]
        : [];
    },
    filters: [
      {
        field: "name",
        operator: "ne",
        value: "Бишкек",
      },
      {
        field: "is_sent",
        operator: "eq",
        value: false,
      },
    ],
  });

  const { mutate: createShipment } = useCreate();

  const handleFinish = (values: any) => {
    if (selectedRowKeys.length === 0) {
      message.error("Выберите хотя бы один сервис");
      return;
    }

    createShipment(
      {
        resource: "shipments",
        values,
      },
      {
        onSuccess: (data) => {
          const shipmentId = data.data.id;

          updateServices(
            {
              resource: "service",
              ids: selectedRowKeys as number[],
              values: {
                shipment_id: shipmentId,
                status: "В пути",
              },
            },
            {
              onSuccess: () => {
                list("shipments");
              },
              onError: (error) => {
                message.error("Ошибка при обновлении сервисов: " + error);
              },
            }
          );
        },
        onError: (error) => {
          message.error("Ошибка при создании отгрузки: " + error);
        },
      }
    );
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      console.log("Выбранные ключи:", keys);
      setSelectedRowKeys(keys);
    },
  };

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("created_at");

  const sortFields = [
    { key: "good.created_at", label: "Дата приемки" },
    { key: "bag_number", label: "Номер мешка" },
  ] as const;

  type SortFieldKey = (typeof sortFields)[number]["key"];
  type SortDirection = "ASC" | "DESC";

  const handleSort = (field: SortFieldKey, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setSorters([
      {
        field,
        //@ts-ignore
        order: direction.toLowerCase() as "ascend" | "descend",
      },
    ]);
  };

  const getSortFieldLabel = (): string => {
    const field = sortFields.find((f) => f.key === sortField);
    return field ? field.label : "Дата приемки";
  };

  const sortMenu = (
    <Menu
      items={sortFields.map((field) => ({
        key: field.key,
        label: field.label,
        children: [
          {
            key: `${field.key}-asc`,
            label: (
              <>
                <ArrowUpOutlined /> По возрастанию
              </>
            ),
            onClick: () => handleSort(field.key, "ASC"),
          },
          {
            key: `${field.key}-desc`,
            label: (
              <>
                <ArrowDownOutlined /> По убыванию
              </>
            ),
            onClick: () => handleSort(field.key, "DESC"),
          },
        ],
      }))}
    />
  );

  const sortedData = [...(tableProps?.dataSource ?? [])].sort(
    (a: any, b: any) => {
      if (sortField === "bag_number") {
        const extractNumber = (val: string) => {
          const parts = val.split("|");
          return parseInt(parts[1]?.trim() ?? "0", 10);
        };

        const aVal = extractNumber(a.bag_number);
        const bVal = extractNumber(b.bag_number);

        return sortDirection === "ASC" ? aVal - bVal : bVal - aVal;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      return sortDirection === "ASC"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
        ? 1
        : -1;
    }
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
            ],
          },
        ],
        "replace"
      );
    }
  };

  const { data: branch } = useCustom({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const { data: typeProduct } = useCustom({
    url: `${API_URL}/type-product`,
    method: "get",
  });

  const [filterVisible, setFilterVisible] = useState(false);

  const filterContent = (
    <Card style={{ width: 300, padding: "0px !important" }}>
      <Select
        placeholder="Выберите пункт назначения"
        options={branch?.data?.map((branch: any) => ({
          label: branch.name,
          value: branch.id,
        }))}
        style={{ width: "100%", marginBottom: 20 }}
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
          setFilters(
            [
              {
                field: "product_type.id",
                operator: "eq",
                value: value,
              },
            ],
            "replace"
          );
        }}
        style={{ width: "100%" }}
      />
    </Card>
  );

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          form.submit();
        },
      }}
    >
      <Form
        {...formProps}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={[16, 0]}>
          <Col span={6}>
            <Form.Item label="Номер рейса" name="truck_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Водитель" name="driver">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Тип" name="type_product_id">
              <Select {...typeSelectProps} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Пункт назначения" name="branch_id">
              <Select {...branchSelectProps} />
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item label="Комментарий" name="comment">
              <Input />
            </Form.Item>
          </Col>
        </Row>
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
                <Button style={{ width: 40 }} icon={<FilterOutlined />} />
              </Dropdown>
            </CustomTooltip>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Поиск по номеру мешка, отправителю, получателю"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Flex>
        </Row>
        <Table
          {...tableProps}
          dataSource={sortedData}
          rowKey="id"
          rowSelection={rowSelection}
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
              dayjs(value?.created_at).utc().format("DD.MM.YYYY HH:mm")
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
            render={(value) => value?.destination?.name}
          />
          <Table.Column title="Штрихкод" dataIndex="barcode" />
          <Table.Column
            title="Номенклатура"
            dataIndex="nomenclature"
            render={(value) => value?.name}
          />
        </Table>
      </Form>
    </Create>
  );
};

export default ShipmentCreate;
