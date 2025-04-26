import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker } from "antd";

const ReceivingEdit = () => {
    const { formProps, saveButtonProps, formLoading } = useForm({});

    return (
        <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label={"Номер рейса"}
                    name={["flightNumber"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Пункт назначения"}
                    name={["destination"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
             
                <Form.Item
                    label={"Сумма"}
                    name={["amount"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Код коробки"}
                    name={["boxCode"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Место погрузки"}
                    name={["loadingPlace"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Количество мест"}
                    name={["numberOfSeats"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Вес"}
                    name={["weight"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Куб"}
                    name={["cube"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Сотрудник"}
                    name={["employee"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Тип"}
                    name={["type"]}
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Edit>
    );
};

export default ReceivingEdit;