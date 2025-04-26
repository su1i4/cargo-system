import React from "react";
import { Create, useForm } from "@refinedev/antd";
import {Col, Form, Input, Select} from "antd";
import InputMask from "react-input-mask";
import {useSelect} from "@refinedev/antd";
export const CounterpartyCreate: React.FC = () => {
    const { formProps, saveButtonProps } = useForm({

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
