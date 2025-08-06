import { supabase } from '@/integrations/supabase/client';
import { 
  SalesInvoice, 
  CreateSalesInvoiceData, 
  AddPaymentToInvoiceData,
  PaymentHistoryEntry 
} from '@/types/payment';

export const salesInvoiceService = {
  // Create a new sales invoice
  async createSalesInvoice(data: CreateSalesInvoiceData): Promise<SalesInvoice> {
    const { data: invoice, error } = await (supabase as any)
      .from('sales_invoice')
      .insert({
        ...data,
        payment_history: [],
        amount_paid: 0,
        amount_due: data.total_amount
      })
      .select()
      .single();

    if (error) throw error;
    return invoice as SalesInvoice;
  },

  // Get sales invoices for a purchase order
  async getInvoicesForPurchaseOrder(purchaseOrderId: string): Promise<SalesInvoice[]> {
    const { data: invoices, error } = await (supabase as any)
      .from('sales_invoice')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return (invoices || []) as SalesInvoice[];
  },

  // Get a single invoice by ID
  async getInvoiceById(invoiceId: string): Promise<SalesInvoice> {
    const { data: invoice, error } = await (supabase as any)
      .from('sales_invoice')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    return invoice as SalesInvoice;
  },

  // Get a single invoice by invoice number
  async getInvoiceByNumber(invoiceNumber: string): Promise<SalesInvoice | null> {
    const { data: invoice, error } = await (supabase as any)
      .from('sales_invoice')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return invoice as SalesInvoice | null;
  },

  // Add payment to an existing invoice
  async addPaymentToInvoice(
    invoiceId: string, 
    paymentData: AddPaymentToInvoiceData
  ): Promise<SalesInvoice> {
    // Get current invoice
    const currentInvoice = await this.getInvoiceById(invoiceId);
    
    // Update payment history
    const newPaymentHistory: PaymentHistoryEntry[] = [
      ...currentInvoice.payment_history,
      {
        date: paymentData.date,
        amount: paymentData.amount,
        payment_mode: paymentData.payment_mode,
        notes: paymentData.notes
      }
    ];

    // Calculate new amount paid
    const newAmountPaid = currentInvoice.amount_paid + paymentData.amount;

    // Update invoice
    const { data: updatedInvoice, error } = await (supabase as any)
      .from('sales_invoice')
      .update({
        amount_paid: newAmountPaid,
        payment_history: newPaymentHistory
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return updatedInvoice as SalesInvoice;
  },

  // Check if invoice number exists
  async invoiceNumberExists(invoiceNumber: string): Promise<boolean> {
    const { data, error } = await (supabase as any)
      .from('sales_invoice')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error && error.code === 'PGRST116') return false; // Not found
    if (error) throw error;
    return !!data;
  },

  // Get payment summary for a purchase order
  async getPaymentSummaryForPurchaseOrder(purchaseOrderId: string): Promise<{
    total_invoice_amount: number;
    total_paid: number;
    total_due: number;
    invoices: SalesInvoice[];
  }> {
    const invoices = await this.getInvoicesForPurchaseOrder(purchaseOrderId);
    
    const total_invoice_amount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const total_paid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const total_due = total_invoice_amount - total_paid;

    return {
      total_invoice_amount,
      total_paid,
      total_due,
      invoices
    };
  },

  // Update invoice status
  async updateInvoiceStatus(
    invoiceId: string, 
    status: SalesInvoice['status']
  ): Promise<SalesInvoice> {
    const { data: updatedInvoice, error } = await (supabase as any)
      .from('sales_invoice')
      .update({ status })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return updatedInvoice as SalesInvoice;
  },

  // Delete an invoice (only if no payments made)
  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (invoice.amount_paid > 0) {
      throw new Error('Cannot delete invoice with payments');
    }

    const { error } = await (supabase as any)
      .from('sales_invoice')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  }
};