import { useState, useEffect } from "react";
import { Edit, useForm, useSelect, useTable } from "@refinedev/antd";
import { useUpdateMany, useOne, useNavigation, useShow } from "@refinedev/core";
import {
  Form,
  Input,
  Row,
  Select,
  Col,
  Table,
  Button,
  DatePicker,
  message,
  Tooltip,
  Flex,
  Dropdown,
  Menu,
} from "antd";
import { useParams } from "react-router";
import {
  CalendarOutlined,
  FileAddOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentEdit = () => {
  const { id } = useParams();
  const { push, list } = useNavigation();

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState("created_at");

  const { tableProps, setFilters, setSorters } = useTable({
    resource: "service",
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
          field: "shipment_id",
          operator: "eq",
          value: Number(id),
        },
      ],
    },
    pagination: {
      pageSize: 200,
    },
  });

  const { data: shipmentData, isLoading: isLoadingShipment } = useOne({
    resource: "shipments",
    id: id ? parseInt(id) : 0,
    queryOptions: {
      enabled: !!id,
    },
  });

  const { mutate: updateServices } = useUpdateMany({
    resource: "service",
  });

  const { selectProps: employeeSelectProps } = useSelect({
    resource: "users",
    optionLabel: (record: any) => `${record.firstName} ${record.lastName}`,
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
  });

  const {
    formProps,
    saveButtonProps: originalSaveButtonProps,
    form,
    formLoading,
  } = useForm({
    resource: "shipments",
    action: "edit",
    id,
    redirect: false,
    onMutationSuccess: async (updatedShipment) => {},
  });

  const { queryResult } = useShow({
    resource: "shipments",
    id,
  });
  const record = queryResult.data?.data;

  const handleFinish = async (values: any) => {
    try {
      const allServices = tableProps?.dataSource || [];

      const selectedServices = allServices.filter((item: any) =>
        selectedRowKeys.includes(item.id)
      );
      const unselectedServices = allServices.filter(
        (item: any) => !selectedRowKeys.includes(item.id)
      );

      const updatePromises = [];

      if (unselectedServices.length > 0) {
        const unselectedPromise = new Promise((resolve, reject) => {
          updateServices(
            {
              ids: unselectedServices.map((item: any) => item.id),
              values: {
                shipment_id: null,
                status: "На складе",
              },
            },
            {
              onSuccess: (data) => {
                resolve(data);
              },
              onError: (error) => {
                reject(error);
              },
            }
          );
        });
        updatePromises.push(unselectedPromise);
      }

      if (selectedServices.length > 0) {
        const selectedPromise = new Promise((resolve, reject) => {
          updateServices(
            {
              ids: selectedServices.map((item: any) => item.id),
              values: {
                shipment_id: Number(id),
                status: "В пути",
              },
            },
            {
              onSuccess: (data) => {
                resolve(data);
              },
              onError: (error) => {
                reject(error);
              },
            }
          );
        });
        updatePromises.push(selectedPromise);
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        list("shipments");
      } else {
        message.info("Нет изменений для сохранения");
        list("shipments");
      }
    } catch (error) {
      console.error("Error in handleFinish:", error);
      message.error("Ошибка при обновлении сервисов: " + error);
    }
  };

  const saveButtonProps = {
    ...originalSaveButtonProps,
    onClick: async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      try {

        const values = await form.validateFields();

        form.submit();

        setTimeout(() => {
          handleFinish(values);
        }, 500);
      } catch (error) {
        console.error("Form validation failed:", error);
        message.error("Проверьте заполнение полей формы");
      }
    },
    disabled: formLoading || !!tableProps.loading,
  };

  useEffect(() => {
    if (tableProps?.dataSource && id) {
      const assignedGoods = tableProps.dataSource
        .filter((item: any) => item.shipment_id === parseInt(id as string))
        .map((item: any) => item.id);

      setSelectedRowKeys(assignedGoods);
    }
  }, [tableProps.dataSource, id]);

  useEffect(() => {
    if (shipmentData?.data && form) {
      form.setFieldsValue({
        ...shipmentData.data,
      });
    }
  }, [shipmentData, form]);

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        flight: record.flight,
        number: record.number,
        employee: record.employee,
        driver: record.driver,
        type: record.type,
        destination: record.destination,
        comment: record.comment,
      });
    }
  }, [record, form]);

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as number[]);
    },
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

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={handleDateRangeChange}
    />
  );

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
    ]);
  };

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      headerButtons={() => null}
      isLoading={formLoading || isLoadingShipment}
    >
      <Form {...formProps} form={form} layout="vertical">
        <Row gutter={[16, 0]}>
          <Col span={6}>
            <Form.Item label="Номер рейса" name="truck_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Сотрудник" name="employee_id">
              <Select {...employeeSelectProps} />
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
            <Tooltip title="Подбор остатков">
              <Button
                icon={<FileAddOutlined />}
                onClick={() => {
                  push(`/shipments/show/${id}/adding`);
                }}
                style={{ width: 40 }}
              />
            </Tooltip>
            <Dropdown overlay={sortMenu} trigger={["click"]}>
              <Button
                style={{ width: 40 }}
                icon={
                  sortDirection === "ASC" ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )
                }
              />
            </Dropdown>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Поиск по номеру мешка, отправителю, получателю"
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
          {...tableProps}
          rowKey="id"
          rowSelection={rowSelection}
          onRow={(record) => ({
            onClick: () => {
              const id = record.id;
              const numId = Number(id);
              if (!numId || isNaN(numId)) return;
              setSelectedRowKeys((prev) => {
                if (prev.includes(numId)) {
                  return prev.filter((key) => key !== numId);
                } else {
                  return [...prev, numId];
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
    </Edit>
  );
};

export default ShipmentEdit;
