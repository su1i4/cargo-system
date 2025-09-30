import React from 'react';
import { useUpdate, useNavigation, useOne } from '@refinedev/core';
import { message } from 'antd';
import { PackerForm } from './components/PackerForm';
import { IPacker } from './interfaces';

export const PackerEdit: React.FC = () => {
    const { mutate, isLoading: isUpdating } = useUpdate();
    const { goBack } = useNavigation();
    const { data, isLoading: isFetching } = useOne<IPacker>({
        resource: 'packers',
        id: window.location.pathname.split('/').pop() || '',
    });

    const handleSubmit = async (values: Partial<IPacker>) => {
        if (!data?.data.id) return;

        try {
            await mutate({
                resource: 'packers',
                id: data.data.id,
                values: {
                    ...values,
                    weight_amount: data.data.weight_amount // Сохраняем текущее значение веса
                }
            });
            message.success('Упаковщик успешно обновлен');
            goBack();
        } catch (error) {
            message.error('Произошла ошибка при обновлении упаковщика');
        }
    };

    if (isFetching) {
        return <div>Загрузка...</div>;
    }

    return (
        <PackerForm
            initialValues={data?.data}
            onSubmit={handleSubmit}
            loading={isUpdating}
        />
    );
}; 