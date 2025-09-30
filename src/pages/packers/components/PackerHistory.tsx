import React, { useState, Key } from 'react';
import { Table, Card, Input, DatePicker, Space, Button } from 'antd';
import { IPackerHistory } from '../interfaces';
import dayjs from 'dayjs';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import type { FilterConfirmProps, FilterDropdownProps } from 'antd/es/table/interface';

const { RangePicker } = DatePicker;

interface PackerHistoryProps {
    history: IPackerHistory[];
    loading?: boolean;
    pagination?: {
        total: number;
        current: number;
        pageSize: number;
        onChange: (page: number, pageSize: number) => void;
    };
}

export const PackerHistory: React.FC<PackerHistoryProps> = ({
    history,
    loading = false,
    pagination
}) => {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const handleSearch = (
        selectedKeys: string[],
        confirm: (param?: FilterConfirmProps) => void,
        dataIndex: string,
    ) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters: () => void) => {
        clearFilters();
        setSearchText('');
    };

    const getColumnSearchProps = (dataIndex: keyof IPackerHistory): ColumnType<IPackerHistory> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Поиск по ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Поиск
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Сброс
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record: IPackerHistory) => {
            const recordValue = record[dataIndex];
            return recordValue
                ? recordValue.toString().toLowerCase().includes((value as string).toLowerCase())
                : false;
        },
        filteredValue: searchedColumn === dataIndex ? [searchText] : null,
    });

    const columns: ColumnType<IPackerHistory>[] = [
        {
            title: 'Дата',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                <div style={{ padding: 8 }}>
                    <RangePicker
                        onChange={(dates) => {
                            if (dates) {
                                setSelectedKeys([dates[0]?.toISOString() || '', dates[1]?.toISOString() || '']);
                            } else {
                                setSelectedKeys([]);
                            }
                        }}
                        style={{ marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Поиск
                        </Button>
                        <Button
                            onClick={() => {
                                clearFilters?.();
                                confirm();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Сброс
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            onFilter: (value: boolean | Key, record: IPackerHistory) => {
                if (typeof value !== 'string') return true;
                const [startDate, endDate] = value.split(',');
                if (!startDate || !endDate) return true;
                const recordDate = dayjs(record.created_at);
                return recordDate.isAfter(startDate) && recordDate.isBefore(endDate);
            },
            sorter: (a: IPackerHistory, b: IPackerHistory) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            sortDirections: ['descend', 'ascend'],
        },
        {
            title: 'Вес (кг)',
            dataIndex: 'packed_weight',
            key: 'packed_weight',
            render: (weight: string | number) => Number(weight).toFixed(2),
            sorter: (a: IPackerHistory, b: IPackerHistory) => Number(a.packed_weight) - Number(b.packed_weight),
            ...getColumnSearchProps('packed_weight')
        },
        {
            title: 'Количество предметов',
            dataIndex: 'packed_items_count',
            key: 'packed_items_count',
            sorter: (a: IPackerHistory, b: IPackerHistory) => a.packed_items_count - b.packed_items_count,
            ...getColumnSearchProps('packed_items_count')
        },
        {
            title: 'ID товара',
            dataIndex: 'good_id',
            key: 'good_id',
            ...getColumnSearchProps('good_id')
        },
        {
            title: 'Примечания',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            ...getColumnSearchProps('notes')
        }
    ];

    return (
        <Card title="История упаковки">
            <Table
                scroll={{ x: 'max-content' }}
                columns={columns}
                dataSource={history}
                rowKey="id"
                loading={loading}
                pagination={pagination}
            />
        </Card>
    );
}; 