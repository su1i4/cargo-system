import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import InputMask from "react-input-mask";

export const CounterpartyEdit: React.FC = () => {
    const { formProps, saveButtonProps, formLoading } = useForm();

    return (
        <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
            <Form {...formProps} layout="vertical">
                {/* Код клиента */}
                <Form.Item
                    label="Код клиента"
                    name="code"
                    rules={[{ required: true, message: "Пожалуйста, введите код клиента" }]}
                >
                    <Input />
                </Form.Item>

                {/* Имя */}
                <Form.Item
                    label="Имя"
                    name="name"
                    rules={[{ required: true, message: "Пожалуйста, введите имя" }]}
                >
                    <Input />
                </Form.Item>

                {/* Номер телефона с маской */}
                <Form.Item
                    label="Номер телефона"
                    name="phoneNumber"
                    rules={[{ required: true, message: "Пожалуйста, введите номер телефона" }]}
                >
                    <InputMask mask="+7 (999) 999-99-99" maskChar="_">
                        {(inputProps: any) => <Input {...inputProps} />}
                    </InputMask>
                </Form.Item>

                {/* Email */}
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: "Пожалуйста, введите email" },
                        { type: "email", message: "Неверный формат email" },
                    ]}
                >
                    <Input />
                </Form.Item>

                {/* Сумма заказов */}
                <Form.Item
                    label="Сумма заказов"
                    name="totalOrders"
                    rules={[{ required: true, message: "Пожалуйста, введите сумму заказов" }]}
                >
                    <Input type="number" />
                </Form.Item>

                {/* Комментарий */}
                <Form.Item label="Комментарий" name="comment">
                    <Input.TextArea rows={4} />
                </Form.Item>
            </Form>
        </Edit>
    );
};
