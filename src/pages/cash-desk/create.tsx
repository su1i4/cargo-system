import React, { Key, useEffect, useState } from "react";
import { Create, useSelect, useForm } from "@refinedev/antd";
import {
  BaseRecord,
  useCustom,
  useNavigation,
  useOne,
  useUpdateMany,
} from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Upload,
} from "antd";
import dayjs from "dayjs";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  PaperClipOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../App";
import TextArea from "antd/lib/input/TextArea";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateStatus } from "../../lib/utils";
import { useNavigate } from "react-router";

dayjs.extend(utc);
dayjs.extend(timezone);

export enum CurrencyType {
  Usd = "Доллар",
  Rub = "Рубль",
  Som = "Сом",
  Cny = "Юань",
}

export const CashDeskCreate: React.FC = () => {
  const { push } = useNavigation();
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<BaseRecord[]>([]);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: async (data: any, variables, context) => {
        refetch();
        push("/income");
      },
    },
  });

  const { formProps, saveButtonProps, form } = useForm({
    onMutationSuccess(data, variables, context, isAutoSave) {
      const id = data?.data?.id;
      if (selectedRowKeys.length > 0) {
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            operation_id: id,
          },
        });
      } else {
        navigate("/income");
      }
    },
    resource: "cash-desk",
    redirect: false,
    //@ts-ignore
    defaultValues: {
      type: "income",
      type_operation: "Извне",
      date: dayjs(),
    },
  });

  const [isAgent, setIsAgent] = useState(false);
  const [sorterVisible, setSorterVisible] = useState(false);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [filters, setFilters] = useState<any>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const { data: currency = { data: [] } } = useCustom<any>({
    url: `${API_URL}/currency`,
    method: "get",
  });

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: {
        s: JSON.stringify({
          $and: [
            {
              "counterparty.id": {
                $eq:
                  form?.getFieldValue("counterparty_id") === undefined
                    ? 0
                    : form?.getFieldValue("counterparty_id"),
              },
              operation_id: {
                $eq: null,
              },
            },
            ...filters,
          ],
        }),
        sort: `${sortField},${sortDirection}`,
        limit: pageSize,
        page: currentPage,
        offset: (currentPage - 1) * pageSize,
      },
    },
  });

  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<
    string | null
  >(null);

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) =>
      `${item.name} ${item.clientPrefix}-${item.clientCode}`,
    filters: [
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value: "" },
          { field: "clientCode", operator: "contains", value: "" },
          { field: "clientPrefix", operator: "contains", value: "" },
        ],
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          { field: "name", operator: "contains", value },
          { field: "clientCode", operator: "contains", value },
          { field: "clientPrefix", operator: "contains", value },
        ],
      },
    ],
  });

  useEffect(() => {
    if (form) {
      form.setFieldValue("type", "income");
    }
  }, [form]);

  useEffect(() => {
    if (formProps.form) {
      if (isAgent) {
        let rate = 0;
        const currentValue: any = formProps.form.getFieldValue("type_currency");
        if (currentValue) {
          rate =
            currency.data?.find((item: any) => item.name === currentValue)
              ?.rate || 0;
        }
        const totalAmount = selectedRows.reduce(
          (acc, row) => acc + Number(row.amount),
          0
        );
        const transformAmount = rate > 0 ? rate * totalAmount : totalAmount;
        formProps.form.setFieldsValue({ amount: transformAmount });
      } else {
        const currentValues: any = formProps.form.getFieldsValue();

        const resetValues = Object.keys(currentValues).reduce(
          (acc: any, key: any) => {
            if (
              key === "income" ||
              key === "type_operation" ||
              key === "date" ||
              key === "type"
            ) {
              acc[key] = currentValues[key];
            } else {
              acc[key] = undefined;
            }
            return acc;
          },
          {}
        );

        formProps.form.setFieldsValue(resetValues);
      }
    }
  }, [isAgent, selectedRows, currency.data]);

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const { data: counterpartyData } = useOne({
    resource: "counterparty",
    id: selectedCounterpartyId ?? "",
    queryOptions: {
      enabled: !!selectedCounterpartyId,
    },
  });

  const currentDateDayjs = dayjs();

  useEffect(() => {
    if (counterpartyData && counterpartyData.data) {
      // @ts-ignore
      formProps.form.setFieldsValue({
        name: counterpartyData.data.name,
      });
    }
    if (formProps.form) {
      formProps.form.setFieldsValue({
        date: currentDateDayjs,
      });
    }
  }, [counterpartyData, formProps.form]);

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        type_operation: "Извне",
      });
    }
  }, []);

  const handleCounterpartyChange = (value: any) => {
    setSelectedCounterpartyId(value);
  };

  const paymentTypes = [
    "Оплата наличными",
    "Оплата переводом",
    "Оплата перечислением",
  ];

  const incomeTypes = ["Извне", "Контрагент"];

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const dataSource = data?.data?.data;

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

  const handleRowSelectionChange = (
    selectedRowKeys: Key[],
    selectedRows: BaseRecord[],
    info: { type: "all" | "none" | "invert" | "single" | "multiple" }
  ) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
    setSelectedRows(selectedRows);
  };

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
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
      </div>
    </Card>
  );

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          // Ensure type field is set before submitting
          form.setFieldValue("type", "income");
          saveButtonProps.onClick && saveButtonProps.onClick();
        },
      }}
      title={<h3 style={{ margin: 0 }}>Добавить приход</h3>}
    >
      <Form
        {...formProps}
        layout="vertical"
        style={{ marginBottom: 0 }}
        initialValues={{
          type: "income",
        }}
        onFinish={(values) => {
          const finalValues = {
            ...values,
            type: "income",
          };

          formProps.onFinish && formProps.onFinish(finalValues);
        }}
      >
        <Form.Item name="type" hidden={true} initialValue="income">
          <Input />
        </Form.Item>

        <Row gutter={[16, 2]}>
          <Col span={6}>
            <Form.Item
              label="Дата поступление"
              name="date"
              style={{ marginBottom: 5 }}
            >
              <DatePicker
                disabled={true}
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Банк"
              name={["bank_id"]}
              rules={[{ required: true, message: "Пожалуйста, выберите Банк" }]}
              style={{ marginBottom: 5 }}
            >
              <Select
                {...bankSelectProps}
                placeholder="Выберите код банк"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Вид прихода"
              name="type_operation"
              rules={[
                {
                  required: true,
                  message: "Пожалуйста, выберите вид прихода",
                },
              ]}
              style={{ marginBottom: 5 }}
            >
              <Select
                options={incomeTypes.map((enumValue) => ({
                  label: enumValue,
                  value: enumValue,
                }))}
                placeholder="Выберите вид прихода"
                style={{ width: "100%" }}
                onChange={(e) => {
                  setIsAgent(e === "Контрагент" ? true : false);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Метод оплаты"
              name="method_payment"
              rules={[
                {
                  required: true,
                  message: "Пожалуйста, выберите метод оплаты",
                },
              ]}
              // Настройка отступов между лейблом и инпутом
              style={{ marginBottom: 5 }}
            >
              <Select
                options={paymentTypes.map((enumValue) => ({
                  label: enumValue,
                  value: enumValue,
                }))}
                placeholder="Выберите вид прихода"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          {isAgent && (
            <>
              <Col span={10}>
                <Form.Item
                  label="Код Клиента"
                  name="counterparty_id"
                  rules={[
                    { required: true, message: "Пожалуйста, выберите клиента" },
                  ]}
                  style={{ marginBottom: 5 }}
                >
                  <Select
                    {...counterpartySelectProps}
                    onChange={handleCounterpartyChange}
                    placeholder="Выберите код клиента"
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={false}
                  />
                </Form.Item>
              </Col>
            </>
          )}
          <Col span={isAgent ? 7 : 12}>
            <Form.Item
              name="type_currency"
              label="Валюта"
              rules={[{ required: true, message: "Выберите Валюту" }]}
            >
              <Select
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value) => {
                  if (isAgent && value) {
                    let rate = 0;
                    if (value) {
                      rate =
                        currency.data?.find((item: any) => item.name === value)
                          ?.rate || 0;
                    }
                    const totalAmount = selectedRows.reduce(
                      (acc, row) => acc + Number(row.amount),
                      0
                    );
                    const transformAmount =
                      rate > 0 ? rate * totalAmount : totalAmount;
                    //@ts-ignore
                    formProps.form.setFieldsValue({ amount: transformAmount });
                  }
                }}
                options={Object.values(CurrencyType).map((item: any) => ({
                  label: `${item}`,
                  value: item,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={isAgent ? 7 : 12}>
            <Form.Item
              label="Сумма"
              name="amount"
              rules={[{ required: true, message: "Укажите сумму" }]}
              style={{ marginBottom: 5 }}
            >
              <Input
                type="number"
                disabled={isAgent}
                min={0}
                placeholder="Введите сумму прихода"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Комментарий"
              name="comment"
              rules={[{ required: false }]}
              style={{ marginBottom: 5 }}
            >
              <TextArea
                placeholder="Комментарий"
                style={{ width: "100%", height: 63 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Чек">
              <Form.Item name="check_file" noStyle>
                <Upload.Dragger
                  name="file"
                  action={`${API_URL}/file-upload`}
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  beforeUpload={(file) => {
                    // Создаем объект FormData для отправки файла
                    const formData = new FormData();
                    formData.append("file", file);

                    // Отправляем запрос на сервер для получения пути к файлу
                    fetch(`${API_URL}/file-upload`, {
                      method: "POST",
                      body: formData,
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        // Предполагаем, что сервер возвращает объект с путем к файлу
                        const filePath = data.path || data.url || data.filePath;
                        // Устанавливаем путь к файлу в форму
                        if (formProps.form) {
                          formProps.form.setFieldsValue({
                            check_file: filePath,
                          });
                        }
                      })
                      .catch((error) => {
                        console.error("Ошибка загрузки файла:", error);
                      });

                    // Предотвращаем стандартную загрузку Ant Design
                    return false;
                  }}
                >
                  <p className="ant-upload-text">
                    <PaperClipOutlined /> Прикрепить чек
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {isAgent && (
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space size="middle">
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
        </Row>
      )}

      {isAgent && (
        <Table
          {...tableProps}
          rowKey="id"
          scroll={{ x: "max-content" }}
          rowSelection={{
            type: "checkbox",
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: handleRowSelectionChange,
          }}
        >
          <Table.Column
            dataIndex="created_at"
            title="Дата приемки"
            render={(value) =>
              value ? dayjs(value).format("DD.MM.YYYY HH:MM") : ""
            }
          />
          <Table.Column dataIndex="trackCode" title="Трек-код" />
          <Table.Column dataIndex="cargoType" title="Тип груза" />
          <Table.Column
            dataIndex="counterparty"
            title="Код получателя"
            render={(value) => {
              return value?.clientPrefix + "-" + value?.clientCode;
            }}
          />
          <Table.Column
            dataIndex="counterparty"
            title="ФИО получателя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="counterparty"
            render={(value) => (
              <p
                style={{
                  width: "200px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {`${value?.branch?.name}, ${
                  value?.under_branch?.address || ""
                }`}
              </p>
            )}
            title="Пункт назначения, Пвз"
          />
          <Table.Column dataIndex="weight" title="Вес" />
          <Table.Column
            dataIndex="counterparty"
            title="Тариф клиента"
            render={(value, record) => {
              return `${(
                Number(value?.branch?.tarif || 0) -
                Number(record?.counterparty?.discount?.discount || 0)
              ).toFixed(2)}`;
            }}
          />

          <Table.Column dataIndex="amount" title="Сумма" />
          <Table.Column
            dataIndex="discount"
            title="Скидка"
            render={(value, record) => {
              return `${(
                Number(value) + Number(record?.discount_custom)
              ).toFixed(2)}`;
            }}
          />
          <Table.Column
            dataIndex="status"
            title="Статус"
            render={(value) => translateStatus(value)}
          />
          <Table.Column
            dataIndex="employee"
            title="Сотрудник"
            render={(value) => {
              return `${value?.firstName}-${value?.lastName}`;
            }}
          />
          <Table.Column dataIndex="comments" title="Комментарий" />
        </Table>
      )}
    </Create>
  );
};
