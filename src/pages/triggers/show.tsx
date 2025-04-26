import React from "react";
import { Show, TextField, EditButton, DeleteButton } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Col, Row, Typography } from "antd";

const { Title } = Typography;

export const TriggersShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data } = queryResult;

  const record = data?.data;

  // @ts-ignore
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
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Title level={5}>Название</Title>
          <TextField value={record?.name} />
        </Col>

        <Col xs={24} md={6}>
          <Title level={5}>Описание</Title>
          <TextField value={record?.description} />
        </Col>
      </Row>
    </Show>
  );
};
