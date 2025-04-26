import React, { useState } from "react";
import { Create, useForm, useTable } from "@refinedev/antd";
import { useUpdateMany } from "@refinedev/core";
import { Form, Input, DatePicker, Row, Col, Table } from "antd";

const ReceivingCreate = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
  });

  const { formProps, saveButtonProps } = useForm({
    resource: "shipments",
    onMutationSuccess: async (createdShipment) => {
      const newShipmentId = createdShipment.data.id;
      if (selectedRowKeys.length > 0) {
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            shipment_id: newShipmentId,
            status: "IN_TRANSIT",
          },
        });
      }
    },
  });

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
      initial: [
        {
          field: "shipment_id",
          operator: "null",
          value: "null",
        },
        {
          field: "status",
          operator: "in",
          value: "IN_WAREHOUSE",
        },
      ],
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Номер рейса"
              name="flightNumber"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Пункт назначения"
              name="destination"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Дата" name="date" rules={[{ required: true }]}>
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Сумма" name="amount" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Код коробки"
              name="boxCode"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Место погрузки"
              name="loadingPlace"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Количество мест"
              name="numberOfSeats"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Вес" name="weight" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Куб" name="cube" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Сотрудник"
              name="employee"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Тип" name="type" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Table
              {...tableProps}
              rowKey="id"
              rowSelection={{
                type: "checkbox",
                onChange: (keys) => {
                  setSelectedRowKeys(keys as number[]);
                },
              }}
            >
              <Table.Column dataIndex="receptionDate" title="Дата" />
              <Table.Column dataIndex="cargoType" title="ТПН" />
              <Table.Column dataIndex="trackCode" title="Треккод" />
              <Table.Column dataIndex="weight" title="Код Клиента" />
              <Table.Column dataIndex="trackCode" title="Получатель" />
              <Table.Column dataIndex="weight" title="Город" />
              <Table.Column dataIndex="weight" title="Вес" />
            </Table>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};

export default ReceivingCreate;
