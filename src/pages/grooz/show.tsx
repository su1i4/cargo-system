import {
  Show,
  TextField,
  DateField,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { useCustom, useParsed, useShow } from "@refinedev/core";
import { Typography, Row, Col, Table, Flex, Input } from "antd";
import { operationStatus } from "../../shared";
import { translateStatus } from "../../lib/utils";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { API_URL } from "../../App";
import { useState } from "react";
import { SearchOutlined } from "@ant-design/icons";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

export const GroozShow: React.FC = () => {
  const { id } = useParsed();
  const { queryResult } = useShow({
    resource: "counterparty",
    id,
  });

  const [searchFilters, setSearchFilters] = useState<any[]>([]);

  const buildQueryParams = () => {
    return {
      s: JSON.stringify({
        $and: [
          ...searchFilters,
          { counterparty_id: { $eq: Number(id) } },
          { is_consolidated: { $eq: true } },
        ],
      }),
    };
  };

  const {
    data: goods,
    isLoading: goodsLoading,
    refetch,
  } = useCustom<any>({
    url: `${API_URL}/goods-processing`,
    method: "get",
    config: {
      query: buildQueryParams(),
    },
  });
  const { data, isLoading } = queryResult;

  const record = data?.data;

  const totalWeight = record?.goods.reduce(
    (acc: number, curr: any) => acc + Number(curr.weight),
    0
  );
  const totalAmount = record?.goods.reduce(
    (acc: number, curr: any) => acc + Number(curr.amount),
    0
  );

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

  return (
    <Show
      headerButtons={({ deleteButtonProps, editButtonProps }) => (
        <>
          {editButtonProps && <EditButton {...editButtonProps} />}
          {deleteButtonProps && <DeleteButton {...deleteButtonProps} />}
        </>
      )}
      isLoading={isLoading}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Title level={5}>Код клиента</Title>
          <TextField
            value={`${record?.clientPrefix}-${String(
              record?.clientCode
            ).padStart(4, "0")}`}
          />

          <Title level={5}>Фио клиента</Title>
          <TextField value={record?.name} />

          <Title level={5}>Пвз</Title>
          <TextField
            value={`${record?.branch?.name}-${
              record?.under_branch?.address || ""
            }`}
          />

          <Title level={5}>Номер телефона</Title>
          <TextField value={record?.phoneNumber} />
        </Col>

        <Col xs={24} sm={12}>
          <Title level={5}>Тариф клиента</Title>
          <TextField
            value={`${
              Number(record?.branch?.tarif) -
              Number(record?.discount?.discount || 0)
            }$`}
          />

          <Title level={5}>Общий вес (кг)</Title>
          <TextField value={`${totalWeight} кг`} />

          <Title level={5}>Общая сумма (USD)</Title>
          <TextField value={`${totalAmount} $`} />

          <Title level={5}>Комментарий</Title>
          <TextField value={record?.comment || "-"} />

          {record?.createdAt && (
            <>
              <Title level={5}>Дата создания</Title>
              <DateField value={record?.createdAt} />
            </>
          )}
        </Col>
      </Row>
      <Flex style={{ marginTop: 10 }}>
        <Input
          placeholder="Поиск по трек-коду, фио получателя или по коду получателя"
          prefix={<SearchOutlined />}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              setFilters([{ trackCode: { $contL: "" } }], "replace");
              return;
            }

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
      </Flex>
      <Table
        //@ts-ignore
        dataSource={goods?.data || []}
        loading={goodsLoading}
        pagination={false}
        rowKey="id"
        scroll={{ x: 1200 }}
        style={{ marginTop: 10 }}
      >
        <Table.Column
          dataIndex="created_at"
          title="Дата приемки в Китае"
          render={(value) =>
            value ? dayjs(value).utc().format("DD.MM.YYYY HH:mm") : ""
          }
        />
        <Table.Column dataIndex="trackCode" title="Трек-код" />
        <Table.Column dataIndex="cargoType" title="Тип груза" />
        <Table.Column
          dataIndex="counterparty"
          title="Код получателя"
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
              {`${value?.branch?.name}, ${value?.under_branch?.address || ""}`}
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
            return `${(Number(value) + Number(record?.discount_custom)).toFixed(
              2
            )}`;
          }}
        />
        <Table.Column
          dataIndex="status"
          title="Статус"
          render={(value) => translateStatus(value)}
        />
        {operationStatus()}
        <Table.Column
          dataIndex="employee"
          title="Сотрудник"
          render={(value) => {
            return `${value?.firstName}-${value?.lastName}`;
          }}
        />
        <Table.Column dataIndex="comments" title="Комментарий" />
      </Table>
    </Show>
  );
};
