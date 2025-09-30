import React, { useState, useEffect } from 'react';
import { useShow, useApiUrl, useResource } from '@refinedev/core';
import { Row, Col, message } from 'antd';
import axios from 'axios';

import { PackerStatistics } from './components/PackerStatistics';
import { PackerHistory } from './components/PackerHistory';
import { AddPackingHistoryForm } from './components/AddPackingHistoryForm';
import { IPackerStatistics, IPackerHistory, IAddPackingHistoryDto } from './interfaces';

export const PackerShow: React.FC = () => {
    const { id: resourceId } = useResource();
    const id = resourceId?.toString();
    const apiUrl = useApiUrl();
    const { queryResult } = useShow();

    const [statistics, setStatistics] = useState<IPackerStatistics>();
    const [history, setHistory] = useState<IPackerHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/packers/${id}/statistics`, {
                params: {
                    dateFrom: dateRange.from?.toISOString(),
                    dateTo: dateRange.to?.toISOString()
                }
            });
            setStatistics(response.data);
        } catch (error) {
            message.error('Ошибка при загрузке статистики');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/packers/${id}/history`, {
                params: {
                    limit: pagination.pageSize,
                    offset: (pagination.current - 1) * pagination.pageSize
                }
            });
            // Если данные приходят как массив, обрабатываем их соответственно
            const historyData = Array.isArray(response.data) ? response.data : response.data.data;
            setHistory(historyData);
            // Если общее количество не приходит, используем длину массива
            const totalCount = response.data.total || historyData.length;
            setPagination(prev => ({ ...prev, total: totalCount }));
        } catch (error) {
            message.error('Ошибка при загрузке истории');
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (from?: Date, to?: Date) => {
        setDateRange({ from, to });
    };

    const handlePaginationChange = (page: number, pageSize: number) => {
        setPagination(prev => ({ ...prev, current: page, pageSize }));
    };

    const handleAddHistory = async (values: IAddPackingHistoryDto) => {
        try {
            setLoading(true);
            await axios.post(`${apiUrl}/packers/history`, values);
            message.success('Запись добавлена успешно');
            fetchStatistics();
            fetchHistory();
        } catch (error) {
            message.error('Ошибка при добавлении записи');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchStatistics();
        }
    }, [id, dateRange]);

    useEffect(() => {
        if (id) {
            fetchHistory();
        }
    }, [id, pagination.current, pagination.pageSize]);

    if (queryResult?.isLoading) {
        return <div>Загрузка...</div>;
    }

    if (queryResult?.isError) {
        return <div>Ошибка</div>;
    }

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                {statistics && (
                    <PackerStatistics
                        statistics={statistics}
                        onDateRangeChange={handleDateRangeChange}
                        loading={loading}
                    />
                )}
            </Col>
            <Col span={24}>
                <PackerHistory
                    history={history}
                    loading={loading}
                    pagination={{
                        total: pagination.total,
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        onChange: handlePaginationChange
                    }}
                />
            </Col>
            {/* <Col span={8}>
                <AddPackingHistoryForm
                    packerId={Number(id)}
                    onSubmit={handleAddHistory}
                    loading={loading}
                />
            </Col> */}
        </Row>
    );
}; 