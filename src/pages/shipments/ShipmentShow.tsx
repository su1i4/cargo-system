import {
  DeleteButton,
  EditButton,
  Show,
  TextField,
  useTable,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Row, Col, Table } from "antd";
import { useParams } from "react-router";
import { translateStatus } from "../../lib/utils";

const { Title } = Typography;

const ShipmentShow = () => {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;
  const { id } = useParams();
  const record = data?.data;

  const { tableProps } = useTable({
    resource: "service",
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
    queryOptions: {},
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
          <TextField value={record?.truck_number || "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Пункт погрузки</Title>
          <TextField value={record?.employee?.branch?.name || "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Пункт назначения</Title>
          <TextField value={record?.branch?.name || "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Сотрудник</Title>
          <TextField
            value={`${record?.employee?.firstName || ""} ${
              record?.employee?.lastName || ""
            }`}
          />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Количество мест</Title>
          <TextField value={record?.count ?? "-"} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Вес</Title>
          <TextField value={Number(record?.weight) || 0} />
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
          <Title level={5}>Статус</Title>
          <TextField value={translateStatus(record?.status)} />
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 24 }}>
        Товары в этом рейсе
      </Title>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="№"
          dataIndex="number"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          title="Тип товара"
          dataIndex="product_type"
          render={(value) => value?.name}
        />
        <Table.Column title="Номер мешка" dataIndex="bag_number" />
        <Table.Column title="Город" dataIndex="country" />
        <Table.Column title="Количество" dataIndex="quantity" />
        <Table.Column title="Вес" dataIndex="weight" />
        <Table.Column title="Статус" dataIndex="status" />
        <Table.Column
          title="Город назначения"
          dataIndex="good"
          render={(value) => value?.destination?.name}
        />
        <Table.Column title="Штрихкод" dataIndex="barcode" />
      </Table>
    </Show>
  );
};

export default ShipmentShow;
