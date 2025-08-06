import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];

export interface PurchaseOrderWithItems extends Omit<PurchaseOrder, 'total_amount'> {
  purchase_order_items: PurchaseOrderItem[];
  total_amount?: number; // Add calculated total as optional
}

export interface CreatePurchaseOrderData {
  supplier_name?: string;
  supplier_client_id?: string;
  status?: string;
  payment_status?: string;
  notes?: string;
  client_po?: string;
  po_date?: string;
  expected_delivery_date?: string;
  due_date?: string;
  items: Array<{
    product_id?: string;
    model?: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const purchaseOrderService = {
  async getAllPurchaseOrders(): Promise<any[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calculate total_amount for all orders
    const ordersWithTotal = (data || []).map(order => {
      const calculatedTotal = order.purchase_order_items?.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0
      ) || 0;
      
      return { ...order, total_amount: calculatedTotal };
    });

    return ordersWithTotal;
  },

  async getPurchaseOrderWithItems(id: string): Promise<PurchaseOrderWithItems | null> {
    console.log('🔍 getPurchaseOrderWithItems called for ID:', id);
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_order_items (
          *,
          products (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching PO:', error);
      throw error;
    }
    
    if (data) {
      console.log('✅ Fetched PO data:', {
        id: data.id,
        supplier_client_id: data.supplier_client_id,
        supplier_name: data.supplier_name,
        client_po: data.client_po,
        hasSupplierClientId: !!data.supplier_client_id,
        itemCount: data.purchase_order_items?.length || 0
      });
      
      // Calculate total_amount
      const calculatedTotal = data.purchase_order_items?.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0
      ) || 0;
      
      return { ...data, total_amount: calculatedTotal };
    }
    
    return data;
  },

  async createPurchaseOrder(orderData: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    // Validate PO number uniqueness before creating
    if (orderData.client_po) {
      const { data: existingPO, error: checkError } = await supabase
        .from('purchase_orders')
        .select('id, client_po')
        .eq('client_po', orderData.client_po)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking PO number uniqueness:', checkError);
        throw new Error(`Failed to validate PO number uniqueness: ${checkError.message}`);
      }
      
      if (existingPO && existingPO.length > 0) {
        throw new Error(`PO number ${orderData.client_po} already exists. Cannot create duplicate PO.`);
      }
    }
    
    // Calculate dates
    const expectedDeliveryDate = orderData.expected_delivery_date || 
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 days from now
    
    const dueDate = new Date(new Date(expectedDeliveryDate).getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]; // 30 days from expected delivery date

    // Create the purchase order (without total_amount as it's not in the schema)
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_name: orderData.supplier_name,
        supplier_client_id: orderData.supplier_client_id,
        status: orderData.status || 'pending',
        payment_status: orderData.payment_status || 'unpaid',
        notes: orderData.notes,
        client_po: orderData.client_po,
        po_date: orderData.po_date,
        expected_delivery_date: expectedDeliveryDate,
        due_date: dueDate,
      })
      .select()
      .single();

    if (orderError) {
      // Check if it's a uniqueness constraint violation and provide a clearer error
      if (orderError.code === '23505' && orderError.message.includes('client_po')) {
        throw new Error(`PO number ${orderData.client_po} already exists. This is a database constraint violation.`);
      }
      throw orderError;
    }

    // Create the purchase order items
    if (orderData.items && orderData.items.length > 0) {
      console.log('Creating purchase order items:', orderData.items);
      console.log('⚠️ WARNING: Creating bulk purchase_order_items records. Unit tracking should auto-generate individual units via triggers.');
      
      const items = orderData.items.map(item => ({
        purchase_order_id: order.id,
        product_id: item.product_id,
        model: item.model || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        // total_price is a generated column, don't include it
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items);

      if (itemsError) throw itemsError;
      
      console.log('Purchase order items created successfully - triggers should now create individual purchase_order_item_units');
      
      // Debug: Check if units were actually created (get the item IDs first)
      const { data: createdItems } = await supabase
        .from('purchase_order_items')
        .select('id')
        .eq('purchase_order_id', order.id);
        
      if (createdItems) {
        for (const createdItem of createdItems) {
          const { data: unitsCheck } = await supabase
            .from('purchase_order_item_units')
            .select('*')
            .eq('purchase_order_item_id', createdItem.id);
          console.log(`Units created for item ${createdItem.id}:`, unitsCheck?.length || 0);
        }
      }
    }

    return order;
  },

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePurchaseOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithItems | null> {
    return this.getPurchaseOrderWithItems(id);
  },

  async updatePurchaseOrderStatus(id: string): Promise<void> {
    try {
      // Try to use unit-level tracking first
      let completionPercentage = 0;
      
      try {
        const { unitTrackingService } = await import('./unitTrackingService');
        const reconciliationReport = await unitTrackingService.generateReconciliationReport(id);
        completionPercentage = reconciliationReport.completion_percentage;
        
        console.log('Using unit-level completion tracking:', {
          purchaseOrderId: id,
          completionPercentage,
          totalOrdered: reconciliationReport.total_ordered,
          totalLinked: reconciliationReport.total_linked
        });
      } catch (unitError) {
        console.warn('Unit tracking not available, falling back to item-level tracking:', unitError);
        
        // Fallback to original item-level logic
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            purchase_order_items (*),
            deliveries!deliveries_purchase_order_id_fkey (
              *,
              delivery_items (*)
            )
          `)
          .eq('id', id)
          .single();

        if (poError) throw poError;
        if (!po) return;

        // Calculate delivery status by matching products between PO items and delivery items
        const totalOrdered = po.purchase_order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        
        let totalDelivered = 0;
        if (po.deliveries && po.purchase_order_items) {
          // Match delivery items to purchase order items by product_id
          for (const poItem of po.purchase_order_items) {
            let itemDelivered = 0;
            
            for (const delivery of po.deliveries) {
              if (delivery.delivery_items) {
                const matchingDeliveryItem = delivery.delivery_items.find(
                  (di: any) => di.product_id === poItem.product_id
                );
                if (matchingDeliveryItem) {
                  itemDelivered += matchingDeliveryItem.quantity_delivered;
                }
              }
            }
            
            // Only count delivered quantity up to the ordered quantity for this item
            totalDelivered += Math.min(itemDelivered, poItem.quantity);
          }
        }

        // Calculate completion percentage
        completionPercentage = totalOrdered > 0 ? (totalDelivered / totalOrdered) * 100 : 0;
      }
      
      // Determine new status based on completion percentage
      let newStatus: string;
      if (completionPercentage === 0) {
        newStatus = 'pending';
      } else if (completionPercentage >= 100) {
        newStatus = 'completed';
      } else if (completionPercentage <= 70) {
        newStatus = 'partial';
      } else if (completionPercentage <= 80) {
        newStatus = 'incomplete';
      } else {
        // 81-99% completion - keeping as 'partial' for continuity
        newStatus = 'partial';
      }

      // Get current status to check if update is needed
      const { data: currentPO, error: getCurrentError } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', id)
        .single();

      if (getCurrentError) throw getCurrentError;

      // Update only if status changed
      if (newStatus !== currentPO?.status) {
        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update({ status: newStatus })
          .eq('id', id);

        if (updateError) throw updateError;
        
        console.log(`Updated PO ${id} status from ${currentPO?.status} to ${newStatus} (${completionPercentage.toFixed(1)}% complete)`);
      }
    } catch (error) {
      console.error('Error updating PO status:', error);
      throw error;
    }
  },

  async getDeliveryCompletionStatus(id: string): Promise<{ isCompletelyDelivered: boolean; deliveryPercentage: number }> {
    try {
      // Try to use unit-level tracking first
      try {
        const { unitTrackingService } = await import('./unitTrackingService');
        const reconciliationReport = await unitTrackingService.generateReconciliationReport(id);
        
        const deliveryPercentage = reconciliationReport.completion_percentage;
        const isCompletelyDelivered = deliveryPercentage >= 100;
        
        console.log('Using unit-level delivery completion status:', {
          purchaseOrderId: id,
          deliveryPercentage,
          isCompletelyDelivered
        });
        
        return { isCompletelyDelivered, deliveryPercentage };
      } catch (unitError) {
        console.warn('Unit tracking not available for delivery completion, falling back to item-level tracking:', unitError);
        
        // Fallback to original item-level logic - but track per PO line item
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            purchase_order_items (
              *,
              delivery_item_links (
                *,
                delivery_item:delivery_items (*)
              )
            )
          `)
          .eq('id', id)
          .single();

        if (poError) throw poError;
        if (!po) return { isCompletelyDelivered: false, deliveryPercentage: 0 };

        if (!po.purchase_order_items) {
          return { isCompletelyDelivered: false, deliveryPercentage: 0 };
        }

        let totalPOItems = 0;
        let fullyFulfilledPOItems = 0;
        
        // Check each PO line item individually for fulfillment
        for (const poItem of po.purchase_order_items) {
          totalPOItems++;
          
          // Calculate delivered quantity for this specific PO line item
          let itemDelivered = 0;
          if ((poItem as any).delivery_item_links) {
            for (const link of (poItem as any).delivery_item_links) {
              if (link.delivery_item) {
                itemDelivered += link.delivery_item.quantity_delivered;
              }
            }
          }
          
          // Check if this PO line item is fully fulfilled
          if (itemDelivered >= poItem.quantity) {
            fullyFulfilledPOItems++;
          }
        }

        const deliveryPercentage = totalPOItems > 0 ? (fullyFulfilledPOItems / totalPOItems) * 100 : 0;
        const isCompletelyDelivered = fullyFulfilledPOItems >= totalPOItems && totalPOItems > 0;

        return { isCompletelyDelivered, deliveryPercentage };
      }
    } catch (error) {
      console.error('Error checking delivery completion status:', error);
      return { isCompletelyDelivered: false, deliveryPercentage: 0 };
    }
  }
};
