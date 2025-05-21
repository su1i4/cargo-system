import { useState } from "react";
import { Show, useTable } from "@refinedev/antd";
import { useUpdateMany, useNavigation } from "@refinedev/core";
import {
  Input,
  Row,
  Col,
  Table,
  Button,
  Dropdown,
  DatePicker,
  Card,
  Form,
  message,
  Tooltip,
} from "antd";
import { useParams } from "react-router";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { translateStatus } from "../../lib/utils";

const ShipmentAdd = () => {
  const { id } = useParams();
  const { push } = useNavigation();
  const [form] = Form.useForm();

  const [sorterVisible, setSorterVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { tableProps, setFilters, setSorter } = useTable({
    resource: "service",
    pagination: {
      pageSize: 10,
    },
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
          field: "status",
          operator: "eq",
          value: "На складе",
        },
        {
          field: "shipment_id",
          operator: "eq",
          value: null,
        },
      ],
    },
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "service",
  });

  const handleSave = async () => {
    if (selectedRowKeys.length === 0) {
      message.error("Выберите хотя бы один товар");
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.all(
        selectedRowKeys.map(async (key) => {
          await updateManyGoods({
            ids: [key],
            values: {
              id: Number(key),
              shipment_id: Number(id),
              status: "В пути",
              adding: true,
            },
          });
        })
      );
      
      message.success("Товары успешно добавлены к отгрузке");
      
      setTimeout(() => {
        push(`/shipments/edit/${id}`);
      }, 500);
    } catch (error) {
      message.error("Ошибка при сохранении: " + error);
      setIsSubmitting(false);
    }
  };

  // Обработчик поиска
  const handleSearch = (value: string) => {
    setSearchText(value);
    
    if (value) {
      setFilters([
        {
          field: "trackCode",
          operator: "contains",
          value,
        },
      ]);
    } else {
      setFilters([]);
    }
  };

  // Обработчик изменения диапазона дат
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

  // Обработчик сортировки
  const handleSortChange = (field: "id" | "counterparty.name", direction: "asc" | "desc") => {
    setSorter([
      {
        field,
        order: direction,
      },
    ]);
    setSorterVisible(false);
  };

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={handleDateRangeChange}
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
          style={{ textAlign: "left" }}
          onClick={() => handleSortChange("id", "desc")}
        >
          Дате создания (новые)
        </Button>
        <Button
          type="text"
          style={{ textAlign: "left" }}
          onClick={() => handleSortChange("id", "asc")}
        >
          Дате создания (старые)
        </Button>
        <Button
          type="text"
          style={{ textAlign: "left" }}
          onClick={() => handleSortChange("counterparty.name", "asc")}
        >
          По имени (А-Я)
        </Button>
        <Button
          type="text"
          style={{ textAlign: "left" }}
          onClick={() => handleSortChange("counterparty.name", "desc")}
        >
          По имени (Я-А)
        </Button>
      </div>
    </Card>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys as number[]);
      setSelectedRows(rows);
    },
  };

  return (
    <Show
      headerButtons={() => (
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => push(`/shipments/edit/${id}`)}
        >
          Назад
        </Button>
      )}
      title="Добавление товаров к отгрузке"
    >
      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Поиск по трек-коду"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Row gutter={8}>
                  <Col>
                    <Tooltip title="Сортировка">
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
                          icon={<ArrowDownOutlined />}
                        ></Button>
                      </Dropdown>
                    </Tooltip>
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
              </Col>
              <Col xs={24} sm={8} style={{ textAlign: "right" }}>
                <Button 
                  type="primary"
                  onClick={handleSave}
                  loading={isSubmitting}
                  disabled={isSubmitting || selectedRowKeys.length === 0}
                >
                  Добавить выбранные товары
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
        <Table
          {...tableProps}
          rowKey="id"
          rowSelection={rowSelection}
          locale={{
            emptyText: "Нет доступных товаров для добавления",
          }}
          scroll={{ x: 1000 }}
        >
          <Table.Column
            title="№"
            render={(value, record, index) => index + 1}
            width={60}
          />
          <Table.Column
            dataIndex="created_at"
            title="Дата"
            render={(value) => {
              return `${value?.split("T")[0]} ${value
                ?.split("T")[1]
                ?.slice(0, 5)}`;
            }}
          />
          <Table.Column dataIndex="cargoType" title="Тип товара" />
          <Table.Column dataIndex="trackCode" title="Трек-код" />
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
            title="Пункт назначения"
            render={(value) => (
              `${value?.branch?.name},${value?.under_branch?.address || ""}`
            )}
          />
          <Table.Column dataIndex="weight" title="Вес" />
          <Table.Column dataIndex="comments" title="Комментарий" />
        </Table>
      </Form>
    </Show>
  );
};

export default ShipmentAdd;
