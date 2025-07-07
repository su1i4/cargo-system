import { EditOutlined } from "@ant-design/icons";
import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Button, Typography } from "antd";

const { Title } = Typography;

export const CashBackShow: React.FC = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  const record = data?.data;

  return (
    <Show
      headerButtons={() => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          href={`/cash-back/edit/${record?.id}`}
        >
          Редактировать
        </Button>
      )}
      isLoading={isLoading}
    >
      <Title level={5}>Клиент</Title>
      <TextField value={record?.counterparty?.code} />

      <Title level={5}>Сумма</Title>
      <TextField value={record?.amount} />
    </Show>
  );
};
