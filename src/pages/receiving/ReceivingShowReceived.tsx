import { Show } from "@refinedev/antd";
import { Table, Input, Dropdown, Space, Button } from "antd";
import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { SearchOutlined, SettingOutlined } from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { API_URL } from "../../App";
import { translateStatus } from "../../lib/utils";

const ReceivingShowReceived = () => {
  const { id } = useParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([
    { trackCode: { $contL: "" } },
  ]);
  const [sorterVisible, setSorterVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          { shipment_id: Number(id) },
          { status: { $in: ["Выдали", "Готов к выдаче"] } },
        ],
      }),
      sort: `${sortField},${sortDirection}`,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  useEffect(() => {
    refetch();
  }, [searchFilters, sortDirection, pagination]);

  const sorterItems = [
    {
      key: "id_desc",
      label: "Дата по убыванию",
      onClick: () => {
        setSortField("id");
        setSortDirection("DESC");
      },
    },
    {
      key: "id_asc",
      label: "Дата по возрастанию",
      onClick: () => {
        setSortField("id");
        setSortDirection("ASC");
      },
    },
    {
      key: "counterparty.name",
      label: "Имя по убыванию",
      onClick: () => {
        setSortField("counterparty.name");
        setSortDirection("DESC");
      },
    },
    {
      key: "counterparty.name",
      label: "Имя по возрастанию",
      onClick: () => {
        setSortField("counterparty.name");
        setSortDirection("ASC");
      },
    },
  ];

  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    setPagination(newPagination);
    if (sorter.field) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const handleSearch = (value: string) => {
    setSearchFilters([
      {
        $or: [
          { trackCode: { $contL: value } },
          { "counterparty.name": { $contL: value } },
          { "counterparty.clientCode": { $contL: value } },
        ],
      },
    ]);
  };

  return (
    <Show headerButtons={() => false}>
      <Table
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        onChange={handleTableChange}
        pagination={pagination}
        title={() => (
          <Space>
            <Input
              placeholder="Поиск по трек-коду, имени или коду клиента"
              prefix={<SearchOutlined />}
              style={{ width: 400 }}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Dropdown
              menu={{ items: sorterItems }}
              placement="bottomRight"
              trigger={["click"]}
              open={sorterVisible}
              onOpenChange={setSorterVisible}
            >
              <Button icon={<SettingOutlined />}>Сортировка</Button>
            </Dropdown>
          </Space>
        )}
        scroll={{ x: "max-content" }}
      >
        <Table.Column
          dataIndex="updated_at"
          title="Дата"
          width={120}
          render={(value) => {
            return `${value?.split("T")[0]} ${value
              ?.split("T")[1]
              ?.slice(0, 5)}`;
          }}
        />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column
          dataIndex="counterparty"
          title="Код клиента"
          render={(value) => {
            return `${value?.clientPrefix}-${value?.clientCode}`;
          }}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Получатель"
          render={(value) => value?.name}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Город"
          render={(value) => value?.branch?.name}
        />
        <Table.Column dataIndex="weight" title="Вес" />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
      </Table>
    </Show>
  );
};

export default ReceivingShowReceived;
