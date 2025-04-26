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
  Checkbox,
  Typography,
  Image,
  message,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileAddOutlined,
  SettingOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useCustom, useNavigation, useUpdate } from "@refinedev/core";
import dayjs from "dayjs";
import { API_URL } from "../../App";
import { useSearchParams } from "react-router";
import { CustomTooltip, operationStatus } from "../../shared";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateStatus } from "../../lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export const AcceptedGoodsList = () => {
  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [search, setSearch] = useState("");
  const [sumData, setSumData] = useState<any>(null);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          { status: { $eq: "В складе" } },
          { is_consolidated: { $eq: false } },
        ],
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

  const getSumData = async () => {
    const token = localStorage.getItem("access_token");

    const response = await fetch(
      `${API_URL}/goods-processing/amount-in-weight/В складе`,
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
    getSumData();
  }, []);

  const [sorterVisible, setSorterVisible] = useState(false);
  const [settingVisible, setSettingVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

  const handleCheckboxChange = (record: any) => {
    if (record.visible) return;

    const newSelectedKeys = selectedRowKeys.includes(record.id)
      ? selectedRowKeys.filter((id) => id !== record.id)
      : [...selectedRowKeys, record.id];
    setSelectedRowKeys(newSelectedKeys);

    const allFalseItems = dataSource.filter((item: any) => !item.visible);
    const allFalseSelected = allFalseItems.every((item: any) =>
      newSelectedKeys.includes(item.id)
    );
    setMainChecked(allFalseSelected);
  };

  const handleSaveChanges = async () => {
    if (selectedRowKeys.length === 0) return;
    const filteredItems = dataSource.filter(
      (item: any) => !item.visible && selectedRowKeys.includes(item.id)
    );
    const selectedItems = filteredItems.map((item: any) => ({
      id: item.id,
      visible: true,
    }));

    try {
      await Promise.all(
        selectedItems.map((item: any) =>
          update({
            resource: "goods-processing",
            id: item.id,
            values: { visible: item.visible },
            successNotification: false,
            errorNotification: false,
          })
        )
      );

      // Показываем только одно уведомление об успехе
      message.success(`Успешно обновлено ${selectedItems.length} записей`);

      // Обновляем список
      refetch();

      // Сбрасываем выбранные строки
      setSelectedRowKeys([]);
      setMainChecked(false);
    } catch (error) {
      console.error("Ошибка при обновлении", error);
      message.error("Произошла ошибка при обновлении");
    }
  };

  const checkboxContent = (
    <Card style={{ padding: 10 }}>
      <Button onClick={handleSaveChanges}>Показать клиенту</Button>
    </Card>
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

  useEffect(() => {
    const value = searchparams.get("value");
    if (value) {
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
    }
    setSearch(value || "");
  }, []);

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
            <CustomTooltip title="Показать клиентам">
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
            placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setFilters([{ trackCode: { $contL: "" } }], "replace");
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
        <Col>
          <Typography.Text>
            Общий вес: <strong>{sumData?.totalWeight || 0} кг</strong>
          </Typography.Text>
        </Col>
        <Col>
          <Typography.Text>
            Общее кол-во:{" "}
            <strong>{tableProps?.pagination?.total || 0} шт</strong>
          </Typography.Text>
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
        {...tableProps}
        rowKey="id"
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onDoubleClick: () => {
            show("accepted-goods", record.id as number);
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
          dataIndex="visible"
          title={<Checkbox checked={mainChecked} onChange={clickAll} />}
          render={(value, record) => {
            if (value) {
              return (
                <CustomTooltip title="Уже видно клиенту">
                  <EyeOutlined />
                </CustomTooltip>
              );
            } else {
              return (
                <Checkbox
                  checked={selectedRowKeys.includes(record.id)}
                  onChange={() => handleCheckboxChange(record)}
                />
              );
            }
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="Дата приемки"
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
              {`${value?.branch?.name}`}
            </p>
          )}
          title="Пункт назначения"
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
        {/* <Table.Column dataIndex="discount" title="Скидка" render={(value, record) => {
            return `${(Number(value) + Number(record?.discount_custom)).toFixed(2)}`;
          }} /> */}
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
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
