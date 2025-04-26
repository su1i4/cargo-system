import React, { useEffect, useState } from "react";
import { useModalForm, useSelect } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { Form, Input, Modal, Select } from "antd";

export const MyCreateModal: React.FC<{ open: boolean; onClose: () => void }> = ({
                                                                                    open,
                                                                                    onClose,
                                                                                }) => {
    const { modalProps, formProps, submit } = useModalForm({
        resource: "cash-back",
        action: "create",
        onMutationSuccess: () => {
            onClose(); // Закрываем модальное окно после успешного создания
        },

    });

    const { selectProps: counterpartySelectProps } = useSelect({
        resource: "counterparty",
        optionLabel: "code",
    });

    // Сохраняем выбранный id клиента
    const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string | null>(
        null
    );

    // Получаем данные клиента по выбранному id с помощью useOne
    const {
        data: counterpartyData,
        isLoading: isCounterpartyLoading,
        isError: isCounterpartyError,
    } = useOne({
        resource: "counterparty",
        id: selectedCounterpartyId ?? "",
        queryOptions: {
            enabled: !!selectedCounterpartyId, // Хук активен только если выбран id
        },
    });

    // При получении данных обновляем поле "Имя" в форме
    useEffect(() => {
        if (counterpartyData && counterpartyData.data) {
            // @ts-ignore
            formProps.form.setFieldsValue({
                name: counterpartyData.data.name, // Предполагается, что данные клиента содержат поле name
            });
        }
    }, [counterpartyData, formProps.form]);

    // Обработчик выбора клиента в Select
    const handleCounterpartyChange = (value: any) => {
        setSelectedCounterpartyId(value);
    };


    return (
        <Modal
            {...modalProps}
            title={<h2 style={{ margin: 0 }}>Добавить кешбек</h2>}
            onOk={submit}
            open={open}
            onCancel={onClose}
            cancelButtonProps={{ style: { display: "none" } }}
            // okButtonProps={{ style: { backgroundColor: "#52c41a" } }}
            width={483}
            okText="Добавить"
            // Пример стилизации "шапки" модалки
        >
            <Form
                {...formProps}
                layout="vertical"
                style={{ marginBottom: 0 }}
            >
                <Form.Item
                    label="Код Клиента"
                    name={["counterparty_id"]}
                    rules={[{ required: true, message: "Пожалуйста, выберите клиента" }]}
                    // Настройка отступов между лейблом и инпутом
                    style={{ marginBottom: 16 }}
                >

                    <Select
                        {...counterpartySelectProps}
                        onChange={handleCounterpartyChange}
                        placeholder="Выберите код клиента"
                        style={{ width: "100%" }}/>
                </Form.Item>

                <Form.Item
                    label="Имя"
                    name="name"
                    rules={[{ required: false, message: "Укажите имя" }]}
                    style={{ marginBottom: 16 }}
                >
                    <Input
                        disabled
                        placeholder="Имя клиента будет заполнено автоматически"
                        style={{ backgroundColor: "#f5f5f5" }}
                    />
                </Form.Item>

                <Form.Item
                    label="Сумма"
                    name="amount"
                    rules={[{ required: true, message: "Укажите сумму" }]}
                    style={{ marginBottom: 24 }}
                >
                    <Input
                        placeholder="Введите сумму кешбэка"
                        style={{ width: "100%" }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
