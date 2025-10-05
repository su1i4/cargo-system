import { List, useTable } from "@refinedev/antd";
import { Card, Row, Col, Button, Flex, message, Tooltip } from "antd";
import { type BaseRecord, useNavigation } from "@refinedev/core";
import { EditOutlined, SwapOutlined, SyncOutlined } from "@ant-design/icons";
import Title from "antd/lib/typography/Title";
import { useState } from "react";
import { BankTransferModal } from "../../components/bank-transfer-modal";
import { CurrencyConvertModal } from "../../components/currency-convert-modal";

interface IBank extends BaseRecord {
  name?: string;
  balance_som?: number;
  balance_rub?: number;
  balance_usd?: number;
}

export const BankList = () => {
  const { tableProps, tableQueryResult } = useTable<IBank>({
    syncWithLocation: false,
    pagination: {
      pageSize: 50,
    },
  });

  const role = localStorage.getItem("cargo-system-role");
  const { dataSource } = tableProps;
  const { show, push } = useNavigation();

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<number | undefined>();
  const [selectedBankName, setSelectedBankName] = useState<
    string | undefined
  >();

  const handleTransferClick = (bankId: number) => {
    setSelectedBankId(bankId);
    setTransferModalVisible(true);
  };

  const handleConvertClick = (bankId: number, bankName: string) => {
    setSelectedBankId(bankId);
    setSelectedBankName(bankName);
    setConvertModalVisible(true);
  };

  const handleTransferSuccess = async () => {
    message.success("Заявка на перевод создана");
    await tableQueryResult.refetch();
  };

  const handleConvertSuccess = async () => {
    message.success("Конвертация успешно выполнена");
    await tableQueryResult.refetch();
  };

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
                  <Flex gap={8}>
                    <Tooltip title="Создать заявку на перевод">
                      <SwapOutlined
                        onClick={() => handleTransferClick(bank.id as number)}
                        style={{ fontSize: "18px", cursor: "pointer" }}
                      />
                    </Tooltip>
                    {role === "admin" && (
                      <>
                        <Tooltip title="Конвертация валюты">
                          <SyncOutlined
                            onClick={() =>
                              handleConvertClick(
                                bank.id as number,
                                bank.name as string
                              )
                            }
                            style={{ fontSize: "18px", cursor: "pointer" }}
                          />
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Редактировать">
                      <EditOutlined
                        onClick={() => {
                          push(`/bank/edit/${bank.id}`);
                        }}
                      />
                    </Tooltip>
                  </Flex>
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

      <BankTransferModal
        visible={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onSuccess={handleTransferSuccess}
        fromBankId={selectedBankId}
      />

      <CurrencyConvertModal
        open={convertModalVisible}
        onClose={() => setConvertModalVisible(false)}
        bankId={selectedBankId}
        bankName={selectedBankName}
        onSuccess={handleConvertSuccess}
      />
    </List>
  );
};
