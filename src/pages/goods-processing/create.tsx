import { useEffect, useState } from "react";
import { Create, useForm, useSelect, useTable } from "@refinedev/antd";
import { Button, Col, Form, InputNumber, Row, Select, Table } from "antd";
import dayjs from "dayjs";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { FileAddOutlined} from "@ant-design/icons";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const columns = [
  { title: "№", value: "id" },
  { title: "Номенклатура", value: "name" },
  { title: "Страна", value: "quantity" },
  { title: "Бренд", value: "price" },
  { title: "Количество", value: "sum" },
  { title: "Вес", value: "sum" },
  { title: "Цена", value: "sum" },
  { title: "Сумма", value: "sum" },
  { title: "Штрихкод", value: "sum" },
];

export const GoodsCreate = () => {
  const { formProps, saveButtonProps, form } = useForm();

  const [services, setServices] = useState<any>([]);

  const values: any = Form.useWatch([], form);

  const currentDateDayjs = dayjs().tz("Asia/Bishkek");

  useEffect(() => {
    if (formProps.form) {
      formProps.form.setFieldsValue({
        created_at: currentDateDayjs,
      });
    }
  }, []);

  const handleFormSubmit = (values: any) => {
    const submitValues = { ...values };

    if (submitValues.created_at) {
      if (typeof submitValues.created_at === "object") {
        if (submitValues.created_at.$d) {
          submitValues.created_at =
            submitValues.created_at.format("YYYY-MM-DDTHH:mm:ss") + ".100Z";
        } else if (submitValues.created_at instanceof Date) {
          submitValues.created_at = submitValues.created_at.toISOString();
        }
      }
    }

    console.log(submitValues.photo);

    if (submitValues.photo) {
      submitValues.photo = {
        file: {
          response: {
            filePath: submitValues.photo?.file?.response?.filePath,
          },
        },
      };
    }

    if (formProps.onFinish) {
      formProps.onFinish(submitValues);
    }
  };

  const { selectProps: counterpartySelectPropsSender } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, `;
    },
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "sender",
      },
    ],
  });

  const { selectProps: counterpartySelectPropsReceiver } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.clientPrefix}-${record?.clientCode}, ${record?.name}, `;
    },
    filters: [
      {
        field: "type",
        operator: "eq",
        value: "receiver",
      },
    ],
  });

  const { selectProps: discountSelectProps }: any = useSelect({
    resource: "discount",
    optionLabel: (record: any) => {
      return `${record?.counter_party?.clientPrefix}-${record?.counter_party?.clientCode}, ${record?.counter_party?.name}, ${record?.discount}%`;
    },
    optionValue: (record: any) => {
      return record?.counter_party?.id;
    },
    filters: [
      {
        field: "counter_party_id",
        operator: "in",
        value: [values?.sender_id, values?.recipient_id],
      },
    ],
    queryOptions: {
      enabled: !!values?.sender_id && !!values?.recipient_id,
    },
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => {
      return `${record?.name}`;
    },
  });

  const { selectProps: nomenclatureSelectProps } = useSelect({
    resource: "nomenclature",
    optionLabel: (record: any) => {
      return `${record?.name}`;
    },
  });

  useEffect(() => {
    if (discountSelectProps?.options?.length > 0) {
      formProps.form?.setFieldsValue({
        discount_id: discountSelectProps?.options?.reduce(
          (max: any, current: any) => {
            return parseFloat(current.discount) > parseFloat(max.discount)
              ? current
              : max;
          }
        ).value,
      });
      console.log(
        discountSelectProps?.options?.reduce((max: any, current: any) => {
          return parseFloat(current.discount) > parseFloat(max.discount)
            ? current
            : max;
        })
      );
    }
  }, [discountSelectProps]);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFormSubmit}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              rules={[
                { required: true, message: "Город назначения обязателен" },
              ]}
              label="Город назначения"
              name="destination_id"
            >
              <Select {...branchSelectProps} allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              rules={[{ required: true, message: "Отправитель обязателен" }]}
              label="Отправитель"
              name="sender_id"
            >
              <Select {...counterpartySelectPropsSender} allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              rules={[{ required: true, message: "Получатель обязателен" }]}
              label="Получатель"
              name="recipient_id"
            >
              <Select {...counterpartySelectPropsReceiver} allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              rules={[{ required: true, message: "Оплачивает" }]}
              label="Оплачивает"
              name="pays"
            >
              <Select
                options={[
                  { label: "Получатель", value: "recipient" },
                  { label: "Отправитель", value: "sender" },
                ]}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              rules={[{ required: true, message: "Скидка обязательна" }]}
              label="Скидка"
              name="discount_id"
            >
              <Select {...discountSelectProps} allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Button onClick={() => setServices([...services, columns])} icon={<FileAddOutlined />} />
          </Col>
        </Row>
        <Table dataSource={services} style={{ marginTop: 10 }}>
          <Table.Column title="№" dataIndex="id" render={(value: any, record: any, index: any) => index + 1} />
          <Table.Column title="Номенклатура" dataIndex="name" render={(value: any, record: any) => <Select style={{ width: 200 }} {...nomenclatureSelectProps} allowClear />} />
          <Table.Column title="Страна" dataIndex="quantity" />
          <Table.Column title="Тип товара" dataIndex="price" />
          <Table.Column title="Количество" dataIndex="sum" />
          <Table.Column title="Вес" dataIndex="sum" />
          <Table.Column title="Цена" dataIndex="sum" />
          <Table.Column title="Сумма" dataIndex="sum" />
          <Table.Column title="Штрихкод" dataIndex="sum" />
        </Table>
      </Form>
    </Create>
  );
};
