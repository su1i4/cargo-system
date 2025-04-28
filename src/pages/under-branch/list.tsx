import {
  List,
  useTable,
} from "@refinedev/antd";
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
    <List>
      <Table
        onRow={(record) => ({
          onDoubleClick: () => {
            push(`/under-branch/show/${record?.id}`)
          },
        })}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          dataIndex="branch"
          title={"Филиал"}
          render={(value) => value?.name || ""}
        />
        <Table.Column dataIndex="work_schedule" title={"Рабочее время"} />
        <Table.Column dataIndex="address" title={"Адрес"} />
        <Table.Column
          dataIndex="currency_id"
          title="Валюта"
          render={(value) =>
            currencyIsLoading ? "Loading..." : currencyMap[value] || ""
          }
        />

        {/* <Table.Column
          title={"Действия"}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        /> */}
      </Table>
    </List>
  );
};
