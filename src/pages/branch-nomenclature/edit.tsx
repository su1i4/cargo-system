import { Edit, useForm, useSelect, useTable } from "@refinedev/antd";
import { Form, Select, Table, Typography } from "antd";
import { useState, useEffect } from "react";

const { Title } = Typography;

export const BranchNomenclatureEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({});
  const record = queryResult?.data?.data;

  const { tableProps: allNomenclaturesTableProps } = useTable({
    resource: "branch-nomenclature",
    pagination: { mode: "off" },
  });

  const blockIds = allNomenclaturesTableProps.dataSource
    ?.map((item: any) => item.destination_id)
    .filter((branchId: any) => branchId !== record?.destination_id);

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => record?.name,
    filters: [
      {
        field: "id",
        operator: "nin",
        value: blockIds,
      },
    ],
  });

  const { tableProps: productsTableProps } = useTable({
    resource: "products",
    pagination: {
      mode: "off",
    },
  });

  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>(
    []
  );

  useEffect(() => {
    if (record?.product_types) {
      const initialSelectedKeys = record.product_types.map((p: any) => p.id);
      setSelectedProductKeys(initialSelectedKeys);
      formProps.form?.setFieldValue("product_types", record.product_types);
    }
  }, [record, formProps.form]);

  const rowSelection = {
    selectedRowKeys: selectedProductKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedProductKeys(selectedRowKeys);
      formProps.form?.setFieldValue("product_types", selectedRows);
    },
  };

  return (
    <Edit
      title="Редактировать товары филиала"
      headerButtons={() => null}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Филиал"
          name="destination_id"
          rules={[{ required: true, message: "Выберите филиал" }]}
        >
          <Select
            {...branchSelectProps}
            placeholder="Выберите филиал"
            allowClear
          />
        </Form.Item>

        <Title level={5}>Доступные товары</Title>
        <Table
          {...productsTableProps}
          rowKey="id"
          rowSelection={rowSelection}
          bordered
        >
          <Table.Column dataIndex="name" title="Наименование" />
          <Table.Column dataIndex="price" title="Цена" />
        </Table>

        <Form.Item name="product_types" hidden>
          <Select />
        </Form.Item>
      </Form>
    </Edit>
  );
}; 