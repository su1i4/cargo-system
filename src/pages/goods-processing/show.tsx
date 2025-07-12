import React, { useRef } from "react";
import { Show, EditButton, DeleteButton, useTable } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Flex, Row, Col, Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useReactToPrint } from "react-to-print";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const { Title, Text } = Typography;

export const GoodsShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;
  const printRef = useRef<HTMLDivElement>(null);

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
        el.style.width = "100%";
        el.style.height = "100vh";
        el.style.boxSizing = "border-box";
        el.style.paddingLeft = "5px";

        // Если товаров много, делаем каждую копию на отдельной странице
        const invoiceCopies = el.querySelectorAll(".invoice-copy");
        if (isLargeInvoice) {
          invoiceCopies.forEach((copy: any, index: number) => {
            copy.style.setProperty("height", "auto", "important");
            copy.style.setProperty("page-break-before", index === 1 ? "always" : "auto", "important");
            copy.style.setProperty("page-break-inside", "avoid", "important");
            copy.style.setProperty("flex", "none", "important");
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
          });
          
          const divider = el.querySelector(".divider");
          if (divider) {
            (divider as any).style.display = "block";
          }
        }

        const totalSum = el.querySelectorAll(".total-sum-text");
        totalSum.forEach((section: any) => {
          section.style.setProperty("font-size", "14px", "important");
        });
        
        const tableText = el.querySelectorAll(".table-text");
        tableText.forEach((section: any) => {
          section.style.setProperty("font-size", "10px", "important");
        });

        const termsSection = el.querySelectorAll(".terms-section");
        termsSection.forEach((section: any) => {
          section.style.setProperty("font-size", "7px", "important");
          section.style.setProperty("line-height", "1", "important");
          section.style.setProperty("font-weight", "300", "important");
          section.style.setProperty("margin", "0", "important");
          section.style.setProperty("padding", "0", "important");
        });

        const termsSectionInvoice = el.querySelectorAll(
          ".terms-section-invoice"
        );
        termsSectionInvoice.forEach((section: any) => {
          section.style.setProperty("font-size", "15px", "important");
        });
      }
    },
    onAfterPrint: () => {
      const el = printRef.current;
      if (el) {
        el.removeAttribute("style");
        
        // Сбрасываем стили копий накладной
        const invoiceCopies = el.querySelectorAll(".invoice-copy");
        invoiceCopies.forEach((copy: any) => {
          copy.style.removeProperty("height");
          copy.style.removeProperty("page-break-before");
          copy.style.removeProperty("page-break-inside");
          copy.style.removeProperty("flex");
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

  if (isLoading) {
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
          bag_number: "",
        };
      }

      acc[key].quantity += service.quantity;
      acc[key].sum += parseFloat(service.sum);
      acc[key].weight += parseFloat(service.weight);
      acc[key].count += 1;

      if (service.bag_number) {
        acc[key].bag_number = acc[key].bag_number
          ? acc[key].bag_number + ", " + service.bag_number
          : service.bag_number;
      }

      return acc;
    }, {})
  );

  const som = currencyTableProps?.dataSource?.find(
    (item: any) => item.name === "Сом"
  );

  const getHistoricalRate = (currency: any, targetDate: string) => {
    if (!currency?.currency_history || !targetDate) {
      return currency?.rate || 1;
    }

    // Сортируем историю по дате (по убыванию)
    const sortedHistory = [...currency.currency_history].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const targetDateTime = new Date(targetDate).getTime();

    // Ищем курс, который был актуален на дату создания накладной
    for (const historyRecord of sortedHistory) {
      const historyDateTime = new Date(historyRecord.created_at).getTime();
      if (historyDateTime <= targetDateTime) {
        return historyRecord.rate;
      }
    }

    // Если не нашли подходящий исторический курс, берем самый ранний
    return sortedHistory[sortedHistory.length - 1]?.rate || currency?.rate || 1;
  };

  const somRate = getHistoricalRate(som, record?.created_at);

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

  const discount = getDiscount();

  const servicesCount = record?.services?.length || 0;
  const productsCount = record?.products?.length || 0;
  const totalItems = servicesCount + productsCount;
  const isLargeInvoice = totalItems > 15;

  const InvoiceContent = () => {
    return (
      <div>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: "4px" }}
        >
          <img
            src="/rosscargo.png"
            style={{ width: "70px", height: "40px", objectFit: "contain" }}
            alt="photo"
          />
          <Title
            className="terms-section-invoice"
            style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}
            level={5}
          >
            Накладная №: {record?.invoice_number}
          </Title>
        </Flex>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: "2px" }}
        >
          <Text style={{ fontSize: "15px" }}>
            Call-center: +996 509 003 003
          </Text>
          <Text style={{ fontSize: "15px" }}>
            {dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
          </Text>
        </Flex>
        <Flex vertical style={{ marginBottom: "6px" }}>
          <Text style={{ fontSize: "15px", color: "#010801", margin: 0 }}>
            Досыл, услуги грузчиков и адресная доставка оплачивается отдельно
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

        <Row
          gutter={[4, 0]}
          style={{
            border: "1px solid black",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "6px",
          }}
        >
          <Col
            style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
            span={4}
          >
            <Text className="table-text">Отправитель</Text>
          </Col>
          <Col style={colStyle} span={8}></Col>
          <Col
            style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
            span={4}
          >
            <Text className="table-text">Получатель</Text>
          </Col>
          <Col style={colStyle} span={8}></Col>

          <Col style={colStyle} span={4}>
            <Text className="table-text">Код</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">{`${
              record?.sender?.clientPrefix || ""
            }-${record?.sender?.clientCode || ""}`}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text className="table-text">Код</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">{`${
              record?.recipient?.clientPrefix || ""
            }-${record?.recipient?.clientCode || ""}`}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text className="table-text">Фио</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">{record?.sender?.name || ""}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text className="table-text">Фио</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">{record?.recipient?.name || ""}</Text>
          </Col>

          <Col style={colStyle} span={4}>
            <Text className="table-text">Телефон</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">
              {record?.sender?.phoneNumber
                ? `+${record?.sender?.phoneNumber}`
                : ""}
            </Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text className="table-text">Телефон</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">
              {record?.recipient?.phoneNumber
                ? `+${record?.recipient?.phoneNumber}`
                : ""}
            </Text>
          </Col>

          <Col style={colStyle} span={4}>
            <Text className="table-text">Адрес</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">{`${
              record?.employee?.branch?.name || ""
            } ${record?.employee?.under_branch?.address || ""}`}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text className="table-text">Город назначения</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text className="table-text">
              {record?.destination?.name || ""}
            </Text>
          </Col>

          <Col style={{ ...colStyle, borderBottom: "none" }} span={4}>
            <Text className="table-text">Комментарий</Text>
          </Col>
          <Col style={{ ...colStyle, borderBottom: "none" }} span={8}>
            <Text className="table-text">{record?.comments || ""}</Text>
          </Col>
          <Col style={{ ...colStyle, borderBottom: "none" }} span={4}>
            <Text className="table-text">Досыл</Text>
          </Col>
          <Col style={{ ...colStyle, borderBottom: "none" }} span={8}>
            <Text className="table-text">{record?.sent_back?.name || ""}</Text>
          </Col>
        </Row>
        <Row
          gutter={[4, 0]}
          style={{
            border: "1px solid black",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <Col
            style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
            span={4}
          >
            <Text className="table-text">№ Мешка, Коробки</Text>
          </Col>
          <Col
            style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
            span={4}
          >
            <Text className="table-text">Наименование услуги</Text>
          </Col>
          <Col
            style={{ ...colStyle, backgroundColor: "#F5F5F4", fontWeight: 600 }}
            span={4}
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
                  padding: "8px",
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
                  padding: "8px",
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
                  padding: "8px",
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
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text className="table-text" style={{ fontWeight: 600 }}>
              Стоимость услуг
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
                <Text className="table-text">{service.bag_number}</Text>
              </Col>
              <Col style={colStyle} span={4}>
                <Text
                  className="table-text"
                  style={{ fontSize: 13, lineHeight: "5px", fontWeight: 600 }}
                >
                  Грузоперевозка{" "}
                  {`${record?.employee?.branch?.name} - ${record?.destination?.name}`}
                </Text>
              </Col>
              <Col style={colStyle} span={4}>
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
                  {String(service.weight?.toFixed(2)).replace(".", ",") || 0}
                </Text>
              </Col>
              <Col style={colStyle} span={4}>
                <Text className="table-text">
                  {service.price - discount || 0}
                </Text>
              </Col>
              <Col style={colStyle} span={2}>
                <Text className="table-text">{service.sum?.toFixed(2) || 0}</Text>
              </Col>
            </React.Fragment>
          ))}
          <Col style={{ ...colStyle, borderBottom: "none" }} span={12}>
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
              {String(totalWeight?.toFixed(2)).replace(".", ",") || 0}
            </Text>
          </Col>
          <Col style={{ ...colStyle, borderBottom: "none" }} span={4}>
            <Text className="table-text" style={{ fontWeight: "bold" }}>
              -
            </Text>
          </Col>
          <Col style={{ ...colStyle, borderBottom: "none" }} span={2}>
            <Text className="table-text" style={{ fontWeight: "bold" }}>
              {totalSum?.toFixed(2)}
            </Text>
          </Col>
        </Row>
        {record?.products?.length ? (
          <Row
            gutter={[4, 0]}
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
        ) : (
          ""
        )}
        <Flex
          justify="space-between"
          align="center"
          style={{ marginTop: "6px" }}
        >
          <Text className="total-sum-text" style={{ fontWeight: "bold", fontSize: "20px", margin: 0 }}>
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
            <Text className="total-sum-text" style={{ fontWeight: "bold", fontSize: "14px", margin: 0 }}>
              {((record?.amount || 0) * Number(somRate)).toFixed(2)} KGS
            </Text>
          </Flex>
        </Flex>
        <Flex gap="3px" style={{ marginTop: "3px" }}>
          <Flex vertical style={{ width: "50%" }}>
            <Text
              className="terms-section"
              style={{ margin: 0, fontWeight: "bold", fontSize: "0.7em" }}
            >
              Условия перевозок:
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              1. Клиент / представитель Клиента гарантирует, что отправляемый
              груз не содержит предметов, запрещенных к перевозке, в
              соответствии с правилами компании, указанными на сайте
              www.rosscargo.kg и действующим законодательством КР, и несет
              полную ответственность за достоверность предоставляемой
              информации.
            </Text>
            <Text
              className="terms-section"
              style={{
                fontSize: "0.8em",
                fontWeight: '600 !important',
                margin: "1px 0",
                lineHeight: "1.0",

              }}
            >
              2. В случае пропажи или порчи товара, или пожара Клиенту
              возмещается стоимость 1 кг груза по следующим тарифам: а) товары
              производства Кыргызстана - по 600 руб., б) товары производства
              Турции - по 1000 руб., в) товары производства Китая и других стран
              - по 750 руб. Гарантия не распространяется на досылы
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              3. При сдаче и перевозки груза Росс Карго несет ответственность
              только на массу груза, за количество ответственности не несет.
            </Text>
          </Flex>
          <Flex vertical style={{ width: "50%" }}>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              4. Стоимость доставки указана только до конечных городов: Москва,
              Новосибирск, Екатеринбург. За досыл в другие города взимается
              дополнительная плата в соответствии с тарифами местных
              транспортных компании, кроме того, возможны дополнительные
              расходы, связанные с обработкой груза, таких как перегруз,
              хранение и другое в соответствии с требованиями администрации
              (склада, рынка, пункта перегрузки) на местах.
            </Text>
            <Text
              className="terms-section"
              style={{ fontSize: "0.8em", margin: 0, lineHeight: "1.0" }}
            >
              5. Предоставляя свои персональные данные, Клиент / представитель
              Клиента дает полное и безусловное согласие на их хранение и
              обработку. 6. Подписанием данного документа Клиент / представитель
              Клиента подтверждает, что ознакомлен и согласен со всеми его
              условиями. Накладная составлена в двух экземплярах, по одной для
              каждой из сторон, и имеет равную юридическую силу
            </Text>
          </Flex>
        </Flex>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginTop: "4px" }}
        >
          <Flex vertical>
            <Text style={{ margin: 0, fontSize: "1.1em" }}>
              Принял(а): _______________________
            </Text>
            <Text style={{ margin: 0, fontSize: "1.1em" }}>
              Менеджер: {record?.employee?.firstName}{" "}
              {record?.employee?.lastName}
            </Text>
          </Flex>
          <Flex vertical>
            <Text style={{ margin: 0, fontSize: "1.1em" }}>
              Сдал(а): _____________________________________
            </Text>
            <Text style={{ margin: 0, fontSize: "1.1em" }}>
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
        className={`print-container ${isLargeInvoice ? 'large-invoice' : ''}`}
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
