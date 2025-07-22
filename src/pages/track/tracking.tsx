import { List } from "@refinedev/antd";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Typography,
  Divider,
  Tag,
  Space,
  Spin,
  Select,
} from "antd";
import { SearchOutlined, InboxOutlined } from "@ant-design/icons";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useDocumentTitle } from "@refinedev/react-router";
import { useCustom } from "@refinedev/core";
import { API_URL } from "../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

interface TrackingData {
  id: number;
  barcode: string;
  country: string | null;
  tariff: string;
  status: string;
  price: string;
  weight: string;
  quantity: number;
  sum: string;
  good_id: number;
  bag_number: string | null;
  bag_number_numeric: number;
  shipment_id: number;
  shipment: {
    id: number;
    flightNumber: string | null;
    length: string;
    width: string;
    height: string;
    weight: string;
    box_weight: string;
    density: string;
    truck_number: string;
    cube: string;
    status: string;
    boxCode: string;
    type: string;
    driver: string;
    branch_id: number;
    count_position: number;
    reshipment: boolean;
    created_at: string;
    updated_at: string;
    employee_id: number;
    type_product_id: number;
    history?: Array<{
      id: number;
      message: string;
      shipment_id: number;
      created_at: string;
      updated_at: string;
    }>;
  };
  good: {
    id: number;
    trackCode: string;
    status: string;
    sent_back_id: number | null;
    invoice_number: string;
    payment_method: string;
    paid_sum: string;
    is_payment: boolean;
    cargoType: string | null;
    packageType: string | null;
    pricePackageType: number;
    is_consolidated: boolean;
    weight: string;
    amount: string;
    paymentMethod: string;
    employee_id: number;
    discount_sum: string;
    discount_custom: string;
    discount_id: number | null;
    markup: string;
    declared_value: string;
    commission: string;
    amount_commission: string;
    comments: string | null;
    photo: string | null;
    branch_id: number | null;
    destination_id: number;
    shipment_id: number | null;
    transfer: string | null;
    transfer_id: number | null;
    visible: boolean;
    recipient_id: number;
    sender_id: number;
    pays: string;
    created_at: string;
    updated_at: string;
    visiting_group_ids: string | null;
    send_notification: boolean;
  };
}

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
  branchOptions: Array<{ value: number; label: string }>;
  onClearFilters: () => void;
  initialValues?: {
    bag_number?: string;
    invoice_number?: string;
    destination?: number[];
    status?: string[];
  };
}

interface SearchParams {
  bag_number: string;
  invoice_number: string;
  destination: number[];
  status: string[];
}

interface TrackingResultsProps {
  trackingData: TrackingData[];
  loading: boolean;
  error: string;
  searchType: string;
  onClearFilters: () => void;
}

