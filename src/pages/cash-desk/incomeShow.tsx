import { useRef } from "react";
import { Show, TextField } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { Button, Col, Flex, Row, Table, Typography } from "antd";
import { useParams } from "react-router";
import { PrinterOutlined } from "@ant-design/icons";
import { operationStatus } from "../../shared/custom-tooltip";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bishkek");

const { Title } = Typography;

export const IncomeShow: React.FC = () => {
  const { id } = useParams();
  const { data: incomeData, isLoading: incomeLoading } = useOne({
    resource: "cash-desk",
    id: id,
  });

  const record = incomeData?.data;

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Накладная ${dayjs().format("DD.MM.YYYY HH:mm")}`,
    onBeforePrint: async () => {
      const el = printRef.current;
      if (el) {
        el.style.backgroundColor = "white";
      }
    },
    onAfterPrint: () => {
      const el = printRef.current;
      if (el) {
        el.style.backgroundColor = "gainsboro";
      }
    },
    onPrintError: (error) => console.error("Print Error:", error),
  });

  return (
    <Show
      headerButtons={() => (
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Распечатать
        </Button>
      )}
      isLoading={incomeLoading}
    >
      <div
        ref={printRef}
        style={{
          width: "105mm",
          height: "148mm",
          backgroundColor: "gainsboro",
          padding: "5px 10px",
        }}
      >
        <div style={{ transform: "scale(0.95)" }}>
          <p
            style={{
              width: "80%",
              textAlign: "center",
              borderBottom: "1px solid black",
            }}
          >
            ОсОО "Росс Карго"
          </p>
          <p
            style={{
              textAlign: "center",
            }}
          >
            организация
          </p>
          <p style={{ textAlign: "center", fontSize: 18, fontWeight: "bold" }}>
            Квитанция
          </p>
          <Flex justify="space-between">
            <p>ПКО №</p>
            <p
              style={{
                borderBottom: "1px solid black",
              }}
            >
              {record?.good?.invoice_number || "-"}
            </p>
            <p></p>
          </Flex>
          <Flex justify="space-between">
            <p></p>
            <p
              style={{
                borderBottom: "1px solid black",
              }}
            >
              от {dayjs().format("DD.MM.YYYY")}
            </p>
            <p></p>
          </Flex>
          <p>Принято от</p>
          <p
            style={{
              borderBottom: "1px solid black",
            }}
          >
            Сулайман сагыналиевич
          </p>
          <p>основание</p>
          <p
            style={{
              borderBottom: "1px solid black",
            }}
          >
            Оплата за доставку
          </p>
          <Flex justify="space-between">
            <p>Cумма RUB</p>
            <p
              style={{
                borderBottom: "1px solid black",
                width: "90px",
              }}
            >
              {record?.amount}
            </p>
            <p></p>
          </Flex>
          <p
            style={{
              borderTop: "1px solid black",
            }}
          >
            Оплачено: {record?.amount} RUB
          </p>
          <Flex justify="center">
            <p
              style={{
                borderBottom: "1px solid black",
              }}
            >
              {dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
            </p>
          </Flex>
          <p>
            {record?.user?.firstName} {record?.user?.lastName}
          </p>
        </div>
      </div>
      <Row gutter={[16, 16]} style={{ margin: "20px 0px" }}>
        <Col span={4}>
          <Title level={5}>Дата прихода</Title>
          <TextField
            value={dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
          />
        </Col>
        <Col span={4}>
          <Title level={5}>Код клиента</Title>
          <TextField
            value={`${record?.counterparty?.clientCode}-${record?.counterparty?.clientPrefix}`}
          />
        </Col>
        <Col span={4}>
          <Title level={5}>Фио клиента</Title>
          <TextField value={record?.counterparty?.name} />
        </Col>
        <Col span={4}>
          <Title level={5}>Номер клиента</Title>
          <TextField value={record?.counterparty?.phoneNumber} />
        </Col>
        <Col span={4}>
          <Title level={5}>Сумма оплаты</Title>
          <TextField value={`${record?.amount}-${record?.type_currency}`} />
        </Col>
      </Row>
      {record?.type_operation === "Контрагент" && (
        <Table
          dataSource={[record?.good]}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1200 }}
        >
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
          {/* <Table.Column
          dataIndex="totalServiceAmountSum"
          title="Сумма"
          render={(_, record: any) =>
            `${
              Number(record?.totalServiceAmountSum || 0) +
              Number(record?.totalProductAmountSum || 0)
            } руб`
          }
        /> */}
          {operationStatus()}
          <Table.Column
            dataIndex="employee"
            title="Сотрудник"
            render={(value) => {
              return `${value?.firstName}-${value?.lastName}`;
            }}
          />
          <Table.Column dataIndex="comments" title="Комментарий" />
        </Table>
      )}
    </Show>
  );
};
