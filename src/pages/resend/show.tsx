import React, { useRef, useState } from "react";
import {
  DeleteButton,
  EditButton,
  Show,
  TextField,
  useTable,
} from "@refinedev/antd";
import { useCustom, useOne, useShow } from "@refinedev/core";
import { Typography, Row, Col, Table, Button, Flex, Modal } from "antd";
import { useParams } from "react-router";
import { translateStatus } from "../../lib/utils";
import { PrinterOutlined } from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import { API_URL } from "../../App";

const { Title } = Typography;

const ResendShow = () => {
  const { id } = useParams();
  const { data, isLoading } = useOne({
    resource: "shipments",
    id,
  });
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
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
    queryOptions: {
      enabled: !isLoading && !!record, // Исправлено: запрос включается только когда данные загружены
    },
  });

  const { data: branchesData } = useCustom<any>({
    url: `${API_URL}/branch`,
    method: "get",
  });

  const buildQueryParams = () => ({
    s: JSON.stringify({
      $and: [
        { shipment_id: { $eq: Number(id) } },
        { status: { $eq: "В пути" } },
      ],
    }),
  });

  const { data: goodsData } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  console.log(goodsData?.data?.length, "goods length");

  const branches = branchesData?.data || [];

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    //@ts-ignore
    contentRef,
    documentTitle: `Выдача накладная ${dayjs().format("DD.MM.YYYY HH:MM")}`,
    onPrintError: (error) => console.error("Print Error:", error),
  });

  const [printOpen, setPrintOpen] = useState(false);

  const handleClose = () => {
    setPrintOpen(false);
  };

  const pvz = goodsData?.data || [];

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          <Button onClick={() => setPrintOpen(true)} icon={<PrinterOutlined />}>
            Распечатать
          </Button>
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
      <Modal
        open={printOpen}
        onCancel={handleClose}
        onClose={handleClose}
        onOk={() => handlePrint()}
        okText="Распечатать"
        cancelText="Отменить"
        style={{ maxWidth: "fit-content" }}
      >
        <div
          ref={contentRef}
          style={{ padding: 10, width: "75mm", height: "140mm" }}
        >
          <Flex vertical gap={0} style={{ width: "100%", lineHeight: "15px" }}>
            <Flex justify="center">
              <img
                style={{
                  width: "70px",
                }}
                src="../../public/alfa-china.png"
              />
            </Flex>
            <p style={{ color: "black" }}>
              г.{" "}
              {
                branches.find((item: any) => item.id === record?.branch_id)
                  ?.name
              }
            </p>
            <p>ПВЗ: {pvz[0]?.counterparty?.under_branch?.address}</p>
            <p>
              Персональный-код:{" "}
              {`${pvz[0]?.counterparty?.clientPrefix}-${pvz[0]?.counterparty?.clientCode}`}
            </p>
            <p>Фио клиента: {pvz[0]?.counterparty?.name}</p>
            <p>Номер для связи: {pvz[0]?.counterparty?.phoneNumber}</p>
            <p>Вес: {record?.weight} кг</p>
            <p>Количество: {record?.goodsCount}</p>
            <p>
              Сумма:{" "}
              {pvz?.reduce(
                (accumulator: any, currentValue: any) =>
                  accumulator + Number(currentValue.amount || 0),
                0
              )}{" "}
              $
            </p>
            <Flex justify="center">
              <img
                style={{
                  width: "140px",
                }}
                src="../../public/qrcode.png"
              />
            </Flex>
          </Flex>
        </div>
      </Modal>
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
          <TextField
            value={Number(record?.weight) + Number(record?.box_weight)}
          />
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
          <TextField value={record?.goodsCount} />
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
        <Col xs={24} md={6}>
          <Title level={5}>Номер фуры</Title>
          <TextField value={record?.truck_number || "-"} />
        </Col>
        <Col xs={24} md={6}>
          <Title level={5}>Общая сумма</Title>
          <TextField
            value={`${pvz?.reduce(
              (accumulator: any, currentValue: any) =>
                accumulator + Number(currentValue.amount || 0),
              0
            )} $`}
          />
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 24 }}>
        Товары в этом рейсе
      </Title>
      <Table
        {...tableProps}
        pagination={{ ...tableProps.pagination, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1000 }}
      >
        <Table.Column
          title="№"
          render={(_: any, __: any, index: number) => {
            return (
              //@ts-ignore
              (tableProps?.pagination?.current - 1) *
              //@ts-ignore
                tableProps?.pagination?.pageSize +
              index +
              1
            );
          }}
        />
        <Table.Column
          dataIndex="created_at"
          title="Дата приемки"
          render={(value) => {
            return value
              ? `${value?.split("T")[0]} ${value?.split("T")[1]?.slice(0, 5)}`
              : "-";
          }}
        />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column dataIndex="trackCode" title="Трек-код" />

        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
          render={(value) => {
            return value ? value?.clientPrefix + "-" + value?.clientCode : "-";
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
            value
              ? `${value?.branch?.name},${value?.under_branch?.address || ""}`
              : "-"
          }
          title="Пункт назначения, Пвз"
        />
        <Table.Column dataIndex="weight" title="Вес" />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </Show>
  );
};

export default ResendShow;
