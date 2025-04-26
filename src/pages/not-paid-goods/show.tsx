import React from "react";
import {
  Show,
  TextField,
  DateField,
  useSelect,
  ListButton,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Col, Image, Row, Typography, Button, Space, Tooltip } from "antd";
import { API_URL } from "../../App";
import {
  DownloadOutlined,
  WhatsAppOutlined,
  MessageOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateStatus } from "../../lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

export const NotPaidGoodsShow: React.FC = () => {
  const { id } = useParams();
  const { queryResult } = useShow({
    resource: "goods-processing",
    id: Number(id),
  });
  const { data, isLoading } = queryResult;

  const record = data?.data;
  const { queryResult: dataBranch } = useShow({
    resource: "branch",
    id: record?.counterparty.branch_id,
  });
  const { data: branch } = dataBranch;

  const handleDownloadPhoto = async () => {
    if (record?.photo) {
      try {
        const photoUrl = `${API_URL}/${record.photo}`;

        // Fetch the image as a blob
        const response = await fetch(photoUrl);
        const blob = await response.blob();

        // Create object URL from blob
        const objectUrl = URL.createObjectURL(blob);

        // Create a link element
        const link = document.createElement("a");
        link.href = objectUrl;

        // Extract filename from path
        const filename = record.photo.split("/").pop() || "photo.jpg";
        link.download = filename;

        // Append to the document, click and then remove
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
        }, 100);
      } catch (error) {
        console.error("Error downloading photo:", error);
        // You could add notification here if desired
      }
    }
  };

  // Функции для шаринга через мессенджеры
  const shareViaWhatsApp = () => {
    if (record?.photo) {
      const photoUrl = `${API_URL}/${record.photo}`;
      const encodedUrl = encodeURIComponent(photoUrl);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedUrl}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const shareViaTelegram = () => {
    if (record?.photo) {
      const photoUrl = `${API_URL}/${record.photo}`;
      const encodedUrl = encodeURIComponent(photoUrl);
      const telegramUrl = `https://t.me/share/url?url=${encodedUrl}`;
      window.open(telegramUrl, "_blank");
    }
  };

  const shareViaWeChat = () => {
    if (record?.photo) {
      const photoUrl = `${API_URL}/${record.photo}`;
      alert("Скопируйте ссылку для отправки в WeChat: " + photoUrl);
      navigator.clipboard
        .writeText(photoUrl)
        .then(() => {
          alert("Ссылка скопирована в буфер обмена");
        })
        .catch((err) => {
          console.error("Не удалось скопировать ссылку: ", err);
        });
    }
  };

  // @ts-ignore
  return (
    <Show headerButtons={() => false}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Title level={5}>Трек-код</Title>
          <TextField value={record?.trackCode} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Вес</Title>
          <TextField value={record?.weight} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Тип груза</Title>
          <TextField value={record?.cargoType} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Сумма</Title>
          <TextField value={record?.amount} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Вид упаковки</Title>
          <TextField value={record?.packageType} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Цена упаковки</Title>
          <TextField value={record?.pricePackageType} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Код получателя</Title>
          <TextField
            value={
              record?.counterparty?.clientPrefix +
              "-" +
              record?.counterparty?.clientCode
            }
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>ФИО получателя</Title>
          <TextField
            value={record?.counterparty?.name || record?.counterparty_id}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Статус</Title>
          <TextField value={translateStatus(record?.status)} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Комментарии</Title>
          <TextField value={record?.comments} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Дата приёма</Title>
          <TextField
            value={dayjs(record?.created_at).utc().format("DD.MM.YYYY HH:mm")}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Место погрузки</Title>
          <TextField value={record?.employee?.branch?.name} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Пункт назначение</Title>
          <TextField
            value={`${record?.counterparty?.branch?.name}, ${
              record?.counterparty?.under_branch?.address || ""
            }`}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Скидка</Title>
          <TextField value={record?.discount} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Ручная скидка</Title>
          <TextField value={record?.discount_custom} />
        </Col>

        <Col xs={24} md={24}>
          <Title level={5}>Фото</Title>
          {record?.photo ? (
            <Space direction="vertical" size="middle">
              <Image
                style={{ objectFit: "cover" }}
                width={300}
                height={300}
                src={API_URL + "/" + record?.photo}
              />
              <Space direction="horizontal">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadPhoto}
                >
                  Скачать фото
                </Button>
                <Tooltip title="Поделиться в WhatsApp">
                  <Button
                    type="primary"
                    icon={<WhatsAppOutlined />}
                    onClick={shareViaWhatsApp}
                    style={{
                      backgroundColor: "#25D366",
                      borderColor: "#25D366",
                    }}
                  />
                </Tooltip>
                <Tooltip title="Поделиться в Telegram">
                  <Button
                    type="primary"
                    icon={<MessageOutlined />}
                    onClick={shareViaTelegram}
                    style={{
                      backgroundColor: "#0088cc",
                      borderColor: "#0088cc",
                    }}
                  />
                </Tooltip>
                <Tooltip title="Поделиться в WeChat">
                  <Button
                    type="primary"
                    icon={<WechatOutlined />}
                    onClick={shareViaWeChat}
                    style={{
                      backgroundColor: "#07C160",
                      borderColor: "#07C160",
                    }}
                  />
                </Tooltip>
              </Space>
            </Space>
          ) : (
            <TextField value="Нет фото" />
          )}
        </Col>
      </Row>
    </Show>
  );
};
