import React, { useRef } from "react";
import {
  Show,
  EditButton,
  DeleteButton,
  useTable,
  useSelect,
  useForm,
} from "@refinedev/antd";
import { useNavigation, useShow, useUpdateMany } from "@refinedev/core";
import {
  Typography,
  Flex,
  Row,
  Col,
  Button,
  message,
  Dropdown,
  Card,
  Form,
  Select,
  Input,
} from "antd";
import { PrinterOutlined, SendOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import QRCode from "react-qr-code";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useReactToPrint } from "react-to-print";
import { API_URL } from "../../App";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

// Функция для получения исторического курса валюты на конкретную дату


const { Title, Text } = Typography;

const paymentTypes = [
  "Оплата наличными",
  "Оплата переводом",
  "Оплата перечислением",
  "Оплата балансом",
];

const incomeTypes = [
  "Извне",
  "Контрагент оптом",
  "Контрагент частично",
  "Контрагент частично с баланса",
];

export const GoodsShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading, refetch } = queryResult;
  const record = data?.data;
  const printRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("cargo-system-token");

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
  });

  const { formProps, saveButtonProps, form, formLoading } = useForm({
    onMutationSuccess(data: any) {
      const id = data?.data?.id;
      if (record?.id) {
        updateManyGoods({
          ids: [record?.id],
          values: {
            operation_id: id,
          },
        });
        message.success("Частичная оплата создана успешно");
        refetch();
      }
    },
    resource: "cash-desk",
    redirect: false,
    //@ts-ignore
    defaultValues: {
      type: "income",
      date: dayjs(),
    },
  });

  const { selectProps: bankSelectProps } = useSelect({
    resource: "bank",
    optionLabel: "name",
  });

  const { selectProps: currencySelectProps } = useSelect({
    resource: "currency",
    optionLabel: "name",
  });
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
    queryOptions: {
      enabled: !!record?.services?.length,
    },
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
          ? acc[key].bag_number_numeric + ", " + service.bag_number_numeric
          : service.bag_number_numeric;
      }

      return acc;
    }, {})
  );

  // Получаем валюту "Сом" из загруженных данных
  const som = currencyTableProps?.dataSource?.find(
    (item: any) => item.name === "Сом"
  );

  // Универсальная функция для получения исторического курса валюты
  const getHistoricalRate = (currency: any, targetDate: string) => {
    if (!currency?.currency_history || !targetDate) {
      return currency?.rate || 1;
    }

    const sortedHistory = [...currency.currency_history].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const targetDateTime = new Date(targetDate).getTime();

    for (const historyRecord of sortedHistory) {
      const historyDateTime = new Date(historyRecord.created_at).getTime();
      if (historyDateTime <= targetDateTime) {
        return historyRecord.rate;
      }
    }

    return sortedHistory[sortedHistory.length - 1]?.rate || currency?.rate || 1;
  };

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
                Call-center: +996 509 003 003
              </Text>
            </Flex>
            <Text style={{ fontSize: "15px", color: "#010801", margin: 0 }}>
              Фактический конечный город, услуги грузчиков и адресная доставка оплачивается отдельно
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

        <Flex gap="5px">
          {/* Левая часть - информация об отправителе и получателе (30%) */}
          <div style={{ width: "30%" }}>
            <Row
              gutter={[2, 0]}
              style={{
                border: "1px solid black",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <Col
                style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600, borderRight: "none" }}
                span={24}
              >
                <Text className="table-text">Отправитель</Text>
              </Col>
              
              <Col style={colStyle} span={8}>
                <Text className="table-text">Код</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">{`${
                  record?.sender?.clientPrefix || ""
                }-${record?.sender?.clientCode || ""}`}</Text>
              </Col>
              
              <Col style={colStyle} span={8}>
                <Text className="table-text">Ф.И.О</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">{record?.sender?.name || ""}</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Контакты</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">
                  {record?.sender?.phoneNumber
                    ? `+${record?.sender?.phoneNumber}`
                    : ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Адрес склада</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">{`${
                  record?.employee?.branch?.name || ""
                } ${record?.employee?.under_branch?.address || ""}`}</Text>
              </Col>

              <Col style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600, borderRight: "none" }} span={24}>
                <Text className="table-text">Получатель</Text>
              </Col>
              
              <Col style={colStyle} span={8}>
                <Text className="table-text">Код</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">{`${
                  record?.recipient?.clientPrefix || ""
                }-${record?.recipient?.clientCode || ""}`}</Text>
              </Col>
              
              <Col style={colStyle} span={8}>
                <Text className="table-text">Ф.И.О</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">{record?.recipient?.name || ""}</Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Контакты</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">
                  {record?.recipient?.phoneNumber
                    ? `+${record?.recipient?.phoneNumber}`
                    : ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Город назначения</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text" style={{ fontWeight: 700 }}>
                  {record?.destination?.name || ""}
                </Text>
              </Col>

              <Col style={colStyle} span={8}>
                <Text className="table-text">Комментарий</Text>
              </Col>
              <Col style={{...colStyle, borderRight: "none"}} span={16}>
                <Text className="table-text">{record?.comments || ""}</Text>
              </Col>
              
              <Col style={{ ...colStyle, borderBottom: "none" }} span={8}>
                <Text className="table-text">Фактический конечный город</Text>
              </Col>
              <Col style={{ ...colStyle, borderBottom: "none", borderRight: "none" }} span={16}>
                <Text className="table-text">{record?.sent_back?.name || ""}</Text>
              </Col>
            </Row>
          </div>

          {/* Правая часть - таблицы с услугами и товарами (70%) */}
          <div style={{ width: "70%" }}>
            <Row
              gutter={[2, 0]}
              style={{
                border: "1px solid black",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <Col
                style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
                span={6}
              >
                <Text className="table-text">№ Мешка, Коробки</Text>
              </Col>
              <Col
                style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
                span={5}
              >
                <Text className="table-text">Наименование услуги</Text>
              </Col>
              <Col
                style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
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
                      style={{ textAlign: "center", margin: 0, fontWeight: 600 }}
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
                      style={{ textAlign: "center", margin: 0, fontWeight: 600 }}
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
                      style={{ textAlign: "center", margin: 0, fontWeight: 600 }}
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
                  Сумма
                </Text>
              </Col>

              {grouped?.map((service: any, index: number) => (
                <React.Fragment key={index}>
                  <Col style={colStyle} span={6}>
                    <Text className="table-text">{service.bag_number_numeric}</Text>
                  </Col>
                  <Col style={colStyle} span={5}>
                    <Text
                      className="table-text"
                      style={{ fontSize: 11, lineHeight: "12px", fontWeight: 600 }}
                    >
                      Грузоперевозка{" "}
                      {`${record?.employee?.branch?.name} - ${record?.destination?.name}`}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={5}>
                    <Text className="table-text">{service.nomenclature?.name}</Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">{service.count || 0}</Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">{service.quantity || 0}</Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">
                      {String(Number(service.weight || 0).toFixed(2)).replace(".", ",") || 0}
                    </Text>
                  </Col>
                  <Col style={colStyle} span={2}>
                    <Text className="table-text">
                      {Number(service.sum || 0).toFixed(2)}
                    </Text>
                  </Col>
                </React.Fragment>
              ))}
              <Col style={{ ...colStyle, borderBottom: "none" }} span={16}>
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
                  {String(Number(totalWeight || 0).toFixed(2)).replace(".", ",") || 0}
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
                  borderRadius: "4px",
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
                      <Col span={6} style={{ ...colStyle, borderRight: "none" }}>
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
          </div>
        </Flex>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginTop: "6px" }}
        >
          <Text
            className="total-sum-text"
            style={{ fontWeight: "bold", fontSize: "20px", margin: 0 }}
          >
            Сумма заказа
          </Text>
          <Flex vertical align="flex-end" style={{ width: "350px" }}>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: "20px",
                borderBottom: "1px solid black",
                margin: 0,
              }}
              className="total-sum-text"
            >
              Итого к оплате: {record?.amount} RUB
            </Text>
            <Text
              className="total-sum-text"
              style={{ fontWeight: "bold", fontSize: "14px", margin: 0 }}
            >
              {som && somRate 
                ? Number((Number(record?.amount || 0) * Number(somRate)) || 0).toFixed(2)
                : "Курс загружается..."
              } KGS
            </Text>
          </Flex>
        </Flex>
        <Flex gap="10px" style={{ marginTop: "3px" }}>
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
              Согласно накладному стоимость доставки указана только до «Городов назначения», за «Фактический конечный город» взимается дополнительная плата в соответствии с тарифами местных транспортных компании.
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: "1px 0", lineHeight: "1.0" }}
            >
              Получатель несет дополнительные расходы, связанные с хранением и иными услугами, взимаемыми в соответствии с требованиями администрации склада, рынка или перегрузочного пункта по месту доставки.
            </Text>
          </Flex>
          <Flex vertical style={{ width: "50%" }}>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              Предоставляя свои персональные данные, «Отправитель» дает полное и безусловное согласие на их хранение и обработку.
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              Подписанием данного накладного «Отправитель» подтверждает, что ознакомлен и согласен со всеми его условиями. Накладная составлена в двух экземплярах, по одной для каждой из сторон, и имеет равную юридическую силу.
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

  const handleSend = async () => {
    const response: any = await fetch(
      `${API_URL}/goods-processing/send-notification-wa`,
      {
        method: "POST",
        body: JSON.stringify({
          good_id: record?.id,
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      message.success("Сообщение отправлено");
      // refetch();
    } else {
      const data = await response.json();
      message.error(data?.message);
    }
  };

  const handleSaveCashDesk = () => {
    form.submit();
  };

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          <Dropdown
            trigger={["click"]}
            overlayStyle={{ width: "200px" }}
            overlay={
              <Card
                size="small"
                style={{
                  width: 480,
                  boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.3)",
                }}
              >
                <Form
                  {...formProps}
                  layout="vertical"
                  onFinish={(values: any) => {
                    // Рассчитываем общую сумму услуг и товаров
                    const totalServiceAmount = record?.services?.reduce(
                      (acc: number, service: any) => acc + Number(service.sum || 0),
                      0
                    ) || 0;
                    const totalProductAmount = record?.products?.reduce(
                      (acc: number, product: any) => acc + Number(product.sum || 0),
                      0
                    ) || 0;
                    const totalGoodAmount = totalServiceAmount + totalProductAmount;

                    // Получаем курс валюты для конвертации
                    const selectedCurrency = currencyTableProps?.dataSource?.find(
                      (item: any) => item.name === values.type_currency
                    );
                    const historicalRate = getHistoricalRate(selectedCurrency, record?.created_at);
                    
                    // Конвертируем в выбранную валюту
                    const convertedAmount = historicalRate > 0 ? historicalRate * totalGoodAmount : totalGoodAmount;
                    const remainingToPay = convertedAmount - (record?.paid_sum || 0);

                    // Проверяем что сумма не превышает остаток к доплате
                    if (values.amount > remainingToPay) {
                      message.error("Сумма к оплате не может превышать оставшуюся сумму к доплате");
                      return;
                    }

                    const finalValues = {
                      ...values,
                      type: "income",
                      type_operation: "Контрагент частично",
                      counterparty_id: record?.sender?.id,
                      good_id: record?.id,
                      paid_sum: remainingToPay, // Общая сумма к доплате
                      date: dayjs(),
                    };

                    formProps.onFinish && formProps.onFinish(finalValues);
                  }}
                >
                  <Row gutter={[16, 0]}>
                    <Col span={12}>
                      <Form.Item
                        label="Банк"
                        name={["bank_id"]}
                        rules={[
                          {
                            required: true,
                            message: "Пожалуйста, выберите Банк",
                          },
                        ]}
                      >
                        <Select
                          {...bankSelectProps}
                          placeholder="Выберите код банк"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Метод оплаты"
                        name="method_payment"
                        rules={[
                          {
                            required: true,
                            message: "Пожалуйста, выберите метод оплаты",
                          },
                        ]}
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
                    <Col span={12}>
                      <Form.Item
                        name="type_currency"
                        label="Валюта"
                        rules={[{ required: true, message: "Выберите Валюту" }]}
                      >
                        <Select
                          {...currencySelectProps}
                          showSearch
                          placeholder="Выберите валюту"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Сумма для прихода"
                        name="amount"
                        rules={[{ required: true, message: "Укажите сумму" }]}
                      >
                        <Input
                          type="number"
                          min={0}
                          placeholder="Введите сумму прихода"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <div style={{ marginBottom: "8px", fontSize: "14px", color: "#666" }}>
                        <strong>Общая сумма:</strong> {Number((Number(record?.services?.reduce((acc: number, service: any) => acc + Number(service.sum || 0), 0) || 0) + Number(record?.products?.reduce((acc: number, product: any) => acc + Number(product.sum || 0), 0) || 0)) || 0).toFixed(2)} RUB
                        <br />
                        <strong>Уже оплачено:</strong> {Number(record?.paid_sum || 0).toFixed(2)} RUB
                        <br />
                        <strong>К доплате:</strong> {Number((Number(record?.services?.reduce((acc: number, service: any) => acc + Number(service.sum || 0), 0) || 0) + Number(record?.products?.reduce((acc: number, product: any) => acc + Number(product.sum || 0), 0) || 0)) - Number(record?.paid_sum || 0) || 0).toFixed(2)} RUB
                      </div>
                    </Col>
                    <Col span={12}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={formLoading}
                      >3
                        Сохранить
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card>
            }
          >
            <Button>Оплатить частично</Button>
          </Dropdown>
          {!record?.send_notification && (
            <Button icon={<SendOutlined />} onClick={handleSend}>
              Отправить смс
            </Button>
          )}
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
