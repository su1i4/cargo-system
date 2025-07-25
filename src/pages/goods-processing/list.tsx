import { List } from "@refinedev/antd";
import {
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Card,
  Modal,
  Flex,
  Select,
  message,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileAddOutlined,
  SettingOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom, useNavigation, useUpdate } from "@refinedev/core";
import { useDocumentTitle } from "@refinedev/react-router";
import { API_URL } from "../../App";
import { useSearchParams } from "react-router";
import { CustomTooltip, operationStatus } from "../../shared/custom-tooltip";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const GoogsProcessingList = () => {
  const setTitle = useDocumentTitle();

  useEffect(() => {
    setTitle("Все товары");
  }, []);
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    | "id"
    | "created_at"
    | "sender.clientCode"
    | "sender.name"
    | "destination.name"
    | "counterparty.name"
  >("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Состояние для хранения отдельных фильтров
  const [destinationFilter, setDestinationFilter] = useState<any>(null);
  const [paymentFilter, setPaymentFilter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Функция для объединения всех фильтров
  useEffect(() => {
    const allFilters = [
      destinationFilter,
      paymentFilter,
      statusFilter,
      searchFilter,
      dateFilter,
    ].filter(Boolean);
    
    setSearchFilters(allFilters);
  }, [destinationFilter, paymentFilter, statusFilter, searchFilter, dateFilter]);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({ $and: searchFilters }),
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

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  const [sorterVisible, setSorterVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [settingVisible, setSettingVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  useEffect(() => {
    const value = searchparams.get("value");
    if (value) {
      setSearchFilter({
        $or: [
          { "counterparty.clientCode": { $contL: value } },
          { "counterparty.name": { $contL: value } },
        ],
      });
    }
    setSearch(value || "");
  }, []);

  const { data: branch } = useCustom({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const filterContent = (
    <Card style={{ width: 300, padding: "0px !important" }}>
      <Select
        title="Выберите пункт назначения"
        placeholder="Выберите пункт назначения"
        options={branch?.data?.map((branch: any) => ({
          label: branch.name,
          value: branch.id,
        }))}
        allowClear
        mode="multiple"
        onChange={(value) => {
          if (!value || value.length === 0) {
            setDestinationFilter(null);
          } else {
            setDestinationFilter({
              $or: value.map((item: any) => ({
                destination_id: { $eq: item },
              })),
            });
          }
        }}
        style={{ width: "100%", marginBottom: 20 }}
      />
      <Select
        placeholder="Оплаченные / Не оплаченные"
        options={[
          {
            label: "Оплаченные",
            value: true,
          },
          {
            label: "Не оплаченные",
            value: false,
          },
        ]}
        allowClear
        onChange={(value) => {
          if (value === undefined || value === null) {
            // очищено — убираем фильтр
            setPaymentFilter(null);
          } else {
            setPaymentFilter({ is_payment: { $eq: value } });
          }
        }}
        style={{ width: "100%", marginBottom: 20 }}
      />
      <Select
        placeholder="Выберите статус"
        options={[
          {
            label: "На складе",
            value: "В складе",
          },
          {
            label: "В пути",
            value: "В пути",
          },
          {
            label: "Готов к выдаче",
            value: "Готов к выдаче",
          },
          {
            label: "Выдали",
            value: "Выдали",
          },
        ]}
        allowClear
        mode="multiple"
        onChange={(value) => {
          if (!value || value.length === 0) {
            // очищено — убираем фильтр по статусу
            setStatusFilter(null);
          } else {
            // добавляем фильтр по статусу с несколькими значениями
            setStatusFilter({
              $or: value.map((status: string) => ({
                status: { $eq: status },
              })),
            });
          }
        }}
        style={{ width: "100%" }}
      />

      {/* <Select
        title="Выберите тип тов"
        placeholder="Выберите пункт назначения"
        options={branch?.data?.map((branch: any) => ({
          label: branch.name,
          value: branch.id,
        }))}
        allowClear
        mode="multiple"
        onChange={(value) => {
          setFilters(
            value.map((item: any) => ({ destination_id: { $eq: item } })),
            "replace"
          );
        }}
        style={{ width: "100%" }}
      /> */}
    </Card>
  );

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      showTime={{ format: "HH:mm" }}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setDateFilter({
            created_at: {
              $gte: dateStrings[0],
              $lte: dateStrings[1],
            },
          });
        } else {
          setDateFilter(null);
        }
      }}
    />
  );

  const sortContent = (
    <Card style={{ width: 200, padding: "0px !important" }}>
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
            fontWeight: sortField === "created_at" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("created_at");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "created_at" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "sender.clientCode" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("sender.clientCode");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По коду отправителя{" "}
          {sortField === "sender.clientCode" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "sender.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("sender.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По фио отправителя{" "}
          {sortField === "sender.name" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>

        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "destination.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("destination.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По пункту назначения{" "}
          {sortField === "destination.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const dataSource = data?.data?.data || [];

  const { mutateAsync: update } = useUpdate();

  const [mainChecked, setMainChecked] = useState(false);

  const clickAll = () => {
    setMainChecked(!mainChecked);
    if (!mainChecked) {
      const allFalseIds = dataSource
        .filter((item: any) => !item.visible)
        .map((item: any) => item.id);
      setSelectedRowKeys(allFalseIds);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleCashDeskCreate = () => {
    if (selectedRows.length === 0) {
      message.warning(
        "Выберите товары для создания приходного кассового ордера"
      );
      return;
    }

    const selectedIds = selectedRows.map((row) => row.id).join(",");

    push(
      `/income/create?type_operation=Контрагент оптом&goods_ids=${selectedIds}`
    );
  };

  const checkboxContent = (
    <Flex
      vertical
      gap={10}
      style={{
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Button onClick={handleCashDeskCreate}>Приходный кассовый ордер</Button>
    </Flex>
  );

  const { show, push } = useNavigation();

  // Создаем функции для пагинации, которые обычно предоставляет tableProps
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
    <List headerButtons={() => false}>
      <Row
        gutter={[16, 16]}
        align="middle"
        style={{ marginBottom: 16, position: "sticky", top: 80, zIndex: 10 }}
      >
        <Col>
          <Space size="middle">
            <CustomTooltip title="Создать">
              <Button
                icon={<FileAddOutlined />}
                style={{}}
                onClick={() => push("/goods-processing/create")}
              />
            </CustomTooltip>
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
                <Button icon={<FilterOutlined />} />
              </Dropdown>
            </CustomTooltip>
            <CustomTooltip title="Настройки">
              <Dropdown
                overlay={checkboxContent}
                trigger={["click"]}
                placement="bottomLeft"
                open={settingVisible}
                onOpenChange={(visible) => {
                  setSettingVisible(visible);
                }}
              >
                <Button icon={<SettingOutlined />} />
              </Dropdown>
            </CustomTooltip>
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск по номеру накладной, фио получателя или по коду получателя"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setSearchFilter(null);
                setSearch("");
                searchparams.set("value", "");
                setSearchParams(searchparams);
                return;
              }

              searchparams.set("page", "1");
              searchparams.set("size", String(pageSize));
              searchparams.set("value", value);
              setSearchParams(searchparams);
              setSearch(value);
              setSearchFilter({
                $or: [
                  { invoice_number: { $contL: value } },
                  { "sender.name": { $contL: value } },
                  { "recipient.name": { $contL: value } },
                ],
              });
            }}
          />
        </Col>
        <Col>
          <Dropdown
            overlay={datePickerContent}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />} className="date-picker-button">
              Дата
            </Button>
          </Dropdown>
        </Col>
      </Row>

      <Modal
        title="Новая спецификация"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form layout="vertical">
          <Form.Item label="Треккод">
            <Input />
          </Form.Item>
          <Form.Item label="Тип груза">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Table
        size="small"
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onDoubleClick: () => {
            show("goods-processing", record.id as number);
          },
        })}
        rowSelection={{
          selectedRowKeys,
          preserveSelectedRowKeys: true,
          onChange: (selectedRowKeys, selectedRows) => {
            setSelectedRowKeys(selectedRowKeys);
            setSelectedRows(selectedRows);
          },
        }}
      >
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
        {operationStatus()}
        <Table.Column
          dataIndex="services"
          title="Номер мешка"
          render={(value) => {
            return value?.map((item: any) => item.bag_number_numeric).join(", ");
          }}
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
    </List>
  );
};
