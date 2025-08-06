
export interface PurchaseOrder {
  id: string;
  supplier_client_id?: string;
  supplier_name?: string;
  client_po?: string;
  purchase_order_number?: string; // Add missing field for compatibility
  status: 'pending' | 'partial' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  expected_delivery_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  isFromTransaction?: boolean; // Add for distinguishing transaction-based items
}

export interface Delivery {
  id: string;
  purchase_order_id?: string;
  client_id?: string;
  delivery_date: string;
  delivery_receipt_number?: string;
  notes?: string;
  created_at: string;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id?: string;
  quantity_delivered: number;
  created_at: string;
}

export interface CreatePurchaseOrderData {
  supplier_client_id?: string;
  supplier_name?: string;
  client_po?: string; // Add client_po field
  po_date?: string; // Add po_date field
  status?: 'pending' | 'partial' | 'completed';
  payment_status?: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  expected_delivery_date?: string;
  due_date?: string;
  items: CreatePurchaseOrderItemData[];
}

export interface CreatePurchaseOrderItemData {
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

export interface CreateDeliveryData {
  purchase_order_id?: string;
  client_id?: string;
  delivery_date: string;
  delivery_receipt_number?: string;
  notes?: string;
  items: CreateDeliveryItemData[];
}

export interface CreateDeliveryItemData {
  product_id?: string;
  quantity_delivered: number;
}

// Enhanced PO with calculated fields
export interface PurchaseOrderWithDetails extends PurchaseOrder {
  items?: PurchaseOrderItem[];
  purchase_order_items?: PurchaseOrderItem[];
  deliveries?: Delivery[];
  total_ordered?: number;
  total_delivered?: number;
  completion_percentage?: number;
  remaining_items?: number;
}
