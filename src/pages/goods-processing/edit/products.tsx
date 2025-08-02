import { InputNumber, Table } from "antd";
import Title from "antd/es/typography/Title";

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  sum?: number;
  edit?: boolean;
  isSelected?: boolean;
  updated?: boolean;
  is_created?: boolean;
}

interface GoodsProcessingEditProductsProps {
  products: ProductItem[];
  setProducts: (products: ProductItem[]) => void;
  selectedProductKeys: React.Key[];
  setSelectedProductKeys: (keys: React.Key[]) => void;
  branchProducts: any[];
  values: any;
  record: any;
}

export const GoodsProcessingEditProducts = ({
  products,
  setProducts,
  selectedProductKeys,
  setSelectedProductKeys,
  branchProducts,
  values,
  record,
}: GoodsProcessingEditProductsProps) => {
  
  const isProductAvailableForBranch = (product: ProductItem): boolean => {
    if (!branchProducts?.length) {
      return true;
    }

    return branchProducts.some(
      (availableProduct: any) =>
        availableProduct.id === product.id ||
        availableProduct.name === product.name
    );
  };

  const updateProductField = (
    id: string | number,
    field: string,
    value: any
  ) => {
    setProducts(
      products.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };

          // Помечаем товар как обновленный, если это не новый товар
          if (!newItem.is_created) {
            newItem.updated = true;
          }

          if (field === "quantity") {
            newItem.sum = value * item.price;
          } else if (field === "price") {
            newItem.sum = value * (item.quantity || 0);
          }

          return newItem;
        }
        return item;
      })
    );
  };

  const lastProducts = [
    {
      quantity: products.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: products.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedProductKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedProductKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: any) => ({
      disabled: !("id" in record) || record.quantity === undefined,
    }),
  };

  return (
    <div style={{ marginTop: 30 }}>
      <Title level={5} style={{ margin: 0 }}>
        Товары
      </Title>
      <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
        Доступны для редактирования товары с разрешением или разрешенные для
        филиала назначения
      </div>
      <Table
        dataSource={[...products, ...lastProducts]}
        style={{ marginTop: 10 }}
        rowKey="id"
        pagination={false}
        rowSelection={rowSelection}
      >
        <Table.Column
          title="№"
          dataIndex="id"
          width={50}
          render={(value, record: any, index: number) =>
            index < products.length && <span>{index + 1}</span>
          }
        />
        <Table.Column
          title="Наименование"
          dataIndex="name"
          render={(value, record: any, index: number) => (
            index < products.length && (
              <span style={{ color: record.updated ? '#1890ff' : 'inherit' }}>
                {value}
                {record.updated && ' (изменено)'}
                {record.is_created && ' (новый)'}
              </span>
            )
          )}
        />
        <Table.Column
          title="Количество"
          dataIndex="quantity"
          render={(value, record: any, index: number) => (
            <InputNumber
              style={{ 
                width: 100,
                backgroundColor: record.updated ? '#f6ffed' : 'inherit'
              }}
              min={0}
              value={value}
              onChange={(val) =>
                updateProductField(record.id, "quantity", val)
              }
              disabled={
                index >= products.length ||
                (!record.edit && !isProductAvailableForBranch(record))
              }
            />
          )}
        />
        <Table.Column
          title="Цена"
          dataIndex="price"
          render={(value, record: any, index: number) =>
            index < products.length && (
              <InputNumber
                style={{ 
                  width: 100,
                  backgroundColor: record.updated ? '#f6ffed' : 'inherit'
                }}
                min={0}
                precision={2}
                value={value}
                disabled={!record.edit}
                onChange={(val) =>
                  updateProductField(record.id, "price", val)
                }
              />
            )
          }
        />
        <Table.Column
          title="Сумма"
          dataIndex="sum"
          render={(value, record: any, index: number) => (
            <InputNumber
              style={{ 
                width: 100,
                backgroundColor: record.updated ? '#f6ffed' : 'inherit'
              }}
              min={0}
              precision={2}
              value={value}
              disabled
            />
          )}
        />
      </Table>
    </div>
  );
}; 