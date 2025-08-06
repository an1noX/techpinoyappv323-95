
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  color?: string;
  alias?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  contact_email?: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionRecord {
  id: string;
  type: string;
  date: string;
  model: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  notes?: string;
  supplier_client_id?: string;
  customer?: string;
  purchase_order_number?: string;
  delivery_receipt_number?: string;
  sales_invoice_number?: string;
  // Enhanced with PO relationships
  purchase_order_id?: string;
  delivery_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  status: string;
  date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  requested_by?: string;
  requested_by_position?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryReceiptItem {
  id: string;
  delivery_receipt_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface DeliveryReceipt {
  id: string;
  dr_number: string;
  client_id: string;
  date: string;
  status: 'draft' | 'confirmed' | 'delivered';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  items: SaleItem[];
  totalAmount: number;
  status: 'pending' | 'delivered' | 'paid' | 'cancelled';
  saleDate: Date;
  deliveryDate?: Date;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
