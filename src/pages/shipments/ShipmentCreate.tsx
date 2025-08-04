import { SearchOutlined } from "@ant-design/icons";
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
} from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React, { useState } from "react";
import { API_URL } from "../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentCreate = () => {
  const { form, saveButtonProps, formProps } = useForm({
    redirect: "list",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { list } = useNavigation();

  const { tableProps, setFilters, setSorters, filters } = useTable({
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
      pageSize: 200,
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

  const createService = async (shipmentId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/service/shipment-relation-services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("cargo-system-token")}`,
          },
          body: JSON.stringify({
            shipment_id: shipmentId,
            servicesIds: selectedRowKeys,
          }),
        }
      );

      if (response?.ok) {
        message.success("Сервисы успешно связаны с отгрузкой");
        list("shipments");
      } else {
        message.error("Ошибка при связывании сервисов с отгрузкой");
      }
    } catch (error: any) {
      message.error(
        error?.message || "Ошибка при связывании сервисов с отгрузкой"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinish = (values: any) => {
    if (selectedRowKeys.length === 0) {
      message.error("Выберите хотя бы один сервис");
      return;
    }

    if (isCreating) {
      return;
    }

    setIsCreating(true);

    createShipment(
      {
        resource: "shipments",
        values,
      },
      {
        onSuccess: (data) => {
          const shipmentId = data?.data?.id;
          if (!shipmentId) {
            message.error("Ошибка при создании отгрузки");
            setIsCreating(false);
            return;
          }
          createService(shipmentId as number);
        },
        onError: (error) => {
          message.error("Ошибка при создании отгрузки: " + error);
          setIsCreating(false);
        },
      }
    );
  };

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys: React.Key[]) => {
      if (isCreating) return;
      setSelectedRowKeys(keys);
    },
  };

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState("created_at");

  const sortFields = [
    { key: "good.created_at", label: "Дата приемки" },
    { key: "bag_number_numeric", label: "Номер мешка" },
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
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        loading: isCreating,
        disabled: isCreating,
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
        disabled={isCreating}
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
        <Flex
          style={{ width: "100%", padding: "10px 0px", marginBottom: 10 }}
          gap={10}
        >
          <Dropdown overlay={sortMenu} trigger={["click"]}>
            <Button
              style={{ width: 30, minWidth: 30 }}
              disabled={isCreating}
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
            style={{ width: "100%" }}
            disabled={isCreating}
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
            disabled={isCreating}
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
            style={{ width: "100%" }}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Поиск по номеру мешка, отправителю, получателю, весу, количеству"
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            disabled={isCreating}
          />
        </Flex>
        <Table
          {...tableProps}
          rowKey="id"
          rowSelection={rowSelection}
          loading={isCreating}
          onRow={(record) => ({
            onClick: () => {
              if (isCreating) return;
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
          <Table.Column title="Номер мешка" dataIndex="bag_number_numeric" />
          <Table.Column
            title="Тип товара"
            dataIndex="product_type"
            render={(value) => value?.name}
            width={60}
          />
          <Table.Column
            title="Получатель"
            dataIndex="good"
            render={(value) =>
              `${value?.recipient?.clientPrefix}-${value?.recipient?.clientCode} ${value?.recipient?.name}`
            }
          />
          <Table.Column title="Кол-во" dataIndex="quantity" />
          <Table.Column
            title="Вес"
            dataIndex="weight"
            render={(value) => String(value).replace(".", ",").slice(0, 5)}
          />
          <Table.Column
            title="Пункт назначения"
            dataIndex="good"
            render={(value, record) =>
              `${value?.destination?.name}, ${
                record?.good?.sent_back?.name || ""
              }`
            }
          />
          <Table.Column
            title="Номенклатура"
            dataIndex="nomenclature"
            render={(value) => value?.name}
          />
          <Table.Column title="Статус" dataIndex="status" />
          <Table.Column title="Штрихкод" dataIndex="barcode" />
        </Table>
      </Form>
    </Create>
  );
};

export default ShipmentCreate;
