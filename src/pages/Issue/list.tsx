import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { List } from "@refinedev/antd";
import {
  BaseRecord,
  useNavigation,
  useUpdateMany,
  useCustom,
} from "@refinedev/core";
import {
  Table,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Form,
  Card,
  Flex,
  Dropdown,
  Typography,
  Modal,
} from "antd";
import {
  SearchOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { API_URL } from "../../App";
import type { Key } from "react";
import { CustomTooltip, operationStatus } from "../../shared/custom-tooltip";
import { useSearchParams } from "react-router";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Filter {
  status?: { $eq: string };
  $or?: Array<{
    trackCode?: { $contL: string };
    "counterparty.clientCode"?: { $contL: string };
    "counterparty.name"?: { $contL: string };
  }>;
  created_at?: {
    $gte: string;
    $lte: string;
  };
}

export const IssueProcessingList = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [printData, setPrintData] = useState([]);
  const [printOpen, setPrintOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    //@ts-ignore
    contentRef,
    documentTitle: `Выдача накладная ${dayjs().format("DD.MM.YYYY HH:MM")}`,
    onPrintError: (error) => console.error("Print Error:", error),
  });

  const handleClose = () => {
    setPrintOpen(false);
    setPrintData([]);
  };

  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    "id" | "counterparty.name" | "updated_at"
  >("updated_at");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    { status: { $eq: "Готов к выдаче" } },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({ $and: searchFilters }),
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

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<BaseRecord[]>([]);
  const [sumData, setSumData] = useState<{
    Доллар: string;
    Сом: string;
    Рубль: string;
  } | null>(null);

  const getSumData = async () => {
    const token = localStorage.getItem("cargo-system-token");

    const response = await fetch(
      `${API_URL}/goods-processing/amount-in-currency/Готов к выдаче`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedRowKeys),
      }
    );

    const result = await response.json();
    setSumData(result);
  };

  useEffect(() => {
    if (selectedRowKeys.length) {
      getSumData();
    } else {
      setSumData(null);
    }
  }, [selectedRowKeys]);

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
  }, [sortDirection, currentPage, pageSize]);

  const filteredByIds = async (ids: number[]) => {
    const token = localStorage.getItem("cargo-system-token");

    const filter = {
      $and: [{ id: { $in: ids } }],
    };

    const queryString = new URLSearchParams({
      sort: "id,DESC",
      s: JSON.stringify(filter),
    }).toString();

    const response = await fetch(`${API_URL}/goods-processing?${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  };

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
    mutationOptions: {
      onSuccess: async (data: any, variables, context) => {
        const ids = data?.data.map((item: any) => item.id);
        if (ids?.length) {
          try {
            const result = await filteredByIds(ids);
            setPrintData(result);
            setPrintOpen(true);
          } catch (error) {
            console.error("Error fetching goods-processing data:", error);
          }
        }
        refetch();
        setSelectedRowKeys([]);
      },
    },
  });

  const handleAcceptSelected = async () => {
    if (!selectedRowKeys.length) {
      return;
    }
    try {
      updateManyGoods({
        ids: selectedRowKeys as number[],
        values: { status: "Выдали" },
      });
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
    }
  };

  const handleRowSelectionChange = (
    selectedRowKeys: Key[],
    selectedRows: BaseRecord[],
    info: { type: "all" | "none" | "invert" | "single" | "multiple" }
  ) => {
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRows(selectedRows);
  };

  const handleFilter = (values: any) => {
    const filters: Filter[] = [{ status: { $eq: "Готов к выдаче" } }];
    if (values.trackCode) {
      filters.push({
        $or: [
          { trackCode: { $contL: values.trackCode } },
          { "counterparty.clientCode": { $contL: values.trackCode } },
          { "counterparty.name": { $contL: values.trackCode } },
        ],
      });
    }
    if (values.dateRange) {
      filters.push({
        created_at: {
          $gte: dayjs(values.dateRange[0]).format("YYYY-MM-DD"),
          $lte: dayjs(values.dateRange[1]).format("YYYY-MM-DD"),
        },
      });
    }
    setSearchFilters(filters);
  };

  const { push } = useNavigation();

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
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "updated_at" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("updated_at");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По дате обновления{" "}
          {sortField === "updated_at" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          // Fixed: Use consistent filter format
          setSearchFilters([
            ...searchFilters,
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

  // Получаем актуальные данные из хука useCustom
  const dataSource = data?.data?.data || [];

  const totalAmount = selectedRows.reduce(
    (acc, row) => acc + Number(row?.amount),
    0
  );

  const totalWeight = selectedRows.reduce(
    (acc, row) => acc + Number(row?.weight),
    0
  );

  const totalAmountPrint = printData.reduce(
    (acc, row: any) => acc + Number(row?.amount),
    0
  );

  const totalWeightPrint = printData.reduce(
    (acc, row: any) => acc + Number(row?.weight),
    0
  );

  const columns = [
    {
      title: "Дата выдачи",
      dataIndex: "tracking_status",
      key: "tracking_status",
      render: (value: any) => {
        const new_value = value[3]?.createdAt;
        return dayjs(new_value).utc().format("DD.MM.YYYY HH:mm");
      },
    },
    {
      title: "Код получателя",
      dataIndex: "recipient",
      key: "recipient",
      render: (value: any) => value?.name,
    },
    {
      title: "Номер накладной",
      dataIndex: "invoice_number",
      key: "invoice_number",
    },
  ];

  return (
    <List>
      <Modal
        open={printOpen}
        onCancel={handleClose}
        onClose={handleClose}
        onOk={() => handlePrint()}
        okText="Распечатать"
        cancelText="Отменить"
      >
        <div ref={contentRef} style={{ padding: 10 }}>
          {/* <Flex justify="center" style={{ width: "100%" }}>
            <img
              style={{
                width: "70px",
              }}
              src="../../public/alfa-china.png"
            />
          </Flex> */}
          <Typography.Title level={5}>Выдачи</Typography.Title>{" "}
          <Table
            columns={columns}
            dataSource={printData || []}
            pagination={false}
            rowKey="id"
          />
          <div
            style={{
              border: "1px dashed gainsboro",
              padding: "4px 10px",
              borderRadius: 5,
              marginTop: 10,
              backgroundColor: "#f9f9f9",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              width: "100%",
              height: 32,
              boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography.Text>
              Общая сумма: <strong>{totalAmountPrint} $</strong>
            </Typography.Text>{" "}
            |
            <Typography.Text>
              Общий вес: <strong>{totalWeightPrint} кг</strong>
            </Typography.Text>
            |
            <Typography.Text>
              Общее кол-во: <strong>{printData.length} шт</strong>
            </Typography.Text>
          </div>
        </div>
      </Modal>
      <Row
        style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 100 }}
      >
        <Col span={24}>
          <Form layout="inline" onFinish={handleFilter}>
            <CustomTooltip title="Сортировка">
              <Dropdown overlay={sortContent} trigger={["click"]}>
                <Button
                  style={{ marginRight: 8 }}
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
            <Form.Item name="trackCode">
              <Input
                style={{ width: 500 }}
                placeholder="Поиск по трек-коду, ФИО получателя или по коду получателя"
                prefix={<SearchOutlined />}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSearchFilters([{ status: { $eq: "Готов к выдаче" } }]);
                    return;
                  }
                  setSearchFilters([
                    { status: { $eq: "Готов к выдаче" } },
                    {
                      $or: [
                        { invoice_number: { $contL: value } },
                        { "sender.name": { $contL: value } },
                        { "recipient.name": { $contL: value } },
                      ],
                    },
                  ]);
                }}
              />
            </Form.Item>
            <Form.Item name="dateRange">
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
            </Form.Item>
          </Form>
        </Col>
      </Row>

      <Flex
        gap={10}
        style={{ marginBottom: 10, position: "sticky", top: 120, zIndex: 100 }}
      >
        <Button
          style={{
            backgroundColor: selectedRowKeys.length ? undefined : "gainsboro", // Используем undefined вместо false
          }}
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleAcceptSelected}
          disabled={!selectedRowKeys.length}
        >
          Выдать выбранные посылки
        </Button>

        <Button type="primary" onClick={() => push("received")}>
          Выданные посылки
        </Button>
        <div
          style={{
            border: "1px dashed gainsboro",
            padding: "4px 10px",
            borderRadius: 5,
            marginBottom: 10,
            backgroundColor: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            width: "70%",
            boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography.Text>
            Общий вес:{" "}
            <strong>
              {String(totalWeight).replace(".", ",").slice(0, 5)} кг
            </strong>
          </Typography.Text>
          |
          <Typography.Text>
            Общее кол-во: <strong>{selectedRowKeys.length} шт</strong>
          </Typography.Text>
        </div>
      </Flex>
      <Table
        dataSource={dataSource}
        loading={isLoading}
        pagination={false}
        rowKey="id"
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: handleRowSelectionChange,
        }}
        scroll={{ x: 1000 }}
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
          render={(_: any, __: any, index: number) => {
            return (data?.data?.page - 1) * pageSize + index + 1;
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="Дата получения"
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
          render={(value) =>
            String(value).replace(".", ",").slice(0, 5) + " кг"
          }
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
        <Table.Column dataIndex="payment_method" title="Способ оплаты" />
        {operationStatus()}
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName}-${value?.lastName}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </List>
  );
};
