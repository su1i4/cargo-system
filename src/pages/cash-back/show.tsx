import { Show } from "@refinedev/antd";
import { useCustom, useNavigation, useShow } from "@refinedev/core";
import { Table, Tag, Button, Modal } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import { useState } from "react";
import { API_URL } from "../../App";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { operationStatus } from "../../shared/custom-tooltip";

dayjs.extend(utc);
dayjs.extend(timezone);

export const CashBackShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);

  const record = data?.data;

  const { data: historyData, isLoading: historyLoading } = useCustom({
    url: `${API_URL}/cash-back-history`,
    method: "get",
    config: {
      query: {
        s: JSON.stringify({
          $and: [{ "counterparty.id": record?.counterparty?.id }],
        }),
        sort: `created_at,DESC`,
      },
    },
    queryOptions: {
      enabled: !!record?.counterparty?.id,
    },
  });

  const showHistoryModal = () => {
    setIsHistoryModalVisible(true);
  };

  const handleHistoryModalCancel = () => {
    setIsHistoryModalVisible(false);
  };

  const { show } = useNavigation();

  return (
    <Show
      headerButtons={() => (
        <Button
          type="primary"
          icon={<HistoryOutlined />}
          onClick={showHistoryModal}
        >
          История изменений
        </Button>
      )}
      title={`Кешбек: ${record?.counterparty?.clientPrefix}-${record?.counterparty?.clientCode}, ${record?.counterparty?.name}, Баланс: ${record?.counterparty?.ross_coin}`}
      isLoading={isLoading}
    >
      <Table
        dataSource={Array.isArray(historyData?.data) ? historyData.data : []}
        loading={historyLoading}
        rowKey="id"
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onDoubleClick: () => {
            show("goods-processing", record.good.id as number);
          },
        })}
      >
        <Table.Column
          dataIndex="good"
          title="Дата приемки"
          render={(value) =>
            value?.created_at
              ? dayjs(value?.created_at).utc().format("DD.MM.YYYY HH:mm")
              : ""
          }
        />
        <Table.Column
          dataIndex="created_at"
          title="Дата операции"
          render={(value) =>
            value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
          }
        />
        <Table.Column
          dataIndex="good"
          title="№ накладной"
          render={(value) => value?.invoice_number}
        />
        <Table.Column
          dataIndex="good"
          title="Код отправителя"
          render={(value) => {
            return `${value?.sender?.clientPrefix || ""}-${
              value?.sender?.clientCode || ""
            }`;
          }}
        />
        <Table.Column
          dataIndex="good"
          title="Фио отправителя"
          render={(value) => value?.sender?.name}
        />
        <Table.Column
          dataIndex="good"
          title="Код получателя"
          render={(value) => {
            return `${value?.recipient?.clientPrefix || ""}-${
              value?.recipient?.clientCode || ""
            }`;
          }}
        />
        <Table.Column
          dataIndex="good"
          title="Фио получателя"
          render={(value) => value?.recipient?.name}
        />
        <Table.Column
          dataIndex="good"
          render={(value) => value?.destination?.name}
          title="Пункт назначения"
        />
        <Table.Column
          dataIndex="good"
          title="Вес"
          render={(value) =>
            value
              ? String(value?.weight).replace(".", ",").slice(0, 5) + " кг"
              : ""
          }
        />
        <Table.Column
          dataIndex="good"
          title="Сумма"
          render={(_, record: any) => `${Number(record.amount)} ₽`}
        />
        <Table.Column
          dataIndex="counterparty"
          title="Клиент операции"
          render={(value) => value?.name}
        />
        <Table.Column
          dataIndex="movement_type"
          title="Операция"
          render={(value, record) => {
            const isCredit = value === "credit";
            return (
              <Tag color={isCredit ? "green" : "red"}>
                {record?.amount} ₽, {isCredit ? "Начисление" : "Списание"}
              </Tag>
            );
          }}
        />
      </Table>

      <Modal
        title="История изменений суммы"
        visible={isHistoryModalVisible}
        onCancel={handleHistoryModalCancel}
        footer={null}
        width={800}
      >
        <Table
          dataSource={
            Array.isArray(record?.cash_back_history)
              ? record.cash_back_history
              : []
          }
          rowKey="id"
          scroll={{ x: 600 }}
        >
          <Table.Column
            dataIndex="created_at"
            title="Дата создания"
            render={(value) =>
              value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
            }
          />
          <Table.Column
            dataIndex="updated_at"
            title="Дата обновления"
            render={(value) =>
              value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
            }
          />
          <Table.Column
            dataIndex="amount"
            title="Сумма"
            render={(value) => `${value || 0} ₽`}
          />
        </Table>
      </Modal>
    </Show>
  );
};
