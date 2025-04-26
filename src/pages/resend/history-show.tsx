import React from "react";
import {
  DeleteButton,
  EditButton,
  Show,
  TextField,
  useTable,
} from "@refinedev/antd";
import { useMany, useShow } from "@refinedev/core";
import { Typography, Row, Col, Table } from "antd";
import dayjs from "dayjs";
import { useParams } from "react-router";
import { translateStatus } from "../../lib/utils";

const { Title } = Typography;

export const ResendHistoryShow = () => {
  const { id } = useParams();
  const { queryResult } = useShow({ resource: "shipments", id });
  const { data, isLoading } = queryResult;
  const record = data?.data;

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
          operator: "or",
          value: [
            {
              field: "status",
              operator: "eq",
              value: "Выдали",
            },
            {
              field: "status",
              operator: "eq",
              value: "Готов к выдаче",
            },
          ],
        },
      ],
    },
  });

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
      isLoading={isLoading}
    >
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
          <TextField value={translateStatus(record?.status)} />
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 24 }}>
        Товары в этом рейсе
      </Title>
      <Table {...tableProps} rowKey="id">
        {/* <Table.Column dataIndex="id" title="id" /> */}
        <Table.Column
          dataIndex="created_at"
          title="Дата"
          render={(value) => {
            return `${value?.split("T")[0]} ${value
              ?.split("T")[1]
              ?.slice(0, 5)}`;
          }}
        />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column dataIndex="trackCode" title="Треккод" />

        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
          render={(value) => {
            return value?.clientPrefix + "-" + value?.clientCode;
          }}
        />

        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
        <Table.Column
          dataIndex="counterparty"
          render={(value) =>
            `${value?.branch?.name},${value?.under_branch?.address || ""}`
          }
          title="Пункт назначения, Пвз"
        />
        <Table.Column dataIndex="weight" title="Вес" />
        {/* Добавьте остальные необходимые колонки */}
      </Table>
    </Show>
  );
};
