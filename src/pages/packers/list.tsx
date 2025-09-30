import React from 'react';
import { useNavigation, useDelete } from '@refinedev/core';
import { useTable } from '@refinedev/antd';
import { Table, Space, Button, Popconfirm, message } from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { IPacker } from './interfaces';

export const PackersList: React.FC = () => {
    const { tableProps } = useTable<IPacker>({
        resource: "packers",
        syncWithLocation: true,
        pagination: {
            pageSize: 10,
        },
        sorters: {
            initial: [
                {
                    field: "id",
                    order: "desc"
                }
            ]
        }
    });

    const { push } = useNavigation();
    const { mutate: deleteOne } = useDelete();

    const handleDelete = async (id: number) => {
        try {
            await deleteOne({
                resource: "packers",
                id,
            });
            message.success('Упаковщик успешно удален');
        } catch (error) {
            message.error('Ошибка при удалении упаковщика');
        }
    };

    const columns = [
        {
            title: 'Имя',
            dataIndex: 'first_name',
            key: 'first_name',
            sorter: true
        },
        {
            title: 'Фамилия',
            dataIndex: 'last_name',
            key: 'last_name',
            sorter: true
        },
        {
            title: 'Общий вес (кг)',
            dataIndex: 'weight_amount',
            key: 'weight_amount',
            render: (weight: number) => weight,
            sorter: true
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_: any, record: IPacker) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => push(`/packers/show/${record.id}`)}
                    >
                        Просмотр
                    </Button>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => push(`/packers/edit/${record.id}`)}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm
                        title="Удалить упаковщика?"
                        description="Вы уверены, что хотите удалить этого упаковщика? Это действие нельзя отменить."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button 
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => push('/packers/create')}
                >
                    Создать упаковщика
                </Button>
                <Button
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
