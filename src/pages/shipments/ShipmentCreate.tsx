import { Create, useForm, useTable } from "@refinedev/antd";
import { Col, DatePicker, Form, Input, Row, Select, Table } from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentCreate = () => {
  const {form, saveButtonProps} = useForm();

  const { tableProps } = useTable({
    resource: "service",
  });

  const handleFinish = (values: any) => {
    console.log(values);
  };

  return (
    //@ts-ignore
    <Create
      saveButtonProps={{ ...saveButtonProps, style: { display: "none" } }}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={[16, 0]}>
          <Col span={8}>
            <Form.Item label="Рейс" name="flight">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Номер" name="number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Сотрудник" name="employee">
              <Select options={[]} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Водитель" name="driver">
              <Select options={[]} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Тип" name="driver">
              <Select options={[]} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Пункт назначения" name="destination">
              <Select options={[]} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Комментарий" name="amount">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>

        </Row>
        <Table dataSource={tableProps.dataSource} pagination={false}>
          <Table.Column title="№" dataIndex="number" />
          <Table.Column title="Тип товара" dataIndex="type" />
          <Table.Column title="Номер мешка" dataIndex="name" />
          <Table.Column title="Город" dataIndex="country" />
          <Table.Column title="Количество" dataIndex="quantity" />
          <Table.Column title="Вес" dataIndex="weight" />
          <Table.Column title='Пункт назначения' dataIndex='good' render={(value) => value?.label} />
          <Table.Column title="Штрихкод" dataIndex="barcode" />
        </Table>
      </Form>
    </Create>
  );
};

export default ShipmentCreate;