// Компонент формы поиска
const SearchForm = memo<SearchFormProps>(
  ({ onSearch, loading, branchOptions, onClearFilters, initialValues }) => {
    const [form] = Form.useForm();
    const [selectedDestination, setSelectedDestination] = useState<number[]>(
      initialValues?.destination || []
    );
    const [selectedStatus, setSelectedStatus] = useState<string[]>(
      initialValues?.status || []
    );

    const statuses = useMemo(
      () => [
        { value: "На складе", label: "На складе" },
        { value: "В пути", label: "В пути" },
        { value: "Готов к выдаче", label: "Готов к выдаче" },
        { value: "Выдали", label: "Выдали" },
      ],
      []
    );

    // Оптимизированные обработчики
    const handleDestinationChange = useCallback((value: number[]) => {
      setSelectedDestination(value);
    }, []);

    const handleStatusChange = useCallback((value: string[]) => {
      setSelectedStatus(value);
    }, []);

    // Оптимизированная функция фильтрации
    const filterOption = useCallback(
      (input: string, option: any) =>
        String(option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase()),
      []
    );

    const values = Form.useWatch([], form);

    // Debounce для автоматического поиска
    useEffect(() => {
      const hasSearchValues =
        (values?.bag_number && values.bag_number.trim().length > 0) ||
        (values?.invoice_number && values.invoice_number.trim().length > 0);

      const hasFilters =
        selectedDestination.length > 0 || selectedStatus.length > 0;

      if (hasSearchValues || hasFilters) {
        const timeoutId = setTimeout(() => {
          onSearch({
            bag_number: values?.bag_number || "",
            invoice_number: values?.invoice_number || "",
            destination: selectedDestination,
            status: selectedStatus,
          });
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    }, [
      values?.bag_number,
      values?.invoice_number,
      selectedDestination,
      selectedStatus,
      onSearch,
    ]);

    const handleClearAll = useCallback(() => {
      setSelectedDestination([]);
      setSelectedStatus([]);
      form.resetFields();
      onClearFilters();
    }, [form, onClearFilters]);

    return (
      <Card style={{ width: "100%" }} size="small">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            onSearch({
              bag_number: values.bag_number || "",
              invoice_number: values.invoice_number || "",
              destination: selectedDestination,
              status: selectedStatus,
            })
          }
        >
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              label="Номер мешка"
              name="bag_number"
              style={{ flex: 1 }}
            >
              <Input
                placeholder="11"
                prefix={
                  loading ? (
                    <Spin size="small" />
                  ) : (
                    <SearchOutlined style={{ color: "#bfbfbf" }} />
                  )
                }
              />
            </Form.Item>

            <Form.Item
              label="Номер накладной"
              name="invoice_number"
              style={{ flex: 1 }}
            >
              <Input
                placeholder="446751348668"
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                suffix={
                  (selectedDestination.length > 0 ||
                    selectedStatus.length > 0 ||
                    values?.bag_number ||
                    values?.invoice_number) && (
                    <Button
                      type="text"
                      size="small"
                      onClick={handleClearAll}
                      style={{ color: "#999" }}
                    >
                      Очистить
                    </Button>
                  )
                }
              />
            </Form.Item>

            <Form.Item label="Пункт назначения" style={{ flex: 1 }}>
              <Select
                mode="multiple"
                placeholder="Выберите города"
                allowClear
                value={selectedDestination}
                onChange={handleDestinationChange}
                showSearch
                filterOption={filterOption}
                options={branchOptions}
                maxTagCount="responsive"
              />
            </Form.Item>

            <Form.Item label="Статус" style={{ flex: 1 }}>
              <Select
                mode="multiple"
                placeholder="Выберите статусы"
                allowClear
                value={selectedStatus}
                onChange={handleStatusChange}
                options={statuses}
                maxTagCount="responsive"
              />
            </Form.Item>

            <Form.Item label=" " style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SearchOutlined />}
              >
                Найти
              </Button>
            </Form.Item>
          </div>

          {/* Индикация активных фильтров */}
          {(selectedDestination.length > 0 || selectedStatus.length > 0) && (
            <Row>
              <Col span={24}>
                <Space wrap>
                  <Text type="secondary">Активные фильтры:</Text>
                  {selectedDestination.length > 0 &&
                    selectedDestination.map((destId) => (
                      <Tag
                        key={destId}
                        color="blue"
                        closable
                        onClose={() =>
                          setSelectedDestination((prev) =>
                            prev.filter((id) => id !== destId)
                          )
                        }
                      >
                        Город:{" "}
                        {branchOptions.find((b) => b.value === destId)?.label}
                      </Tag>
                    ))}
                  {selectedStatus.length > 0 &&
                    selectedStatus.map((status) => (
                      <Tag
                        key={status}
                        color="green"
                        closable
                        onClose={() =>
                          setSelectedStatus((prev) =>
                            prev.filter((s) => s !== status)
                          )
                        }
                      >
                        Статус: {status}
                      </Tag>
                    ))}
                </Space>
              </Col>
            </Row>
          )}
        </Form>
      </Card>
    );
  }
);

SearchForm.displayName = "SearchForm";

// Компонент отображения результатов
const TrackingResults = memo<TrackingResultsProps>(
  ({ trackingData, loading, error, searchType, onClearFilters }) => {
    const getStatusColor = useCallback((status?: string) => {
      switch (status) {
        case "В пути":
          return "processing";
        case "На складе":
          return "warning";
        case "Выдано":
          return "success";
        case "Получено":
          return "success";
        default:
          return "default";
      }
    }, []);

    const groupedData = useMemo(
      () =>
        trackingData.reduce((groups: any, item: TrackingData) => {
          const invoiceNumber = item?.good?.invoice_number;
          if (!groups[invoiceNumber]) {
            groups[invoiceNumber] = {
              good: item.good,
              shipments: {},
            };
          }

          const shipmentId = item?.shipment_id || "warehouse";
          if (!groups[invoiceNumber].shipments[shipmentId]) {
            groups[invoiceNumber].shipments[shipmentId] = {
              shipment: item.shipment,
              bags: [],
            };
          }

          groups[invoiceNumber].shipments[shipmentId].bags.push(item);
          return groups;
        }, {}),
      [trackingData]
    );

    const renderInvoiceGroup = useCallback(
      (invoiceNumber: string, group: any, index: number) => {
        const allBags = Object.values(group.shipments).reduce(
          (acc: any[], shipmentGroup: any) => {
            return acc.concat(shipmentGroup.bags);
          },
          []
        );
        const totalBags = allBags.length;
        const totalWeight = allBags.reduce(
          (sum: number, bag: any) => sum + Number(bag.weight || 0),
          0
        );
        const totalSum = allBags.reduce(
          (sum: number, bag: any) => sum + Number(bag.sum || 0),
          0
        );

        return (
          <Card
            style={{ marginBottom: 8 }}
            size="small"
            key={index}
            title={
              <Row align="middle" justify="space-between">
                <Col>
                  <Space>
                    <SearchOutlined style={{ color: "#52c41a" }} />
                    <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                      Номер накладной: {invoiceNumber}
                    </span>
                    <Tag color="blue">Общее кол-во мешков: {totalBags}</Tag>
                  </Space>
                </Col>
                <Col>
                  <Tag
                    color={getStatusColor(group.good?.status)}
                    style={{ fontSize: "14px" }}
                  >
                    {group.good?.status}
                  </Tag>
                </Col>
              </Row>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={6}>
                <Card type="inner" size="small" title="Детали накладной">
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="small"
                  >
                    <div>
                      <Text strong>Общий вес:</Text> {group.good?.weight} кг
                    </div>
                    <div>
                      <Text strong>Общая сумма:</Text>
                      <Text style={{ color: "#52c41a", fontWeight: "bold" }}>
                        {" "}
                        {group.good?.amount}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Оплачено:</Text> {group.good?.paid_sum}
                    </div>
                    <div>
                      <Text strong>Долг:</Text>
                      <Text
                        style={{
                          color:
                            Number(group.good?.amount) -
                              Number(group.good?.paid_sum) >
                            0
                              ? "#ff4d4f"
                              : "#52c41a",
                          fontWeight: "bold",
                        }}
                      >
                        {Number(group.good?.amount) -
                          Number(group.good?.paid_sum)}{" "}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Дата создания:</Text>{" "}
                      {dayjs(group.good?.created_at).format("DD.MM.YYYY HH:mm")}
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} xl={18}>
                <Row gutter={[12, 12]}>
                  {Object.entries(group.shipments).map(
                    ([shipmentId, shipmentGroup]: [string, any]) => {
                      const isWarehouse = shipmentId === "warehouse";
                      const shipmentBags = shipmentGroup.bags.length;
                      const shipmentWeight = shipmentGroup.bags.reduce(
                        (sum: number, bag: any) =>
                          sum + Number(bag.weight || 0),
                        0
                      );
                      const shipmentSum = shipmentGroup.bags.reduce(
                        (sum: number, bag: any) => sum + Number(bag.sum || 0),
                        0
                      );

                      return (
                        <Col xs={24} lg={12} key={shipmentId}>
                          <Card
                            type="inner"
                            size="small"
                            style={{
                              backgroundColor: isWarehouse
                                ? "#fff7e6"
                                : "#f6ffed",
                              border: isWarehouse
                                ? "1px solid #ffd591"
                                : "1px solid #b7eb8f",
                            }}
                            title={
                              <Space>
                                {isWarehouse ? (
                                  <>
                                    <InboxOutlined
                                      style={{ color: "#fa8c16" }}
                                    />
                                    <span
                                      style={{
                                        color: "#fa8c16",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      На складе
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <SearchOutlined
                                      style={{ color: "#722ed1" }}
                                    />
                                    <span
                                      style={{
                                        color: "#722ed1",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Номер рейса:{" "}
                                      {shipmentGroup.shipment?.truck_number}
                                    </span>
                                  </>
                                )}
                                <Tag
                                  color={isWarehouse ? "orange" : "purple"}
                                  style={{ fontSize: "11px" }}
                                >
                                  Кол-во мешков: {shipmentBags}
                                </Tag>
                              </Space>
                            }
                          >
                            {!isWarehouse && shipmentGroup.shipment && (
                              <div
                                style={{
                                  marginBottom: 12,
                                  padding: "8px",
                                  backgroundColor: "#f9f9f9",
                                  borderRadius: "4px",
                                }}
                              >
                                <Row gutter={12}>
                                  <Col span={12}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "12px" }}
                                    >
                                      Водитель:
                                    </Text>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {shipmentGroup.shipment.driver}
                                    </div>
                                  </Col>
                                  <Col span={12}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "12px" }}
                                    >
                                      Статус:
                                    </Text>
                                    <div>
                                      <Tag
                                        color={getStatusColor(
                                          shipmentGroup.shipment.status
                                        )}
                                        style={{
                                          fontSize: "11px",
                                          marginTop: 2,
                                        }}
                                      >
                                        {shipmentGroup.shipment.status}
                                      </Tag>
                                    </div>
                                  </Col>
                                </Row>
                                
                                {shipmentGroup.shipment.history && 
                                 shipmentGroup.shipment.history.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "11px", marginBottom: 4, display: "block" }}
                                    >
                                      📋 История рейса:
                                    </Text>
                                    <div
                                      style={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e8e8e8",
                                        borderRadius: "3px",
                                        padding: "4px",
                                      }}
                                    >
                                      {shipmentGroup.shipment.history
                                        .sort((a: any, b: any) => 
                                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                        )
                                        .map((historyItem: any, historyIndex: number) => (
                                          <div
                                            key={historyItem.id}
                                            style={{
                                              padding: "3px 6px",
                                              marginBottom: historyIndex < shipmentGroup.shipment.history.length - 1 ? 2 : 0,
                                              backgroundColor: historyIndex % 2 === 0 ? "#fafafa" : "#ffffff",
                                              borderRadius: "2px",
                                              fontSize: "10px",
                                              lineHeight: "1.2",
                                            }}
                                          >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                              <Text style={{ fontSize: "10px", flex: 1 }}>
                                                {historyItem.message}
                                              </Text>
                                              <Text 
                                                type="secondary" 
                                                style={{ 
                                                  fontSize: "9px", 
                                                  marginLeft: 6,
                                                  whiteSpace: "nowrap"
                                                }}
                                              >
                                                {dayjs(historyItem.created_at).format("DD.MM HH:mm")}
                                              </Text>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div
                              style={{ maxHeight: "400px", overflowY: "auto" }}
                            >
                              {shipmentGroup.bags.map(
                                (bag: any, bagIndex: number) => (
                                  <div
                                    key={bag.id}
                                    style={{
                                      padding: "6px 8px",
                                      marginBottom: 4,
                                      backgroundColor:
                                        bagIndex % 2 === 0
                                          ? "#ffffff"
                                          : "#fafafa",
                                      border: "1px solid #f0f0f0",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    <Row gutter={8} align="middle">
                                      <Col flex="auto">
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              gap: 2,
                                              justifyContent: "space-between",
                                              width: "100%",
                                            }}
                                          >
                                            <Text
                                              strong
                                              style={{
                                                fontSize: "13px",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              Номер мешка:{" "}
                                            <br />
                                              <span
                                                style={{ color: "#1890ff" }}
                                              >
                                                {bag.bag_number_numeric}
                                              </span>
                                            </Text>
                                            <Text
                                              strong
                                              style={{
                                                fontSize: "10px",
                                              }}
                                            >
                                              <span style={{ color: "red" }}>
                                                Номенклатура:
                                              </span>
                                              <br />
                                              {bag.nomenclature?.name}
                                            </Text>
                                            <Tag
                                              color={getStatusColor(bag.status)}
                                              style={{
                                                fontSize: "10px",
                                                margin: 0,
                                              }}
                                            >
                                              {bag.status}
                                            </Tag>
                                          </div>
                                          <div
                                            style={{ display: "flex", gap: 2 }}
                                          ></div>
                                        </div>
                                        <Row
                                          gutter={8}
                                          style={{ marginTop: 4 }}
                                        >
                                          <Col span={12}>
                                            <Text
                                              type="secondary"
                                              style={{ fontSize: "11px" }}
                                            >
                                              {bag.weight} кг
                                            </Text>
                                          </Col>
                                          <Col span={12}>
                                            <Text
                                              type="secondary"
                                              style={{ fontSize: "11px" }}
                                            >
                                              Сумма: {bag.sum}
                                            </Text>
                                          </Col>
                                        </Row>
                                      </Col>
                                    </Row>
                                  </div>
                                )
                              )}
                            </div>

                            <Divider style={{ margin: "8px 0" }} />
                            <Row gutter={8}>
                              <Col span={12}>
                                <Text
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "500",
                                  }}
                                >
                                  Вес: {shipmentWeight.toFixed(1)} кг
                                </Text>
                              </Col>
                              <Col span={12}>
                                <Text
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "500",
                                  }}
                                >
                                  Сумма: {shipmentSum}
                                </Text>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      );
                    }
                  )}
                </Row>
              </Col>
            </Row>
          </Card>
        );
      },
      [getStatusColor]
    );

    if (loading) {
      return (
        <Col style={{ marginTop: 4 }} span={24}>
          <Card>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>Поиск посылок...</Text>
              </div>
            </div>
          </Card>
        </Col>
      );
    }

    if (error) {
      return (
        <Col style={{ marginTop: 4 }} span={24}>
          <Alert
            type="error"
            message="Ошибка поиска"
            description={error}
            showIcon
            closable
            onClose={() => {}}
          />
        </Col>
      );
    }

    if (trackingData.length === 0) {
      return null;
    }

    return (
      <>
        <Col span={24}>
          <Card size="small" style={{ marginBottom: 4, marginTop: 4 }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={5} style={{ margin: 0, color: "#52c41a" }}>
                  📦 Найдено {Object.keys(groupedData).length}{" "}
                  {Object.keys(groupedData).length === 1
                    ? "накладная"
                    : Object.keys(groupedData).length < 5
                    ? "накладные"
                    : "накладных"}{" "}
                  ({trackingData.length} мешков)
                </Title>
                {searchType && (
                  <Text type="secondary">Поиск выполнен {searchType}</Text>
                )}
              </Col>
              <Col>
                <Button onClick={onClearFilters} type="dashed">
                  Новый поиск
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
        {Object.entries(groupedData).map(([invoiceNumber, group], index) =>
          renderInvoiceGroup(invoiceNumber, group, index)
        )}
      </>
    );
  }
);

TrackingResults.displayName = "TrackingResults";

// Основной компонент страницы
export const TrackingPage = () => {
  const setTitle = useDocumentTitle();
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [error, setError] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("");
  const token = localStorage.getItem("cargo-system-token");

  useEffect(() => {
    setTitle("Отслеживание посылок");
  }, [setTitle]);

  const { data: branchData } = useCustom({
    url: `${API_URL}/branch`,
    method: "get",
    config: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const branches = branchData?.data || [];

  // Оптимизированные options для Select компонентов
  const branchOptions = useMemo(
    () =>
      branches.map((branch: any) => ({
        value: branch.id,
        label: branch.name,
      })),
    [branches]
  );

  const onSearch = useCallback(
    async (params: SearchParams) => {
      setLoading(true);
      setError("");
      setTrackingData([]);

      try {
        const queryParams = [];
        let searchMethod = "";

        if (params.bag_number && params.bag_number.trim()) {
          queryParams.push(`bag_number=${params.bag_number.trim()}`);
          searchMethod = "по номеру мешка";
        }

        if (params.invoice_number && params.invoice_number.trim()) {
          queryParams.push(`invoice_number=${params.invoice_number.trim()}`);
          if (searchMethod) {
            searchMethod = "по номеру мешка и накладной";
          } else {
            searchMethod = "по номеру накладной";
          }
        }

        const filterParams: string[] = [];
        if (params.destination.length > 0) {
          params.destination.forEach((id) => {
            filterParams.push(`destination_id=${id}`);
          });
        }
        if (params.status.length > 0) {
          params.status.forEach((status) => {
            filterParams.push(`status=${encodeURIComponent(status)}`);
          });
        }

        if (queryParams.length === 0 && filterParams.length === 0) {
          throw new Error(
            "Введите номер мешка, номер накладной или выберите фильтры"
          );
        }

        const mainQueryParams = queryParams.join("&");
        const finalParams = [mainQueryParams, ...filterParams]
          .filter(Boolean)
          .join("&");

        const response = await fetch(
          `${API_URL}/service/find-service-to-shipment?${finalParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "Посылка не найдена. Проверьте правильность введенного номера."
            );
          }
          throw new Error("Ошибка при поиске посылки");
        }

        const data = await response.json();
        setTrackingData(Array.isArray(data) ? data : [data]);

        let fullSearchDescription = searchMethod;

        if (params.destination.length > 0 || params.status.length > 0) {
          const activeFilters = [];
          if (params.destination.length > 0) {
            const destinationNames = params.destination
              .map((id) => branches.find((b: any) => b.id === id)?.name)
              .filter(Boolean);
            activeFilters.push(`города: ${destinationNames.join(", ")}`);
          }
          if (params.status.length > 0) {
            activeFilters.push(`статусы: ${params.status.join(", ")}`);
          }

          if (searchMethod) {
            fullSearchDescription += ` + фильтры (${activeFilters.join(", ")})`;
          } else {
            fullSearchDescription = `по фильтрам (${activeFilters.join(", ")})`;
          }
        }
        setSearchType(fullSearchDescription);
      } catch (err: any) {
        setError(err.message || "Произошла ошибка при поиске");
      } finally {
        setLoading(false);
      }
    },
    [branches, token]
  );

  const clearFilters = useCallback(() => {
    setTrackingData([]);
    setError("");
    setSearchType("");
  }, []);

  return (
    <List title="Отслеживание посылок" headerButtons={() => false}>
      <Row gutter={[24, 4]}>
        <Col span={24}>
          <SearchForm
            onSearch={onSearch}
            loading={loading}
            branchOptions={branchOptions}
            onClearFilters={clearFilters}
          />
        </Col>
      </Row>
      <TrackingResults
        trackingData={trackingData}
        loading={loading}
        error={error}
        searchType={searchType}
        onClearFilters={clearFilters}
      />
    </List>
  );
};
