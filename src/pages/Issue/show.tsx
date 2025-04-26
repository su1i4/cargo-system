import React from "react";
import { Show, TextField, DateField } from "@refinedev/antd";
import {useParsed, useShow} from "@refinedev/core";
import {Col, Image, Row, Typography} from "antd";
import { API_URL } from "../../App"; // Путь к API_URL, если фото нужно отображать через этот URL

const { Title } = Typography;

export const GoodsShow: React.FC = () => {
    const { queryResult,  } = useShow();
    const { data, isLoading } = queryResult;

    // Предполагается, что data.data содержит объект записи, а связанные данные (branch, counterparty) подгружаются через joins
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={6}>
                    <Title level={5}>ID</Title>
                    <TextField value={record?.id} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Трек-код</Title>
                    <TextField value={record?.trackCode} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Тип груза</Title>
                    <TextField value={record?.cargoType} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Код получателя</Title>
                    <TextField value={record?.recipientCode} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Вес</Title>
                    <TextField value={record?.weight} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Сумма</Title>
                    <TextField value={record?.amount} />
                </Col>

                <Col xs={24} md={6}>
                    <Title level={5}>Статус</Title>
                    <TextField value={record?.status} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Комментарии</Title>
                    <TextField value={record?.comments} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Дата приёма</Title>
                    <DateField value={record?.receptionDate} format="YYYY-MM-DD HH:mm:ss" />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Филиал</Title>
                    <TextField value={record?.branch?.name || record?.branch_id} />
                </Col>
                <Col xs={24} md={6}>
                    <Title level={5}>Контрагент</Title>
                    <TextField value={record?.counterparty?.name || record?.counterparty_id} />
                </Col>
                <Col xs={24} md={24}>
                    <Title level={5}>Фото</Title>
                    {record?.photo ? (
                        <Image
                            width={200}
                            height={300}
                            src={API_URL + '/' + record?.photo}
                        />
                    ) : (
                        <TextField value="Нет фото" />
                    )}
                </Col>
            </Row>
        </Show>
    );
};
