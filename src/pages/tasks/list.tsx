import { useState, useEffect } from "react";
import { CreateButton, List } from "@refinedev/antd";
import { Button, Table } from "antd";
import { useCustom, useNavigation } from "@refinedev/core";
import { API_URL } from "../../App";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateTaskStatus } from "../../lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export const TasksList = () => {
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<
    "id" | "counterparty.id" | "operation_id"
  >("id");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/tasks`,
    method: "get",
    config: {
      query: {
        sort: `${sortField},${sortDirection}`,
        limit: pageSize,
        page: currentPage,
      },
    },
  });

  useEffect(() => {
    refetch();
  }, [currentPage, pageSize]);

  const tasks = data?.data?.data || [];

  const { push, show } = useNavigation();

  return (
    <List
      headerButtons={() => (
        <>
          <Button onClick={() => push("archive")}>Архив</Button>
          <CreateButton onClick={() => push("/tasks/create")} />
        </>
      )}
    >
      <Table
        dataSource={tasks}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: pageSize,
          current: currentPage,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          total: data?.data?.total || 0,
        }}
        onRow={(record) => ({
          onDoubleClick: () => {
            show("tasks", record.id as number);
          },
        })}
      >
        <Table.Column
          dataIndex="createdAt"
          title="Дата создания"
          width={100}
          render={(value) =>
            value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
          }
        />
        <Table.Column dataIndex="title" title="Название" />
        <Table.Column dataIndex="description" title="Описание" />
        <Table.Column
          dataIndex="counterparty"
          title="Код клиента"
          render={(value) => `${value?.clientPrefix}-${value?.clientCode}`}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Фио клиента"
          render={(value) => value?.name}
        />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateTaskStatus(value)}
        />
      </Table>
    </List>
  );
};
