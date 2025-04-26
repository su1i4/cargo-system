import React from "react";
import { List, useTable } from "@refinedev/antd";
import { Card, Row, Col, Button, Flex } from "antd";
import { type BaseRecord, useNavigation } from "@refinedev/core";
import { EditOutlined, MoneyCollectOutlined } from "@ant-design/icons";
import Title from "antd/lib/typography/Title";

interface IBank extends BaseRecord {
  name?: string;
  balance_som?: number;
  balance_rub?: number;
  balance_usd?: number;
}

export const BankList = () => {
  const { tableProps } = useTable<IBank>({
    syncWithLocation: true,
  });

  const { dataSource } = tableProps;
  const { show, push } = useNavigation();
  return (
    <List>
      <Row gutter={[16, 16]}>
        {dataSource?.map((bank) => (
          <Col key={bank.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              title={
                <Flex
                  align="center"
                  justify="space-between"
                  style={{ height: "100%" }}
                >
                  <Title level={5}>{bank.name}</Title>
                  <EditOutlined
                    onClick={() => {
                      push(`/bank/edit/${bank.id}`);
                    }}
                  />
                </Flex>
              }
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: "16px" }}
            >
              <p>
                <img
                  style={{ width: 20, marginRight: 5, marginBottom: 5 }}
                  src="/balance_som.png"
                  alt="logo"
                />
                <strong>СОМ:</strong> {bank.balance_som}
              </p>
              <p>
                <img
                  style={{ width: 20, marginRight: 5, marginBottom: 5 }}
                  src="/balance_rub.png"
                  alt="logo"
                />
                <strong>Рубль:</strong> {bank.balance_rub}
              </p>
              <p>
                <img
                  style={{ width: 20, marginRight: 5, marginBottom: 5 }}
                  src="/balance_usd.png"
                  alt="logo"
                />
                <strong>USD:</strong> {bank.balance_usd}
              </p>
              <p>
                <img
                  style={{ width: 20, marginRight: 5, marginBottom: 5 }}
                  src="/balance_yen.png"
                  alt="logo"
                />
                <strong>Юань:</strong> {bank.balance_cny}
              </p>

              <Button
                type="primary"
                onClick={() => show("bank", bank.id as number)}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  color: "#fff",
                  marginTop: 16,
                }}
              >
                Посмотреть операции
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </List>
  );
};
