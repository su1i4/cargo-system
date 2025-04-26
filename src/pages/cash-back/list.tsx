import React, { useState } from "react";
import { List, useTable } from "@refinedev/antd";
import {Space, Table, Form, Input, Button, Row, Col, Select} from "antd";
import {BaseKey} from "@refinedev/core";
import { MyCreateModal } from "./modal/create-modal";
import {
    FileAddOutlined,
    SearchOutlined, SyncOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import {MyEditModal} from "./modal/edit-modal";

export const CashBackList: React.FC = () => {
    const { tableProps, setFilters } = useTable({
        resource: "cash-back",
        syncWithLocation: false,
    });

    const [open, setOpen] = useState(false);

    // @ts-ignore
    return (
        <List headerButtons={() => null}>
            {/* Передаем open и setOpen в модальное окно */}
            {/* <MyCreateModal open={open} onClose={() => setOpen(false)} /> */}
            {/*<MyEditModal id={editId} open={openEdit} onClose={() => setOpenEdit(false)} />*/}

            {/* Верхняя панель с фильтром и кнопкой создания */}
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Space size="middle">
                        <Button
                            icon={<FileAddOutlined />}
                            style={{}}
                            onClick={() => setOpen(true)}
                        />

                        {/*<Button icon={<EditOutlined />} onClick={handleBulkEdit} />*/}
                        <Button icon={<UnorderedListOutlined />} />
                        {/*<Dropdown*/}
                        {/*    overlay={sortContent}*/}
                        {/*    trigger={['click']}*/}
                        {/*    placement="bottomLeft"*/}
                        {/*    visible={sortVisible}*/}
                        {/*    onVisibleChange={(visible) => {*/}
                        {/*        setSortVisible(visible);*/}
                        {/*        if (visible) {*/}
                        {/*            setFilterVisible(true);*/}
                        {/*        }*/}
                        {/*    }}*/}
                        {/*>*/}
                        {/*    <Button*/}
                        {/*        icon={sortDirection === 'asc' ?*/}
                        {/*            <ArrowUpOutlined /> :*/}
                        {/*            <ArrowDownOutlined />*/}
                        {/*        }*/}
                        {/*    />*/}
                        {/*</Dropdown>*/}
                        <Button icon={<SyncOutlined />} />
                    </Space>
                </Col>
                <Col flex="auto">
                    <Input
                        placeholder="Поиск по трек-коду или коду клиента"
                        prefix={<SearchOutlined />}
                        onChange={(e) => {
                            setFilters([
                                {
                                    field: "trackCode",
                                    operator: "contains",
                                    value: e.target.value,
                                },
                            ]);
                        }}
                    />
                </Col>
                <Col>
                    <Select
                        mode="multiple"
                        placeholder="Выберите филиал"
                        style={{ width: 200 }}
                        onChange={(value) => {
                            setFilters([
                                {
                                    field: "branch",
                                    operator: "in",
                                    value,
                                },
                            ]);
                        }}
                        options={[
                            { label: 'Гуанчжоу', value: 'guangzhou' },
                            { label: 'Бишкек', value: 'bishkek' },
                            { label: 'Ош', value: 'osh' },
                        ]}
                    />
                </Col>
                <Col>
                    {/*<Dropdown*/}
                    {/*    overlay={}*/}
                    {/*    trigger={['click']}*/}
                    {/*    placement="bottomRight"*/}
                    {/*>*/}
                    {/*    <Button*/}
                    {/*        icon={<CalendarOutlined />}*/}
                    {/*        className="date-picker-button"*/}
                    {/*    >*/}
                    {/*        Дата*/}
                    {/*    </Button>*/}
                    {/*</Dropdown>*/}
                </Col>
            </Row>

            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column
                    dataIndex="counterparty"
                    title="Код клиента"
                    render={(counterparty) => counterparty ? counterparty.code : ""}
                />

                <Table.Column
                    dataIndex="counterparty"
                    title="Имя"
                    render={(counterparty) => counterparty ? counterparty.name : ""}
                />

                <Table.Column
                    dataIndex="counterparty"
                    title="Телефон"
                    render={(counterparty) => counterparty ? counterparty.name : ""}
                />

                <Table.Column dataIndex="amount" title="Сумма" />


            </Table>
        </List>
    );
};
