import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Col, Row, Typography, Tag, Space } from "antd";

const { Title } = Typography;

export const BranchNomenclatureShow = () => {
  const { queryResult } = useShow({});
  const { data, isLoading } = queryResult;

  const record = data?.data;

  return (
    <Show
      headerButtons={() => null}
      isLoading={isLoading}
      title="Товары филиала"
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Title level={5}>Филиал</Title>
          <TextField value={record?.destination?.name || "Не указан"} />
        </Col>
        <Col span={12}>
          <Title level={5}>ID филиала</Title>
          <TextField value={record?.destination_id || "Не указан"} />
        </Col>
        <Col span={24}>
          <Title level={5}>Типы продуктов</Title>
          <div>
            {record?.product_types && Array.isArray(record.product_types) ? (
              <Space wrap>
                {record.product_types.map((product: any, index: number) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 8 }}>
                    {typeof product === "object"
                      ? `${product.name} (${product.tariff || 0} за кг)`
                      : `ID: ${product}`}
                  </Tag>
                ))}
              </Space>
            ) : (
              <span>Типы продуктов не указаны</span>
            )}
          </div>
        </Col>
      </Row>
    </Show>
  );
};
