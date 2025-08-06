
export interface CustomerType {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  activeRentals: number;
  company: string;
}

export interface TonerType {
  id: string;
  name: string;
  manufacturer: string;
  description?: string;
  price?: number;
  type: "toner" | "ink" | "drum";
  stock?: number;
  imageUrl?: string;
  brand?: string;
  model?: string;
  compatibility?: string[];
  clientPricing?: ClientPriceType[];
}

export interface ClientPriceType {
  id: string;
  productId: string;
  clientId: string;
  clientName: string;
  price: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  effectiveDate: string;
}
