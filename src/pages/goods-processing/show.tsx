import React, { useRef, useState } from "react";
import { Show, EditButton, DeleteButton, useTable } from "@refinedev/antd";
import { useShow, useNavigation } from "@refinedev/core";
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
        el.style.width = "100%";
        el.style.height = "297mm";
        el.style.boxSizing = "border-box";
      }
    },
    onAfterPrint: () => {
      const el = printRef.current;
      if (el) {
        el.removeAttribute("style");
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
    borderRight: "1px solid #EDEDEC",
    borderBottom: "1px solid #EDEDEC",
    padding: "2px 6px",
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
      const id = service.product_type.id;

      if (!acc[id]) {
        acc[id] = {
          ...service,
          quantity: 0,
          sum: 0,
          weight: 0,
          count: 0,
          bag_number: "",
        };
      }

      acc[id].quantity += service.quantity;
      acc[id].sum += parseFloat(service.sum);
      acc[id].weight += parseFloat(service.weight);
      acc[id].count += 1;

      if (service.bag_number) {
        acc[id].bag_number = acc[id].bag_number
          ? acc[id].bag_number + ", " + service.bag_number
          : service.bag_number;
      }

      return acc;
    }, {})
  );

  const som = currencyTableProps?.dataSource?.find(
    (item: any) => item.name === "Сом"
  );

  const InvoiceContent = () => {
    return (
      <div>
        <Flex justify="space-between" align="center">
          <img
            src="/rosscargo.png"
            style={{ width: 100, height: 60, objectFit: "contain" }}
            alt="photo"
          />
          <Title style={{ fontSize: 16, fontWeight: 600 }} level={5}>
            Накладная №: {record?.invoice_number}
          </Title>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text>Call-center: +996 509 003 003</Text>
          <Text>
            {dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
          </Text>
        </Flex>
        <Flex vertical style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 14, color: "#808080" }}>
            Досыл, услуги грузчиков и адресная доставка оплачивается отдельно
          </Text>
          <Text style={{ fontSize: 14, color: "#808080" }}>
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
            }{' '}
            Тел. Whatsapp:{" "}
            {
              tableProps?.dataSource?.find(
                (item: any) => item.id === record?.destination_id
              )?.phone
            }
          </Text>
        </Flex>

        <Row
          gutter={[12, 0]}
          style={{
            border: "1px solid #F2F2F1",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text>Отправитель</Text>
          </Col>
          <Col style={colStyle} span={8}></Col>
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text>Получатель</Text>
          </Col>
          <Col style={colStyle} span={8}></Col>

          <Col style={colStyle} span={4}>
            <Text>Код</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{`${record?.sender?.clientPrefix || ""}-${
              record?.sender?.clientCode || ""
            }`}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text>Код</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{`${record?.recipient?.clientPrefix || ""}-${
              record?.recipient?.clientCode || ""
            }`}</Text>
          </Col>

          <Col style={colStyle} span={4}>
            <Text>Фио</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{record?.sender?.name || ""}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text>Фио</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{record?.recipient?.name || ""}</Text>
          </Col>

          <Col style={colStyle} span={4}>
            <Text>Телефон</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>
              {record?.sender?.phoneNumber
                ? `+${record?.sender?.phoneNumber}`
                : ""}
            </Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text>Телефон</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>
              {record?.recipient?.phoneNumber
                ? `+${record?.recipient?.phoneNumber}`
                : ""}
            </Text>
          </Col>

          <Col style={colStyle} span={4}>
            <Text>Адрес</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{`${record?.employee?.branch?.name || ""} ${
              record?.employee?.under_branch?.address || ""
            }`}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text>Город назначения</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{record?.destination?.name || ""}</Text>
          </Col>

          <Col style={colStyle} span={4}>
            <Text>Комментарий</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{record?.comments || ""}</Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text>Досыл</Text>
          </Col>
          <Col style={colStyle} span={8}>
            <Text>{record?.sent_back?.name || ""}</Text>
          </Col>
        </Row>

        <Row
          gutter={[12, 0]}
          style={{
            border: "1px solid #F2F2F1",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text>№ Мешка, Коробки</Text>
          </Col>
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text>Наименование услуги</Text>
          </Col>
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text>Наименование товара клиента</Text>
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
                  borderBottom: "1px solid #EDEDEC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                }}
              >
                <p style={{ textAlign: "center", margin: 0 }}>Количество</p>
              </Col>
              <Col
                span={12}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: "1px solid #EDEDEC",
                  padding: "8px",
                }}
              >
                <p style={{ textAlign: "center", margin: 0 }}>Мест</p>
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
                <p style={{ textAlign: "center", margin: 0 }}>шт</p>
              </Col>
            </Row>
          </Col>
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={2}>
            <Text>Вес, кг</Text>
          </Col>
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={4}>
            <Text>Стоимость услуг</Text>
          </Col>
          <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={2}>
            <Text>Сумма</Text>
          </Col>

          {grouped?.map((service: any, index: number) => (
            <React.Fragment key={index}>
              <Col style={colStyle} span={4}>
                <Text>{service.bag_number}</Text>
              </Col>
              <Col style={colStyle} span={4}>
                <Text style={{ fontSize: 13, lineHeight: "10px" }}>
                  Грузоперевозка{" "}
                  {`${record?.employee?.branch?.name} - ${record?.destination?.name}`}
                </Text>
              </Col>
              <Col style={colStyle} span={4}>
                <Text>{service.nomenclature?.name}</Text>
              </Col>
              <Col style={colStyle} span={2}>
                <Text>{service.count || 0}</Text>
              </Col>
              <Col style={colStyle} span={2}>
                <Text>{service.quantity || 0}</Text>
              </Col>
              <Col style={colStyle} span={2}>
                <Text>
                  {String(service.weight).replace(".", ",").slice(0, 5) || 0}
                </Text>
              </Col>
              <Col style={colStyle} span={4}>
                <Text>{service.tariff || 0}</Text>
              </Col>
              <Col style={colStyle} span={2}>
                <Text>{service.sum || 0}</Text>
              </Col>
            </React.Fragment>
          ))}

          <Col style={colStyle} span={12}>
            <Text style={{ textAlign: "end", fontWeight: "bold" }}>Итого</Text>
          </Col>
          <Col style={colStyle} span={2}>
            <Text style={{ fontWeight: "bold" }}>{totalPlaces}</Text>
          </Col>
          <Col style={colStyle} span={2}>
            <Text style={{ fontWeight: "bold" }}>{totalQuantity}</Text>
          </Col>
          <Col style={colStyle} span={2}>
            <Text style={{ fontWeight: "bold" }}>
              {String(totalWeight).replace(".", ",").slice(0, 5)}
            </Text>
          </Col>
          <Col style={colStyle} span={4}>
            <Text style={{ fontWeight: "bold" }}>-</Text>
          </Col>
          <Col style={colStyle} span={2}>
            <Text style={{ fontWeight: "bold" }}>{totalSum}</Text>
          </Col>
        </Row>
        {record?.products?.length ? (
          <Row
            gutter={[12, 0]}
            style={{
              border: "1px solid #F2F2F1",
              borderRadius: 10,
              overflow: "hidden",
              marginTop: 12,
            }}
          >
            <Col span={10} style={{ ...colStyle, backgroundColor: "#F5F5F4" }}>
              <Text>Номенклатура</Text>
            </Col>
            <Col span={4} style={{ ...colStyle, backgroundColor: "#F5F5F4" }}>
              <Text>Цена</Text>
            </Col>
            <Col span={4} style={{ ...colStyle, backgroundColor: "#F5F5F4" }}>
              <Text>Количество, шт</Text>
            </Col>
            <Col span={6} style={{ ...colStyle, backgroundColor: "#F5F5F4" }}>
              <Text>Сумма</Text>
            </Col>

            {record?.products?.map(
              ({ id, name, price, quantity, sum }: any) => (
                <React.Fragment key={id}>
                  <Col span={10} style={colStyle}>
                    <Text>{name}</Text>
                  </Col>
                  <Col span={4} style={colStyle}>
                    <Text>{price}</Text>
                  </Col>
                  <Col span={4} style={colStyle}>
                    <Text>{quantity}</Text>
                  </Col>
                  <Col span={6} style={colStyle}>
                    <Text>{sum}</Text>
                  </Col>
                </React.Fragment>
              )
            )}

            <Col span={10} style={colStyle}>
              <Text style={{ fontWeight: "bold" }}>Итого</Text>
            </Col>
            <Col span={4} style={colStyle}>
              <Text style={{ fontWeight: "bold" }}>{totalProdQty}</Text>
            </Col>
            <Col span={6} style={colStyle}>
              <Text style={{ fontWeight: "bold" }}>{totalProdSum}</Text>
            </Col>
          </Row>
        ) : (
          ""
        )}
        <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: "bold", fontSize: 15 }}>Сумма заказа</Text>
          <Flex vertical align="flex-end" style={{ width: "300px" }}>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                borderBottom: "1px solid black",
              }}
            >
              Итого к оплате: {totalSum + totalProdSum} RUB
            </Text>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {((totalSum + totalProdSum) * Number(som?.rate)).toFixed(0)} KGS
            </Text>
          </Flex>
        </Flex>
        <Flex gap={12} style={{ marginTop: 5 }}>
          <Flex vertical style={{ width: "50%", fontSize: 14 }}>
            <Text>Условия перевозок:</Text>
            <Text style={{ fontSize: 12 }}>
              1. Клиент / представитель Клиента гарантирует, что отправляемый
              груз не содержит предметов, запрещенных к перевозке, в
              соответствии с правилами компании, указанными на сайте
              www.rosscargo.kg и действующим законодательством КР, и несет
              полную ответственность за достоверность предоставляемой
              информации.
            </Text>
            <Text style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              2. В случае пропажи или порчи товара, или пожара Клиенту
              возмещается стоимость 1 кг груза по следующим тарифам: а) товары
              производства Кыргызстана - по 600 руб., б) товары производства
              Турции - по 1000 руб., в) товары производства Китая и других стран
              - по 750 руб. Гарантия не распространяется на досылы
            </Text>
            <Text style={{ fontSize: 12, marginBottom: 4 }}>
              3. При сдаче и перевозки груза Росс Карго несет ответственность
              только на массу груза, за количество ответственности не несет.
            </Text>
          </Flex>
          <Flex vertical style={{ width: "50%", fontSize: 12 }}>
            <Text style={{ fontSize: 12, marginBottom: 4 }}>
              4. Стоимость доставки указана только до конечных городов: Москва,
              Новосибирск, Екатеринбург. За досыл в другие города взимается
              дополнительная плата в соответствии с тарифами местных
              транспортных компании, кроме того, возможны дополнительные
              расходы, связанные с обработкой груза, таких как перегруз,
              хранение и другое в соответствии с требованиями администрации
              (склада, рынка, пункта перегрузки) на местах.
            </Text>
            <Text style={{ fontSize: 12 }}>
              5. Предоставляя свои персональные данные, Клиент / представитель
              Клиента дает полное и безусловное согласие на их хранение и
              обработку. 6. Подписанием данного документа Клиент / представитель
              Клиента подтверждает, что ознакомлен и согласен со всеми его
              условиями. Накладная составлена в двух экземплярах, по одной для
              каждой из сторон, и имеет равную юридическую силу
            </Text>
          </Flex>
        </Flex>
        <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
          <Flex vertical>
            <Text>Принял(а): _______________________</Text>
            <Text>
              Менеджер: {record?.employee?.firstName}{" "}
              {record?.employee?.lastName}
            </Text>
          </Flex>
          <Flex vertical>
            <Text>Сдал(а): _____________________________________</Text>
            <Text>
              ФИО клиента / представителя клиента{" "}
              <span style={{ marginLeft: 40 }}>подпись</span>
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
      <div ref={printRef} className="print-container">
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
