import React, { Key, useState, useEffect } from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import { Col, Form, Input, Row, Select, Table, Button } from "antd";
import { API_URL } from "../../App";
import {
  BaseRecord,
  useCreate,
  useCustom,
  useNavigation,
} from "@refinedev/core";
import { useSearchParams } from "react-router";

export const TasksCreate: React.FC = () => {
  const { formProps, saveButtonProps, form } = useForm();

  const { mutate } = useCreate();

  const [searchparams, setSearchParams] = useSearchParams();
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [sortField, setSortField] = useState<"id" | "counterparty.name">("id");
  const [searchFilters, setSearchFilters] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    const counterpartyId = form.getFieldValue("counterpartyId");
    if (counterpartyId) {
      refreshData();
    }
  }, [form.getFieldValue("counterpartyId")]);

  const refreshData = () => {
    setCurrentPage((prevPage) => prevPage);
  };

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          {
            "counterparty.id": {
              $eq:
                form.getFieldValue("counterpartyId") === undefined
                  ? 0
                  : form.getFieldValue("counterpartyId"),
            },
          },
        ],
      }),
      sort: `${sortField},${sortDirection}`,
      limit: pageSize,
      page: currentPage,
      offset: (currentPage - 1) * pageSize,
    };
  };

  const { data, isLoading } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });

  const handleRowSelectionChange = (
    selectedRowKeys: Key[],
    selectedRows: BaseRecord[],
    info: { type: "all" | "none" | "invert" | "single" | "multiple" }
  ) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

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

  const { selectProps: counterpartySelectProps } = useSelect({
    resource: "counterparty",
    optionLabel: (record: any) => {
      return `${record?.name}, ${record?.clientPrefix}-${record?.clientCode}`;
    },
    onSearch: (value) => {
      const isOnlyDigits = /^\d+$/.test(value);

      if (isOnlyDigits) {
        return [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
        ];
      } else {
        return [
          {
            field: "name",
            operator: "contains",
            value,
          },
        ];
      }
    },
  });

  const { selectProps: usersSelectProps } = useSelect({
    resource: "users",
    optionLabel: (record: any) => {
      return `${record?.firstName}-${record?.lastName}`;
    },
    onSearch: (value) => {
      const isOnlyDigits = /^\d+$/.test(value);

      if (isOnlyDigits) {
        return [
          {
            field: "clientCode",
            operator: "contains",
            value,
          },
        ];
      } else {
        return [
          {
            field: "name",
            operator: "contains",
            value,
          },
        ];
      }
    },
  });

  const { push } = useNavigation();

  const handleCreateSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      const payload = {
        ...values,
        goodsIds: selectedRowKeys,
      };

      mutate(
        {
          resource: "tasks",
          values: payload,
          successNotification: {
            message: "Задача успешно создана",
            description: "Новая задача была успешно создана",
            type: "success",
          },
          errorNotification: {
            message: "Ошибка",
            description: "Произошла ошибка при создании задачи",
            type: "error",
          },
        },
        {
          onSuccess: () => {
            form.resetFields();
            setSelectedRowKeys([]);
            push("/tasks");
          },
        }
      );
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        disabled: selectedRowKeys.length === 0,
        onClick: () => handleCreateSubmit(),
      }}
    >
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item
              label="Заголовок"
              name="title"
              rules={[{ required: true, message: "Укажите заголовок" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Описание"
              name="description"
              rules={[{ required: true, message: "Укажите описание" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Клиент"
              name="counterpartyId"
              rules={[
                {
                  required: true,
                  message: "Выберите клиента",
                },
              ]}
            >
              <Select
                {...counterpartySelectProps}
                onChange={() => {
                  setSelectedRowKeys([]);
                  refreshData();
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Сотрудники"
              name="assignedUserIds"
              rules={[
                {
                  required: true,
                  message: "Выберите сотрудников",
                },
              ]}
            >
              <Select
                {...usersSelectProps}
                mode="multiple" // Enable multiple selection
                placeholder="Выберите сотрудников"
              />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          {selectedRowKeys.length > 0 ? (
            <span>Выбрано товаров: {selectedRowKeys.length}</span>
          ) : (
            <span>Выберите товары для задачи</span>
          )}
        </div>

        <Table
          rowSelection={{
            type: "checkbox",
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: handleRowSelectionChange,
          }}
          {...tableProps}
          rowKey="id"
          scroll={{ x: 1200 }}
        >
          <Table.Column dataIndex="trackCode" title="Трек-код" />
          <Table.Column dataIndex="cargoType" title="Тип груза" />
          <Table.Column
            dataIndex="counterparty"
            title="Код клиента"
            render={(value) => {
              return value?.clientPrefix + "-" + value?.clientCode;
            }}
          />
          <Table.Column
            dataIndex="counterparty"
            title="ФИО получателя"
            render={(value) => value?.name}
          />
          <Table.Column
            dataIndex="counterparty"
            render={(value) => (
              <p
                style={{
                  width: "200px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {`${value?.branch?.name}, ${
                  value?.under_branch?.address || ""
                }`}
              </p>
            )}
            title="Пункт назначения, Пвз"
          />
          <Table.Column
            dataIndex="weight"
            title="Вес"
            render={(value) => value + " кг"}
          />
          <Table.Column
            dataIndex="counterparty"
            title="Тариф клиента"
            render={(value, record) => {
              return `${(
                Number(value?.branch?.tarif || 0) -
                Number(record?.counterparty?.discount?.discount || 0)
              ).toFixed(2)}$`;
            }}
          />

          <Table.Column
            dataIndex="amount"
            title="Сумма"
            render={(value) => value + " $"}
          />
          <Table.Column
            dataIndex="discount"
            title="Скидка"
            render={(value, record) => {
              return `${(
                Number(value) + Number(record?.discount_custom)
              ).toFixed(2)}`;
            }}
          />
          <Table.Column dataIndex="comments" title="Комментарий" />
        </Table>
      </Form>
    </Create>
  );
};
