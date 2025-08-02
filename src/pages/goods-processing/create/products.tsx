import React, { useCallback, useMemo } from "react";
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
}

interface GoodsProcessingCreateProductsProps {
  products: ProductItem[];
  setProducts: (products: ProductItem[]) => void;
  branchProducts: any[];
  values: any;
}

export const GoodsProcessingCreateProducts = React.memo(({
  products,
  setProducts,
  branchProducts,
  values,
}: GoodsProcessingCreateProductsProps) => {
  
  // Мемоизированная функция проверки доступности продукта для филиала
  const isProductAvailableForBranch = useCallback((product: ProductItem): boolean => {
    if (!branchProducts?.length) {
      return false;
    }

    return branchProducts.some(
      (availableProduct: any) =>
        availableProduct.id === product.id ||
        availableProduct.name === product.name
    );
  }, [branchProducts]);

  // Мемоизированная функция обновления поля продукта
  const updateProductField = useCallback((
    id: string | number,
    field: string,
    value: any
  ) => {
    setProducts(
      products.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };

          if (field === "quantity") {
            newItem.sum = Number(value || 0) * Number(item.price || 0);
          } else if (field === "price") {
            newItem.sum = Number(value || 0) * Number(item.quantity || 0);
          }

          return newItem;
        }
        return item;
      })
    );
  }, [products, setProducts]);

  // Мемоизированное вычисление итогов
  const lastProducts = useMemo(() => [
    {
      id: 'total',
      quantity: products.reduce(
        (acc, item) => acc + Number(item.quantity || 0),
        0
      ),
      sum: products.reduce((acc, item) => acc + Number(item.sum || 0), 0),
    },
  ], [products]);

  // Мемоизированные данные таблицы
  const tableData = useMemo(() => [...products, ...lastProducts], [products, lastProducts]);

  // Мемоизированные колонки таблицы
  const columns = useMemo(() => [
    {
      title: "№",
      dataIndex: "id",
      width: 50,
      render: (value: any, record: any, index: number) =>
        index < products.length ? <span>{index + 1}</span> : null,
    },
    {
      title: "Наименование",
      dataIndex: "name",
      render: (value: string, record: any, index: number) =>
        index < products.length ? <span>{value}</span> : null,
    },
    {
      title: "Количество",
      dataIndex: "quantity",
      render: (value: number, record: any, index: number) => (
        <InputNumber
          style={{ width: 100 }}
          min={0}
          value={value}
          onChange={(val) => updateProductField(record.id, "quantity", val)}
          disabled={
            index >= products.length ||
            (!record.edit && !isProductAvailableForBranch(record))
          }
        />
      ),
    },
    {
      title: "Цена",
      dataIndex: "price",
      render: (value: number, record: any, index: number) =>
        index < products.length ? (
          <InputNumber
            style={{ width: 100 }}
            min={0}
            precision={2}
            value={value}
            disabled={!record.edit}
            onChange={(val) => updateProductField(record.id, "price", val)}
          />
        ) : null,
    },
    {
      title: "Сумма",
      dataIndex: "sum",
      render: (value: number) => (
        <InputNumber
          style={{ width: 100 }}
          min={0}
          precision={2}
          value={value}
          disabled
        />
      ),
    },
  ], [products.length, updateProductField, isProductAvailableForBranch]);

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
        dataSource={tableData}
        columns={columns}
        style={{ marginTop: 10 }}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
});

// Добавляем displayName для лучшей отладки
GoodsProcessingCreateProducts.displayName = 'GoodsProcessingCreateProducts';
