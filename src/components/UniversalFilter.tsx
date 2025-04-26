import React from "react";
import { Form, Input, Button, DatePicker, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface UniversalFilterProps {
    setFilters: (filters: any[]) => void;
    branchOptions?: { label: string; value: string | number }[];
}

const UniversalFilter: React.FC<UniversalFilterProps> = ({
                                                             setFilters,
                                                             branchOptions,
                                                         }) => {
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        const filters = [];

        if (values.search) {
            filters.push({
                field: "trackCode",
                operator: "contains",
                value: values.search,
            });
        }

        if (values.branch && values.branch.length) {
            filters.push({
                field: "branch_id",
                operator: "in",
                value: values.branch,
            });
        }

        if (values.dateRange) {
            filters.push({
                field: "created_at",
                operator: "gte",
                value: dayjs(values.dateRange[0]).format("YYYY-MM-DD"),
            });
            filters.push({
                field: "created_at",
                operator: "lte",
                value: dayjs(values.dateRange[1]).format("YYYY-MM-DD"),
            });
        }

        setFilters(filters);
    };

    return (
        <Form form={form} layout="inline" onFinish={onFinish}>
            <Form.Item name="search">
                <Input
                    placeholder="Поиск по трек-коду или коду клиента"
                    prefix={<SearchOutlined />}
                />
            </Form.Item>
            <Form.Item name="branch">
                <Select
                    mode="multiple"
                    placeholder="Выберите филиал"
                    style={{ width: 200 }}
                    options={
                        branchOptions || [
                            { label: "Гуанчжоу", value: "guangzhou" },
                            { label: "Бишкек", value: "bishkek" },
                            { label: "Ош", value: "osh" },
                        ]
                    }
                />
            </Form.Item>
            <Form.Item name="dateRange">
                <DatePicker.RangePicker placeholder={["Начальная дата", "Конечная дата"]} />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Применить
                </Button>
            </Form.Item>
        </Form>
    );
};

export default UniversalFilter;
