import { useState, useEffect } from "react";
import { useForm, Show } from "@refinedev/antd";
import { useUpdateMany, useNavigation, useCustom } from "@refinedev/core";
import {
  Input,
  Row,
  Flex,
  Table,
  Button,
  Dropdown,
  DatePicker,
  Card,
} from "antd";
import { useParams, useSearchParams } from "react-router";
import {
  FileAddOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  SearchOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { API_URL } from "../../App";
import { CustomTooltip } from "../../shared";
import { translateStatus } from "../../lib/utils";

const ShipmentAdd = () => {
  const { id } = useParams();
  const { push } = useNavigation();

  const [searchparams, setSearchParams] = useSearchParams();
  const [sorterVisible, setSorterVisible] = useState(false);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          { status: { $eq: "В складе" } },
          { is_consolidated: { $eq: false } },
        ],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: currentPage * pageSize,
    };
  };

  const { data, isLoading, refetch } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const { mutate: updateManyGoods } = useUpdateMany({
    resource: "goods-processing",
  });

  const {
    formProps,
    saveButtonProps: originalSaveButtonProps,
    form,
    formLoading,
  } = useForm({
    resource: "shipments",
    action: "edit",
    id,
    redirect: false,
    onMutationSuccess: async (updatedShipment) => {
      if (selectedRowKeys.length > 0) {
        await updateManyGoods({
          ids: selectedRowKeys,
          values: {
            shipment_id: Number(id),
            status: "В пути",
          },
        });
      }

      push(`/shipments/edit/${id}`);
    },
  });

  const handleSave = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        await Promise.all(
          selectedRowKeys.map(async (key) => {
            await updateManyGoods({
              ids: [key], // Передаём массив с одним id
              values: {
                id: Number(key),
                shipment_id: Number(id),
                status: "В пути",
                adding: true,
              },
            });
          })
        );
        push(`/shipments/edit/${id}`);
      } catch (error) {
        console.error("Ошибка при сохранении:", error);
      }
    } else {
      push(`/shipments/edit/${id}`);
    }
  };

  useEffect(() => {
    if (!searchparams.get("page") && !searchparams.get("size")) {
      searchparams.set("page", String(currentPage));
      searchparams.set("size", String(pageSize));
      setSearchParams(searchparams);
    } else {
      const page = searchparams.get("page");
      const size = searchparams.get("size");
      setCurrentPage(Number(page));
      setPageSize(Number(size));
    }
    refetch();
  }, [searchFilters, sortDirection, currentPage, pageSize]);

  const setFilters = (
    filters: any[],
    mode: "replace" | "append" = "append"
  ) => {
    if (mode === "replace") {
      setSearchFilters(filters);
    } else {
      setSearchFilters((prevFilters) => [...prevFilters, ...filters]);
    }
  };

  const datePickerContent = (
    <DatePicker.RangePicker
      style={{ width: "280px" }}
      placeholder={["Начальная дата", "Конечная дата"]}
      onChange={(dates, dateStrings) => {
        if (dates && dateStrings[0] && dateStrings[1]) {
          setFilters(
            [
              {
                created_at: {
                  $gte: dateStrings[0],
                  $lte: dateStrings[1],
                },
              },
            ],
            "replace"
          );
        }
      }}
    />
  );

  const sortContent = (
    <Card style={{ width: 200, padding: "0px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div
          style={{
            marginBottom: "8px",
            color: "#666",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Сортировать по
        </div>
        {/* Сортировка по дате создания */}
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "id" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("id");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          Дате создания{" "}
          {sortField === "id" && (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
        <Button
          type="text"
          style={{
            textAlign: "left",
            fontWeight: sortField === "counterparty.name" ? "bold" : "normal",
          }}
          onClick={() => {
            setSortField("counterparty.name");
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
          }}
        >
          По фио{" "}
          {sortField === "counterparty.name" &&
            (sortDirection === "ASC" ? "↑" : "↓")}
        </Button>
      </div>
    </Card>
  );

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    searchparams.set("page", pagination.current);
    searchparams.set("size", pagination.pageSize);
    setSearchParams(searchparams);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    if (sorter && sorter.field) {
      setSortField(
        sorter.field === "counterparty.name" ? "counterparty.name" : "id"
      );
      setSortDirection(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  const dataSource = data?.data?.data || [];

  // Формируем пропсы для таблицы из данных useCustom
  const tableProps = {
    dataSource: dataSource,
    loading: isLoading,
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      total: data?.data?.total || 0,
    },
    onChange: handleTableChange,
  };

  return (
    <Show
      headerButtons={() => (
        <Flex gap={8}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => push(`/shipments/edit/${id}`)}
          >
            Назад
          </Button>
        </Flex>
      )}
    >
      <Flex
        gap={10}
        style={{ marginBottom: 10, position: "sticky", top: 80, zIndex: 100 }}
      >
        <CustomTooltip title="Сортировка">
          <Dropdown
            overlay={sortContent}
            trigger={["click"]}
            placement="bottomLeft"
            open={sorterVisible}
            onOpenChange={(visible) => {
              setSorterVisible(visible);
            }}
          >
            <Button
              icon={
                sortDirection === "ASC" ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )
              }
            ></Button>
          </Dropdown>
        </CustomTooltip>
        <Input
          style={{ width: "90%" }}
          placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
          prefix={<SearchOutlined />}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              setFilters([], "replace");
              return;
            }

            searchparams.set("page", "1");
            searchparams.set("size", String(pageSize));
            setSearchParams(searchparams);

            setFilters(
              [
                {
                  $or: [
                    { trackCode: { $contL: value } },
                    { "counterparty.clientCode": { $contL: value } },
                    { "counterparty.name": { $contL: value } },
                  ],
                },
              ],
              "replace"
            );
          }}
        />
        <Dropdown
          overlay={datePickerContent}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button icon={<CalendarOutlined />} className="date-picker-button">
            Дата
          </Button>
        </Dropdown>
        <Button type="primary" onClick={handleSave} loading={formLoading}>
          Сохранить
        </Button>
      </Flex>
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{
          type: "checkbox",
          preserveSelectedRowKeys: true,
          selectedRowKeys: selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys as number[]);
            setSelectedRows(rows);

            // Сбрасываем ошибку при выборе товаров
            if (keys.length > 0 && form.getFieldError("_goods")?.length > 0) {
              form.setFields([{ name: "_goods", errors: [] }]);
            }
          },
        }}
        locale={{
          emptyText: "Нет доступных товаров для отправки",
        }}
        scroll={{ x: 1200 }}
      >
        <Table.Column
          dataIndex="created_at"
          title="Дата"
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
          title="Код получателя"
          render={(value) => {
            return value?.clientPrefix + "-" + value?.clientCode;
          }}
        />

        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
        <Table.Column
          dataIndex="counterparty"
          render={(value) => (
            <p style={{ width: "200px" }}>
              {`${value?.branch?.name},${value?.under_branch?.address || ""}`}
            </p>
          )}
          title="Пункт назначения, Пвз"
        />
        <Table.Column dataIndex="weight" title="Вес" />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </Show>
  );
};

export default ShipmentAdd;
