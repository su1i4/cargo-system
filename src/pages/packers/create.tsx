import React from 'react';
import { useCreate, useNavigation } from '@refinedev/core';
import { message } from 'antd';
import { PackerForm } from './components/PackerForm';
import { IPacker } from './interfaces';

export const PackerCreate: React.FC = () => {
    const { mutate, isLoading } = useCreate();
    const { goBack } = useNavigation();

    const handleSubmit = async (values: Partial<IPacker>) => {
        try {
            await mutate({
                resource: 'packers',
                values: {
                    ...values,
                    weight_amount: 0 // Начальное значение для нового упаковщика
                }
            });
            message.success('Упаковщик успешно создан');
            goBack();
        } catch (error) {
            message.error('Произошла ошибка при создании упаковщика');
        }
    };

    return (
        <PackerForm
            onSubmit={handleSubmit}
            loading={isLoading}
        />
    );
}; 