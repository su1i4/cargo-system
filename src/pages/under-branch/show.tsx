import { DeleteButton, EditButton, Show, TextField } from "@refinedev/antd";
import { useMany, useOne, useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;

export const UnderBranchShow = () => {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;

  const record = data?.data;

  // Use useOne to fetch the specific currency for this record
  const { data: currencyData, isLoading: currencyIsLoading } = useOne({
    resource: "currency",
    id: record?.currency_id || "",
    queryOptions: {
      enabled: !!record?.currency_id,
    },
  });

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          {editButtonProps && (
            <EditButton {...editButtonProps} meta={{ foo: "bar" }} />
          )}
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} meta={{ foo: "bar" }} />
          )}
        </>
      )}
      isLoading={isLoading}
      title="Просмотр филиала"
    >
      <Title level={5}>Название филиала</Title>
      <TextField value={record?.address} />

      <Title level={5}>Телефон</Title>
      <TextField value={record?.phone} />

      <Title level={5}>Рабочее время</Title>
      <TextField value={record?.work_schedule} />
    </Show>
  );
};
