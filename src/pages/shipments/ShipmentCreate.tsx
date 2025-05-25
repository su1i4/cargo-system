import { Create, useForm, useTable, useSelect } from "@refinedev/antd";
import { useUpdateMany, useCreate, useNavigation } from "@refinedev/core";
import { Col, DatePicker, Form, Input, Row, Select, Table, Button, message } from "antd";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useState } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentCreate = () => {
  const { form, saveButtonProps, formProps } = useForm({
    redirect: "list",
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { list } = useNavigation();

  const { tableProps } = useTable({
    resource: "service",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "На складе",
        },
      ],
    },
  });

  const { mutate: updateServices } = useUpdateMany({
    resource: "service",
  })

   const {selectProps: employeeSelectProps} = useSelect({
    resource: "users",
    optionLabel: (record: any) => `${record.firstName} ${record.lastName}`,
   })

   const {selectProps: typeSelectProps} = useSelect({
    resource: "type-product",
    optionLabel: (record: any) => record.name,
   })

   const {selectProps: branchSelectProps} = useSelect({
    resource: "branch",
    optionLabel: (record: any) => record.name,
    onSearch(value) {
      return value ? [
        {
          field: "name",
          operator: "contains",
          value: value,
        },
      ] : [];
    },
   })

  const { mutate: createShipment } = useCreate();

  const handleFinish = (values: any) => {
    if (selectedRowKeys.length === 0) {
      message.error("Выберите хотя бы один сервис");
      return;
    }

    // Создаем отгрузку
    createShipment(
      {
        resource: "shipments",
        values,
      },
      {
        onSuccess: (data) => {
          const shipmentId = data.data.id;
          
          // Обновляем выбранные сервисы, привязывая их к отгрузке
          updateServices(
            {
              resource: "service",
              ids: selectedRowKeys as number[],
              values: {
                shipment_id: shipmentId,
                status: "В пути" // Опционально: обновить статус сервиса
              },
            },
            {
              onSuccess: () => {
                // Переход на страницу списка отгрузок после успешного создания
                list("shipments");
              },
              onError: (error) => {
                message.error("Ошибка при обновлении сервисов: " + error);
              }
            }
          );
        },
        onError: (error) => {
          message.error("Ошибка при создании отгрузки: " + error);
        },
      }
    );
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <Create
      saveButtonProps={{ 
        ...saveButtonProps, 
        onClick: () => {
          form.submit();
        } 
      }}
    >
      <Form {...formProps} form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={[16, 0]}>
          <Col span={6}>
            <Form.Item label="Номер рейса" name="truck_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Водитель" name="driver">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Тип" name="type_product_id">
              <Select {...typeSelectProps} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Пункт назначения" name="branch_id">
              <Select {...branchSelectProps} />
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item label="Комментарий" name="comment">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Table 
          {...tableProps}
          rowKey="id"
          rowSelection={rowSelection}
        >
          <Table.Column title="№" dataIndex="index" render={(value, record, index) => index + 1} />
          <Table.Column
          title="Дата приемки"
          dataIndex="good"
          render={(value) =>
            dayjs.utc(value?.created_at).format("DD.MM.YYYY HH:mm")
          }
        />
        <Table.Column
          title="Отправитель"
          dataIndex="good"
          render={(value) =>
            `${value?.sender?.clientPrefix}-${value?.sender?.clientCode}`
          }
        />
        <Table.Column title="Номер мешка" dataIndex="bag_number" />
        <Table.Column
          title="Получатель"
          dataIndex="good"
          render={(value) =>
            `${value?.recipient?.clientPrefix}-${value?.recipient?.clientCode}`
          }
        />
        <Table.Column title="Количество" dataIndex="quantity" />
        <Table.Column title="Вес" dataIndex="weight" />
        <Table.Column title="Статус" dataIndex="status" />
        <Table.Column
          title="Пункт назначения"
          dataIndex="good"
          render={(value) => value?.destination?.name}
        />
        <Table.Column title="Штрихкод" dataIndex="barcode" />
        </Table>
      </Form>
    </Create>
  );
};

export default ShipmentCreate;
