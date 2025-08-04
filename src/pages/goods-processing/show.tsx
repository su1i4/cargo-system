import React, { useRef } from "react";
import {
  Show,
  EditButton,
  DeleteButton,
  useTable,
} from "@refinedev/antd";
import { useNavigation, useShow } from "@refinedev/core";
import {
  Typography,
  Flex,
  Row,
  Col,
  Button,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import QRCode from "react-qr-code";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useReactToPrint } from "react-to-print";
import { PartialPayment } from "./PartialPayment";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const { Title, Text } = Typography;

// Функция для получения исторического курса валюты на конкретную дату
const getHistoricalRate = (currency: any, targetDate: string) => {
  if (!currency?.currency_history || !targetDate) {
    return currency?.rate || 1;
  }

  // Сортируем историю по дате (по убыванию)
  const sortedHistory = [...currency.currency_history].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const targetDateTime = new Date(targetDate).getTime();

  // Ищем курс, который был актуален на дату создания товара
  for (const historyRecord of sortedHistory) {
    const historyDateTime = new Date(historyRecord.created_at).getTime();
    if (historyDateTime <= targetDateTime) {
      return historyRecord.rate;
    }
  }

  // Если не нашли подходящий исторический курс, берем самый ранний
  return sortedHistory[sortedHistory.length - 1]?.rate || currency?.rate || 1;
};

