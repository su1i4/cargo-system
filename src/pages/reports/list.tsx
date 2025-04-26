import { List } from "@refinedev/antd";
import { Row, Col, Typography } from "antd";
import CargoReceivedIcon from "../../../public/Component 1.svg?react";
import CargoReceivedIcon2 from "../../../public/Component 2.svg?react";
import CargoReceivedIcon3 from "../../../public/Component 3.svg?react";
import { useNavigation } from "@refinedev/core";

const { Title, Paragraph } = Typography;

export const ReportList = () => {
  const reports = [
    {
      id: "cargo-received",
      title: "Отчеты по принятым грузам",
      description:
        "Отчет показывает, сколько товаров было принято каждым складом за определенный период.",
      icon: <CargoReceivedIcon />,
      link: "cargo-received",
    },
    {
      id: "cargo-types",
      title: "Отчеты по полученным товарам",
      description:
        "Фиксирует, сколько товаров прибыло на склады в определенный",
      icon: <CargoReceivedIcon3 />,
      link: "cargo-types",
    },
    {
      id: "income",
      title: "Отчеты по выдачам",
      description: "Отчет по тому, сколько посылок выдано клиентам",
      icon: <CargoReceivedIcon3 />,
      link: "income",
    },
    {
      id: "expense",
      title: "Отчеты по остаткам",
      description: "Анализ остатков на складах на текущий момент",
      icon: <CargoReceivedIcon3 />,
      link: "expense",
    },
    {
      id: "employees",
      title: "Отчеты по контрагентам",
      description: "Показывает активность работы с контрагентами",
      icon: <CargoReceivedIcon3 />,
      link: "employees",
    },
    {
      id: "branches",
      title: "Отчеты по должникам",
      description: "Отчет о клиентах и контрагентах с задолженностями",
      icon: <CargoReceivedIcon3 />,
      link: "branches",
    },
    {
      id: "cash-operations",
      title: "Отчеты по кассам",
      description: "Анализ поступлений и выдач наличных средств через кассы",
      icon: <CargoReceivedIcon3 />,
      link: "cash-operations",
    },
    {
      id: "incoming-funds",
      title: "Отчеты по приходу",
      description: "Поступления денежных средств за определенный период",
      icon: <CargoReceivedIcon3 />,
      link: "incoming-funds",
    },
    {
      id: "expense-finance",
      title: "Отчеты по расходам",
      description: "Финансовый учет расходов компании",
      icon: <CargoReceivedIcon3 />,
      link: "expense-finance",
    },
    {
      id: "expense-representative",
      title: "Отчеты по долгам представительства",
      description: "Отчет о представительствах и контрагентах с задолженностями",
      icon: <CargoReceivedIcon3 />,
      link: "expense-representative",
    },
  ];

  const { push } = useNavigation();

  return (
    <List headerButtons={() => false} title="Отчеты">
      <Col>
        {reports.map((report, index) => (
          <Row
            key={report.id}
            gutter={16}
            style={{
              cursor: "pointer",
              marginBottom: "8px",
              borderRadius: "8px",
              transition: "all 0.3s",
            }}
            onClick={() => push(`/reports/${report.link}`)}
            className="report-item-row"
          >
            <Col>{report.icon}</Col>
            <Col>
              <Title level={5}>
                {index + 1}. {report.title}
              </Title>
              <Paragraph>{report.description}</Paragraph>
            </Col>
          </Row>
        ))}
      </Col>
    </List>
  );
};
