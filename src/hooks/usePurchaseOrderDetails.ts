import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PurchaseOrderDetail {
  id: string;
  purchase_order_number: string;
  supplier_name: string;
  status: string;
  payment_status: string;
  sale_invoice_number?: string;
  total_amount: number;
  after_tax: number;
  created_at: string;
  client_po: string;
  items: {
    id: string;
    product_name: string;
    model: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export const usePurchaseOrderDetails = (paymentStatus?: 'paid' | 'unpaid') => {
  return useQuery({
    queryKey: ['purchaseOrderDetails', paymentStatus],
    queryFn: async (): Promise<PurchaseOrderDetail[]> => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          id,
          purchase_order_number,
          supplier_name,
          status,
          payment_status,
          sale_invoice_number,
          client_po,
          po_date,
          created_at,
          total_amount,
          after_tax,
          purchase_order_items(
            id,
            model,
            quantity,
            unit_price,
            total_price,
            product:products(
              name,
              sku
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (paymentStatus) {
        if (paymentStatus === 'paid') {
          query = query.eq('payment_status', 'paid');
        } else if (paymentStatus === 'unpaid') {
          query = query.neq('payment_status', 'paid').neq('payment_status', 'completed');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching purchase orders:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.map((po: any) => ({
        id: po.id,
        purchase_order_number: po.purchase_order_number || `PO-${po.id.slice(0, 8)}`,
        supplier_name: po.supplier_name || 'Unknown Supplier',
        status: po.status || 'draft',
        payment_status: po.payment_status || 'unpaid',
        sale_invoice_number: po.sale_invoice_number || null,
        client_po: po.client_po || '',
        created_at: po.po_date || po.created_at || '',
        total_amount: po.total_amount || po.purchase_order_items?.reduce((sum: number, item: any) => {
          return sum + (Number(item.total_price) || (Number(item.unit_price) * Number(item.quantity)));
        }, 0) || 0,
        after_tax: po.after_tax || 0,
        items: po.purchase_order_items?.map((item: any) => ({
          id: item.id, // Include item ID for fulfillment matching
          product_name: item.product?.name || item.model || 'Unknown Product',
          model: item.model || '',
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || (Number(item.unit_price) * Number(item.quantity))
        })) || []
      }));
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};