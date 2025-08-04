import React, { useEffect, useMemo } from "react";
import { useSelect } from "@refinedev/antd";
import { Col, Form, Input, Row, Select } from "antd";
import Title from "antd/es/typography/Title";

interface GoodsProcessingCreateRequisitesProps {
  values: any;
  sentCityData: any[];
  cashBacks: any[];
  discounts: any[];
  form: any;
}

const branchSelectConfig = {
  resource: "branch",
  optionLabel: (record: any) =>
    `${record?.name || ""}${record?.is_sent ? " (досыльный)" : ""}`,
  filters: [
    {
      field: "name",
      operator: "ne" as const,
      value: "Бишкек",
    },
  ],
  onSearch: (value: string): any[] => [
    {
      field: "name",
      operator: "contains" as const,
      value,
    },
  ],
};

const counterpartySenderSelectConfig = {
  resource: "counterparty",
  optionLabel: (record: any) =>
    `${record?.clientPrefix || ""}-${record?.clientCode || ""}, ${
      record?.name || ""
    }`,
  filters: [
    {
      field: "type",
      operator: "eq" as const,
      value: "sender",
    },
  ],
  onSearch: (value: string): any[] => [
    {
      operator: "or" as const,
      value: [
        {
          field: "clientCode",
          operator: "contains" as const,
          value,
        },
        {
          field: "clientPrefix",
          operator: "contains" as const,
          value,
        },
        {
          field: "name",
          operator: "contains" as const,
          value,
        },
      ],
    },
  ],
};

const counterpartyReceiverSelectConfig = {
  resource: "counterparty",
  optionLabel: (record: any) =>
    `${record?.clientPrefix || ""}-${record?.clientCode || ""}, ${
      record?.name || ""
    }`,
  filters: [
    {
      field: "type",
      operator: "eq" as const,
      value: "receiver",
    },
  ],
  onSearch: (value: string): any[] => [
    {
      operator: "or" as const,
      value: [
        {
          field: "clientCode",
          operator: "contains" as const,
          value,
        },
        {
          field: "clientPrefix",
          operator: "contains" as const,
          value,
        },
        {
          field: "name",
          operator: "contains" as const,
          value,
        },
      ],
    },
  ],
};

export const GoodsProcessingCreateRequisites = React.memo(
  ({
    values,
    sentCityData,
    cashBacks,
    discounts,
    form,
  }: GoodsProcessingCreateRequisitesProps) => {
    const { selectProps: branchSelectProps } = useSelect(branchSelectConfig);
    const { selectProps: counterpartySelectPropsSender } = useSelect(
      counterpartySenderSelectConfig
    );
    const { selectProps: counterpartySelectPropsReceiver } = useSelect(
      counterpartyReceiverSelectConfig
    );

    const sentCityOptions = useMemo(
      () =>
        sentCityData
          .filter((item: any) => Number(item.city_id) === values.destination_id)
          .map((item: any) => ({
            label: item.sent_city.name || "",
            value: item.id,
          })),
      [sentCityData, values?.destination_id]
    );

    const cashBackOptions = useMemo(
      () =>
        cashBacks
          .filter(
            (item: any) =>
              item.counterparty_id === values.sender_id ||
              item.counterparty_id === values.recipient_id
          )
          .map((item: any) => ({
            label: `${item.counterparty?.clientPrefix || ""}-${
              item.counterparty?.clientCode || ""
            }, ${item.counterparty.name}. Сумма: ${item.amount}`,
            value: item.counterparty.type,
          })),
      [cashBacks, values?.sender_id, values?.recipient_id]
    );

    useEffect(() => {
      if (values?.discount_id) {
        if (
          values.sender_id !== values.discount_id &&
          values.recipient_id !== values.discount_id
        ) {
          form.setFieldsValue({
            discount_id: null,
          });
        }
      }
    }, [values?.sender_id, values?.recipient_id]);

    const discountOptions = useMemo(
      () =>
        discounts
          .filter(
            (item: any) =>
              item.counter_party_id === values.sender_id ||
              (item.counter_party_id === values.recipient_id &&
                item.destination_id === values.destination_id &&
                Boolean(item?.product_type_id))
          )
          .map((item: any) => ({
            label: `${item.counter_party?.clientPrefix || ""}-${
              item.counter_party?.clientCode || ""
            }, ${item.counter_party?.name}. Скидка: ${item.discount}`,
            value: item.counter_party_id,
          })),
      [
        discounts,
        values?.sender_id,
        values?.recipient_id,
        values?.destination_id,
      ]
    );

    return (
      <>
        <Title level={5} style={{ margin: 0 }}>
          Реквизиты
        </Title>

        <Row gutter={16} style={{ marginTop: 5 }}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Form.Item
              label="Город назначения"
              name="destination_id"
              rules={[{ required: true, message: "Выберите город назначения" }]}
            >
              <Select
                {...branchSelectProps}
                placeholder="Выберите город"
                showSearch
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={9}>
            <Form.Item
              label="Отправитель"
              name="sender_id"
              rules={[{ required: true, message: "Выберите отправителя" }]}
            >
              <Select
                {...counterpartySelectPropsSender}
                placeholder="Выберите отправителя"
                showSearch
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={9}>
            <Form.Item
              label="Получатель"
              name="recipient_id"
              rules={[{ required: true, message: "Выберите получателя" }]}
            >
              <Select
                {...counterpartySelectPropsReceiver}
                placeholder="Выберите получателя"
                showSearch
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Form.Item label="Комментарий" name="comment">
              <Input placeholder="Введите комментарий" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <Form.Item label="Досыл" name="sent_back_id">
              <Select
                options={sentCityOptions}
                placeholder="Выберите досыл"
                allowClear
                showSearch
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
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
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Скидка" name="discount_id">
              <Select
                placeholder="Выберите скидку"
                options={discountOptions}
                allowClear
                showSearch
                onChange={(value) => {
                  if (value) {
                    form.setFieldsValue({
                      discount_id: value,
                      cash_back_target: null,
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Кешбек" name="cash_back_target">
              <Select
                placeholder="Выберите кешбек"
                options={cashBackOptions}
                allowClear
                onChange={(value) => {
                  if (value) {
                    form.setFieldsValue({
                      cash_back_target: value,
                      discount_id: null,
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }
);
