import React from "react";
import { Create, useForm } from "@refinedev/antd";
import {Col, Form, Input, Select, notification} from "antd";
import InputMask from "react-input-mask";
import {useSelect} from "@refinedev/antd";

export const CounterpartyCreate: React.FC = () => {
    const { formProps, saveButtonProps } = useForm({
        errorNotification: false,
        onMutationError: (error: any) => {
            console.error("Mutation error:", error);
            
            // Проверяем, есть ли информация об ошибке в ответе
            if (error?.response?.data?.message) {
                const errorMessage = error.response.data.message;
                
                // Обрабатываем конкретную ошибку о дублирующемся номере телефона
                if (errorMessage.includes("уже существует") || errorMessage.includes("already exists")) {
                    notification.error({
                        message: "Ошибка создания контрагента",
                        description: "Контрагент с таким номером телефона уже существует. Пожалуйста, используйте другой номер телефона.",
                        duration: 5,
                    });
                } else {
                    notification.error({
                        message: "Ошибка создания контрагента",
                        description: errorMessage,
                        duration: 5,
                    });
                }
            } else {
                notification.error({
                    message: "Ошибка создания контрагента",
                    description: "Произошла неизвестная ошибка. Пожалуйста, попробуйте еще раз.",
                    duration: 5,
                });
            }
        },
    });

    const { selectProps: branchSelectProps } = useSelect({
        resource: "branch",
        optionLabel:"name"
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                {/* Код клиента */}
                <Form.Item
                    label="Код клиента"
                    name="code"
                    rules={[{ required: true, message: "Укажите код клиента" }]}
                >
                    <Input />
                </Form.Item>

                {/* Имя */}
                <Form.Item
                    label="Имя"
                    name="name"
                    rules={[{ required: true, message: "Укажите имя" }]}
                >
                    <Input />
                </Form.Item>

                {/* Номер телефона */}
                <Form.Item
                    label="Номер телефона"
                    name="phoneNumber"
                    rules={[{ required: true, message: "Введите номер телефона" }]}
                >
                    <InputMask mask="+7 (999) 999-99-99" maskChar="_">
                        {(inputProps: any) => <Input {...inputProps} />}
                    </InputMask>
                </Form.Item>

                {/* Почта */}
                <Form.Item
                    label="Почта"
                    name="email"
                    rules={[{ type: "email", message: "Неверный формат email" }]}
                >
                    <InputMask mask="****@****.**" maskChar="">
                        {(inputProps: any) => <Input {...inputProps} />}
                    </InputMask>
                </Form.Item>


                <Col span={6}>
                    <Form.Item
                        name="branch_id"
                        label="Пунк назначения"
                        rules={[{ required: true, message: "Введите Пунк назначения" }]}
                    >
                        <Select {...branchSelectProps}  />
                    </Form.Item>
                </Col>

                {/* Сумма заказов */}
                <Form.Item
                    label="Сумма заказов"
                    name="totalOrders"
                >
                    <Input type="number" />
                </Form.Item>

                {/* Комментарий */}
                <Form.Item
                    label="Комментарий"
                    name="comment"
                >
                    <Input.TextArea rows={4} />
                </Form.Item>
            </Form>
        </Create>
    );
};
