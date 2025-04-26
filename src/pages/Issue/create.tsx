import {Create, useForm, useSelect} from "@refinedev/antd";
import {Form, Input, InputNumber, Select, DatePicker, Upload, Row, Col} from "antd";
import {API_URL} from "../../App";


const entityFields = [
    { name: 'trackCode', label: 'Трек-код', type: 'varchar', required: true },

    {
        name: 'cargoType',
        label: 'Тип груза',
        type: 'enum',
        required: true,
        enumValues:[
            "Генеральный груз",
            "Насыпной груз",
            "Навалочный груз",
            "Контейнерный груз",
            "Жидкий груз",
            "Газообразный груз",
            "Скоропортящийся груз",
            "Опасный груз",
            "Живой груз",
            "Тяжеловесный груз",
            "Негабаритный груз",
            "Автомобильный груз",
            "Железнодорожный груз",
            "Воздушный груз",
            "Морской груз",
        ]
    },
    {
        name: 'packageType',
        label: 'Вид упаковки',
        type: 'enum',
        required: true,
        enumValues: [
            "Картонная коробка",
            "Пластиковая упаковка",
            "Стеклянная тара",
            "Металлическая банка",
            "Термоусадочная пленка",
            "Деревянный ящик",
            "Блистерная упаковка",
            "Фольгированная упаковка",
            "Вакуумная упаковка",
            "Бумажный пакет",
            "Тканевый мешок",
            "Пузырчатая упаковка",
            "Тетра Пак",
            "Пластиковая бутылка",
            "Стеклянная бутылка",
        ]
    },


    { name: 'weight', label: 'Вес', type: 'decimal', required: true },
    { name: 'comments', label: 'Комментарии', type: 'text', required: true },
];


export const GoodsCreate = () => {
    const { formProps, saveButtonProps } = useForm({});

    const { selectProps: branchSelectProps } = useSelect({
        resource: "branch",
        optionLabel:"name"
    });

    const { selectProps: counterpartySelectProps } = useSelect({
        resource: "counterparty",
        optionLabel:"name"
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="horizontal">
                <Row gutter={16}> {/* Добавляем отступы между колонками */}
                    {entityFields.map((field, index) => (
                        <Col span={8} key={field.name}> {/* Разбиваем строку на 3 части (24 / 8 = 3) */}
                            <Form.Item
                                label={field.label}
                                name={field.name}
                                rules={field.required ? [{ required: true }] : []}
                            >
                                {field.type === 'varchar' || field.type === 'text' ? (
                                    <Input />
                                ) : field.type === 'decimal' ? (
                                    <InputNumber style={{ width: '100%' }} />
                                ) : field.type === 'enum' ? (
                                    <Select
                                        // @ts-ignore
                                        options={field?.enumValues.map(enumValue => ({
                                            label: enumValue,
                                            value: enumValue,
                                        }))}
                                    />
                                ) : field.type === 'date' || field.type === 'timestamp' ? (
                                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" showTime />
                                ) : (
                                    <Input />
                                )}
                            </Form.Item>
                        </Col>
                    ))}
                    {/*<Col span={8} >*/}
                    {/*    <Form.Item*/}
                    {/*        label={"Филиал"}*/}
                    {/*        name={["branch_id"]}*/}
                    {/*        rules={[*/}
                    {/*            {*/}
                    {/*                required: true,*/}
                    {/*            },*/}
                    {/*        ]}*/}
                    {/*    >*/}
                    {/*    <Select {...branchSelectProps}  />*/}
                    {/*    </Form.Item>*/}
                    {/*</Col>*/}

                    <Col span={8} >
                        <Form.Item
                            label={"Код Клиента"}
                            name={["counterparty_id"]}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Select {...counterpartySelectProps}  />
                        </Form.Item>
                    </Col>

                </Row>



                {/* Поле загрузки фото - на отдельной строке */}
                <Row>
                    <Col span={24}>
                        <Form.Item label="Фото">
                            <Form.Item
                                name="photo"
                                noStyle
                            >
                                <Upload.Dragger
                                    name="file"
                                    action={`${API_URL}/file-upload`}
                                    listType="picture"
                                    accept=".png,.jpg,.jpeg"
                                >
                                    <p className="ant-upload-text">Загрузите Фото</p>
                                </Upload.Dragger>
                            </Form.Item>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Create>
    );
};