import { List, useTable } from "@refinedev/antd";
import { useMany, useNavigation } from "@refinedev/core";
import { Table } from "antd";

export const UnderBranchList = () => {
  const { tableProps } = useTable({
    syncWithLocation: false,
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
  });
  const currencyIds = tableProps?.dataSource
    ? tableProps.dataSource.map((item: any) => item.currency_id).filter(Boolean)
    : [];

  const { data: currencyData, isLoading: currencyIsLoading } = useMany({
    resource: "currency",
    ids: currencyIds,
    queryOptions: {
      enabled: currencyIds.length > 0,
    },
  });

  const currencyMap =
    currencyData?.data?.reduce(
      (acc: Record<string | number, string>, curr: any) => {
        acc[curr.id] = curr.name;
        return acc;
      },
      {}
    ) || {};

  const { show, push } = useNavigation();

  return (
    <List title="Филиалы">
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            push(`/under-branch/show/${record?.id}`);
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          dataIndex="branch"
          title="Название филиала"
          render={(value) => value?.name || ""}
          width={250}
        />
        <Table.Column dataIndex="work_schedule" title="Рабочее время" width={250} />
        <Table.Column dataIndex="address" title="Адрес" />
      </Table>
    </List>
  );
};
