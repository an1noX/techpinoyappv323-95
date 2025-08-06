
export interface PriceHistoryEntry {
  price: number;
  timestamp: Date;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  price: number;
  lastUpdated: Date;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  priceHistory: PriceHistoryEntry[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  suppliers: Supplier[];
}
