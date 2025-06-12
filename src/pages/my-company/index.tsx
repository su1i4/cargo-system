import { useCustom, useNavigation } from "@refinedev/core";
import { API_URL } from "../../App";
import { List } from "@refinedev/antd";
import { Card, Col, Divider, Flex, Row, Select, Typography } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart,
} from "recharts";

import CargoReceivedIcon from "../../../public/Component 1.svg?react";
import CargoReceivedIcon3 from "../../../public/Component 3.svg?react";

const { Title, Text, Paragraph } = Typography;

export const MyCompany = () => {
  const { data } = useCustom({
    url: `${API_URL}/my-company`,
    method: "get",
  });

  const iconIncrease = (increase: boolean, change: number) =>
    increase ? (
      <Flex gap={5} align="center">
        <img src="/arrow-big-up.svg" />
        <div
          style={{
            color: increase ? "#00AC4F" : "#DA001A",
            lineHeight: "15px",
          }}
        >
          {change}%
        </div>
      </Flex>
    ) : (
      <Flex gap={5} align="center">
        <img src="/arrow-big-down.svg" />
        <div
          style={{
            color: increase ? "#00AC4F" : "#DA001A",
            lineHeight: "15px",
          }}
        >
          {change} %
        </div>
      </Flex>
    );

  const months = data?.data?.overview?.shipmentByMonth;

  // Цвета для графика
  const COLORS = ["#f72585", "#7209b7", "#e0e0e0"];

  const clients = data?.data?.clients;

  const maxItem = months?.reduce(
    (acc: any, item: any, index: any) => {
      if (item.value > acc.maxValue) {
        return { maxValue: item.value, maxIndex: index };
      }
      return acc;
    },
    { maxValue: -Infinity, maxIndex: -1 }
  );

  const pieData = [
    { name: "New", value: clients?.newClientsPercentage },
    { name: "Others", value: 100 - clients?.newClientsPercentage },
  ];

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
      id: "stock",
      title: "Отчет по задолженности представительств",
      description: "Отчёт показывает задолженности представительств",
      icon: <CargoReceivedIcon3 />,
      link: "stock",
    },
  ];

  const { push } = useNavigation();

  return (
    <List title="Моя компания" headerButtons={() => false}>
      <Flex vertical gap={20}>
        <Flex
          style={{
            boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
            padding: 20,
            borderRadius: 16,
            backgroundColor: "white",
          }}
          justify="space-between"
          gap={20}
        >
          <Flex gap={10} style={{ width: "100%" }}>
            <img src="/Group 3.svg" />
            <Flex vertical gap={0}>
              <p style={{ lineHeight: "15px", color: "#606877" }}>Приход</p>
              <p style={{ fontSize: 18, lineHeight: "16px", fontWeight: 600 }}>
                {data?.data?.summary?.income?.amount}
              </p>
              {iconIncrease(
                data?.data?.summary?.income?.isIncrease,
                data?.data?.summary?.income?.change
              )}
            </Flex>
          </Flex>
          <Divider type="vertical" style={{ height: "100px" }} />
          <Flex gap={10} style={{ width: "100%" }}>
            <img src="/Group 3 (1).svg" />
            <Flex vertical gap={0}>
              <p style={{ lineHeight: "15px", color: "#606877" }}>Баланс</p>
              <p style={{ fontSize: 18, lineHeight: "16px", fontWeight: 600 }}>
                {data?.data?.summary?.balance?.amount}
              </p>
              {iconIncrease(
                data?.data?.summary?.balance?.isIncrease,
                data?.data?.summary?.balance?.change
              )}
            </Flex>
          </Flex>
          <Divider type="vertical" style={{ height: "100px" }} />
          <Flex style={{ marginRight: 20, width: "100%" }} gap={10}>
            <img src="/Group 3 (2).svg" />
            <Flex vertical gap={0}>
              <p style={{ lineHeight: "15px", color: "#606877" }}>
                Отправлено товаров
              </p>
              <p style={{ fontSize: 18, lineHeight: "16px", fontWeight: 600 }}>
                {data?.data?.summary?.itemsSent?.amount}
              </p>
              {iconIncrease(
                data?.data?.summary?.itemsSent?.isIncrease,
                data?.data?.summary?.itemsSent?.change
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex gap={20}>
          <Card
            style={{
              borderRadius: 16,
              width: "60%",
              boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Flex vertical gap={8}>
              <Title level={4} style={{ margin: 0 }}>
                Обзор
              </Title>

              <Flex justify="space-between" align="center">
                <Text style={{ color: "#606877" }}>Отправки за месяц</Text>
                <Select
                  defaultValue="6 месяцев"
                  style={{ width: 120 }}
                  options={[
                    { value: "3", label: "3 месяца" },
                    { value: "6", label: "6 месяцев" },
                    { value: "12", label: "12 месяцев" },
                  ]}
                />
              </Flex>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={months}>
                  <XAxis dataKey="month" />
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toLocaleString()} кг`
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[10, 10, 0, 0]}
                    fill="#8884d8"
                    label={({ x, y, width, value, index }) => (
                      <text
                        x={x + width / 2}
                        y={y - 10}
                        textAnchor="middle"
                        fill="#000"
                        fontSize={12}
                      >
                        {value}
                      </text>
                    )}
                    style={{ fill: "#EEE" }}
                  >
                    {months?.map((entry: any, index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        style={{ backgroundColor: "" }}
                        fill={
                          maxItem?.maxIndex === index ? "#5932EA" : "#F2EFFF"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <Flex vertical gap={0}>
                <Text style={{ color: "#8c8c8c" }}>Отправлено кг в общем</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {data?.data?.overview?.totalKg?.toLocaleString()} кг
                </Title>
              </Flex>
            </Flex>
          </Card>
          <Flex
            style={{
              boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
              padding: 20,
              borderRadius: 16,
              width: "40%",
              backgroundColor: "white",
            }}
            vertical
          >
            <Title level={4} style={{ margin: 0 }}>
              Клиентов
            </Title>
            <Text style={{ color: "#606877" }}>Клиенты которые отправили</Text>

            <div style={{ marginTop: 10 }}>
              <Text strong>Города получатели</Text>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {clients?.cities.map((city: string, index: number) => (
                  <span key={index} style={{ color: "#4a4a4a" }}>
                    • {city}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ width: 200, margin: "0 auto" }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
              <div
                style={{
                  position: "relative",
                  top: "-140px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                {clients?.newClientsPercentage}%
                <div style={{ fontSize: 12, fontWeight: 400, color: "#333" }}>
                  Новых клиентов
                  <br />в этом месяце
                </div>
              </div>
            </div>
          </Flex>
        </Flex>
        <Flex gap={20}>
          <Flex
            style={{
              boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
              padding: 20,
              borderRadius: 16,
              width: 400,
              minWidth: 400,
              backgroundColor: "white",
            }}
            vertical
          >
            <Title level={4} style={{ margin: 0 }}>
              Филиалы
            </Title>
            <Flex
              style={{
                borderBottom: "1px solid gainsboro",
                paddingBottom: "10px",
                marginBottom: 10,
              }}
              justify="space-between"
            >
              <div style={{ width: "100%", color: "#606877" }}>Название</div>
              <div style={{ width: "100%", color: "#606877" }}>Принято</div>
              <div style={{ width: "100%", color: "#606877" }}>Получено</div>
            </Flex>
            <Flex vertical>
              {data?.data?.branches?.data?.map((item: any) => (
                <Flex
                  style={{
                    borderBottom: "1px solid gansboro",
                    paddingBottom: "10px",
                  }}
                  justify="space-between"
                >
                  <div style={{ width: "100%", color: "#606877" }}>
                    {item.name}
                  </div>
                  <div style={{ width: "100%", color: "#606877" }}>
                    {item.received} кг
                  </div>
                  <div style={{ width: "100%", color: "#606877" }}>
                    {item.sent} кг
                  </div>
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Flex
            style={{
              boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
              padding: 20,
              borderRadius: 16,
              width: "100%",
              backgroundColor: "white",
            }}
            vertical
          >
            <Title level={4} style={{ margin: 0 }}>
              Отчеты
            </Title>
            <Text style={{ color: "#606877" }}>Отчеты по названиям</Text>
            <Flex vertical style={{ padding: "10px 0px" }}>
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
                  <Col span={2}>{report.icon}</Col>
                  <Col span={21}>
                    <Title level={5}>
                      {index + 1}. {report.title}
                    </Title>
                    <Paragraph>{report.description}</Paragraph>
                  </Col>
                </Row>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </List>
  );
};
