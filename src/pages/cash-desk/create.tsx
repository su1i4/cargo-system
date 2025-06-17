import React, { useEffect, useState } from "react";
import { Create, useSelect, useForm } from "@refinedev/antd";
import {
  useCustom,
  useNavigation,
  useOne,
  useUpdateMany,
} from "@refinedev/core";
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Input,
  message,
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
import { useNavigate } from "react-router";

dayjs.extend(utc);
dayjs.extend(timezone);

export enum CurrencyType {
  Usd = "Доллар",
  Rub = "Рубль",
  Som = "Сом",
}

export const CashDeskCreate: React.FC = () => {
  const { push } = useNavigation();
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Mutate function to update multiple goods (e.g., link them to the new cash-desk operation)
  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: async (data: any, variables, context) => {
        refetch(); // Refetch goods data after update
        push("/income"); // Navigate to income page
      },
    },
  });

  // Form hook for creating a cash-desk entry
  const { formProps, saveButtonProps, form } = useForm({
    onMutationSuccess(data, variables, context, isAutoSave) {
      const id = data?.data?.id; // Get the ID of the newly created cash-desk entry
      if (selectedRowKeys.length > 0) {
        // If goods were selected, update them with the cash-desk operation ID
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            operation_id: id,
          },
        });
      } else {
        // If no goods were selected (e.g., direct income), navigate
        navigate("/income");
      }
    },
    resource: "cash-desk",
    redirect: false, // Prevent default redirection
    //@ts-ignore
    defaultValues: {
      type: "income", // Default type for cash desk entry
      type_operation: "Извне", // Default operation type
      date: dayjs(), // Default date to current day
    },
  });

  const [isAgent, setIsAgent] = useState(false); // State to control visibility of agent-related fields and table
  const [sorterVisible, setSorterVisible] = useState(false); // State for sort dropdown visibility
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC"); // Sorting direction
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id"); // Field to sort by
  const [filters, setFilters] = useState<any>([]); // Filters for the goods table
  const [currentPage, setCurrentPage] = useState(1); // Current page for goods table
  const [pageSize, setPageSize] = useState(100); // Page size for goods table
  const [change, setChange] = useState(0); // Dummy state to trigger useEffect for amount calculation
  const [bolik, setBolik] = useState(false); // True for "Контрагент частично" (partial payment), enables single selection

  // Fetch currency data
  const { data: currency = { data: [] }, isLoading: currencyLoading } =
    useCustom<any>({
      url: `${API_URL}/currency`,
      method: "get",
    });

  const [selectedType, setSelectedType] = useState<string | null>(null); // To determine if sender or recipient
  const [selectedReceipientId, setSelectedReceipientId] = useState<
    string | null
  >(null); // For fetching counterparty details (though not directly used now)

  // Fetch goods-processing data based on filters, sorting, and pagination
  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: {
        s: JSON.stringify({
          $and: [
            {
              $or: [
                {
                  "sender.id": {
                    $eq:
                      form?.getFieldValue("sender_id") === undefined
                        ? 0
                        : form?.getFieldValue("sender_id"),
                  },
                },
                {
                  "recipient.id": {
                    $eq:
                      form?.getFieldValue("sender_id") === undefined
                        ? 0
                        : form?.getFieldValue("sender_id"),
                  },
                },
              ],
            },
            ...filters,
            {
              is_payment: {
                $eq: false,
              },
            },
          ],
        }),
        sort: `${sortField},${sortDirection}`,
        limit: pageSize,
        page: currentPage,
        offset: (currentPage - 1) * pageSize,
      },
    },
  });

  // Select properties for the sender/counterparty dropdown
  const { selectProps: senderSelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (item) =>
      `${item.name} ${item.clientPrefix}-${item.clientCode}/${
        item.type === "sender" ? "." : ","
      }`, // Custom label combining name, prefix, code
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

  // Set initial form values (type: "income") when the form is available
  useEffect(() => {
    if (form) {
      form.setFieldValue("type", "income");
    }
  }, [form]);

  // Effect to calculate and set 'amount' and 'paid_sum' based on selections and currency
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

        // Calculate total amounts from selected goods (services + products)
        const totalServiceAmount = selectedRows.reduce(
          (total: number, item: any) => {
            const localAmount = item.services.reduce(
              (acc: number, service: any) => acc + Number(service.sum || 0),
              0
            );
            return total + localAmount;
          },
          0
        );
        const totalProductAmount = selectedRows.reduce(
          (total: number, item: any) => {
            const localAmount = item.products.reduce(
              (acc: number, service: any) => acc + Number(service.sum || 0),
              0
            );
            return total + localAmount;
          },
          0
        );
        const totalAmount = totalProductAmount + totalServiceAmount;
        // Transform amount based on currency rate
        const transformAmount = rate > 0 ? rate * totalAmount : totalAmount;

        // Calculate the remaining amount to be paid
        const remainingToPay =
          selectedRows.length > 0
            ? transformAmount - (selectedRows[0]?.paid_sum || 0)
            : 0;

        // Set form fields: 'amount' and 'paid_sum'
        formProps.form.setFieldsValue({
          amount: remainingToPay,
          paid_sum: remainingToPay,
        });
      } else {
        // If not an agent operation, reset agent-specific fields
        const currentValues: any = formProps.form.getFieldsValue();

        const resetValues = Object.keys(currentValues).reduce(
          (acc: any, key: any) => {
            if (
              key === "income" ||
              key === "type_operation" ||
              key === "date" ||
              key === "type" ||
              key === "type_currency" || // Keep currency selection
              key === "bank_id" || // Keep bank selection
              key === "method_payment" || // Keep payment method
              key === "comment" // Keep comment
            ) {
              acc[key] = currentValues[key];
            } else {
              acc[key] = undefined; // Reset other fields
            }
            return acc;
          },
          {}
        );

        formProps.form.setFieldsValue(resetValues);
      }
    }
  }, [isAgent, selectedRows, currency.data, change, bolik]); // Added bolik to dependencies

  // Select properties for the bank dropdown
  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  // Fetch counterparty data (currently not fully utilized for setting form fields, but available)
  const { data: counterpartyData } = useOne({
    resource: "counterparty",
    id: selectedReceipientId ?? "",
    queryOptions: {
      enabled: !!selectedReceipientId,
    },
  });

  const currentDateDayjs = dayjs(); // Get current date for default value

  // Set counterparty name and default date when data is available
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

  // Set default type_operation on component mount
  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        type_operation: "Извне",
      });
    }
  }, []);

  // Handle sender selection change
  const handleSenderChange = (value: any, record: any) => {
    setSelectedType(
      record.label.split("/")[1] === "." ? "sender" : "recipient"
    );
    setSelectedRows([]); // Clear selected rows when sender changes
    setSelectedRowKeys([]); // Clear selected row keys
    setChange(change + 1); // Trigger recalculation
  };

  const paymentTypes = [
    "Оплата наличными",
    "Оплата переводом",
    "Оплата перечислением",
  ];

  const incomeTypes = ["Извне", "Контрагент оптом", "Контрагент частично"];

  // Handle table pagination, filtering, and sorting
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

  // Table props configuration
  const tableProps = {
    type: "radio" as const, // Although we handle multi-select with checkboxes, Antd Table `type` can be used for built-in radio
    dataSource: dataSource,
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
    rowClassName: (record: any) => {
      return selectedRowKeys.includes(record.id)
        ? "ant-table-row-selected"
        : "";
    },
  };

  // Content for the date picker dropdown
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
        } else {
          setFilters([]); // Clear date filter if dates are cleared
        }
      }}
    />
  );

  // Content for the sort dropdown
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

  // Handle row selection for the goods table
  const handleRowSelect = (record: any) => {
    if (!bolik) {
      // If NOT partial payment (i.e., bulk payment or other multi-select)
      const alreadySelected = selectedRowKeys.includes(record.id);

      if (alreadySelected) {
        setSelectedRowKeys(selectedRowKeys.filter((id) => id !== record.id));
        setSelectedRows(selectedRows.filter((row) => row.id !== record.id));
      } else {
        setSelectedRowKeys([...selectedRowKeys, record.id]);
        setSelectedRows([...selectedRows, record]);
      }
    } else {
      // If partial payment (bolik is true), only allow single selection
      setSelectedRowKeys([record.id]);
      setSelectedRows([record]);
    }
  };

  // Clear selected rows/keys when 'bolik' (payment type) changes
  useEffect(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [bolik]);

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          const confirmed = window.confirm("Вы уверены, что хотите сохранить?");
          if (confirmed) {
            form.setFieldValue("type", "income"); // Ensure type is income before saving
            saveButtonProps.onClick && saveButtonProps.onClick();
          }
        },
      }}
      title={<h4 style={{ margin: 0 }}>Добавить приход</h4>}
    >
      <Form
        {...formProps}
        layout="vertical"
        style={{ marginBottom: 0 }}
        initialValues={{
          type: "income",
        }}
        onFinish={(values: any) => {
          // --- Validation for "Контрагент частично" (Partial Payment) ---
          // This ensures the user cannot pay more than the remaining balance for a single item.
          if (bolik && selectedRows.length === 1) {
            const selectedGood = selectedRows[0];
            let rate = 0;
            const selectedCurrency = values.type_currency;
            if (selectedCurrency) {
              rate =
                currency.data?.find(
                  (item: any) => item.name === selectedCurrency
                )?.rate || 0;
            }

            // Calculate the total actual amount of the selected good (services + products)
            const totalGoodAmount =
              selectedGood.services.reduce(
                (acc: number, service: any) => acc + Number(service.sum || 0),
                0
              ) +
              selectedGood.products.reduce(
                (acc: number, product: any) => acc + Number(product.sum || 0),
                0
              );

            // Calculate the remaining amount due for this specific good, considering currency rate
            const remainingAmount =
              (rate > 0 ? rate * totalGoodAmount : totalGoodAmount) -
              (selectedGood?.paid_sum || 0);

            // Check if the user-entered amount exceeds the remaining amount
            if (values.amount > remainingAmount) {
              message.error(
                "Сумма к оплате не может превышать оставшуюся сумму."
              );
              return; // Prevent form submission
            }
          }
          // --- End Validation ---

          const finalValues = {
            ...values,
            type: "income",
            // counterparty_id is set based on the sender_id selected in the form
            counterparty_id: formProps?.form?.getFieldValue("sender_id"),
          };

          // If it's an agent operation, link the cash desk entry to the first selected good
          // (For "Контрагент частично", this will be the single selected good)
          // (For "Контрагент оптом", this will link all selected goods to a single cash desk operation)
          if (isAgent && selectedRows.length > 0) {
            //@ts-ignore
            finalValues.good_id = selectedRows[0]?.id; // Link to the first selected good's ID
          }

          formProps.onFinish && formProps.onFinish(finalValues); // Proceed with form submission
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
                disabled={true} // Date is disabled and set to current date
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
                  // Set isAgent based on selection
                  setIsAgent(
                    e === "Контрагент оптом" || e === "Контрагент частично"
                  );
                  // Set bolik for "Контрагент частично" to enable single selection
                  setBolik(e === "Контрагент частично");
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
              style={{ marginBottom: 5 }}
            >
              <Select
                options={paymentTypes.map((enumValue) => ({
                  label: enumValue,
                  value: enumValue,
                }))}
                placeholder="Выберите метод оплаты"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          {isAgent && (
            <>
              <Col span={10}>
                <Form.Item
                  label="Код клиента"
                  name="sender_id"
                  rules={[
                    {
                      required: true,
                      message: "Пожалуйста, выберите клиента",
                    },
                  ]}
                  style={{ marginBottom: 5 }}
                >
                  <Select
                    {...senderSelectProps}
                    onChange={handleSenderChange}
                    placeholder="Выберите клиента"
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
              style={{ marginBottom: 5 }}
            >
              <Select
                showSearch
                loading={currencyLoading}
                disabled={currencyLoading}
                placeholder="Выберите валюту"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value) => {
                  setChange(change + 1); // Trigger re-calculation on currency change
                  // The main logic for amount calculation is in the useEffect,
                  // this handler just ensures that effect runs.
                }}
                options={Object.values(CurrencyType).map((item: any) => ({
                  label: `${item}`,
                  value: item,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={isAgent ? 4 : 12}>
            <Form.Item
              label="Сумма для прихода"
              name="amount"
              rules={[{ required: true, message: "Укажите сумму" }]}
              style={{ marginBottom: 5 }}
            >
              <Input
                type="number"
                disabled={isAgent && !bolik} // Disabled if agent AND NOT partial payment (bolik)
                min={0}
                placeholder="Введите сумму прихода"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          {isAgent && (
            <Col span={3}>
              <Form.Item
                label="Сумма к оплате"
                name="paid_sum"
                style={{ marginBottom: 5 }}
              >
                <Input
                  type="number"
                  disabled // This field is always disabled as it displays the calculated remaining amount
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          )}
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
                  action={`${API_URL}/file-upload`} // Your upload endpoint
                  listType="picture"
                  accept=".png,.jpg,.jpeg"
                  beforeUpload={(file) => {
                    // Create FormData to send the file
                    const formData = new FormData();
                    formData.append("file", file);

                    // Send request to server to get file path
                    fetch(`${API_URL}/file-upload`, {
                      method: "POST",
                      body: formData,
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        // Assuming the server returns an object with the file path
                        const filePath = data.path || data.url || data.filePath;
                        // Set the file path in the form field
                        if (formProps.form) {
                          formProps.form.setFieldsValue({
                            check_file: filePath,
                          });
                        }
                      })
                      .catch((error) => {
                        console.error("Ошибка загрузки файла:", error);
                      });

                    // Prevent Ant Design's default upload behavior
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
        <>
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
                placeholder="Поиск по номеру накладной"
                prefix={<SearchOutlined />}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setFilters([]); // Clear filters if search is empty
                    return;
                  }

                  setFilters([
                    {
                      $or: [
                        { invoice_number: { $contL: value } },
                        { "sender.clientCode": { $contL: value } },
                        { "recipient.clientCode": { $contL: value } },
                        { "sender.name": { $contL: value } },
                        { "recipient.name": { $contL: value } },
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

          <Table
            {...tableProps}
            rowKey="id"
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => {
                handleRowSelect(record); // Handle row click for selection
              },
              style: { cursor: "pointer" },
            })}
          >
            <Table.Column
              title=""
              dataIndex="id"
              render={(value) => (
                <Checkbox
                  // This checkbox visualizes selection; the actual selection is handled by onRow onClick
                  checked={selectedRowKeys.includes(value)}
                />
              )}
            />
            <Table.Column
              title="№"
              render={(_: any, __: any, index: number) => {
                return (data?.data?.page - 1) * pageSize + index + 1;
              }}
            />
            <Table.Column
              dataIndex="created_at"
              title="Дата приемки"
              render={(value) =>
                value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
              }
            />
            <Table.Column dataIndex="invoice_number" title="№ накладной" />
            <Table.Column
              dataIndex="employee"
              title="Пункт приема"
              render={(value) =>
                `${value?.branch?.name}, ${value?.under_branch?.address || ""}`
              }
            />
            <Table.Column
              dataIndex="sender"
              title="Код отправителя"
              render={(value) => {
                return value?.clientPrefix + "-" + value?.clientCode;
              }}
            />
            <Table.Column
              dataIndex="sender"
              title="Фио отправителя"
              render={(value) => value?.name}
            />
            <Table.Column
              dataIndex="recipient"
              title="Код получателя"
              render={(value) => {
                return value?.clientPrefix + "-" + value?.clientCode;
              }}
            />
            <Table.Column
              dataIndex="recipient"
              title="Фио получателя"
              render={(value) => value?.name}
            />
            <Table.Column
              dataIndex="destination"
              render={(value) => value?.name}
              title="Пункт назначения"
            />
            <Table.Column
              dataIndex="totalServiceWeight"
              title="Вес"
              render={(value) => value.toFixed(2) + " кг"}
            />
            <Table.Column
              dataIndex="services"
              title="Кол-во мешков"
              render={(value) => value?.length + " шт"}
            />
            <Table.Column
              dataIndex="totalServiceAmountSum"
              title="Сумма"
              render={(_, record: any) =>
                `${
                  Number(record.totalServiceAmountSum) +
                  Number(record.totalProductAmountSum)
                } руб`
              }
            />
            <Table.Column
              dataIndex="paid_sum"
              title="Оплачено"
              render={(value) => `${value || 0} руб`}
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
        </>
      )}
    </Create>
  );
};
