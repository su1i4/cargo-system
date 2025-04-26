import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  MarkdownField,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, useMany, useNavigation } from "@refinedev/core";
import { Space, Table } from "antd";

export const UnderBranchList = () => {
  const { tableProps } = useTable({
    syncWithLocation: false,
  });

  // Extract currency IDs from the table data
  const currencyIds = tableProps?.dataSource
    ? tableProps.dataSource.map((item: any) => item.currency_id).filter(Boolean)
    : [];

  // Fetch currency data based on the extracted IDs
  const { data: currencyData, isLoading: currencyIsLoading } = useMany({
    resource: "currency",
    ids: currencyIds,
    queryOptions: {
      enabled: currencyIds.length > 0,
    },
  });

  // Create a map of currency IDs to currency names for efficient lookup
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
        {/* <Table.Column dataIndex="id" title={"ID"} /> */}
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
