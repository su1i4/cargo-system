import { CreateButton, List, useTable } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";
import { Button, Table } from "antd";
import dayjs from "dayjs";

const ReceivingList = () => {
  const { tableProps } = useTable({
    resource: "shipments",
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "В пути",
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "id",
          order: "desc",
        },
      ],
    },
  });

  const { push, show } = useNavigation();

  return (
    <List headerButtons={false}>
      <Table
        onRow={(record) => {
          return {
            onDoubleClick: () => {
              show("receiving", record.id as number);
            },
          };
        }}
        {...tableProps}
        rowKey="id"
      >
        <Table.Column
          title="№"
          dataIndex="number"
          render={(value, record, index) => index + 1}
        />
        <Table.Column
          title="Дата"
          dataIndex="created_at"
          render={(value) => dayjs(value).format("DD.MM.YYYY")}
        />
        <Table.Column title="Номер рейса" dataIndex="truck_number" />
        <Table.Column
          title="Пункт погрузки"
          dataIndex="employee"
          render={(value) => value?.branch?.name}
        />
        <Table.Column title="Количество мест" dataIndex="count" />
        <Table.Column title="Вес" dataIndex="weight" />
        {/* <Table.Column title="Сумма" dataIndex="amount" /> */}
        <Table.Column
          title="Пункт назначения"
          dataIndex="branch"
          render={(value) => value?.name}
        />
        <Table.Column
          title="Сотрудник"
          dataIndex="employee"
          render={(value) => `${value?.firstName} ${value?.lastName}`}
        />
        <Table.Column title="Статус" dataIndex="status" />
      </Table>
    </List>
  );
};

export default ReceivingList;
