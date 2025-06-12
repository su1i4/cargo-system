import {
  DateField,
  DeleteButton,
  EditButton,
  MarkdownField,
  Show,
  TextField,
} from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;

export const BranchShow = () => {
  const { queryResult } = useShow({});
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
      <Title level={5}>Название города</Title>
      <TextField value={record?.name} />
      <Title level={5}>Телефон</Title>
      <TextField value={record?.phone} />
      <Title level={5}>Досыльный город</Title>
      <TextField value={record?.is_sent ? "Да" : "Нет"} />
      <Title level={5}>latitude</Title>
      <TextField value={record?.latitude || 0} />
      <Title level={5}>longitude</Title>
      <TextField value={record?.longitude || 0} />
    </Show>
  );
};
