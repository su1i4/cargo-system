import { List } from "@refinedev/antd";
import { Row, Col, Typography } from "antd";
import CargoReceivedIcon from "../../../public/Component 1.svg?react";
import CargoReceivedIcon3 from "../../../public/Component 3.svg?react";
import { useNavigation } from "@refinedev/core";

const { Title, Paragraph } = Typography;

export const ReportList = () => {
  const reports = [
    {
      id: "cargo-received",
      title: "Отчеты по принятым грузам",
      description:
        "Отчет показывает принятые грузы за выбранный период с разбивкой по городам, местам приёма и категориям товаров (самопошив, бренд, личные вещи и др.).",
      icon: <CargoReceivedIcon />,
      link: "cargo-received",
    },
    {
      id: "nomenclature",
      title: "Отчеты по упаковочному листу",
      description:
        "Отчет формирует упаковочный лист по выбранному рейсу. Содержит подробную информацию по каждому месту (коробке/мешку): наименование товара,  вес, количество.",
      icon: <CargoReceivedIcon3 />,
      link: "nomenclature",
    },
    {
      id: "borrow",
      title: "Отчет по задолженности представительств",
      description: "Отчёт показывает задолженности представительств",
      icon: <CargoReceivedIcon3 />,
      link: "borrow",
    },
    {
      id: "",
      title: "Отчет по задолженности представительств",
      description: "Отчёт показывает задолженности представительств",
      icon: <CargoReceivedIcon3 />,
      link: "",
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
            <Col span={1.5}>{report.icon}</Col>
            <Col span={22}>
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
