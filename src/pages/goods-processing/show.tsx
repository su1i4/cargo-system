import React, { useEffect, useState } from "react";
import {
  Show,
  TextField,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { useShow, useOne } from "@refinedev/core";
import { Col, Image, Row, Typography, Button, Space, Table, Card, Descriptions, Tag } from "antd";
import { API_URL } from "../../App";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateStatus } from "../../lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const { Title, Text } = Typography;

interface GoodItem {
  id: number;
  nomenclature_id?: string;
  nomenclature?: { name: string };
  country?: string;
  type_id?: string;
  product_type?: { name: string; tariff: number };
  type_name?: string;
  tariff?: number;
  quantity?: number;
  weight?: number;
  price?: number;
  sum?: number;
  barcode: string;
}

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  sum?: number;
}

export const GoodsShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [services, setServices] = useState<GoodItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // URL для фото
  const PHOTO_URL = record?.photo ? `${API_URL}/${record.photo}` : "";

  // Загрузка данных при открытии формы просмотра
  useEffect(() => {
    if (record) {
      // Загрузка услуг из записи
      if (record.services && Array.isArray(record.services)) {
        setServices(record.services);
      }
      
      // Загрузка товаров из записи
      if (record.products && Array.isArray(record.products)) {
        setProducts(record.products);
      }
    }
  }, [record]);

  const lastGoods = [
    {
      weight: services.reduce((acc, item) => acc + Number(item.weight || 0), 0),
      price: 0,
      quantity: services.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: services.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ];

  const lastProducts = [
    {
      id: "total",
      name: "Итого",
      price: 0,
      quantity: products.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: products.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ];

  // Определение статуса оплаты
  const paymentStatus = record?.payment_status || "pending";
  const paymentStatusMap: Record<string, { color: string; text: string }> = {
    pending: { color: "orange", text: "Ожидает оплаты" },
    paid: { color: "green", text: "Оплачено" },
    partial: { color: "blue", text: "Частично оплачено" },
    refunded: { color: "red", text: "Возвращено" },
  };

  // Функция для скачивания фото
  const handleDownloadPhoto = async () => {
    if (record?.photo) {
      try {
        const response = await fetch(PHOTO_URL);
        const blob = await response.blob();

        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;

        const filename = record?.trackCode || "photo.jpg";
        link.download = filename;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
        }, 100);
      } catch (error) {
        console.error("Error downloading photo:", error);
      }
    }
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

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
      <Row gutter={[16, 16]}>
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
      </Row>
    </Show>
  );
};
