import { useState, useEffect } from "react";
import { Edit, useForm, useSelect, useTable } from "@refinedev/antd";
import {
  useUpdateMany,
  useOne,
  useNavigation,
  useUpdate,
  useShow,
} from "@refinedev/core";
import {
  Form,
  Input,
  Row,
  Select,
  Col,
  Table,
  Button,
  Card,
  DatePicker,
  message,
  Tooltip,
} from "antd";
import { useParams, useSearchParams } from "react-router";
import { FileAddOutlined, SearchOutlined } from "@ant-design/icons";
import { translateStatus } from "../../lib/utils";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bishkek");

const ShipmentEdit = () => {
  const { id } = useParams();
  const { push, list } = useNavigation();

  const [searchValue, setSearchValue] = useState<string>("");

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const { tableProps, setFilters } = useTable({
    resource: "service",
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
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
      initial: searchValue
        ? [
            {
              field: "trackCode",
              operator: "contains",
              value: searchValue,
            },
          ]
        : [],
    },
  });

  const { data: shipmentData, isLoading: isLoadingShipment } = useOne({
    resource: "shipments",
    id: id ? parseInt(id) : 0,
    queryOptions: {
      enabled: !!id,
    },
  });

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
  });

  const { selectProps: employeeSelectProps } = useSelect({
    resource: "users",
    optionLabel: (record: any) => `${record.firstName} ${record.lastName}`,
  });

  const { selectProps: typeSelectProps } = useSelect({
    resource: "type-product",
    optionLabel: (record: any) => record.name,
  });

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => record.name,
    onSearch(value) {
      return value
        ? [
            {
              field: "name",
              operator: "contains",
              value: value,
            },
          ]
        : [];
    },
  });

  const {
    formProps,
    saveButtonProps: originalSaveButtonProps,
    form,
    formLoading,
  } = useForm({
    resource: "shipments",
    action: "edit",
    id,
    redirect: "list",
    onMutationSuccess: async (updatedShipment) => {
      const shipmentId = updatedShipment.data.id;

      const currentAssignedGoods =
        tableProps?.dataSource
          ?.filter((item: any) => item.shipment_id === parseInt(id as string))
          .map((item: any) => item.id) || [];

      const unassignedGoods = currentAssignedGoods.filter(
        (goodId: number) => !selectedRowKeys.includes(goodId)
      );

      if (unassignedGoods.length > 0) {
        updateManyGoods({
          ids: unassignedGoods,
          values: {
            shipment_id: null,
            status: "В складе",
          },
        });
      }

      if (selectedRowKeys.length > 0) {
        updateManyGoods({
          ids: selectedRowKeys,
          values: {
            shipment_id: shipmentId,
            status: "В пути",
          },
        });
      }
    },
  });

  const saveButtonProps = {
    ...originalSaveButtonProps,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (originalSaveButtonProps.onClick) {
        originalSaveButtonProps.onClick(e);
      }
    },
    disabled: !!tableProps.loading,
  };

  useEffect(() => {
    if (tableProps?.dataSource && id) {
      const assignedGoods = tableProps.dataSource
        .filter((item: any) => item.shipment_id === parseInt(id as string))
        .map((item: any) => item.id);

      setSelectedRowKeys(assignedGoods);
    }
  }, [tableProps.dataSource, id]);

  useEffect(() => {
    if (shipmentData?.data && form) {
      form.setFieldsValue({
        ...shipmentData.data,
      });
    }
  }, [shipmentData, form]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (!value) {
      setFilters([]);
    } else {
      setFilters([
        {
          field: "trackCode",
          operator: "contains",
          value,
        },
      ]);
    }
  };

  const { queryResult } = useShow({
    resource: "shipments",
    id,
  });
  const record = queryResult.data?.data;

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        flight: record.flight,
        number: record.number,
        employee: record.employee,
        driver: record.driver,
        type: record.type,
        destination: record.destination,
        comment: record.comment,
      });
    }
  }, [record, form]);

  const { mutate: updateServices } = useUpdateMany({
    resource: "service",
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as number[]);
    },
  };

  const handleFinish = (values: any) => {
    const unselectedServices = tableProps?.dataSource?.filter(
      (item: any) => !selectedRowKeys.includes(item.id)
    );
    updateServices({
      ids: unselectedServices?.map((item: any) => item.id),
      values: {
        shipment_id: null,
        status: "На складе",
      },
    });
    updateServices({
      ids: unselectedServices?.map((item: any) => item.id),
      values: {
        shipment_id: Number(id),
        status: "В пути",
      },
    },
    {
      onSuccess: () => {
        list("shipments");
      },
      onError: (error) => {
        message.error("Ошибка при обновлении сервисов: " + error);
      }
    });
  };

  return (
    <Edit
      saveButtonProps={{
        ...saveButtonProps,
        onClick: () => {
          form.submit();
          handleFinish(form.getFieldsValue());
        },
      }}
      isLoading={formLoading || isLoadingShipment}
    >
      <Form form={form} layout="vertical">
        <Row gutter={[16, 0]}>
          <Col span={6}>
            <Form.Item label="Номер рейса" name="truck_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Сотрудник" name="employee_id">
              <Select {...employeeSelectProps} />
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
        <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col span={12}>
            <Tooltip title="Подбор остатков">
              <Button
                icon={<FileAddOutlined />}
                onClick={() => {
                  push(`/shipments/show/${id}/adding`);
                }}
              />
            </Tooltip>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Input
              placeholder="Поиск по трек-коду"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </Col>
        </Row>
        <Table {...tableProps} rowKey="id" rowSelection={rowSelection}>
          <Table.Column
            title="№"
            dataIndex="index"
            render={(value, record, index) => index + 1}
          />
          <Table.Column title="Тип товара" dataIndex="type" />
          <Table.Column title="Номер мешка" dataIndex="bag_number" />
          <Table.Column title="Город" dataIndex="country" />
          <Table.Column title="Количество" dataIndex="quantity" />
          <Table.Column title="Вес" dataIndex="weight" />
          <Table.Column title="Статус" dataIndex="status" />
          <Table.Column
            title="Пункт назначения"
            dataIndex="good"
            render={(value) => value?.label}
          />
          <Table.Column title="Штрихкод" dataIndex="barcode" />
        </Table>
      </Form>
    </Edit>
  );
};

export default ShipmentEdit;
