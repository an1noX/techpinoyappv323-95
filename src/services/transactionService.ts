import { supabase } from '@/integrations/supabase/client';

export interface TransactionRecord {
  id: string;
  status: string;
  date: string;
  type: string;
  customer?: string;
  model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sales_invoice_number?: string;
  delivery_receipt_number?: string;
  purchase_order_number?: string;
  purchase_order_id?: string;
  delivery_id?: string;
  product_id?: string;
  supplier_client_id?: number;
  purpose?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRecord {
  type: 'sale' | 'purchase' | 'delivery' | 'return';
  date: string;
  customer?: string | null;
  model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  purchase_order_id?: string | null;
  purchase_order_number?: string | null;
  delivery_id?: string | null;
  delivery_receipt_number?: string | null;
  sales_invoice_number?: string | null;
  product_id?: string | null;
  supplier_client_id?: number | null;
  notes?: string | null;
}

export interface TransactionPaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
}

export interface PaginatedTransactionResponse {
  records: TransactionRecord[];
  total: number;
  hasMore: boolean;
  nextPage: number | null;
}

export const transactionService = {
  async getAllTransactions(): Promise<TransactionRecord[]> {
    // Get purchase order items with related data
    const { data: poItems, error: poError } = await supabase
      .from('purchase_order_items')
      .select(`
        *,
        purchase_order:purchase_orders!purchase_order_items_purchase_order_id_fkey(
          id, 
          status, 
          supplier_name, 
          client_po,
          purchase_order_number,
          supplier_client_id,
          supplier_client:clients!purchase_orders_supplier_client_id_fkey(
            id,
            name,
            contact_person,
            phone,
            address
          )
        ),
        product:products!purchase_order_items_product_id_fkey(
          id,
          name,
          sku
        )
      `)
      .order('created_at', { ascending: false });

    if (poError) throw poError;

    // Get delivery receipts for the purchase orders
    const purchaseOrderIds = poItems?.map(item => item.purchase_order_id).filter(Boolean) || [];
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('id, purchase_order_id, delivery_receipt_number')
      .in('purchase_order_id', purchaseOrderIds);

    // Create a map of delivery receipts by purchase order ID
    const deliveryMap = new Map();
    deliveries?.forEach(delivery => {
      deliveryMap.set(delivery.purchase_order_id, delivery.delivery_receipt_number);
    });
    
    // Transform the data to match TransactionRecord interface
    return (poItems || []).map(item => {
      const productName = item.product?.name || item.model || 'Unknown Product';
      const productSku = item.product?.sku || '';
      const formattedProduct = productSku ? `${productName} (${productSku})` : productName;
      
      // Get client name with fallback hierarchy
      let clientName = 'Unknown Client';
      if (item.purchase_order?.supplier_client?.name) {
        clientName = item.purchase_order.supplier_client.name;
      } else if (item.purchase_order?.supplier_name) {
        clientName = item.purchase_order.supplier_name;
      }
      
      return {
        id: item.id,
        status: item.purchase_order?.status || 'pending',
        date: item.created_at,
        type: 'purchase_order',
        customer: clientName,
        model: formattedProduct,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price || (item.unit_price * item.quantity),
        sales_invoice_number: null, // Not available in this table structure
        delivery_receipt_number: deliveryMap.get(item.purchase_order_id) || null,
        purchase_order_number: item.purchase_order?.client_po || item.purchase_order?.id,
        notes: null,
        product_id: item.product_id,
        purchase_order_id: item.purchase_order_id,
        delivery_id: null,
        supplier_client_id: null,
        created_at: item.created_at,
        updated_at: item.created_at
      };
    });
  },

  async getPaginatedTransactions(options: TransactionPaginationOptions = {}): Promise<PaginatedTransactionResponse> {
    const { page = 0, pageSize = 50, offset = 0 } = options;
    const actualOffset = page > 0 ? page * pageSize : offset;

    try {
      // First, get the total count for pagination info
      const { count: totalCount, error: countError } = await supabase
        .from('purchase_order_items')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get paginated purchase order items with related data
      const { data: poItems, error: poError } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          purchase_order:purchase_orders!purchase_order_items_purchase_order_id_fkey(
            id, 
            status, 
            supplier_name, 
            client_po,
            purchase_order_number,
            supplier_client_id,
            supplier_client:clients!purchase_orders_supplier_client_id_fkey(
              id,
              name,
              contact_person,
              phone,
              address
            )
          ),
          product:products!purchase_order_items_product_id_fkey(
            id,
            name,
            sku
          )
        `)
        .order('created_at', { ascending: false })
        .range(actualOffset, actualOffset + pageSize - 1);

      if (poError) throw poError;

      // Get delivery receipts for the purchase orders
      const purchaseOrderIds = poItems?.map(item => item.purchase_order_id).filter(Boolean) || [];
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('id, purchase_order_id, delivery_receipt_number')
        .in('purchase_order_id', purchaseOrderIds);

      // Create a map of delivery receipts by purchase order ID
      const deliveryMap = new Map();
      deliveries?.forEach(delivery => {
        deliveryMap.set(delivery.purchase_order_id, delivery.delivery_receipt_number);
      });

      // Get delivery items for purpose data (use type assertion for compatibility)
      const deliveryIds = deliveries?.map(d => d.id).filter(Boolean) || [];
      const { data: deliveryItems } = await (supabase as any)
        .from('delivery_items')
        .select('delivery_id, purpose')
        .in('delivery_id', deliveryIds);

      // Create purpose map from delivery items
      const purposeMap = new Map();
      if (deliveryItems) {
        const deliveryItemsByDeliveryId = new Map();
        deliveryItems.forEach((item: any) => {
          if (!deliveryItemsByDeliveryId.has(item.delivery_id)) {
            deliveryItemsByDeliveryId.set(item.delivery_id, []);
          }
          deliveryItemsByDeliveryId.get(item.delivery_id).push(item);
        });

        // Map delivery items purpose back to purchase orders
        deliveries?.forEach(delivery => {
          const items = deliveryItemsByDeliveryId.get(delivery.id) || [];
          const purposeItem = items.find((item: any) => item.purpose && item.purpose.trim() !== '');
          if (purposeItem?.purpose) {
            purposeMap.set(delivery.purchase_order_id, purposeItem.purpose);
          }
        });
      }
      
      // Transform the data to match TransactionRecord interface
      const records = (poItems || []).map(item => {
        const productName = item.product?.name || item.model || 'Unknown Product';
        const productSku = item.product?.sku || '';
        const formattedProduct = productSku ? `${productName} (${productSku})` : productName;
        
        // Get client name with fallback hierarchy
        let clientName = 'Unknown Client';
        if (item.purchase_order?.supplier_client?.name) {
          clientName = item.purchase_order.supplier_client.name;
        } else if (item.purchase_order?.supplier_name) {
          clientName = item.purchase_order.supplier_name;
        }
        
        return {
          id: item.id,
          status: item.purchase_order?.status || 'pending',
          date: item.created_at,
          type: 'purchase_order',
          customer: clientName,
          model: formattedProduct,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price || (item.unit_price * item.quantity),
          sales_invoice_number: null, // Not available in this table structure
          delivery_receipt_number: deliveryMap.get(item.purchase_order_id) || null,
          purchase_order_number: item.purchase_order?.client_po || item.purchase_order?.id,
          purpose: purposeMap.get(item.purchase_order_id) || null,
          notes: null,
          product_id: item.product_id,
          purchase_order_id: item.purchase_order_id,
          delivery_id: null,
          supplier_client_id: null,
          created_at: item.created_at,
          updated_at: item.created_at
        };
      });

      const total = totalCount || 0;
      const hasMore = actualOffset + pageSize < total;
      const nextPage = hasMore ? page + 1 : null;

      return {
        records,
        total,
        hasMore,
        nextPage
      };
    } catch (error) {
      console.error('Error fetching paginated transactions:', error);
      throw error;
    }
  },

  async getTransactionsByPurchaseOrder(purchaseOrderNumber: string): Promise<TransactionRecord[]> {
    const { data, error } = await supabase
      .from('transaction_records')
      .select(`
        *,
        purchase_order:purchase_orders!fk_transaction_purchase_order(id, status, supplier_name, client_po),
        delivery:deliveries!fk_transaction_delivery(id, delivery_date, delivery_receipt_number)
      `)
      .eq('purchase_order_number', purchaseOrderNumber)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTransactionsByDelivery(deliveryId: string): Promise<TransactionRecord[]> {
    const { data, error } = await supabase
      .from('transaction_records')
      .select(`
        *,
        purchase_order:purchase_orders!fk_transaction_purchase_order(id, status, supplier_name, client_po),
        delivery:deliveries!fk_transaction_delivery(id, delivery_date, delivery_receipt_number)
      `)
      .eq('delivery_id', deliveryId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: CreateTransactionRecord): Promise<TransactionRecord> {
    const { data, error } = await supabase
      .from('transaction_records')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(id: string, updates: Partial<CreateTransactionRecord>): Promise<TransactionRecord> {
    const { data, error } = await supabase
      .from('transaction_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async importFromExcel(transactions: CreateTransactionRecord[]): Promise<TransactionRecord[]> {
    const { data, error } = await supabase
      .from('transaction_records')
      .insert(transactions)
      .select();

    if (error) throw error;
    return data || [];
  },

  async linkTransactionToPurchaseOrder(transactionId: string, purchaseOrderId: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_records')
      .update({ purchase_order_id: purchaseOrderId })
      .eq('id', transactionId);

    if (error) throw error;
  },

  async linkTransactionToDelivery(transactionId: string, deliveryId: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_records')
      .update({ delivery_id: deliveryId })
      .eq('id', transactionId);

    if (error) throw error;
  },

  // Get sales data consistency view
  async getSalesDataConsistency(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sales_data_consistency')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTransactionFromOrder(orderData: {
    type: 'sale' | 'purchase';
    orderId: string;
    clientName: string;
    items: Array<{
      productId?: string;
      model: string;
      quantity: number;
      unitPrice: number;
    }>;
    orderNumbers: {
      po?: string;
      dr?: string;
      invoice?: string;
    };
    date: string;
    status: string;
    supplierClientId?: string;
  }): Promise<TransactionRecord[]> {
    const transactions: CreateTransactionRecord[] = orderData.items.map(item => ({
      type: orderData.type,
      date: orderData.date,
      customer: orderData.clientName,
      model: item.model,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      status: orderData.status,
      purchase_order_id: orderData.orderId,
      purchase_order_number: orderData.orderNumbers.po,
      delivery_receipt_number: orderData.orderNumbers.dr,
      sales_invoice_number: orderData.orderNumbers.invoice,
      product_id: item.productId,
      supplier_client_id: orderData.supplierClientId ? parseInt(orderData.supplierClientId) : null,
      notes: `Auto-generated from ${orderData.type} order`
    }));

    const results: TransactionRecord[] = [];
    for (const transaction of transactions) {
      const result = await this.createTransaction(transaction);
      results.push(result);
    }

    return results;
  },

  async getAllDeliveryItems(): Promise<TransactionRecord[]> {
    // Use delivery_items table → join deliveries table → join clients table directly using client_id
    // Note: Using type assertion as client_id exists in self-hosted database but not in auto-generated types
    const { data: deliveryItems, error } = await (supabase as any)
      .from('delivery_items')
      .select(`
        *,
        delivery:deliveries!delivery_items_delivery_id_fkey(
          id,
          delivery_date,
          delivery_receipt_number,
          purchase_order_id,
          client_id,
          notes,
          client:clients!deliveries_client_id_fkey(
            id,
            name,
            contact_person
          )
        ),
        product:products!delivery_items_product_id_fkey(
          id,
          name,
          sku
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get pricing information for all items - first from P.O., then fallback to product_clients
    const deliveryItemsWithPricing = await Promise.all((deliveryItems || []).map(async (item) => {
      const productName = item.product?.name || 'Unknown Product';
      const productSku = item.product?.sku || '';
      const formattedProduct = productSku ? `${productName} (${productSku})` : productName;
      
      // Get client name directly from deliveries table client_id relationship
      const clientName = item.delivery?.client?.name || 'Unknown Client';
      
      // Fetch pricing - first try from linked P.O., then fallback to product_clients
      let unitPrice = 0;
      
      // 1. Try to get pricing from purchase order items (primary source)
      if (item.delivery?.purchase_order_id && item.product_id) {
        const { data: poItem } = await supabase
          .from('purchase_order_items')
          .select('unit_price')
          .eq('purchase_order_id', item.delivery.purchase_order_id)
          .eq('product_id', item.product_id)
          .single();
        
        if (poItem?.unit_price) {
          unitPrice = poItem.unit_price;
        }
      }
      
      // 2. Fallback to product_clients table if no P.O. pricing found
      if (unitPrice === 0 && item.product_id && item.delivery?.client_id) {
        const { data: productClient } = await supabase
          .from('product_clients')
          .select('quoted_price')
          .eq('product_id', item.product_id)
          .eq('client_id', item.delivery.client_id)
          .single();
        
        unitPrice = productClient?.quoted_price || 0;
      }
      
      const totalPrice = unitPrice * item.quantity_delivered;
      
      return {
        id: item.id,
        status: 'delivered',
        date: item.delivery?.delivery_date || item.created_at,
        type: 'delivery_receipt',
        customer: clientName,
        model: formattedProduct,
        quantity: item.quantity_delivered,
        unit_price: unitPrice,
        total_price: totalPrice,
        sales_invoice_number: null, // Not available in this table structure
        delivery_receipt_number: item.delivery?.delivery_receipt_number,
        purchase_order_number: null,
        purpose: item.purpose || null, // Add purpose field from delivery_items table
        notes: item.delivery?.notes,
        product_id: item.product_id,
        purchase_order_id: item.delivery?.purchase_order_id,
        delivery_id: item.delivery_id,
        supplier_client_id: item.delivery?.client_id ? parseInt(item.delivery.client_id) : null,
        created_at: item.created_at,
        updated_at: item.created_at
      };
    }));

    return deliveryItemsWithPricing;
  }
};
