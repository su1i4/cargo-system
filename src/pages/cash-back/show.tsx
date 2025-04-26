import { Show, TextField, DateField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Title } = Typography;

export const CounterpartyShow: React.FC = () => {
    const { queryResult } = useShow();
    const { data, isLoading } = queryResult;

    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>ID</Title>
            <TextField value={record?.id} />

            <Title level={5}>Код клиента</Title>
            <TextField value={record?.code} />

            <Title level={5}>Имя</Title>
            <TextField value={record?.name} />

            <Title level={5}>Номер телефона</Title>
            <TextField value={record?.phoneNumber} />

            <Title level={5}>Email</Title>
            <TextField value={record?.email} />

            <Title level={5}>Сумма заказов</Title>
            <TextField value={record?.totalOrders} />

            <Title level={5}>Комментарий</Title>
            <TextField value={record?.comment} />

            {record?.createdAt && (
                <>
                    <Title level={5}>Дата создания</Title>
                    <DateField value={record?.createdAt} />
                </>
            )}
        </Show>
    );
};
