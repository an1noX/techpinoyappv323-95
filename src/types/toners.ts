
export interface TonerType {
  id: string;
  name: string;
  manufacturer: string;
  description?: string;
  price: number;
  type: "toner" | "ink" | "drum";
  stock?: number;
  imageUrl?: string;
  brand?: string;
}

export interface EnhancedTonerType extends TonerType {
  category: string;
  quantityInStock: number;
}
