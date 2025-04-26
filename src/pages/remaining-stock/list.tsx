import { useState, useEffect } from "react";
import { List, useSelect } from "@refinedev/antd";
import { BaseRecord, useGo, useUpdate, useCustom } from "@refinedev/core";
import {
  Space,
  Table,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Checkbox,
  Dropdown,
  Select,
  Form,
  Card,
  Modal,
  Image,
  Menu,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  SwapOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useMany, useNavigation, useUpdateMany } from "@refinedev/core";
import { API_URL } from "../../App";
import dayjs from "dayjs";
import { operationStatus } from "../../shared";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateStatus } from "../../lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export const RemainingStockProcessingList = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    "created_at" | "status" | "name" | "counterparty.name"
  >("created_at");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    {
      status: {
        $in: ["В Складе", "Готов к выдаче"],
      },
    },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [isModalVisible1, setIsModalVisible1] = useState(false);
  const { create } = useNavigation();
  const { mutate: updateMany } = useUpdateMany();
  const go = useGo();

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

  // Получаем данные из ответа API
  const dataSource = data?.data?.data || [];
  const total = data?.data?.total || 0;

  // Функция для обновления фильтров
  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
  };

  // Обновление данных при изменении фильтров или сортировки
  useEffect(() => {
    refetch();
  }, [searchFilters, sortDirection, sortField, currentPage, pageSize]);

  // Обработка изменений в таблице (пагинация, сортировка)
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    // Обрабатываем сортировку, если она пришла из таблицы
    if (sorter && sorter.field) {
      if (sorter.field === "counterparty") {
        setSortField("name");
      } else if (sorter.field === "counterparty_id") {
        setSortField("counterparty.name");
      } else if (sorter.field === "created_at" || sorter.field === "status") {
        setSortField(sorter.field);
      }
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const sortContent = (
    <Card style={{ width: 200, padding: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ marginBottom: "8px", color: "#666", fontSize: "14px" }}>
          Сортировать по
        </div>
        {/* Сортировка по дате создания */}
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
          Дата создания{" "}
          {sortField === "created_at" && (sortDirection === "ASC" ? "↑" : "↓")}
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

  const filterContent = (
    <Card style={{ width: 300, padding: "12px", border: "1px solid #f0f0f0" }}>
      <Form layout="vertical">
        <Form.Item label="Филиалы">
          <Input
            placeholder="Выберите город"
            prefix={<SearchOutlined />}
            style={{ marginBottom: "8px" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "150px",
              overflowY: "auto",
            }}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <Checkbox value="guangzhou">Гуанчжоу</Checkbox>
                <Checkbox value="bishkek">Бишкек</Checkbox>
                <Checkbox value="osh">Ош</Checkbox>
              </div>
            </Checkbox.Group>
          </div>
        </Form.Item>

        <Form.Item label="Дата">
          <Row gutter={8}>
            <Col span={11}>
              <Select placeholder="От" style={{ width: "100%" }}>
                <Select.Option value="today">Сегодня</Select.Option>
                <Select.Option value="yesterday">Вчера</Select.Option>
                <Select.Option value="week">Неделя</Select.Option>
              </Select>
            </Col>
            <Col span={11} offset={2}>
              <Select placeholder="До" style={{ width: "100%" }}>
                <Select.Option value="today">Сегодня</Select.Option>
                <Select.Option value="tomorrow">Завтра</Select.Option>
                <Select.Option value="week">Неделя</Select.Option>
              </Select>
            </Col>
          </Row>
        </Form.Item>

        <Form.Item label="Поиск по трек-коду">
          <Input
            placeholder="Введите номер трек-кода"
            prefix={<SearchOutlined />}
          />
        </Form.Item>

        <Form.Item label="Отбор и сортировка">
          <Space>
            <Dropdown overlay={sortContent} trigger={["click"]}>
              <Button icon={<SwapOutlined />}>Сортировка</Button>
            </Dropdown>
            <Button icon={<HistoryOutlined />}>История</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

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

  const showModal = () => {
    setIsModalVisible1(true);
  };

  const handleOk = () => {
    setIsModalVisible1(false);
  };

  const handleCancel = () => {
    setIsModalVisible1(false);
  };

  const { data: userData, isLoading: userIsLoading } = useMany({
    resource: "users",
    ids: dataSource?.map((item: any) => item?.user?.id).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!dataSource,
    },
  });

  const { data: counterpartyData, isLoading: counterpartyIsLoading } = useMany({
    resource: "counterparty",
    ids:
      dataSource?.map((item: any) => item?.counterparty?.id).filter(Boolean) ??
      [],
    queryOptions: {
      enabled: !!dataSource,
    },
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: "name",
  });

  const { push } = useNavigation();

  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<BaseRecord | null>(null);
  const { mutate } = useUpdate({
    resource: "goods-processing",
  });

  const handleSelectChange = (value: string, record: BaseRecord) => {
    setSelectedBranch(value);
    setSelectedRecord(record);
    setIsModalVisible1(true);
  };

  const handleConfirm = (id: any) => {
    mutate({
      id: id,
      values: {
        transfer: true,
        transfer_id: selectedBranch,
      },
    });

    setIsModalVisible1(false);
  };

  const handleConfirmTransfer = (record: any) => {
    mutate({
      id: record.id,
      values: {
        transfer: false,
        branch_id: record.transfer_id,
      },
    });
  };

  return (
    <List headerButtons={() => false}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space size="middle">
            <Dropdown
              overlay={sortContent}
              trigger={["click"]}
              placement="bottomLeft"
              visible={sortVisible}
              onVisibleChange={(visible) => {
                setSortVisible(visible);
                if (visible) {
                  setFilterVisible(true);
                }
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
              />
            </Dropdown>
          </Space>
        </Col>
        <Col flex="auto">
          <Input
            style={{ width: 600 }}
            placeholder="Поиск по трек-коду, ФИО получателя или по коду получателя"
            prefix={<SearchOutlined />}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters(
                  [
                    {
                      status: {
                        $in: selectedBranch
                          ? ["Готов к выдаче"]
                          : ["В Складе", "Готов к выдаче"],
                      },
                    },
                  ],
                  "replace"
                );
                return;
              }
              setFilters(
                [
                  {
                    status: {
                      $in: selectedBranch
                        ? ["Готов к выдаче"]
                        : ["В Складе", "Готов к выдаче"],
                    },
                  },
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
        </Col>
        <Col>
          <Select
            {...branchSelectProps}
            placeholder="Выберите филиал"
            style={{ width: 300 }}
            value={selectedBranch || undefined} // Убедитесь, что пустое значение не передается как null
            allowClear // Разрешает очистку
            onChange={(e) => {
              setSelectedBranch(e || null); // Сбрасываем в null при очистке
              if (!e) {
                setFilters(
                  [
                    {
                      status: {
                        $in: ["В Складе", "Готов к выдаче"],
                      },
                    },
                  ],
                  "replace"
                );
                return;
              }
              setFilters(
                [
                  {
                    status: {
                      $in: ["Готов к выдаче"],
                    },
                  },
                  {
                    "counterparty.branch_id": e,
                  },
                ],
                "replace"
              );
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
        visible={false}
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

      <div style={{ width: "100%", overflow: "auto" }}>
        <Table
          dataSource={dataSource}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
          }}
          onChange={handleTableChange}
          rowSelection={{
            type: "checkbox",
            onChange: (selectedRowKeys, selectedRows) => {},
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
            title="Дата"
            render={(value) =>
              value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
            }
          />
          <Table.Column dataIndex="trackCode" title="Трек-код" />
          <Table.Column dataIndex="cargoType" title="Тип груза" />
          <Table.Column
            dataIndex="counterparty"
            title="Код получателя"
            render={(value) => {
              return `${value?.clientPrefix}-${value?.clientCode}`;
            }}
          />
          <Table.Column
            dataIndex="counterparty_id"
            title="ФИО получателя"
            render={(value) => {
              if (counterpartyIsLoading) {
                return <>Loading....</>;
              }

              const counterparty = counterpartyData?.data?.find(
                (item) => item.id === value
              );
              return counterparty ? `${counterparty.name}` : null;
            }}
          />
          <Table.Column
            render={(value) => value?.branch?.name}
            dataIndex="counterparty"
            title={"Пункт назначения"}
          />
          <Table.Column dataIndex="weight" title="Вес" />
          <Table.Column dataIndex="amount" title="Сумма" />
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
          <Table.Column
            dataIndex="employee_id"
            title="Сотрудник"
            render={(value) => {
              if (userIsLoading) {
                return <>Loading....</>;
              }
              const user = userData?.data?.find((item) => item.id === value);
              return user ? `${user.firstName} ${user.lastName}` : null;
            }}
          />
          <Table.Column
            dataIndex="employee"
            title={"Филиал"}
            render={(value) => value?.branch?.name}
          />
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
          <Table.Column
            title="Переместить"
            dataIndex="actions"
            render={(_, record: BaseRecord) => {
              return record.transfer ? (
                <Button
                  type="dashed"
                  onClick={() => handleConfirmTransfer(record)}
                >
                  Подвердить
                </Button>
              ) : (
                <>
                  <Select
                    {...branchSelectProps}
                    style={{ width: 200 }}
                    // @ts-ignore
                    onChange={(value) => handleSelectChange(value, record)}
                  />

                  <Modal
                    title="Подтверждение перемещения"
                    open={isModalVisible1}
                    onOk={() => handleConfirm(record.id)}
                    onCancel={() => setIsModalVisible1(false)}
                    okText="Переместить"
                    cancelText="Отмена"
                  >
                    <p>Вы уверены, что хотите переместить товар</p>
                  </Modal>
                </>
              );
            }}
          />
        </Table>
      </div>
    </List>
  );
};
