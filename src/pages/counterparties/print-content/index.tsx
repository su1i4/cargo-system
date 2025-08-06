import { Table } from "antd";
import dayjs from "dayjs";


export const PrintContent = ({data}: {data: any}) => {
  return (
    <Table
      rowKey="id"
      dataSource={data}
      pagination={false}
    >
      <Table.Column
        title="№"
        render={(_: any, __: any, index: number) => {
          return index + 1;
        }}
      />
      <Table.Column
        dataIndex="created_at"
        title="Дата приемки"
        render={(value) =>
          value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
        }
      />
      <Table.Column dataIndex="invoice_number" title="№ накладной" />
      <Table.Column
        dataIndex="employee"
        title="Пункт приема"
        render={(value) =>
          `${value?.branch?.name}, ${value?.under_branch?.address || ""}`
        }
      />
      <Table.Column
        dataIndex="sender"
        title="Код отправителя"
        render={(value) => {
          return value?.clientPrefix + "-" + value?.clientCode;
        }}
      />
      <Table.Column
        dataIndex="sender"
        title="Фио отправителя"
        render={(value) => value?.name}
      />
      <Table.Column
        dataIndex="recipient"
        title="Код получателя"
        render={(value) => {
          return value?.clientPrefix + "-" + value?.clientCode;
        }}
      />
      <Table.Column
        dataIndex="recipient"
        title="Фио получателя"
        render={(value) => value?.name}
      />
      <Table.Column
        dataIndex="destination"
        render={(value) => value?.name}
        title="Пункт назначения"
      />
      <Table.Column
        dataIndex="totalServiceWeight"
        title="Вес"
      />
      <Table.Column
        dataIndex="services"
        title="Кол-во мешков"
        render={(value) => value?.length + " шт"}
      />
      <Table.Column
        dataIndex="totalServiceAmountSum"
        title="Сумма"
      />
    </Table>
  );
};
