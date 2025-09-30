import React from 'react';
import { Card, Table, DatePicker } from 'antd';
import { ITopPacker } from '../interfaces';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface TopPackersProps {
    packers: ITopPacker[];
    loading?: boolean;
    onDateRangeChange?: (dateFrom?: Date, dateTo?: Date) => void;
}

export const TopPackers: React.FC<TopPackersProps> = ({
    packers,
    loading = false,
    onDateRangeChange
}) => {
    const handleDateRangeChange = (dates: any) => {
        if (!onDateRangeChange) return;
        
        if (!dates || !dates[0] || !dates[1]) {
            onDateRangeChange(undefined, undefined);
            return;
        }

        onDateRangeChange(dates[0].toDate(), dates[1].toDate());
    };

    const columns = [
        {
            title: 'Упаковщик',
            dataIndex: 'firstName',
            key: 'name',
            render: (_: string, record: ITopPacker) => `${record.firstName} ${record.lastName}`
        },
        {
            title: 'Всего упаковок',
            dataIndex: 'totalPackings',
            key: 'totalPackings',
            sorter: (a: ITopPacker, b: ITopPacker) => a.totalPackings - b.totalPackings
        },
        {
            title: 'Общий вес (кг)',
            dataIndex: 'totalWeight',
            key: 'totalWeight',
            render: (weight: number) => weight,
            sorter: (a: ITopPacker, b: ITopPacker) => a.totalWeight - b.totalWeight
        },
        {
            title: 'Вес за период (кг)',
            dataIndex: 'periodWeight',
            key: 'periodWeight',
            render: (weight: number) => weight,
            sorter: (a: ITopPacker, b: ITopPacker) => a.periodWeight - b.periodWeight
        },
        {
            title: 'Предметов за период',
            dataIndex: 'periodItems',
            key: 'periodItems',
            sorter: (a: ITopPacker, b: ITopPacker) => a.periodItems - b.periodItems
        }
    ];

    return (
        <Card title="Топ упаковщиков">
            {onDateRangeChange && (
                <div style={{ marginBottom: 16 }}>
                    <RangePicker onChange={handleDateRangeChange} />
                </div>
            )}
            <Table
                columns={columns}
                dataSource={packers}
                rowKey="packerId"
                loading={loading}
            />
        </Card>
    );
}; 