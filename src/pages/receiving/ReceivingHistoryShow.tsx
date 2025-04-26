import React, { useState } from "react";
import {
  DeleteButton,
  EditButton,
  Show,
  TextField,
  useTable,
} from "@refinedev/antd";
import { useUpdateMany, useParsed, useShow, useNavigation} from "@refinedev/core";
import { Typography, Row, Col, Table, Button, Space } from "antd";
import dayjs from "dayjs";
import { useParams } from "react-router";
import { translateStatus } from "../../lib/utils";

const { Title } = Typography;

export const ReceivingHistoryShow = () => {
  // Получаем ID из URL (например, /shipments/show/123)
  const { id } = useParams();

  // Запрашиваем данные о конкретном рейсе (shipment) по ID
  const { queryResult } = useShow({
    resource: "shipments",
    id,
  });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  // Получаем список товаров (goods-processing),
  // отфильтрованных по текущему shipment_id
  const { tableProps } = useTable({
    resource: "goods-processing",
    syncWithLocation: false,
    initialSorter: [
      {
        field: "id",
        order: "desc",
      },
    ],
    filters: {
      permanent: [
        {
          field: "shipment_id",
          operator: "eq",
          value: Number(id),
        },
        {
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
  });

  // -----------------------
  // 1. Состояние для выделенных строк
  // -----------------------
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Настройка антовского rowSelection
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedKeys);
    },
  };

  // -----------------------
  // 2. Массовое обновление
  // -----------------------
  const { mutate, isLoading: isUpdating } = useUpdateMany();

  const handleSetReadyToIssue = () => {
    mutate(
      {
        resource: "goods-processing",
        // @ts-ignore
        ids: selectedRowKeys,
        values: { status: "Готов к выдаче" },
      },
      {
        onSuccess: () => {
          setSelectedRowKeys([]);
        },
      }
    );
  };

  const {push} = useNavigation()

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          <Button onClick={() => push(`/receiving/show/${id}/received`)} >Выгруженные товары</Button>
          {editButtonProps && (
            <EditButton {...editButtonProps} meta={{ foo: "bar" }} />
          )}
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} meta={{ foo: "bar" }} />
          )}
        </>
      )}
      isLoading={isLoading}
    >
      {/* Данные о текущем рейсе */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Title level={5}>Номер рейса</Title>
          <TextField value={id} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Тип груза</Title>
          <TextField value={record?.type} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}> Код коробки</Title>
          <TextField value={record?.boxCode} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Пункт назначения</Title>
          <TextField value={record?.branch?.name} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Место погрузки</Title>
          <TextField value={record?.employee?.branch?.name} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Сотрудник</Title>
          <TextField
            value={`${record?.employee?.firstName || ""}-${
              record?.employee?.lastName || ""
            }`}
          />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Вес</Title>
          <TextField value={record?.weight} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Размеры (Д × Ш × В)</Title>
          <TextField
            value={`${record?.length}_x 
               _${record?.width}_x_${record?.height}`}
          />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Куб</Title>
          <TextField value={record?.cube} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Плотность</Title>
          <TextField value={record?.density} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Количество посылок</Title>
          <TextField value={record?.count} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Дата</Title>
          <TextField
            value={`${record?.created_at?.split("T")[0]} ${record?.created_at
              ?.split("T")[1]
              ?.slice(0, 5)}`}
          />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Обновлено</Title>
          <TextField
            value={`${record?.updated_at?.split("T")[0]} ${record?.updated_at
              ?.split("T")[1]
              ?.slice(0, 5)}`}
          />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Статус</Title>
          <TextField
            value={translateStatus(record?.status)}
          />
        </Col>
      </Row>

      {/* <Title level={4} style={{ marginTop: 24 }}>
        Товары в этом рейсе
      </Title> */}

      {/* Кнопки массового изменения статуса */}
      {/* <Space style={{ marginBottom: 16 }}>
        <Button
          onClick={handleSetReadyToIssue}
          disabled={selectedRowKeys.length === 0 || isUpdating}
        >
          Принять
        </Button>
      </Space> */}

      {/* Таблица со списком товаров и чекбоксами */}
      {/* <Table {...tableProps} rowKey="id" rowSelection={rowSelection}>
        <Table.Column dataIndex="receptionDate" title="Дата" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column dataIndex="trackCode" title="Треккод" />
        <Table.Column dataIndex="clientCode" title="Код Клиента" />
        <Table.Column dataIndex="recipient" title="Получатель" />
        <Table.Column dataIndex="city" title="Город" />
        <Table.Column dataIndex="weight" title="Вес" />
        <Table.Column dataIndex="status" title="Статус" />
      </Table> */}
    </Show>
  );
};