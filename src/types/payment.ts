export interface PaymentInfo {
  invoiceNumber: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  notes?: string;
}

export interface CreatePaymentData {
  purchase_order_id: string;
  sale_invoice_number: string;
  amount: number;
  payment_date?: string;
  notes?: string;
}

export interface PaymentSummary {
  total_paid: number;
  total_due: number;
  remaining_balance: number;
  is_fully_paid: boolean;
  is_partially_paid: boolean;
  payments: PaymentInfo[];
}

// New types for sales_invoice table
export interface SalesInvoice {
  id: string;
  invoice_number: string;
  purchase_order_id?: string;
  client_id?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  net_of_vat: number;
  wht_rate: number;
  withholding_tax: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  payment_mode?: string;
  notes?: string;
  payment_history: PaymentHistoryEntry[];
  client_tax_info: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryEntry {
  date: string;
  amount: number;
  payment_mode?: string;
  notes?: string;
}

export interface CreateSalesInvoiceData {
  invoice_number: string;
  purchase_order_id?: string;
  client_id?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  net_of_vat: number;
  wht_rate: number;
  withholding_tax: number;
  total_amount: number;
  payment_mode?: string;
  notes?: string;
  client_tax_info?: any;
}

export interface AddPaymentToInvoiceData {
  amount: number;
  date: string;
  payment_mode?: string;
  notes?: string;
}