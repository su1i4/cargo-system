import React from 'react';
import { Form, InputNumber, Input, Button, Card } from 'antd';
import { IAddPackingHistoryDto } from '../interfaces';

interface AddPackingHistoryFormProps {
    packerId: number;
    onSubmit: (values: IAddPackingHistoryDto) => void;
    loading?: boolean;
}

export const AddPackingHistoryForm: React.FC<AddPackingHistoryFormProps> = ({
    packerId,
    onSubmit,
    loading = false
}) => {
    const [form] = Form.useForm();

    const handleSubmit = (values: any) => {
        onSubmit({
            packerId,
            packedWeight: values.packedWeight,
            packedItemsCount: values.packedItemsCount,
            goodId: values.goodId,
            notes: values.notes
        });
        form.resetFields();
    };

    return (
        <Card title="Добавить запись">
            <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
            >
                <Form.Item
                    label="Вес (кг)"
                    name="packedWeight"
                    rules={[
                        { required: true, message: 'Пожалуйста, введите вес' },
                        { type: 'number', min: 0, message: 'Вес должен быть положительным числом' }
                    ]}
                >
                    <InputNumber style={{ width: '100%' }} precision={2} />
                </Form.Item>

                <Form.Item
                    label="Количество предметов"
                    name="packedItemsCount"
                    rules={[
                        { required: true, message: 'Пожалуйста, введите количество предметов' },
                        { type: 'number', min: 1, message: 'Количество должно быть положительным числом' }
                    ]}
                >
                    <InputNumber style={{ width: '100%' }} precision={0} />
                </Form.Item>

                <Form.Item
                    label="ID товара"
                    name="goodId"
                >
                    <InputNumber style={{ width: '100%' }} precision={0} />
                </Form.Item>

                <Form.Item
                    label="Примечания"
                    name="notes"
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Добавить
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}; 