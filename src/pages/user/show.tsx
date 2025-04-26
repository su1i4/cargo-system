import { DeleteButton, EditButton, Show, TextField } from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;

export const UserShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  const record = data?.data;

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

      <Title level={5}>{"Email"}</Title>
      <TextField value={record?.email} />

      <Title level={5}>{"Роль"}</Title>
      <TextField value={record?.role} />

      <Title level={5}>{"Имя"}</Title>
      <TextField value={record?.firstName} />

      <Title level={5}>{"Фамилия"}</Title>
      <TextField value={record?.lastName} />

      <Title level={5}>{"Должность"}</Title>
      <TextField value={record?.position} />

      <Title level={5}>{"Фото"}</Title>
      <TextField value={record?.photo} />
    </Show>
  );
};
