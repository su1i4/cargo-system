export interface GoodItem {
    id: number;
    nomenclature_id?: string;
    country?: string;
    type_id?: string;
    type_name?: string;
    tariff?: number;
    quantity?: number;
    weight?: number;
    price?: number;
    sum?: number;
    barcode: string;
    bag_number_numeric?: string;
    is_price_editable?: boolean;
    individual_discount?: number;
    discount_id?: number | null;
  }
  
  export interface ProductItem {
    id: string | number;
    name: string;
    price: number;
    quantity?: number;
    sum?: number;
    edit?: boolean;
    isSelected?: boolean;
  }
  
  export interface TariffItem {
    id: number;
    branch_id: number;
    product_type_id: number;
    tariff: string;
    product_type: {
      id: number;
      name: string;
      tariff: string;
    };
    branch: {
      id: number;
      name: string;
      tarif: string;
      prefix: string;
      visible: boolean;
    };
  }
  
  export interface CashBackItem {
    id: number;
    amount: number;
    counterparty_id: number;
    counterparty: {
      id: number;
      name: string;
      clientPrefix: string;
      clientCode: string;
    };
  }
  
  export interface DiscountOrCashBackItem {
    id: string;
    counter_party_id: number;
    counter_party: {
      id: number;
      name: string;
      clientPrefix: string;
      clientCode: string;
    };
    discount: number;
    destination_id: number;
    product_type_id: number;
  }