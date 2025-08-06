export interface ProductSet {
  id: string;
  name: string;
  description?: string;
  sku: string;
  created_at: string;
  updated_at: string;
}

export interface ProductSetItem {
  id: string;
  product_set_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    color?: string;
    category: string;
  };
}

export interface ProductSetWithItems extends ProductSet {
  items: ProductSetItem[];
}

export interface CreateProductSetData {
  name: string;
  description?: string;
  sku: string;
  productIds: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateProductSetData {
  name?: string;
  description?: string;
  sku?: string;
  productIds?: Array<{
    productId: string;
    quantity: number;
  }>;
}