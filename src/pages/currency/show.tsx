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
import { Table, Typography } from "antd";
import { useShow } from "@refinedev/core";
import { EditOutlined } from "@ant-design/icons";

const { Title } = Typography;

export const CurrencyShow: React.FC = () => {
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
      <Title level={5}>Валюта</Title>
      <TextField value={record?.name} />

      <Title level={5}>Курс</Title>
      <TextField value={record?.rate} />

      <Title level={5}>Дата создания</Title>
      <DateField value={record?.created_at} />
      <Title level={4} style={{ marginTop: 24 }}>
        История курса
      </Title>
      <Table
        dataSource={record?.currency_history}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        style={{ marginTop: 16 }}
      >
        <Table.Column dataIndex="created_at" title="Дата изменения" render={(value) => new Date(value).toLocaleDateString()} />
        <Table.Column dataIndex="rate" title="Курс" />
      </Table>
    </Show>
  );
};
