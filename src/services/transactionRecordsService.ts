import { supabase } from '@/integrations/supabase/client';

export interface CreateTransactionRecordData {
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
}

export const transactionRecordsService = {
  async createTransactionRecord(data: CreateTransactionRecordData) {
    const { data: record, error } = await supabase
      .from('transaction_records')
      .insert({
        status: data.status,
        date: data.date,
        type: data.type,
        customer: data.customer,
        model: data.model,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total_price: data.total_price,
        sales_invoice_number: data.sales_invoice_number,
        delivery_receipt_number: data.delivery_receipt_number,
        purchase_order_number: data.purchase_order_number,
        notes: data.notes,
        product_id: data.product_id,
        purchase_order_id: data.purchase_order_id,
        delivery_id: data.delivery_id,
        supplier_client_id: data.supplier_client_id,
      })
      .select()
      .single();

    if (error) throw error;
    return record;
  },

  async createMultipleTransactionRecords(records: CreateTransactionRecordData[]) {
    const { data, error } = await supabase
      .from('transaction_records')
      .insert(records)
      .select();

    if (error) throw error;
    return data;
  }
};