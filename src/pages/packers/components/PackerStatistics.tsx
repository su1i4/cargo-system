import React from 'react';
import { Card, Space, Statistic, DatePicker } from 'antd';
import { IPackerStatistics } from '../interfaces';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface PackerStatisticsProps {
    statistics: IPackerStatistics;
    onDateRangeChange?: (dateFrom?: Date, dateTo?: Date) => void;
    loading?: boolean;
}

export const PackerStatistics: React.FC<PackerStatisticsProps> = ({
    statistics,
    onDateRangeChange,
    loading = false
}) => {
    const handleDateRangeChange = (dates: any) => {
        if (!onDateRangeChange) return;
        
        if (!dates || !dates[0] || !dates[1]) {
            onDateRangeChange(undefined, undefined);
            return;
        }

        onDateRangeChange(dates[0].toDate(), dates[1].toDate());
    };

    return (
        <Card loading={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                    <h2>{`${statistics.firstName} ${statistics.lastName}`}</h2>
                    {onDateRangeChange && (
                        <RangePicker
                            onChange={handleDateRangeChange}
                            style={{ marginBottom: 16 }}
                        />
                    )}
                </div>
                
                <Space size="large">
                    <Statistic
                        title="Общее количество упаковок"
                        value={statistics.totalPackings}
                    />
                    <Statistic
                        title="Общий вес (кг)"
                        value={statistics.totalWeight}
                        precision={2}
                    />
                    <Statistic
                        title="Общее количество предметов"
                        value={statistics.totalItems}
                    />
                </Space>
            </Space>
        </Card>
    );
}; 