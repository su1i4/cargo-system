import React, { useState } from "react";
import {
  List,
  useTable,
  EditButton,
  ShowButton,
  DeleteButton,
  Show,
  TextField,
  DateField,
} from "@refinedev/antd";
import { Typography } from "antd";
import { useShow } from "@refinedev/core";
import { EditOutlined } from "@ant-design/icons";

const { Title } = Typography;

export const DiscountShow: React.FC = () => {
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
      <Title level={5}>Код клиента</Title>
      <TextField
        value={`${record?.counter_party.clientPrefix}-${String(
          record?.counter_party.clientCode
        ).padStart(4, "0")}`}
      />

      <Title level={5}>Фио</Title>
      <TextField value={record?.counter_party.name} />

      <Title level={5}>Скидка</Title>
      <TextField value={record?.discount} />
    </Show>
  );
};
