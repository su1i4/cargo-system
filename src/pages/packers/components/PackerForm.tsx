import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { IPacker } from '../interfaces';

interface PackerFormProps {
    initialValues?: IPacker;
    onSubmit: (values: Partial<IPacker>) => void;
    loading?: boolean;
}

export const PackerForm: React.FC<PackerFormProps> = ({
    initialValues,
    onSubmit,
    loading = false
}) => {
    const [form] = Form.useForm();

    return (
        <Card title={initialValues ? "Редактирование упаковщика" : "Создание упаковщика"}>
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={onSubmit}
            >
                <Form.Item
                    name="first_name"
                    label="Имя"
                    rules={[
                        { required: true, message: 'Пожалуйста, введите имя' },
                        { min: 2, message: 'Имя должно содержать минимум 2 символа' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="last_name"
                    label="Фамилия"
                    rules={[
                        { required: true, message: 'Пожалуйста, введите фамилию' },
                        { min: 2, message: 'Фамилия должна содержать минимум 2 символа' }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {initialValues ? "Сохранить" : "Создать"}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}; 