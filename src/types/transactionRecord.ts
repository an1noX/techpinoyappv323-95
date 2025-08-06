export interface TransactionRecord {
  id: string;
  status: string;
  date: string;
  type: 'purchase_order' | 'sales_invoice' | 'delivery_receipt';
  customer?: string;
  model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sales_invoice_number?: string;
  delivery_receipt_number?: string;
  purchase_order_number?: string;
  notes?: string;
  product_id?: string;
  purchase_order_id?: string;
  delivery_id?: string;
  supplier_client_id?: number;
  created_at: string;
  updated_at: string;
}