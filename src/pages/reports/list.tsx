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
      id: "stock",
      title: "Отчет по остаткам товаров",
      description:
        "Отчет показывает товары находящиеся на складе с детальной информацией по каждому месту и статусом 'На складе'.",
      icon: <CargoReceivedIcon3 />,
      link: "stock",
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
      id: "issue",
      title: "Отчет по выданным товарам",
      description: "Отчёт показывает выданные товары за выбранный период",
      icon: <CargoReceivedIcon3 />,
      link: "issue",
    },
    {
      id: "bank",
      title: "Отчет по банку",
      description: "",
      icon: <CargoReceivedIcon3 />,
      link: "bank",
    },
    {
      id: "receiving",
      title: "Отчет по получению",
      description: "",
      icon: <CargoReceivedIcon3 />,
      link: "receiving",
    },
    {
      id: "cash-desk",
      title: "Отчет по приходам и расходам",
      description: "Отчёт показывает все операции прихода и расхода по кассе за выбранный период",
      icon: <CargoReceivedIcon3 />,
      link: "cash-desk",
    },
    {
      id: "cash-desk-income",
      title: "Отчет по приходам кассы",
      description: "Отчёт показывает только операции прихода по кассе за выбранный период",
      icon: <CargoReceivedIcon3 />,
      link: "cash-desk-income",
    },
    {
      id: "cash-desk-outcome",
      title: "Отчет по расходам кассы",
      description: "Отчёт показывает только операции расхода по кассе за выбранный период",
      icon: <CargoReceivedIcon3 />,
      link: "cash-desk-outcome",
    },
    {
      id: "warehouse-stock",
      title: "Отчет по упаковочным листам со статусом 'В складе'",
      description: "Отчёт показывает номенклатуры товаров со статусом 'В складе' с подробной информацией по каждому месту",
      icon: <CargoReceivedIcon3 />,
      link: "warehouse-stock",
    },
    {
      id: "warehouse-stock-goods",
      title: "Отчет по задолженности представительств по рейсам",
      description: "Отчёт показывает задолженности представительств по рейсам",
      icon: <CargoReceivedIcon3 />,
      link: "warehouse-stock-goods",
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
