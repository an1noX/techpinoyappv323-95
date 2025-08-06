import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalesInvoiceForIncome {
  id: string;
  invoice_number: string;
  client_id?: string;
  purchase_order_id?: string;
  total_amount: number;
  invoice_date: string;
  status: string;
  payment_status: string;
  notes?: string;
}

export const useSalesInvoicesForIncome = () => {
  return useQuery({
    queryKey: ['sales-invoices-for-income'],
    queryFn: async (): Promise<SalesInvoiceForIncome[]> => {
      // First get all sales invoices that are not cancelled
      const { data: salesInvoices, error: salesError } = await (supabase as any)
        .from('sales_invoice')
        .select('*')
        .neq('status', 'cancelled')
        .order('invoice_date', { ascending: false });

      if (salesError) throw salesError;

      // Then get income entries that are linked to sales invoices
      const { data: incomeEntries, error: incomeError } = await (supabase as any)
        .from('income_entries')
        .select('sales_invoice_id')
        .not('sales_invoice_id', 'is', null);

      if (incomeError) throw incomeError;

      // Create a set of sales invoice IDs that have already been recorded as income
      const recordedInvoiceIds = new Set(
        incomeEntries?.map((entry: any) => entry.sales_invoice_id) || []
      );

      // Filter out invoices that have already been recorded as income
      const availableInvoices = (salesInvoices || []).filter(
        (invoice: any) => !recordedInvoiceIds.has(invoice.id)
      );

      return availableInvoices.map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        purchase_order_id: invoice.purchase_order_id,
        total_amount: invoice.total_amount || 0,
        invoice_date: invoice.invoice_date,
        status: invoice.status,
        payment_status: invoice.payment_status,
        notes: invoice.notes
      }));
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};