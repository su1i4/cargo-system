import React from "react";
import { useModalForm } from "@refinedev/antd";
import { Form, Input, Modal } from "antd";
import InputMask from "react-input-mask";

export const MyEditModal: React.FC<{ id?: number | null; open: boolean; onClose: () => void }> = ({ id, open, onClose }) => {

    const {
        modalProps,
        formProps,
        submit,
    } = useModalForm({
        resource: "counterparty",
        action: "edit",
        // @ts-ignore
        id, // Передаем ID редактируемого элемента
        onMutationSuccess: () => {
            onClose(); // Закрываем модальное окно после успешного обновления
        },
    });

    return (
        <Modal
            {...modalProps}
            title="Редактировать контрагента"
            onOk={submit}
            open={open} // Управляем открытием через props
            onCancel={onClose} // Закрываем модалку
        >
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label="Код клиента"
                    name="code"
                    rules={[{ required: true, message: "Укажите код клиента" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Имя"
                    name="name"
                    rules={[{ required: true, message: "Укажите имя" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Номер телефона"
                    name="phoneNumber"
                    rules={[{ required: true, message: "Введите номер телефона" }]}
                >
                    <InputMask mask="+7 (999) 999-99-99" maskChar="_">
                        {(inputProps: any) => <Input {...inputProps} />}
                    </InputMask>
                </Form.Item>

                <Form.Item
                    label="Почта"
                    name="email"
                    rules={[{ type: "email", message: "Неверный формат email" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Сумма заказов" name="totalOrders">
                    <Input type="number" />
                </Form.Item>

                <Form.Item label="Комментарий" name="comment">
                    <Input.TextArea rows={4} />
                </Form.Item>
            </Form>
        </Modal>
    );
};
