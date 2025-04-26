import React, { useState, useEffect } from "react";
import { Create, Title, useForm, useSelect, useTable } from "@refinedev/antd";
import { useCustom, useUpdateMany } from "@refinedev/core";
import {
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Table,
  Flex,
  Select,
  Dropdown,
  Button,
  Space,
  Card,
} from "antd";
import { catchDateTable, translateStatus } from "../../lib/utils";
import { API_URL } from "../../App";
import { useSearchParams } from "react-router";
import { CustomTooltip } from "../../shared";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentCreate = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    "id" | "counterparty.name" | "operation_id"
  >("id");
  const [filters, setFilters] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [...filters, { status: { eq: "В складе" } }, { is_consolidated: { $eq: false } },],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
  });

  interface IShipment {
    id?: number;
    type: string;
    boxCode: string;
    branch_id: number;
    weight: string;
    length: string;
    width: string;
    height: string;
    cube: string;
    density: string;
    created_at: any;
  }

  const {
    formProps,
    saveButtonProps: originalSaveButtonProps,
    form,
  } = useForm<IShipment>({
    resource: "shipments",
    onMutationSuccess: async (createdShipment) => {
      const newShipmentId = createdShipment.data.id;
      if (selectedRowKeys.length > 0) {
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            shipment_id: newShipmentId,
            status: "В пути",
          },
        });
      }
    },
  });

  const modifiedFormProps = {
    ...formProps,
    onFinish: async (values: IShipment) => {
      const { cube, ...dataToSubmit } = values;

      if (dataToSubmit.created_at) {
        if (typeof dataToSubmit.created_at === "object") {
          if (dataToSubmit.created_at.$d) {
            dataToSubmit.created_at =
              dataToSubmit.created_at.format("YYYY-MM-DDTHH:mm:ss") + ".100Z";
          } else if (dataToSubmit.created_at instanceof Date) {
            dataToSubmit.created_at = dataToSubmit.created_at.toISOString();
          }
        }
      }

      return formProps.onFinish?.(dataToSubmit);
    },
  };

  const saveButtonProps = {
    ...originalSaveButtonProps,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (selectedRowKeys.length === 0) {
        return form
          .validateFields()
          .then(() => {
            form.setFields([
              {
                name: "_goods",
                errors: ["Необходимо выбрать хотя бы один товар для отправки"],
              },
            ]);
          })
          .catch((errorInfo) => {});
      }

      if (originalSaveButtonProps.onClick) {
        originalSaveButtonProps.onClick(e);
      }
    },
    disabled: isLoading,
  };

  useEffect(() => {
    if (selectedRows.length > 0) {
      const sum = selectedRows.reduce((total, row) => {
        const weight = parseFloat(row.weight) || 0;
        return total + weight;
      }, 0);

      form.setFieldsValue({ weight: sum.toFixed(2) });

      const length = form.getFieldValue("length") || 0;
      const width = form.getFieldValue("width") || 0;
      const height = form.getFieldValue("height") || 0;

      const cube = ((length * width * height) / 1000000).toFixed(5);
      form.setFieldsValue({ cube });

      if (parseFloat(cube) > 0) {
        const density = (sum / parseFloat(cube)).toFixed(5);
        form.setFieldsValue({ density: density });
      }
    } else {
      form.setFieldsValue({ weight: "0", cube: "0", density: "0" });
    }
  }, [selectedRows, form]);

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, []);

  // Обновляем куб и плотность при изменении размеров
  useEffect(() => {
    const updateCalculations = () => {
      const length = form.getFieldValue("length") || 0;
      const width = form.getFieldValue("width") || 0;
      const height = form.getFieldValue("height") || 0;

      if (length && width && height) {
        const cube = ((length * width * height) / 1000000).toFixed(5);
        form.setFieldsValue({ cube });

        const weight = form.getFieldValue("weight") || 0;
        if (parseFloat(cube) > 0 && parseFloat(weight) > 0) {
          const density = (parseFloat(weight) / parseFloat(cube)).toFixed(5);
          form.setFieldsValue({ density: density });
        }
      }
    };

    // Задержка для обеспечения обновления после заполнения полей формы
    const timeoutId = setTimeout(updateCalculations, 100);
    return () => clearTimeout(timeoutId);
  }, [
    form.getFieldValue("length"),
    form.getFieldValue("width"),
    form.getFieldValue("height"),
  ]);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const type = [
    "Одежда",
    "Хозка",
    "Обувь",
    "Головные уборы",
    "Смешка",
    "Ткань",
    "Оборудование",
    "Фурнитура",
    "Автозапчасти",
    "Электро товары",
    "Мебель",
    "Инструменты",
    "Аксессуары",
  ];

  const [sorterVisible, setSorterVisible] = useState(false);

  useEffect(() => {
    if (!searchparams.get("page") && !searchparams.get("size")) {
      searchparams.set("page", String(currentPage));
      searchparams.set("size", String(pageSize));
      setSearchParams(searchparams);
    } else {
      const page = searchparams.get("page");
      const size = searchparams.get("size");
      setCurrentPage(Number(page));
      setPageSize(Number(size));
    }
    refetch();
  }, [filters, sortDirection, currentPage, pageSize]);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    searchparams.set("page", pagination.current);
    searchparams.set("size", pagination.pageSize);
    setSearchParams(searchparams);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    // Обрабатываем сортировку, если она пришла из таблицы
    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const dataSource = data?.data?.data || [];

  const tableProps = {
    dataSource: dataSource,
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          // Fixed: Use consistent filter format
          setFilters([
            {
              created_at: {
                $gte: dateStrings[0],
                $lte: dateStrings[1],
              },
            },
          ]);
        }
      }}
    />
  );

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
        {/* Сортировка по дате создания */}
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
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "counterparty.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("counterparty.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По фио{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "operation_id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("operation_id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По статусу оплаты{" "}
          {sortField === "operation_id" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  //@ts-ignore
  return (
    //@ts-ignore
    <Create
      saveButtonProps={{ ...saveButtonProps, style: { display: "none" } }}
    >
      {/* @ts-ignore */}
      <Form {...modifiedFormProps} layout="vertical">
        {/* Скрытое поле для отображения ошибки выбора товаров */}
        <Form.Item name="_goods" style={{ display: "none" }}>
          <Input />
        </Form.Item>

        <Row style={{ width: "100%" }}>
          <Flex gap={10}>
            <Form.Item
              label="Дата отправки"
              name="created_at"
              style={{ marginBottom: 5 }}
              rules={[{ required: true }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
                placeholder="Выберите дату"
                showTime
              />
            </Form.Item>
            <Form.Item
              style={{ minWidth: 200 }}
              label="Тип"
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                options={type.map((enumValue) => ({
                  label: enumValue,
                  value: enumValue,
                }))}
              />
            </Form.Item>
            <Form.Item
              style={{ width: 250 }}
              label="Код коробки"
              name="boxCode"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ width: 250 }}
              label="Номер фуры"
              name="truck_number"
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ width: 250 }}
              name="branch_id"
              label="Пункт назначения"
              rules={[{ required: true, message: "Введите Пункт назначения" }]}
            >
              <Select {...branchSelectProps} />
            </Form.Item>
          </Flex>
        </Row>
        <Row>
          <Flex gap={10}>
            <Form.Item
              style={{ width: 120 }}
              label="Вес"
              name="weight"
              required={false}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item label="Размеры (Д × Ш × В)" required>
              <Input.Group compact>
                <Form.Item
                  name="length"
                  noStyle
                  rules={[
                    { required: true, message: "Введите длину" },
                    {
                      validator: (_, value) => {
                        if (!value || Number(value) >= 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Минимальная длина — 10см")
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    style={{ width: 100, textAlign: "center" }}
                    placeholder="Длина"
                    onChange={() => {
                      form.validateFields(["width", "height", "length"]);
                    }}
                    type="number"
                  />
                </Form.Item>

                <span style={{ padding: "0 8px" }}>×</span>

                <Form.Item
                  name="width"
                  noStyle
                  rules={[
                    { required: true, message: "Введите ширину" },
                    {
                      validator: (_, value) => {
                        if (!value || Number(value) >= 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Минимальная ширина — 10см")
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    style={{ width: 100, textAlign: "center" }}
                    placeholder="Ширина"
                    onChange={() => {
                      form.validateFields(["length", "height", "width"]);
                    }}
                    type="number"
                  />
                </Form.Item>

                <span style={{ padding: "0 8px" }}>×</span>

                <Form.Item
                  name="height"
                  noStyle
                  rules={[
                    { required: true, message: "Введите высоту" },
                    {
                      validator: (_, value) => {
                        if (!value || Number(value) >= 10) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Минимальная высота — 10см")
                        );
                      },
                    },
                  ]}
                >
                  <Input
                    style={{ width: 100, textAlign: "center" }}
                    placeholder="Высота"
                    onChange={() => {
                      form.validateFields(["length", "width", "height"]);
                    }}
                    type="number"
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
            <Form.Item
              style={{ width: 120 }}
              label="Куб"
              name="cube"
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              style={{ width: 120 }}
              label="Плотность"
              name="density"
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              style={{ width: 150 }}
              label="Вес коробки"
              name="box_weight"
            >
              <Input min={0} type="number" />
            </Form.Item>
          </Flex>
        </Row>

        <Row
          gutter={[16, 16]}
          align="middle"
          style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 100 }}
        >
          <Col>
            <Space size="middle">
              <CustomTooltip title="Сортировка">
                <Dropdown
                  overlay={sortContent}
                  trigger={["click"]}
                  placement="bottomLeft"
                  open={sorterVisible}
                  onOpenChange={(visible) => {
                    setSorterVisible(visible);
                  }}
                >
                  <Button
                    icon={
                      sortDirection === "ASC" ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )
                    }
                  ></Button>
                </Dropdown>
              </CustomTooltip>
            </Space>
          </Col>
          <Col flex="auto">
            <Input
              placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
              prefix={<SearchOutlined />}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setFilters([{ trackCode: { $contL: "" } }]);
                  return;
                }
                setCurrentPage(1);
                searchparams.set("page", "1");
                setSearchParams(searchparams);

                setFilters([
                  {
                    $or: [
                      { trackCode: { $contL: value } },
                      { "counterparty.clientCode": { $contL: value } },
                      { "counterparty.name": { $contL: value } },
                    ],
                  },
                ]);
              }}
            />
          </Col>
          <Col>
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
          </Col>
          <Col>
            <Button type="primary" icon={<SaveOutlined />} {...saveButtonProps}>
              Сохранить
            </Button>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            {form.getFieldError("_goods").length > 0 && (
              <div style={{ color: "#ff4d4f", marginBottom: "12px" }}>
                {form.getFieldError("_goods")[0]}
              </div>
            )}

            <Table
              {...tableProps}
              rowKey="id"
              rowSelection={{
                type: "checkbox",
                preserveSelectedRowKeys: true,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys as number[]);
                  setSelectedRows(rows);

                  if (
                    keys.length > 0 &&
                    form.getFieldError("_goods").length > 0
                  ) {
                    form.setFields([{ name: "_goods", errors: [] }]);
                  }
                },
              }}
              locale={{
                emptyText: "Нет доступных товаров для отправки",
              }}
              scroll={{ x: "max-content" }}
            >
              {catchDateTable("Дата приемки", "В складе")}
              <Table.Column dataIndex="cargoType" title="Тип груза" />
              <Table.Column dataIndex="trackCode" title="Трек-код" />
              <Table.Column
                dataIndex="counterparty"
                title="Код получателя"
                render={(value) => {
                  return value?.clientPrefix + "-" + value?.clientCode;
                }}
              />
              <Table.Column
                dataIndex="counterparty"
                title="ФИО Получателя"
                render={(value) => value?.name}
              />
              <Table.Column
                dataIndex="counterparty"
                title="Пункт назначения"
                render={(value) => value?.branch?.name}
              />
              <Table.Column dataIndex="weight" title="Вес" />
              <Table.Column
                dataIndex="status"
                title="Статус"
                render={(value) => translateStatus(value)}
              />
              <Table.Column dataIndex="comments" title="Комментарий" />
            </Table>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};

export default ShipmentCreate;
