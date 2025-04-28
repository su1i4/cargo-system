import { Table, Tooltip } from "antd";
import { ReactNode } from "react";

export const CustomTooltip = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return <Tooltip title={title}>{children}</Tooltip>;
};

export const operationStatus = () => {
  return (
    <Table.Column
      dataIndex="operation_id"
      title="Статус оплаты"
      render={(value) => {
        if (value === null) {
          return <p style={{ color: "red" }}>Не оплачено</p>;
        } else {
          return <p style={{ color: "green" }}>Оплачено</p>;
        }
      }}
    />
  );
};