export const GoodsShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading, refetch } = queryResult;
  const record = data?.data;
  const printRef = useRef<HTMLDivElement>(null);
  
  const { push } = useNavigation();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Накладная ${dayjs().format("DD.MM.YYYY HH:mm")}`,
    onBeforePrint: async () => {
      const el = printRef.current;
      if (el) {
        let fontSize = 15;
        if (totalItems > 20) {
          fontSize = 14;
        } else if (totalItems > 15) {
          fontSize = 13;
        } else if (totalItems < 5) {
          fontSize = 15;
        }

        el.style.fontSize = `${fontSize}px`;
        el.style.fontFamily = "Times New Roman, serif";
        el.style.width = "100%";
        el.style.height = "100vh";
        el.style.boxSizing = "border-box";
        el.style.paddingLeft = "5px";

        // Если товаров много, делаем каждую копию на отдельной странице
        const invoiceCopies = el.querySelectorAll(".invoice-copy");
        if (isLargeInvoice) {
          invoiceCopies.forEach((copy: any, index: number) => {
            copy.style.setProperty("height", "auto", "important");
            copy.style.setProperty(
              "page-break-before",
              index === 1 ? "always" : "auto",
              "important"
            );
            copy.style.setProperty("page-break-inside", "avoid", "important");
            copy.style.setProperty("flex", "none", "important");
            // copy.style.setProperty("font-family", "Times New Roman, serif", "important");
          });

          // Убираем divider если используем отдельные страницы
          const divider = el.querySelector(".divider");
          if (divider) {
            (divider as any).style.display = "none";
          }
        } else {
          // Для небольшого количества товаров оставляем как есть
          invoiceCopies.forEach((copy: any) => {
            copy.style.setProperty("height", "49.5vh", "important");
            copy.style.setProperty("page-break-before", "auto", "important");
            copy.style.setProperty("flex", "1", "important");
            // copy.style.setProperty("font-family", "Times New Roman, serif", "important");
          });

          const divider = el.querySelector(".divider");
          if (divider) {
            (divider as any).style.display = "block";
          }
        }

        const totalSum = el.querySelectorAll(".total-sum-text");
        totalSum.forEach((section: any) => {
          section.style.setProperty("font-size", "13px", "important");
          // section.style.setProperty("font-family", "Times New Roman, serif", "important");
        });

        const tableText = el.querySelectorAll(".table-text");
        tableText.forEach((section: any) => {
          section.style.setProperty("font-size", "11px", "important");
          // section.style.setProperty("font-family", "Times New Roman, serif", "important");
        });

        const termsSection = el.querySelectorAll(".terms-section");
        termsSection.forEach((section: any) => {
          section.style.setProperty("font-size", "10px", "important");
          section.style.setProperty("line-height", "1", "important");
          section.style.setProperty("font-weight", "400", "important");
          section.style.setProperty("margin", "0", "important");
          section.style.setProperty("padding", "0", "important");
          // section.style.setProperty("font-family", "Times New Roman, serif", "important");
        });

        const termsSectionInvoice = el.querySelectorAll(
          ".terms-section-invoice"
        );
        termsSectionInvoice.forEach((section: any) => {
          section.style.setProperty("font-size", "14px", "important");
          // section.style.setProperty("font-family", "Times New Roman, serif", "important");
        });
      }
    },
    onAfterPrint: () => {
      const el = printRef.current;
      if (el) {
        // Сохраняем fontFamily при сбросе других стилей
        const currentFontFamily = el.style.fontFamily;
        el.removeAttribute("style");
        el.style.fontFamily = currentFontFamily;

        // Сбрасываем стили копий накладной
        const invoiceCopies = el.querySelectorAll(".invoice-copy");
        invoiceCopies.forEach((copy: any) => {
          copy.style.removeProperty("height");
          copy.style.removeProperty("page-break-before");
          copy.style.removeProperty("page-break-inside");
          copy.style.removeProperty("flex");
          copy.style.removeProperty("font-family");
        });

        // Возвращаем divider
        const divider = el.querySelector(".divider");
        if (divider) {
          (divider as any).style.removeProperty("display");
        }

        const termsSection = el.querySelectorAll(".terms-section");
        termsSection.forEach((section: any) => {
          section.style.removeProperty("font-size");
          section.style.removeProperty("line-height");
          section.style.removeProperty("margin");
          section.style.removeProperty("padding");
          section.style.removeProperty("font-family");
        });

        const tableText = el.querySelectorAll(".table-text");
        tableText.forEach((section: any) => {
          section.style.removeProperty("font-size");
        });

        const totalSum = el.querySelectorAll(".total-sum-text");
        totalSum.forEach((section: any) => {
          section.style.removeProperty("font-size");
        });

        const termsSectionInvoice = el.querySelectorAll(
          ".terms-section-invoice"
        );
        termsSectionInvoice.forEach((section: any) => {
          section.style.removeProperty("font-size");
          section.style.removeProperty("font-family");
        });
      }
    },
    onPrintError: (error) => console.error("Print Error:", error),
  });

  const { tableProps } = useTable({
    resource: "branch",
    queryOptions: {
      enabled: !!record?.employee?.branch?.id,
    },
    pagination: {
      mode: "off",
    },
  });

  const { tableProps: currencyTableProps } = useTable({
    resource: "currency",
    pagination: {
      mode: "off",
    },
  });

  // Проверяем готовность данных о валютах
  const currenciesLoading = !currencyTableProps?.dataSource;

  if (isLoading || currenciesLoading) {
    return <div>Загрузка...</div>;
  }

  const colStyle = {
    borderRight: "1px solid black",
    borderBottom: "1px solid black",
    padding: "0px 2px",
  };

  const totalPlaces = record?.services?.length || 0;
  const totalQuantity =
    record?.services?.reduce(
      (acc: number, item: any) => acc + Number(item.quantity || 0),
      0
    ) || 0;
  const totalWeight =
    record?.services?.reduce(
      (acc: number, item: any) => acc + Number(item.weight || 0),
      0
    ) || 0;
  const totalSum =
    record?.services?.reduce(
      (acc: number, item: any) => acc + Number(item.sum || 0),
      0
    ) || 0;
  const totalProdQty =
    record?.products?.reduce(
      (acc: number, { quantity = 0 }) => acc + +quantity,
      0
    ) ?? 0;
  const totalProdSum =
    record?.products?.reduce((acc: number, { sum = 0 }) => acc + +sum, 0) ?? 0;

  const grouped = Object.values(
    record?.services?.reduce((acc: any, service: any) => {
      const key = `${service.product_type.id}_${service.price}`;

      if (!acc[key]) {
        acc[key] = {
          ...service,
          quantity: 0,
          sum: 0,
          weight: 0,
          count: 0,
          bag_number_numeric: "",
        };
      }

      acc[key].quantity += service.quantity;
      acc[key].sum += parseFloat(service.sum);
      acc[key].weight += parseFloat(service.weight);
      acc[key].count += 1;

      if (service.bag_number_numeric) {
        acc[key].bag_number_numeric = acc[key].bag_number_numeric
          ? acc[key].bag_number_numeric + "," + service.bag_number_numeric
          : service.bag_number_numeric;
      }

      return acc;
    }, {})
  );

  // Получаем валюту "Сом" из загруженных данных
  const som = currencyTableProps?.dataSource?.find(
    (item: any) => item.name === "Сом"
  );

  // Получаем курс сома на дату создания накладной
  const somRate = som ? getHistoricalRate(som, record?.created_at) : 1;

  const getDiscount = () => {
    if (record?.discount_id) {
      const discount_sum =
        record?.discount_id === record?.sender?.id
          ? record?.sender?.discount?.discount || 0
          : record?.recipient?.discount?.discount || 0;
      return discount_sum;
    }
    return 0;
  };

  const servicesCount = record?.services?.length || 0;
  const productsCount = record?.products?.length || 0;
  const totalItems = servicesCount + productsCount;
  const isLargeInvoice = totalItems > 15;

  const InvoiceContent = () => {
    return (
      <div>
        <Flex justify="space-between" style={{ marginBottom: "4px" }}>
          <Flex vertical>
            <img
              src="/rosscargo.png"
              style={{ width: "70px", height: "40px", objectFit: "contain" }}
              alt="photo"
            />
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: "2px" }}
            >
              <Text style={{ fontSize: "15px" }}>
                Call-center: +996 990 105 003
              </Text>
            </Flex>
            <Text style={{ fontSize: "15px", color: "#010801", margin: 0 }}>
              Фактический конечный город, услуги грузчиков и адресная доставка
              оплачивается отдельно
            </Text>
            <Text style={{ fontSize: "15px", color: "#010101", margin: 0 }}>
              Адрес склада:{" "}
              {
                tableProps?.dataSource?.find(
                  (item: any) => item.id === record?.destination_id
                )?.name
              }
              ,
              {
                tableProps?.dataSource?.find(
                  (item: any) => item.id === record?.destination_id
                )?.address
              }{" "}
              Тел. Whatsapp:{" "}
              {
                tableProps?.dataSource?.find(
                  (item: any) => item.id === record?.destination_id
                )?.phone
              }
            </Text>
          </Flex>
          <Flex vertical align="center" gap="3px">
            <QRCode
              value={`https://rosscargo.kg/?trackingNumber=${record?.invoice_number}`}
              size={55}
            />
            <Text style={{ fontSize: "15px", whiteSpace: "nowrap" }}>
              Сканируй и отслеживай
            </Text>
          </Flex>
          <Flex vertical align="end" gap="10px">
            <Title
              className="terms-section-invoice"
              style={{
                fontSize: "20px",
                fontWeight: 600,
                margin: 0,
                whiteSpace: "nowrap",
              }}
              level={5}
            >
              Накладная №: {record?.invoice_number}
            </Title>
            <Text style={{ fontSize: "15px" }}>
              {dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
            </Text>
          </Flex>
        </Flex>

        <Flex style={{ marginBottom: "5px" }} gap="5px">
          <div style={{ width: "30%" }}>
            <Row
              gutter={[2, 0]}
              style={{
                border: "1px solid black",
                overflow: "hidden",
              }}
            >
              <Col
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                  borderRight: "none",
                }}
                span={24}
              >
                <Text className="table-text">Отправитель</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Код</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">{`${
                  record?.sender?.clientPrefix || ""
                }-${record?.sender?.clientCode || ""}`}</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Ф.И.О</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">{record?.sender?.name || ""}</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Контакты</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">
                  {record?.sender?.phoneNumber
                    ? `+${record?.sender?.phoneNumber}`
                    : ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Адрес склада</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">{`${
                  record?.employee?.branch?.name || ""
                } ${record?.employee?.under_branch?.address || ""}`}</Text>
              </Col>

              <Col
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                  borderRight: "none",
                }}
                span={24}
              >
                <Text className="table-text">Получатель</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Код</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">{`${
                  record?.recipient?.clientPrefix || ""
                }-${record?.recipient?.clientCode || ""}`}</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Ф.И.О</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">
                  {record?.recipient?.name || ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Контакты</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">
                  {record?.recipient?.phoneNumber
                    ? `+${record?.recipient?.phoneNumber}`
                    : ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Город назначения</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text" style={{ fontWeight: 700 }}>
                  {record?.destination?.name || ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Комментарий</Text>
              </Col>
              <Col style={{ ...colStyle, borderRight: "none" }} span={16}>
                <Text className="table-text">{record?.comments || ""}</Text>
              </Col>

              <Col style={{ ...colStyle, borderBottom: "none" }} span={8}>
                <Text className="table-text">Фактический конечный город</Text>
              </Col>
              <Col
                style={{
                  ...colStyle,
                  borderBottom: "none",
                  borderRight: "none",
                }}
                span={16}
              >
                <Text className="table-text">
                  {record?.sent_back?.name || ""}
                </Text>
              </Col>
            </Row>
          </div>

          {/* Правая часть - таблицы с услугами и товарами (70%) */}
          <div style={{ width: "70%" }}>
            <Row
              gutter={[2, 0]}
              style={{
                border: "1px solid black",
                overflow: "hidden",
              }}
            >
              <Col
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
                span={4}
              >
                <Text className="table-text">№ Мешка, Коробки</Text>
              </Col>
              <Col
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
                span={5}
              >
                <Text className="table-text">Наименование услуги</Text>
              </Col>
              <Col
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
                span={5}
              >
                <Text className="table-text">Наименование товара клиента</Text>
              </Col>
              <Col
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  padding: 0,
                  overflow: "hidden",
                }}
                span={4}
              >
                <Row gutter={[12, 0]} style={{ overflow: "hidden" }}>
                  <Col
                    span={24}
                    style={{
                      borderBottom: "1px solid black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                    }}
                  >
                    <p
                      className="table-text"
                      style={{
                        textAlign: "center",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Количество
                    </p>
                  </Col>
                  <Col
                    span={12}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRight: "1px solid black",
                      padding: "4px",
                    }}
                  >
                    <p
                      className="table-text"
                      style={{
                        textAlign: "center",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Мест
                    </p>
                  </Col>
                  <Col
                    span={12}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                    }}
                  >
                    <p
                      className="table-text"
                      style={{
                        textAlign: "center",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      шт
                    </p>
                  </Col>
                </Row>
              </Col>
              <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={2}>
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  Вес, кг
                </Text>
              </Col>
              <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={2}>
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  Цена
                </Text>
              </Col>
              <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={2}>
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  Сумма
                </Text>
              </Col>

              {grouped?.map((service: any, index: number) => (
                <React.Fragment key={index}>
                  <Col style={colStyle} span={4}>
                    <Text className="table-text">
                      {service.bag_number_numeric}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={5}>
                    <Text
                      className="table-text"
                      style={{
                        fontSize: 11,
                        lineHeight: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Грузоперевозка{" "}
                      {`${record?.employee?.branch?.name} - ${record?.destination?.name}`}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={5}>
                    <Text className="table-text">
                      {service.nomenclature?.name}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">{service.count || 0}</Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">{service.quantity || 0}</Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">
                      {String(Number(service.weight || 0).toFixed(2)).replace(
                        ".",
                        ","
                      ) || 0}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">
                      {Number(service.price || 0).toFixed(2)}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">
                      {Number(service.sum || 0).toFixed(2)}
                    </Text>
                  </Col>
                </React.Fragment>
              ))}
              <Col style={{ ...colStyle, borderBottom: "none" }} span={14}>
                <Text
                  className="table-text"
                  style={{ textAlign: "end", fontWeight: "bold" }}
                >
                  Итого
                </Text>
              </Col>
              <Col style={{ ...colStyle, borderBottom: "none" }} span={2}>
                <Text className="table-text" style={{ fontWeight: "bold" }}>
                  {totalPlaces}
                </Text>
              </Col>
              <Col style={{ ...colStyle, borderBottom: "none" }} span={2}>
                <Text className="table-text" style={{ fontWeight: "bold" }}>
                  {totalQuantity}
                </Text>
              </Col>
              <Col style={{ ...colStyle, borderBottom: "none" }} span={2}>
                <Text className="table-text" style={{ fontWeight: "bold" }}>
                  {String(Number(totalWeight || 0).toFixed(2)).replace(
                    ".",
                    ","
                  ) || 0}
                </Text>
              </Col>
              <Col style={{ ...colStyle, borderBottom: "none" }} span={2}>
                <Text className="table-text" style={{ fontWeight: "bold" }}>
                  {/* {Number(totalSum || 0).toFixed(2)} */}
                </Text>
              </Col>
              <Col style={{ ...colStyle, borderBottom: "none" }} span={2}>
                <Text className="table-text" style={{ fontWeight: "bold" }}>
                  {Number(totalSum || 0).toFixed(2)}
                </Text>
              </Col>
            </Row>

            {/* Таблица с товарами в правой части */}
            {record?.products?.length ? (
              <Row
                gutter={[2, 0]}
                style={{
                  border: "1px solid black",
                  overflow: "hidden",
                  marginTop: "6px",
                }}
              >
                <Col
                  span={10}
                  style={{
                    ...colStyle,
                    backgroundColor: "#F5F5F4",
                    fontWeight: 600,
                  }}
                >
                  <Text className="table-text">Номенклатура</Text>
                </Col>
                <Col
                  span={4}
                  style={{
                    ...colStyle,
                    backgroundColor: "#F5F5F4",
                    fontWeight: 600,
                  }}
                >
                  <Text className="table-text">Цена</Text>
                </Col>
                <Col
                  span={4}
                  style={{
                    ...colStyle,
                    backgroundColor: "#F5F5F4",
                    fontWeight: 600,
                  }}
                >
                  <Text className="table-text">Количество, шт</Text>
                </Col>
                <Col
                  span={6}
                  style={{
                    ...colStyle,
                    backgroundColor: "#F5F5F4",
                    borderRight: "none",
                  }}
                >
                  <Text className="table-text" style={{ fontWeight: 600 }}>
                    Сумма
                  </Text>
                </Col>

                {record?.products?.map(
                  ({ id, name, price, quantity, sum }: any) => (
                    <React.Fragment key={id}>
                      <Col span={10} style={colStyle}>
                        <Text className="table-text">{name}</Text>
                      </Col>
                      <Col span={4} style={colStyle}>
                        <Text className="table-text">{price}</Text>
                      </Col>
                      <Col span={4} style={colStyle}>
                        <Text className="table-text">{quantity}</Text>
                      </Col>
                      <Col
                        span={6}
                        style={{ ...colStyle, borderRight: "none" }}
                      >
                        <Text className="table-text">{sum}</Text>
                      </Col>
                    </React.Fragment>
                  )
                )}
                <Col span={10} style={{ ...colStyle, borderBottom: "none" }}>
                  <Text className="table-text" style={{ fontWeight: "bold" }}>
                    Итого
                  </Text>
                </Col>
                <Col span={4} style={{ ...colStyle, borderBottom: "none" }}>
                  <Text
                    className="table-text"
                    style={{ fontWeight: "bold" }}
                  ></Text>
                </Col>
                <Col span={4} style={{ ...colStyle, borderBottom: "none" }}>
                  <Text className="table-text" style={{ fontWeight: "bold" }}>
                    {totalProdQty}
                  </Text>
                </Col>
                <Col span={6} style={{ ...colStyle, border: "none" }}>
                  <Text className="table-text" style={{ fontWeight: "bold" }}>
                    {totalProdSum}
                  </Text>
                </Col>
              </Row>
            ) : null}
            <Row
              gutter={[2, 0]}
              style={{
                border: "1px solid black",
                overflow: "hidden",
                marginTop: "6px",
              }}
            >
              <Col
                span={14}
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
              >
                <Text className="table-text"></Text>
              </Col>
              <Col
                span={4}
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">RUB</Text>
              </Col>
              <Col
                span={6}
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  borderRight: "none",
                }}
              >
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  KGS
                </Text>
              </Col>
              <Col
                span={14}
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">
                  Стоимость доставки (Транспортные услуги)
                </Text>
              </Col>
              <Col
                span={4}
                style={{
                  ...colStyle,
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">{record?.amount}</Text>
              </Col>
              <Col
                span={6}
                style={{
                  ...colStyle,
                  borderRight: "none",
                }}
              >
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  {som && somRate
                    ? Number(
                        Number(record?.amount || 0) * Number(somRate) || 0
                      ).toFixed(2)
                    : "Курс загружается..."}
                </Text>
              </Col>
              <Col
                span={14}
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">Оплачено</Text>
              </Col>
              <Col
                span={4}
                style={{
                  ...colStyle,
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">{record?.paid_sum}</Text>
              </Col>
              <Col
                span={6}
                style={{
                  ...colStyle,
                  borderRight: "none",
                }}
              >
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  {som && somRate
                    ? Number(
                        Number(record?.paid_sum || 0) * Number(somRate) || 0
                      ).toFixed(2)
                    : "Курс загружается..."}
                </Text>
              </Col>
              <Col
                span={14}
                style={{
                  ...colStyle,
                  backgroundColor: "#F5F5F4",
                  borderBottom: "none",
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">Итого к оплате (остаток)</Text>
              </Col>
              <Col
                span={4}
                style={{
                  ...colStyle,
                  borderBottom: "none",
                  fontWeight: 600,
                }}
              >
                <Text className="table-text">
                  {record?.amount - record?.paid_sum}
                </Text>
              </Col>
              <Col
                span={6}
                style={{
                  ...colStyle,
                  borderRight: "none",
                  borderBottom: "none",
                }}
              >
                <Text className="table-text" style={{ fontWeight: 600 }}>
                  {som && somRate
                    ? Number(
                        Number(record?.amount - record?.paid_sum || 0) *
                          Number(somRate) || 0
                      ).toFixed(2)
                    : "Курс загружается..."}
                </Text>
              </Col>
            </Row>
          </div>
        </Flex>
        <Flex gap="10px" style={{ marginTop: "5px" }}>
          <Flex vertical style={{ width: "50%" }}>
            <Text
              className="terms-section"
              style={{ margin: 0, fontWeight: "bold", fontSize: "0.7em" }}
            >
              Условия доставки:
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              Согласно накладному стоимость доставки указана только до «Городов
              назначения», за «Фактический конечный город» взимается
              дополнительная плата в соответствии с тарифами местных
              транспортных компании.
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: "1px 0", lineHeight: "1.0" }}
            >
              Получатель несет дополнительные расходы, связанные с хранением и
              иными услугами, взимаемыми в соответствии с требованиями
              администрации склада, рынка или перегрузочного пункта по месту
              доставки.
            </Text>
          </Flex>
          <Flex vertical style={{ width: "50%" }}>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              Предоставляя свои персональные данные, «Отправитель» дает полное и
              безусловное согласие на их хранение и обработку.
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              Подписанием данного накладного «Отправитель» подтверждает, что
              ознакомлен и согласен со всеми его условиями. Накладная составлена
              в двух экземплярах, по одной для каждой из сторон, и имеет равную
              юридическую силу.
            </Text>
          </Flex>
        </Flex>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginTop: "4px" }}
        >
          <Flex vertical>
            <Text style={{ margin: 0, fontSize: "1.2em" }}>
              Принял(а): _______________________
            </Text>
            <Text style={{ margin: 0, fontSize: "1.2em" }}>
              Менеджер: {record?.employee?.firstName}{" "}
              {record?.employee?.lastName}
            </Text>
          </Flex>
          <Flex vertical>
            <Text style={{ margin: 0, fontSize: "1.2em" }}>
              Сдал(а): _____________________________________
            </Text>
            <Text style={{ margin: 0, fontSize: "1.2em" }}>
              ФИО клиента / представителя клиента{" "}
              <span style={{ marginLeft: "20px" }}>подпись</span>
            </Text>
          </Flex>
        </Flex>
      </div>
    );
  };

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          {/* <PartialPayment record={record} refetch={refetch} /> */}
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Распечатать
          </Button>
          {editButtonProps && (
            <EditButton {...editButtonProps} meta={{ foo: "bar" }} />
          )}
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} meta={{ foo: "bar" }} />
          )}
        </>
      )}
    >
      <div
        ref={printRef}
        className={`print-container ${isLargeInvoice ? "large-invoice" : ""}`}
        style={{ fontFamily: "Times New Roman, serif" }}
      >
        <div className="invoice-copy">
          <InvoiceContent />
        </div>

        <div className="divider" />

        <div className="invoice-copy">
          <InvoiceContent />
        </div>
      </div>
    </Show>
  );
};
