import React, { useState, useEffect } from 'react';
import { useApiUrl } from '@refinedev/core';
import { message } from 'antd';
import axios from 'axios';

import { TopPackers } from './components/TopPackers';
import { ITopPacker } from './interfaces';

export const PackersTop: React.FC = () => {
    const apiUrl = useApiUrl();
    const [packers, setPackers] = useState<ITopPacker[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

    const fetchTopPackers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiUrl}/packers/top-packers`, {
                params: {
                    dateFrom: dateRange.from?.toISOString(),
                    dateTo: dateRange.to?.toISOString(),
                    limit: 10
                }
            });
            setPackers(response.data);
        } catch (error) {
            message.error('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (from?: Date, to?: Date) => {
        setDateRange({ from, to });
    };

    useEffect(() => {
        fetchTopPackers();
    }, [dateRange]);

    return (
        <TopPackers
            packers={packers}
            loading={loading}
            onDateRangeChange={handleDateRangeChange}
        />
    );
}; 