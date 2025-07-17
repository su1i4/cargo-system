import { useSelect } from "@refinedev/antd";
import { Col, Form, Input, Row, Select } from "antd";

export const GoodsProcessingCreateRequisites = () => {
  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) =>
      `${record?.name}${record?.is_sent ? " (досыльный)" : ""}`,
    filters: [
      {
        field: "name",
        operator: "ne",
        value: "Бишкек",
      },
    ],
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  const { selectProps: counterpartySelectPropsSender } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) =>
      `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}`,
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "sender",
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
          {
            field: "clientPrefix",
            operator: "contains",
            value,
          },
          {
            field: "name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: counterpartySelectPropsReceiver } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) =>
      `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}`,
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "receiver",
      },
    ],
    onSearch: (value) => [
      {
        operator: "or",
        value: [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
          {
            field: "clientPrefix",
            operator: "contains",
            value,
          },
          {
            field: "name",
            operator: "contains",
            value,
          },
        ],
      },
    ],
  });

  const { selectProps: branchSelectPropsIsSent } = useSelect({
    resource: "sent-the-city",
    optionLabel: (record: any) => `${record?.sent_city?.name}`,
    // filters: [
    //   {
    //     field: "city_id",
    //     operator: "eq",
    //     value: values?.destination_id,
    //   },
    // ],
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains",
        value,
      },
    ],
  });

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Form.Item label="Город назначения" name="destination_id">
          <Select {...branchSelectProps} />
        </Form.Item>
      </Col>
      <Col span={9}>
        <Form.Item
          rules={[{ required: true, message: "Отправитель обязателен" }]}
          label="Отправитель"
          name="sender_id"
        >
          <Select {...counterpartySelectPropsSender} allowClear />
        </Form.Item>
      </Col>
      <Col span={9}>
        <Form.Item
          rules={[{ required: true, message: "Получатель обязателен" }]}
          label="Получатель"
          name="recipient_id"
        >
          <Select {...counterpartySelectPropsReceiver} allowClear />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Комментарий" name="comments">
          <Input />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Досыльные города" name="sent_back_id">
          <Select {...branchSelectPropsIsSent} allowClear />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item
          rules={[{ required: true, message: "Способ оплаты обязателен" }]}
          label="Способ оплаты"
          name="payment_method"
          initialValue="Наличные"
        >
          <Select
            showSearch
            allowClear
            placeholder="Выберите способ оплаты"
            options={[
              { label: "Наличные", value: "Наличные" },
              { label: "Безналичные", value: "Безналичные" },
              { label: "Перечислением", value: "Перечислением" },
            ]}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label="Скидка/Кешбек" name="discount_cashback_id">
          <Select placeholder="Выберите скидку или кешбек" />
        </Form.Item>
      </Col>
    </Row>
  );
};
