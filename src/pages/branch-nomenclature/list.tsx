import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Space, Table, Tag } from "antd";

export const BranchNomenclatureList = () => {
  const { tableProps } = useTable({
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

  const { push } = useNavigation();

  return (
    <List title="Товары филиалов">
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            push(`/branch-nomenclature/show/${record?.id}`);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column dataIndex="id" title="№" width={50} />
        <Table.Column 
          dataIndex="destination" 
          title="Филиал"
          render={(value) => value?.name || "Не указан"}
        />
        <Table.Column
          dataIndex="product_types"
          title="Типы продуктов"
          render={(value) => {
            if (!value || !Array.isArray(value)) return "Не указаны";
            return (
              <div>
                {value.slice(0, 3).map((product: any, index: number) => (
                  <Tag key={index} color="blue">
                    {product?.name || `ID: ${product?.id}`}
                  </Tag>
                ))}
                {value.length > 3 && (
                  <Tag color="default">+{value.length - 3} еще</Tag>
                )}
              </div>
            );
          }}
        />
        <Table.Column
          title="Действия"
          dataIndex="actions"
          render={(_, record) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}; 