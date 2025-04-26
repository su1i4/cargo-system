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
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Form,
  Card,
  Image,
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
import { CustomTooltip, operationStatus } from "../../shared";
import { useSearchParams } from "react-router";
import { catchDateTable, translateStatus } from "../../lib/utils";

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
    const token = localStorage.getItem("access_token");

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
    const token = localStorage.getItem("access_token");

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
      title: "Код клиента",
      dataIndex: "render",
      key: "render",
      render: (value: any, record: any) =>
        `${record?.counterparty?.clientPrefix || ""}-${
          record?.counterparty?.clientCode || ""
        }`,
    },
    {
      title: "Трек-код",
      dataIndex: "trackCode",
      key: "trackCode",
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
          <Flex justify="center" style={{ width: "100%" }}>
            <img
              style={{
                width: "70px",
              }}
              src="../../public/alfa-china.png"
            />
          </Flex>
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
                        { trackCode: { $contL: value } },
                        { "counterparty.clientCode": { $contL: value } },
                        { "counterparty.name": { $contL: value } },
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

      {/* Кнопки для действий */}
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
            Доллар:{" "}
            <strong>{Number(sumData?.Доллар || 0)?.toFixed(2)} $</strong>
          </Typography.Text>
          |
          <Typography.Text>
            Сом: <strong>{Number(sumData?.Сом || 0)?.toFixed(2)} сом</strong>
          </Typography.Text>
          |
          <Typography.Text>
            Рубль: <strong>{Number(sumData?.Рубль || 0)?.toFixed(2)} р</strong>
          </Typography.Text>
          |
          <Typography.Text>
            Общий вес: <strong>{totalWeight.toFixed(3)} кг</strong>
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
        scroll={{ x: 1200 }}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (data?.data?.page - 1) * pageSize + index + 1;
          }}
        />
        {catchDateTable("Дата приемки в Китае", "В Складе")}
        {catchDateTable("Дата получения", "Готов к выдаче")}
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
          render={(value) => {
            return `${value?.clientPrefix || ""}-${value?.clientCode || ""}`;
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
            <p style={{ width: "200px" }}>
              {`${value?.branch?.name || ""},${
                value?.under_branch?.address || ""
              }`}
            </p>
          )}
          title="Пункт назначения, Пвз"
        />
        <Table.Column
          dataIndex="weight"
          title="Вес"
          render={(value) => value + " кг"}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Тариф клиента"
          render={(value, record) => {
            return `${(
              Number(value?.branch?.tarif || 0) -
              Number(record?.counterparty?.discount?.discount || 0)
            ).toFixed(2)}$`;
          }}
        />
        <Table.Column
          dataIndex="amount"
          title="Сумма"
          render={(value) => value + " $"}
        />
        {/* <Table.Column dataIndex="paymentMethod" title="Способ оплаты" /> */}
        {/* <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName || ""}-${value?.lastName || ""}`;
          }}
        /> */}
        {/* <Table.Column
          dataIndex="employee"
          title="Филиал"
          render={(value) => value?.branch?.name}
        /> */}
        <Table.Column dataIndex="comments" title="Комментарий" />
        <Table.Column
          dataIndex="photo"
          title="Фото"
          render={(photo) =>
            photo ? (
              <Image width={30} height={30} src={API_URL + "/" + photo} />
            ) : null
          }
        />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
        {operationStatus()}
        {/* <Table.Column
          title="Действия"
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        /> */}
      </Table>
    </List>
  );
};
