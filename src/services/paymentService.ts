import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { calculateTaxes } from '@/utils/taxCalculation';

// For now, we'll use a simplified approach using purchase_orders table
// with sale_invoice_number and add payment tracking in the notes field
export interface PaymentInfo {
  invoiceNumber: string;
  amount: number;
  date: string;
  paymentMethod?: string;
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

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

export const paymentService = {
  // Parse payment data from notes field (JSON format)
  parsePaymentsFromNotes(notes: string | null): PaymentInfo[] {
    if (!notes) return [];
    
    try {
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed.payments)) {
        return parsed.payments;
      }
    } catch (e) {
      // If notes is not JSON or doesn't have payments, return empty
    }
    return [];
  },

  // Format payments to notes field
  formatPaymentsToNotes(payments: PaymentInfo[], originalNotes?: string): string {
    const notesObj: any = { payments };
    
    // Preserve any existing non-payment notes
    if (originalNotes) {
      try {
        const existing = JSON.parse(originalNotes);
        if (existing.notes) {
          notesObj.notes = existing.notes;
        }
      } catch (e) {
        // If original notes is plain text, preserve it
        if (!originalNotes.startsWith('{')) {
          notesObj.notes = originalNotes;
        }
      }
    }
    
    return JSON.stringify(notesObj);
  },

  async markAsPaid(id: string, saleInvoiceNumber: string, amount?: number): Promise<PurchaseOrder> {
    // Get current PO data with product information
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity,
          unit_price,
          product_id,
          products (
            id,
            name,
            sku,
            color
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!po) throw new Error('Purchase order not found');

    // Calculate tax-adjusted total amount using same logic as getPaymentSummary
    const summary = await this.getPaymentSummary(id);
    const totalDue = summary.total_due;

    const paymentAmount = amount || totalDue;
    
    // Get existing payments
    const existingPayments = this.parsePaymentsFromNotes(po.notes);
    
    // Check if invoice number already exists
    if (existingPayments.some(p => p.invoiceNumber === saleInvoiceNumber.trim())) {
      throw new Error('This sale invoice number is already used');
    }
    
    // Add new payment
    const newPayment: PaymentInfo = {
      invoiceNumber: saleInvoiceNumber.trim(),
      amount: paymentAmount,
      date: new Date().toISOString()
    };
    
    const updatedPayments = [...existingPayments, newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Determine payment status
    let payment_status: string;
    if (totalPaid >= totalDue - 0.01) { // Allow small rounding differences
      payment_status = 'paid';
    } else if (totalPaid > 0) {
      payment_status = 'partial';
    } else {
      payment_status = 'unpaid';
    }

    // Update the purchase order
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        payment_status,
        sale_invoice_number: saleInvoiceNumber.trim(), // Save first invoice number to dedicated column
        notes: this.formatPaymentsToNotes(updatedPayments, po.notes)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentSummary(purchaseOrderId: string): Promise<PaymentSummary> {
    // Get PO data with items and product information
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          id,
          quantity,
          unit_price,
          product_id,
          products (
            id,
            name,
            sku,
            color
          )
        )
      `)
      .eq('id', purchaseOrderId)
      .single();

    if (poError) throw poError;
    if (!po) throw new Error('Purchase order not found');

    // Calculate original subtotal from items (same logic as PurchaseOrdersPage)
    let originalSubtotal = 0;
    if (po.purchase_order_items) {
      try {
        // Get pricing data for each item (same logic as PurchaseOrdersPage)
        const itemsWithPricing = await Promise.all(po.purchase_order_items?.map(async (item: any) => {
          const { data: pricingData } = await supabase
            .from('product_clients')
            .select('quoted_price, margin_percentage')
            .eq('product_id', item.product_id)
            .eq('client_id', po.supplier_client_id)
            .single();
          
          return {
            ...item,
            client_product_pricing: pricingData
          };
        }) || []);

        // Calculate subtotal using the same logic as PurchaseOrdersPage
        originalSubtotal = itemsWithPricing.reduce((sum: number, item: any) => {
          const unitPrice = item.unit_price || item.client_product_pricing?.quoted_price || 0;
          return sum + (unitPrice * item.quantity);
        }, 0);
      } catch (error) {
        console.error('Error getting item pricing data:', error);
        // Fallback to basic calculation
        originalSubtotal = po.purchase_order_items.reduce(
          (sum: any, item: any) => sum + (item.quantity * item.unit_price), 
          0
        );
      }
    }

    // Get client tax information to calculate actual total due
    let total_due = originalSubtotal; // Default to subtotal if no client tax info

    try {
      if (po.supplier_client_id && originalSubtotal > 0) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('tax, wht')
          .eq('id', po.supplier_client_id)
          .single();

        if (clientData) {
          // Use the shared tax calculation utility (same as PurchaseOrdersPage)
          const taxCalculation = calculateTaxes({
            subtotal: originalSubtotal,
            clientTaxInfo: {
              tax: clientData.tax || '12',
              wht: clientData.wht || '0'
            },
            discount: 0, // No discount information available in current data
            withholdingTaxEnabled: false,
            withholdingTaxRate: 0
          });
          
          total_due = taxCalculation.totalAmountDue;
        }
      }
    } catch (error) {
      console.error('Error calculating tax-adjusted total due:', error);
      // Fall back to subtotal if tax calculation fails
    }

    const payments = this.parsePaymentsFromNotes(po.notes);
    const total_paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining_balance = Math.max(0, total_due - total_paid); // Ensure no negative balance
    const is_fully_paid = total_paid >= total_due - 0.01; // Allow for small rounding differences
    const is_partially_paid = total_paid > 0 && !is_fully_paid;

    return {
      total_paid,
      total_due: Math.round(total_due * 100) / 100, // Round to 2 decimal places
      remaining_balance: Math.round(remaining_balance * 100) / 100,
      is_fully_paid,
      is_partially_paid,
      payments
    };
  },

  async addPayment(purchaseOrderId: string, invoiceNumber: string, amount: number, notes?: string, paymentMethod?: string): Promise<void> {
    const summary = await this.getPaymentSummary(purchaseOrderId);
    
    // Check if invoice number already exists
    if (summary.payments.some(p => p.invoiceNumber === invoiceNumber.trim())) {
      throw new Error('This sale invoice number is already used');
    }
    
    // Get current PO
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .single();

    if (fetchError) throw fetchError;
    if (!po) throw new Error('Purchase order not found');
    
    // Add new payment
    const newPayment: PaymentInfo = {
      invoiceNumber: invoiceNumber.trim(),
      amount,
      date: new Date().toISOString(),
      paymentMethod,
      notes
    };
    
    const updatedPayments = [...summary.payments, newPayment];
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Determine payment status
    let payment_status: string;
    if (newTotalPaid >= summary.total_due - 0.01) {
      payment_status = 'paid';
    } else if (newTotalPaid > 0) {
      payment_status = 'partial';
    } else {
      payment_status = 'unpaid';
    }

    // Determine which invoice number should be in sale_invoice_number column (first chronologically)
    const sortedPayments = updatedPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstInvoiceNumber = sortedPayments[0]?.invoiceNumber || null;

    // Update the purchase order
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        payment_status,
        sale_invoice_number: firstInvoiceNumber, // Save first invoice number to dedicated column
        notes: this.formatPaymentsToNotes(updatedPayments, po.notes)
      })
      .eq('id', purchaseOrderId);

    if (error) throw error;
  },

  async removePayment(purchaseOrderId: string, invoiceNumber: string): Promise<void> {
    const summary = await this.getPaymentSummary(purchaseOrderId);
    
    // Get current PO
    const { data: po, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .single();

    if (fetchError) throw fetchError;
    if (!po) throw new Error('Purchase order not found');
    
    // Remove payment
    const updatedPayments = summary.payments.filter(p => p.invoiceNumber !== invoiceNumber);
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Determine payment status
    let payment_status: string;
    if (newTotalPaid >= summary.total_due - 0.01) {
      payment_status = 'paid';
    } else if (newTotalPaid > 0) {
      payment_status = 'partial';
    } else {
      payment_status = 'unpaid';
    }

    // Determine which invoice number should be in sale_invoice_number column (first chronologically)
    const sortedPayments = updatedPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstInvoiceNumber = sortedPayments[0]?.invoiceNumber || null;

    // Update the purchase order
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        payment_status,
        sale_invoice_number: firstInvoiceNumber, // Update first invoice number or set to null if no payments
        notes: this.formatPaymentsToNotes(updatedPayments, po.notes)
      })
      .eq('id', purchaseOrderId);

    if (error) throw error;
  }
};