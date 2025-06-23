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
      title="Статус оплаты"
      render={(_, record) => {
        const amount = Number(record.amount);
        const paidSum = Number(record.paid_sum);

        if (!paidSum) {
          return <p style={{ color: "red" }}>Не оплачено</p>;
        }

        if (paidSum < amount) {
          return <p style={{ color: "orange" }}>Частично оплачено</p>;
        }

        return <p style={{ color: "green" }}>Оплачено</p>;
      }}
    />
  );
};
