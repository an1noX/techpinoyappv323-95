export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  purpose?: 'warranty' | 'replacement' | 'demo' | null;
}

export interface DeliveryReceipt {
  id: string;
  drNumber: string;
  date: string;
  items: LineItem[];
  totalAmount: number;
  status: 'unfulfilled' | 'partial' | 'fulfilled';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  items: LineItem[];
  totalAmount: number;
  vendor?: string;
}

export interface Fulfillment {
  id: string;
  drId: string;
  drItemId: string;
  poId: string;
  poItemId: string;
  fulfilledQuantity: number;
  date: string;
}

export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface ItemFulfillmentSummary {
  drItemId: string;
  requiredQuantity: number;
  fulfilledQuantity: number;
  status: FulfillmentStatus;
  fulfillments: Fulfillment[];
}