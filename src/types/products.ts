
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  brand: string;
  quantityInStock: number;
  imageUrl?: string;
  clientPricing?: any[];
  manufacturer?: string;
  model?: string;
}
