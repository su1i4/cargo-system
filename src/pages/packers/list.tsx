import React from 'react';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button } from 'antd';
import { IPacker } from './interfaces';
import { useNavigation } from '@refinedev/core';

export const PackersList: React.FC = () => {
    const { tableProps } = useTable<IPacker>();
    const {push} = useNavigation()

    const columns = [
        {
            title: 'Имя',
            dataIndex: 'first_name',
            key: 'first_name'
        },
        {
            title: 'Фамилия',
            dataIndex: 'last_name',
            key: 'last_name'
        },
        {
            title: 'Общий вес (кг)',
            dataIndex: 'weight_amount',
            key: 'weight_amount',
            render: (weight: number) => weight
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: IPacker) => (
                <Space>
                    <Button
                        onClick={() => push(`/packers/show/${record.id}`)}
                        type="primary"
                    >
                        Подробнее
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    onClick={() => push('/packers/top')}
                >
                    Топ упаковщиков
                </Button>
            </Space>
            <Table
                {...tableProps}
                columns={columns}
                rowKey="id"
            />
        </div>
    );
};
