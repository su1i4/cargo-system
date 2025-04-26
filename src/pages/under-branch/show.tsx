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
    >
      <Title level={5}>{"ID"}</Title>
      <TextField value={record?.id} />

      <Title level={5}>{"Филиал"}</Title>
      <TextField value={record?.branch?.name} />

      <Title level={5}>{"Тариф"}</Title>
      <TextField value={record?.branch?.tarif} />

      <Title level={5}>{"Валюта"}</Title>
      <TextField
        value={
          currencyIsLoading
            ? "Loading..."
            : currencyData?.data?.name || "Not specified"
        }
      />
    </Show>
  );
};
