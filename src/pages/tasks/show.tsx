import { Show, TextField, useSelect } from "@refinedev/antd";
import { useMany, useShow } from "@refinedev/core";
import { Typography, Row, Col, Tabs, Flex, Form, Select, Table } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import ChatPage from "./chat/page";
import { ArrowLeftOutlined } from "@ant-design/icons";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { TabPane } = Tabs;

export const TasksyShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogId, setDialogId] = useState(0);
  const initialTab = searchParams.get("tab") || "details";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const navigate = useNavigate();

  useEffect(() => {
    setSearchParams({ tab: activeTab });
    setDialogId(data?.data?.dialog?.id);
  }, [activeTab, setSearchParams, data]);

  return (
    <Show
      isLoading={isLoading}
      title={
        <Flex gap={10}>
          <ArrowLeftOutlined
            style={{ width: 18, height: 18, marginTop: 1 }}
            onClick={() => navigate("/tasks")}
          />
          <Title style={{ fontSize: 20, lineHeight: "20px" }}>Чат задачи</Title>
        </Flex>
      }
      headerButtons={() => false}
      goBack={false}
    >
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
        <TabPane tab="Детали задачи" key="details">
          <Row gutter={[16, 0]}>
            <Col span={6}>
              <Title level={5}>Дата создания</Title>
              <TextField
                value={dayjs(record?.createdAt)
                  .utc()
                  .format("DD.MM.YYYY HH:mm")}
              />
            </Col>
            <Col span={6}>
              <Title level={5}>Заголовок</Title>
              <TextField value={record?.title} />
            </Col>
            <Col span={6}>
              <Title level={5}>Описание</Title>
              <TextField value={record?.description} />
            </Col>
            <Col span={6}>
              <Title level={5}>Сотрудники</Title>
              <TextField
                value={`${record?.counterparty?.clientCode}-${record?.counterparty?.clientPrefix}`}
              />
            </Col>
            <Col span={6} style={{ marginTop: 20 }}>
              <Title level={5}>Фио клиента</Title>
              <TextField value={record?.counterparty?.name} />
            </Col>
            <Col span={6} style={{ marginTop: 20 }}>
              <Title level={5}>Код клиента</Title>
              <TextField
                value={`${record?.counterparty?.clientCode}-${record?.counterparty?.clientPrefix}`}
              />
            </Col>
            <Col span={6} style={{ marginTop: 20 }}>
              <Title level={5}>Сотрудники</Title>
              <Flex vertical>
                {record?.assignedUsers?.map((item: any) => (
                  <Typography>{`${item.firstName}-${item.lastName}`}</Typography>
                ))}
              </Flex>
            </Col>
            <Col span={24}>
              <Title level={5}>Выбранные товары</Title>
            </Col>
            <Table dataSource={record?.goods} rowKey="id" scroll={{ x: 1200 }}>
              <Table.Column dataIndex="trackCode" title="Трек-код" />
              <Table.Column dataIndex="cargoType" title="Тип груза" />
              <Table.Column
                dataIndex="counterparty"
                title="Код клиента"
                render={(value) => {
                  return value?.clientPrefix + "-" + value?.clientCode;
                }}
              />
              <Table.Column
                dataIndex="counterparty"
                title="ФИО получателя"
                render={(value) => value?.name}
              />
              <Table.Column
                dataIndex="counterparty"
                render={(value) => (
                  <p
                    style={{
                      width: "200px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {`${value?.branch?.name}, ${
                      value?.under_branch?.address || ""
                    }`}
                  </p>
                )}
                title="Пункт назначения, Пвз"
              />
              <Table.Column
                dataIndex="weight"
                title="Вес"
                render={(value) => value + " кг"}
              />
              <Table.Column
                dataIndex="counterparty"
                title="Тариф клиента"
                render={(value, record) => {
                  return `${(
                    Number(value?.branch?.tarif || 0) -
                    Number(record?.counterparty?.discount?.discount || 0)
                  ).toFixed(2)}$`;
                }}
              />

              <Table.Column
                dataIndex="amount"
                title="Сумма"
                render={(value) => value + " $"}
              />
              <Table.Column
                dataIndex="discount"
                title="Скидка"
                render={(value, record) => {
                  return `${(
                    Number(value) + Number(record?.discount_custom)
                  ).toFixed(2)}`;
                }}
              />
              <Table.Column dataIndex="comments" title="Комментарий" />
            </Table>
          </Row>
        </TabPane>
        <TabPane tab="Чат задачи" key="chat">
          <div style={{ height: "calc(100vh - 300px)", position: "relative" }}>
            {dialogId ? (
              <ChatPage
                messages_load={record?.dialog?.message || []}
                loading={isLoading}
                dialog_id={dialogId}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography.Text type="secondary">
                  Загрузка чата...
                </Typography.Text>
              </div>
            )}
          </div>
        </TabPane>
      </Tabs>
    </Show>
  );
};

export default TasksyShow;
