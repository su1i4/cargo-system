import React, { useEffect, useState } from "react";
import { Show, EditButton, DeleteButton } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Flex, Row, Col } from "antd";
import { API_URL } from "../../App";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const { Title, Text } = Typography;

export const GoodsShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);

  useEffect(() => {
    if (record) {
      if (record.services && Array.isArray(record.services)) {
        let tariffs: number[] = [];
        record.services.forEach((service: any) => {
          if (service.tariff) {
            if (!tariffs.includes(Number(service.tariff))) {
              tariffs.push(Number(service.tariff));
            }
          }
        });
        setTariffs(tariffs);
      }

      if (record.services && Array.isArray(record.services)) {
        let nomenclatures: string[] = [];
        record.services.forEach((service: any) => {
          if (service.nomenclature) {
            if (!nomenclatures.includes(service.nomenclature)) {
              nomenclatures.push(service.nomenclature);
            }
          }
        });
        setNomenclatures(nomenclatures);
      }
    }
  }, [record]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const colStyle = {
    borderRight: "1px solid #EDEDEC",
    borderBottom: "1px solid #EDEDEC",
    padding: "8px 14px",
  };

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          {editButtonProps && (
            <EditButton {...editButtonProps} meta={{ foo: "bar" }} />
          )}
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} meta={{ foo: "bar" }} />
          )}
        </>
      )}
    >
      <Flex justify="space-between" align="center">
        <img
          src="/cargo-system-logo.png"
          style={{ width: 100, height: 60, objectFit: "cover" }}
          alt="photo"
        />
        <Title style={{ fontSize: 16, fontWeight: 500 }} level={5}>
          Накладная №: {record?.invoice_number}
        </Title>
      </Flex>
      <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
        <Text>Call-center: +996 555 555 555</Text>
        <Text>Отследить посылку</Text>
        <Text>{dayjs(record?.created_at).format("DD.MM.YYYY HH:mm")}</Text>
      </Flex>
      <Row
        gutter={[16, 0]}
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
          <Text>{`${record?.sender?.clientPrefix}-${record?.sender?.clientCode}`}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Код</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{`${record?.recipient?.clientPrefix}-${record?.recipient?.clientCode}`}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Фио</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{record?.sender?.name}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Фио</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{record?.recipient?.name}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Телефон</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{`+${record?.sender?.phoneNumber}`}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Телефон</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{`+${record?.recipient?.phoneNumber}`}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Адрес</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{`${record?.employee?.branch?.name} ${record?.employee?.under_branch?.address}`}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Досыл</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{record?.sent_back}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Комментарий</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{record?.comment}</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <Text>Город назначения</Text>
        </Col>
        <Col style={colStyle} span={8}>
          <Text>{record?.destination?.name}</Text>
        </Col>
      </Row>
      <Row
        gutter={[16, 0]}
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
          <Text>Наименование услуги </Text>
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
          <Row gutter={[16, 0]} style={{ overflow: "hidden" }}>
            <Col
              span={24}
              style={{
                borderBottom: "1px solid #EDEDEC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ textAlign: "center" }}>Количество</p>
            </Col>
            <Col
              span={12}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid #EDEDEC",
              }}
            >
              <p style={{ textAlign: "center" }}>Мест</p>
            </Col>
            <Col
              span={12}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ textAlign: "center" }}>шт</p>
            </Col>
          </Row>
        </Col>
        <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={2}>
          Вес, кг
        </Col>
        <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={3}>
          <Text>Стоимость услуг</Text>
        </Col>
        <Col style={{ ...colStyle, backgroundColor: "#F5F5F4" }} span={3}>
          <Text>Сумма</Text>
        </Col>

        <Col style={colStyle} span={4}>
          <p style={{ textAlign: "end" }}>
            {record?.services.map((item: any) => item.bag_number).join(", ")}
          </p>
        </Col>
        <Col style={colStyle} span={4}>
          <p style={{ textAlign: "center", fontSize: 12 }}>
            Грузоперевозка{" "}
            {`${record?.employee?.branch?.name} - ${record?.destination?.name}`}
          </p>
        </Col>
        <Col style={colStyle} span={4}>
          <p style={{ textAlign: "center" }}>
            {nomenclatures.map((item: string) => item).join(", ")}
          </p>
        </Col>
        <Col style={colStyle} span={2}>
          <Text>{record?.services?.length}</Text>
        </Col>
        <Col style={colStyle} span={2}>
          <Text>
            {record?.services?.reduce(
              (acc: number, item: any) => acc + Number(item.quantity || 0),
              0
            )}
          </Text>
        </Col>
        <Col style={colStyle} span={2}>
          <Text>
            {record?.services?.reduce(
              (acc: number, item: any) => acc + Number(item.weight || 0),
              0
            )}
          </Text>
        </Col>
        <Col style={{...colStyle, padding: 0}} span={3}>
          {tariffs.map((item: number) => (
            <div style={{ borderBottom: "1px solid #EDEDEC", width: "100%", padding: '0px 14px' }}>
              <Text>{item}</Text>
            </div>
          ))}
        </Col>
        <Col style={colStyle} span={3}>
          <Text>
            {record?.services?.reduce(
              (acc: number, item: any) => acc + Number(item.sum || 0),
              0
            )}
          </Text>
        </Col>

        <Col style={colStyle} span={12}>
          <p style={{ textAlign: "end" }}>Итого</p>
        </Col>
        <Col style={colStyle} span={2}>
          <Text>Сум</Text>
        </Col>
        <Col style={colStyle} span={2}>
          <Text>Сум</Text>
        </Col>
        <Col style={colStyle} span={2}>
          <Text>Сум</Text>
        </Col>
        <Col style={colStyle} span={3}>
          <Text>Сум</Text>
        </Col>
        <Col style={colStyle} span={3}>
          <Text>Сум</Text>
        </Col>
      </Row>

      {/* <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card size="small" title={`Номер накладной: ${record?.invoice_number || ''}`} style={{ marginBottom: 20 }}>
            <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3, lg: 3 }}>
              <Descriptions.Item span={3} label="Город назначения">
                {record?.destination?.name}
              </Descriptions.Item>
              <Descriptions.Item span={3} label="Отправитель">
                {record?.sender?.clientPrefix}-{record?.sender?.clientCode}, {record?.sender?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Получатель">
                {record?.recipient?.clientPrefix}-{record?.recipient?.clientCode}, {record?.recipient?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Оплачивает">
                {record?.pays === "recipient" ? "Получатель" : "Отправитель"}
              </Descriptions.Item>
              <Descriptions.Item label="Скидка">
                {record?.discount?.discount || 0}%
              </Descriptions.Item>
              <Descriptions.Item label="Статус оплаты">
                <Tag color={paymentStatusMap[paymentStatus]?.color || "default"}>
                  {paymentStatusMap[paymentStatus]?.text || "Неизвестно"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Трек-код">
                {record?.trackCode}
              </Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {dayjs(record?.created_at).format("DD.MM.YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={24}>
          <Card size="small" title="Услуги" style={{ marginBottom: 20 }}>
            <Table 
              dataSource={[...services]} 
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6}>
                      <Text strong>Итого</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>{lastGoods[0]?.weight?.toFixed(2) || 0} кг</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong>{lastGoods[0]?.sum?.toFixed(2) || 0}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            >
              <Table.Column 
                title="№" 
                dataIndex="id" 
                render={(_, __, index) => index + 1} 
                width={50}
              />
              <Table.Column 
                title="Номенклатура" 
                dataIndex="nomenclature" 
                render={(value) => value?.name || "-"}
              />
              <Table.Column title="Страна" dataIndex="country" />
              <Table.Column 
                title="Тип товара" 
                dataIndex="product_type" 
                render={(value) => value?.name || "-"}
              />
              <Table.Column title="Количество" dataIndex="quantity" />
              <Table.Column 
                title="Вес (кг)" 
                dataIndex="weight" 
                render={(value) => Number(value)?.toFixed(2) || "-"}
              />
              <Table.Column 
                title="Цена за кг" 
                dataIndex="product_type" 
                render={(value) => value?.tariff || "-"}
              />
              <Table.Column 
                title="Сумма" 
                dataIndex="sum" 
                render={(value) => Number(value)?.toFixed(2) || "-"}
              />
              <Table.Column title="Штрихкод" dataIndex="barcode" />
            </Table>
          </Card>
        </Col>

        <Col span={24}>
          <Card size="small" title="Товары" style={{ marginBottom: 20 }}>
            <Table 
              dataSource={[...products]} 
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>Итого</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>{lastProducts[0]?.quantity || 0}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong>{lastProducts[0]?.sum?.toFixed(2) || 0}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            >
              <Table.Column 
                title="№" 
                dataIndex="id" 
                render={(_, __, index) => index + 1} 
                width={50}
              />
              <Table.Column title="Наименование" dataIndex="name" />
              <Table.Column title="Количество" dataIndex="quantity" />
              <Table.Column 
                title="Цена" 
                dataIndex="price" 
                render={(value) => Number(value)?.toFixed(2) || "-"}
              />
              <Table.Column 
                title="Сумма" 
                dataIndex="sum" 
                render={(value) => Number(value)?.toFixed(2) || "-"}
              />
            </Table>
          </Card>
        </Col>

        <Col span={24}>
          <Card size="small" title="Дополнительная информация" style={{ marginBottom: 20 }}>
            <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3, lg: 3 }}>
              <Descriptions.Item label="Процент скидки">
                {record?.discount_custom || 0}%
              </Descriptions.Item>
              <Descriptions.Item label="Процент наценки">
                {record?.markup || 0}%
              </Descriptions.Item>
              <Descriptions.Item label="Объявленная ценность">
                {record?.declared_value || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Комиссия">
                {record?.commission || 0}%
              </Descriptions.Item>
              <Descriptions.Item label="Сумма комиссии">
                {record?.amount_commission || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={24}>
          <Card size="small" title="Упаковщики и выездная группа" style={{ marginBottom: 20 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>Упаковщики:</Title>
                {record?.packers && record.packers.length > 0 ? (
                  <Space direction="vertical">
                    {record.packers.map((packer: any) => (
                      <Text key={packer.id}>
                        {packer.first_name} {packer.last_name}
                      </Text>
                    ))}
                  </Space>
                ) : (
                  <Text>Не назначены</Text>
                )}
              </Col>
              <Col span={12}>
                <Title level={5}>Выездная группа:</Title>
                {record?.visiting_group && record.visiting_group.length > 0 ? (
                  <Space direction="vertical">
                    {record.visiting_group.map((member: any) => (
                      <Text key={member.id}>
                        {member.first_name} {member.last_name}
                      </Text>
                    ))}
                  </Space>
                ) : (
                  <Text>Не назначена</Text>
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row> */}
    </Show>
  );
};
