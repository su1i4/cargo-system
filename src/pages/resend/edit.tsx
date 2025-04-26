import { useState, useEffect } from "react";
import { Edit, useForm, useSelect, useTable } from "@refinedev/antd";
import {
  useUpdateMany,
  useOne,
  useNavigation,
  useCustom,
} from "@refinedev/core";
import {
  Form,
  Input,
  Row,
  Flex,
  Select,
  Col,
  Table,
  Button,
  Space,
  Dropdown,
  Card,
  DatePicker,
} from "antd";
import { useParams, useSearchParams } from "react-router";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  FileAddOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../App";
import { CustomTooltip } from "../../shared";
import { translateStatus } from "../../lib/utils";

// const { tableProps, refetch: refetchGoods } = useTable({
//   resource: "goods-processing",
//   syncWithLocation: false,
//   filters: {
//     permanent: [
//       {
//         field: "shipment_id",
//         operator: "eq",
//         value: Number(id),
//       },
//       {
//         field: "status",
//         operator: "eq",
//         value: "В пути",
//       },
//     ],
//   },
// });

const ResendEdit = () => {
  const { id } = useParams();
  const { push } = useNavigation();

  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    "id" | "counterparty.name" | "operation_id"
  >("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          { shipment_id: { $eq: Number(id) } },
          { status: { $eq: "В пути" } },
        ],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: currentPage * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [sorterVisible, setSorterVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);

  // Получаем данные текущей отправки для редактирования
  const { data: shipmentData, isLoading: isLoadingShipment } = useOne({
    resource: "shipments",
    id: id ? parseInt(id) : 0,
    queryOptions: {
      enabled: !!id,
    },
  });

  /**
   * Хук для массового обновления (updateMany) товаров.
   */
  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess(data, variables, context) {
        push(`/resend/show/${id}`);
      },
    },
  });

  /**
   * Хук формы для редактирования "shipments".
   */
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
    onMutationSuccess: async (updatedShipment) => {
      // Получаем ID отправки
      const shipmentId = updatedShipment.data.id;

      // Удаляем старые связи (товары, у которых больше не выбраны чекбоксы)
      const currentAssignedGoods =
        tableProps?.dataSource
          ?.filter((item: any) => item.shipment_id === parseInt(id as string))
          .map((item: any) => item.id) || [];

      // Находим товары, которые были откреплены (были в отправке, но сейчас не выбраны)
      const unassignedGoods = currentAssignedGoods.filter(
        (goodId: number) => !selectedRowKeys.includes(goodId)
      );

      // Обновляем открепленные товары (возвращаем в статус "В складе")
      if (unassignedGoods.length > 0) {
        updateManyGoods({
          ids: unassignedGoods,
          values: {
            shipment_id: null,
            status: "В складе",
          },
        });
      }

      // Обновляем выбранные товары (привязываем к отправке)
      if (selectedRowKeys.length > 0) {
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            shipment_id: shipmentId,
            status: "В пути",
          },
        });
      }
    },
  });

  const allValues = Form.useWatch([], form);

  // Модифицируем props кнопки сохранения, чтобы добавить проверку на наличие товаров
  const saveButtonProps = {
    ...originalSaveButtonProps,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      // if (selectedRowKeys.length === 0) {
      //   // Показываем предупреждение, если товары не выбраны
      //   return form
      //     .validateFields()
      //     .then(() => {
      //       // Если форма валидна, но товары не выбраны - показываем ошибку
      //       form.setFields([
      //         {
      //           name: "_goods",
      //           errors: ["Необходимо выбрать хотя бы один товар для отправки"],
      //         },
      //       ]);
      //     })
      //     .catch((errorInfo) => {
      //       // Стандартная обработка ошибок валидации формы
      //     });
      // }

      // Если товары выбраны, вызываем оригинальный обработчик
      if (originalSaveButtonProps.onClick) {
        originalSaveButtonProps.onClick(e);
      }
    },
    disabled: isLoading,
  };

  // Получаем данные о связанных товарах
  //@ts-ignore

  // После загрузки данных автоматически выбираем товары, которые уже привязаны к отправке
  useEffect(() => {
    if (tableProps?.dataSource && id) {
      const assignedGoods = tableProps.dataSource
        .filter((item: any) => item.shipment_id === parseInt(id as string))
        .map((item: any) => item.id);

      setSelectedRowKeys(assignedGoods);
      setSelectedRows(
        tableProps.dataSource.filter((item: any) =>
          assignedGoods.includes(item.id)
        )
      );
    }
  }, [data, id]);

  // Заполняем форму данными отправки после их загрузки
  useEffect(() => {
    if (shipmentData?.data && form) {
      form.setFieldsValue({
        ...shipmentData.data,
      });
    }
  }, [shipmentData, form]);

  // Рассчитываем общий вес при изменении выбранных строк
  useEffect(() => {
    if (selectedRows.length > 0) {
      const sum = selectedRows.reduce((total, row) => {
        const weight = parseFloat(row.weight) || 0;
        return total + weight;
      }, 0);

      setTotalWeight(sum);
      form.setFieldsValue({ weight: sum });

      // Расчитываем "куб" и "плотность"
      const length = form.getFieldValue("length") || 0;
      const width = form.getFieldValue("width") || 0;
      const height = form.getFieldValue("height") || 0;

      const cube = (length * width * height) / 1000000;
      form.setFieldsValue({ cube });

      if (cube > 0) {
        const boxWeight = Number(form.getFieldValue("box_weight") || 0);
        const density = (sum + boxWeight) / cube;
        form.setFieldsValue({ density });
      }
    } else {
      setTotalWeight(0);
      form.setFieldsValue({ weight: 0 });

      const length = form.getFieldValue("length") || 0;
      const width = form.getFieldValue("width") || 0;
      const height = form.getFieldValue("height") || 0;

      if (length && width && height) {
        const cube = (length * width * height) / 1000000;
        form.setFieldsValue({ cube });

        form.setFieldsValue({ density: 0 });
      } else {
        form.setFieldsValue({ cube: 0, density: 0 });
      }
    }
  }, [selectedRows, form]);

  useEffect(() => {
    const updateCalculations = () => {
      const length = form.getFieldValue("length") || 0;
      const width = form.getFieldValue("width") || 0;
      const height = form.getFieldValue("height") || 0;

      if (length && width && height) {
        const cube = (length * width * height) / 1000000;
        form.setFieldsValue({ cube });

        const itemWeight = parseFloat(form.getFieldValue("weight") || 0);
        const boxWeight = parseFloat(form.getFieldValue("box_weight") || 0);
        const totalWeight = itemWeight + boxWeight;

        if (cube > 0 && totalWeight > 0) {
          const density = totalWeight / cube;
          form.setFieldsValue({ density });
        }
      }
    };

    const timeoutId = setTimeout(updateCalculations, 100);
    return () => clearTimeout(timeoutId);
  }, [
    form.getFieldValue("length"),
    form.getFieldValue("width"),
    form.getFieldValue("height"),
    form.getFieldValue("box_weight"),
  ]);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const { selectProps: userSelectProps } = useSelect({
    resource: "users",
    optionLabel: "firstName",
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
  }, [searchFilters, sortDirection, currentPage, pageSize]);

  const dataSource = data?.data?.data || [];

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setFilters(
            [
              {
                created_at: {
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

  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
    // We'll refetch in useEffect after state updates
  };

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

  // Формируем пропсы для таблицы из данных useCustom
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

  return (
    <Edit
      //@ts-ignore
      saveButtonProps={{ ...saveButtonProps, style: { display: "none" } }}
      headerButtons={() => false}
      isLoading={formLoading || isLoadingShipment}
      goBack={false}
    >
      <Form {...formProps} layout="vertical">
        {/* Скрытое поле для отображения ошибки выбора товаров */}
        <Form.Item name="_goods" style={{ display: "none" }}>
          <Input />
        </Form.Item>

        <Row style={{ width: "100%" }}>
          <Flex gap={10}>
            {/* <Form.Item
              label="Дата отправки"
              name="created_at"
              style={{ marginBottom: 5 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
                placeholder="Выберите дату"
                showTime
              />
            </Form.Item> */}
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
              rules={[{ required: true, message: "Введите Пунк назначения" }]}
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
              style={{ width: 150 }}
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

        <Flex
          gap={10}
          style={{ marginBottom: 10, position: "sticky", top: 80, zIndex: 100 }}
        >
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
          <Input
            style={{ width: "90%" }}
            placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
            prefix={<SearchOutlined />}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([{ trackCode: { $contL: "" } }], "replace");
                setSearchParams(searchparams);
                return;
              }

              searchparams.set("page", "1");
              searchparams.set("size", String(pageSize));
              setSearchParams(searchparams);
              setSearch(value);
              setFilters(
                [
                  {
                    $or: [
                      { trackCode: { $contL: value } },
                      { "counterparty.clientCode": { $contL: value } },
                      { "counterparty.name": { $contL: value } },
                    ],
                  },
                ],
                "replace"
              );
            }}
          />
          <Dropdown
            overlay={datePickerContent}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />} className="date-picker-button">
              Дата
            </Button>
          </Dropdown>
          <Button type="primary" icon={<SaveOutlined />} {...saveButtonProps}>
            Сохранить
          </Button>
        </Flex>
        <Row gutter={16}>
          <Col span={24}>
            {/* Показываем сообщение об ошибке, если форма была отправлена без выбора товаров */}
            {form.getFieldError("_goods")?.length > 0 && (
              <div style={{ color: "#ff4d4f", marginBottom: "12px" }}>
                {form.getFieldError("_goods")[0]}
              </div>
            )}

            <Table
              {...tableProps}
              rowKey="id"
              rowSelection={{
                type: "checkbox",
                selectedRowKeys: selectedRowKeys,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys as number[]);
                  setSelectedRows(rows);

                  // Сбрасываем ошибку при выборе товаров
                  if (
                    keys.length > 0 &&
                    form.getFieldError("_goods")?.length > 0
                  ) {
                    form.setFields([{ name: "_goods", errors: [] }]);
                  }
                },
              }}
              locale={{
                emptyText: "Нет доступных товаров для отправки",
              }}
              pagination={{ showSizeChanger: true }}
            >
              <Table.Column
                dataIndex="created_at"
                title="Дата"
                render={(value) => {
                  return `${value?.split("T")[0]} ${value
                    ?.split("T")[1]
                    ?.slice(0, 5)}`;
                }}
              />
              <Table.Column dataIndex="cargoType" title="Тип груза" />
              <Table.Column dataIndex="trackCode" title="Треккод" />

              <Table.Column
                dataIndex="counterparty"
                title="Код получателя"
                render={(value) => {
                  return value?.clientPrefix + "-" + value?.clientCode;
                }}
              />

              <Table.Column
                dataIndex="status"
                title="Статус"
                render={(value) => translateStatus(value)}
              />
              <Table.Column
                dataIndex="counterparty"
                render={(value) =>
                  `${value?.branch?.name},${value?.under_branch?.address || ""}`
                }
                title="Пункт назначения, Пвз"
              />
              <Table.Column dataIndex="weight" title="Вес" />
              <Table.Column dataIndex="comments" title="Комментарий" />
            </Table>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};

export default ResendEdit;
