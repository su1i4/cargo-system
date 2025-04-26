import { useState, useEffect } from "react";
import { List } from "@refinedev/antd";
import { Button, Flex, Table } from "antd";
import { useCustom, useNavigation } from "@refinedev/core";
import { API_URL } from "../../App";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { translateTaskStatus } from "../../lib/utils";
import { ArrowLeftOutlined } from "@ant-design/icons";

dayjs.extend(utc);
dayjs.extend(timezone);

export const TasksArchive = () => {
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
        s: JSON.stringify({ $and: [{ status: { $eq: "completed" } }] }),
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

  const { push } = useNavigation();

  return (
    <List
      title="Завершенные задачи"
      headerButtons={() => (
        <Flex gap={8}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => push(`/tasks`)}>
            Назад
          </Button>
        </Flex>
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
