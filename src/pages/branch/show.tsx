import { DeleteButton, EditButton, Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Col, Row, Typography } from "antd";

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
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Title level={5}>Название города</Title>
          <TextField value={record?.name} />
        </Col>
        <Col span={8}>
          <Title level={5}>Телефон</Title>
          <TextField value={record?.phone} />
        </Col>
        <Col span={8}>
          <Title level={5}>Досыльный город</Title>
          <TextField value={record?.is_sent ? "Да" : "Нет"} />
        </Col>
        <Col span={8}>
          <Title level={5}>latitude</Title>
          <TextField value={record?.latitude || 0} />
        </Col>
        <Col span={8}>
          <Title level={5}>longitude</Title>
          <TextField value={record?.longitude || 0} />
        </Col>
      </Row>
    </Show>
  );
};
