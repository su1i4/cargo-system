import { Create, useForm, useSelect, useTable } from "@refinedev/antd";
import { Form, Select, Table, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

export const BranchNomenclatureCreate = () => {
  const { formProps, saveButtonProps } = useForm({});

  const { tableProps } = useTable({
    resource: "branch-nomenclature",
    syncWithLocation: true,
    sorters: {
      permanent: [
        {
          field: "id",
          order: "asc",
        },
      ],
    },
  });

  const blockIds = tableProps.dataSource?.map(
    (item: any) => item.destination_id
  );

  const { selectProps: branchSelectProps } = useSelect({
    resource: "branch",
    optionLabel: (record: any) => {
      return record?.name;
    },
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

  const rowSelection = {
    selectedRowKeys: selectedProductKeys,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedProductKeys(selectedRowKeys);
      formProps.form?.setFieldValue("product_types", selectedRows);
    },
  };

  return (
    <Create
      title="Создать товары филиала"
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
    </Create>
  );
};
