import { BaseRecord } from "@refinedev/core";
import { CustomTooltip } from "../custom-tooltip";
import { Table } from "antd";

export const clientCodeField = ({ width = null }: { width?: number | null }) => {
  return (
    <Table.Column
      dataIndex="codeClientAndPrefix"
      title="Код клиента"
      render={(_, record: BaseRecord) => {
        if (!record.clientPrefix || !record.clientCode) return "";
        return (
          <CustomTooltip
            title={`Префикс: ${record.clientPrefix}, Код: ${record.clientCode}`}
          >
            <span>{record.clientPrefix + "-" + record.clientCode}</span>
          </CustomTooltip>
        );
      }}
      {...(width ? { width } : {})}
    />
  );
};

export const nameField = ({ width = null }: { width?: number | null }) => {
  return <Table.Column dataIndex="name" title="Фио клиента" {...(width ? { width } : {})} />;
};

export const phoneNumberField = ({ width = null }: { width?: number | null }) => {
  return <Table.Column dataIndex="phoneNumber" title="Номер телефона" {...(width ? { width } : {})} />;
};




