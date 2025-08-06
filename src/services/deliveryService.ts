
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Delivery = any & {
  client?: { 
    id: string; 
    name: string; 
    contact_person?: string; 
    phone?: string; 
    address?: string; 
  } | null;
  purchase_order?: { 
    id: string; 
    supplier_name?: string; 
    supplier_client_id?: string; 
    client_po?: string;
    status?: string;
    payment_status?: string;
    supplier_client?: { id: string; name: string } | null;
  } | null;
  delivery_items?: Array<{
    id: string;
    product_id?: string;
    quantity_delivered: number;
    product?: {
      id: string;
      name: string;
      sku: string;
      category: string;
      color?: string;
      description?: string;
    } | null;
  }> | null;
};
type DeliveryItem = Database['public']['Tables']['delivery_items']['Row'];

export interface DeliveryWithItems extends Delivery {
  delivery_items: DeliveryItem[];
}

export interface CreateDeliveryData {
  purchase_order_id?: string;
  client_id?: string;
  delivery_date: string;
  delivery_receipt_number?: string;
  notes?: string;
  items: Array<{
    product_id?: string;
    quantity_delivered: number;
  }>;
}

export const deliveryService = {
  async getAllDeliveries(): Promise<Delivery[]> {
    console.log('Fetching all deliveries...');
    
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        client:clients!deliveries_client_id_fkey(id, name, contact_person, phone, address),
        purchase_order:purchase_orders!deliveries_purchase_order_id_fkey(
          id, 
          supplier_name, 
          supplier_client_id, 
          client_po,
          status,
          payment_status,
          supplier_client:clients!purchase_orders_supplier_client_id_fkey(id, name)
        ),
        delivery_items(
          id,
          product_id,
          quantity_delivered,
          product:products(id, name, sku, category, color, description)
        )
      `)
      .order('delivery_date', { ascending: false });

    if (error) {
      console.error('Error fetching deliveries:', error);
      throw error;
    }
    
    console.log('Fetched deliveries:', data);
    console.log('Sample delivery with PO data:', data?.[0]);
    
    return data || [];
  },

  async getDeliveryWithItems(id: string): Promise<DeliveryWithItems | null> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        delivery_items (
          *,
          products (
            id,
            name,
            sku,
            category,
            color,
            description
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getDeliveriesByPurchaseOrder(purchaseOrderId: string): Promise<Delivery[]> {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('delivery_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createDelivery(deliveryData: CreateDeliveryData): Promise<Delivery> {
    console.log('Creating delivery with data:', deliveryData);
    
    // Debug authentication context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user context:', {
      user: user ? { id: user.id, email: user.email } : null,
      authError
    });
    
    // Test database connection and permissions
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('deliveries')
        .select('count')
        .limit(1);
      console.log('Database test query result:', { testQuery, testError });
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
    }

    // Try to test direct access and provide helpful debugging
    try {
      const { databaseSetupService } = await import('./databaseSetupService');
      const testResult = await databaseSetupService.testDirectTableAccess();
      console.log('Direct access test result:', testResult);
    } catch (setupError) {
      console.warn('Could not run direct access test:', setupError);
    }
    
    // Create the delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        purchase_order_id: deliveryData.purchase_order_id,
        client_id: deliveryData.client_id,
        delivery_date: deliveryData.delivery_date,
        delivery_receipt_number: deliveryData.delivery_receipt_number,
        notes: deliveryData.notes,
      })
      .select()
      .single();

    if (deliveryError) {
      console.error('Delivery creation error:', deliveryError);
      console.error('Error details:', {
        code: deliveryError.code,
        message: deliveryError.message,
        details: deliveryError.details,
        hint: deliveryError.hint
      });
      throw deliveryError;
    }

    console.log('Delivery created successfully:', delivery);
    
    // Create the delivery items
    if (deliveryData.items && deliveryData.items.length > 0) {
      console.log('Creating delivery items:', deliveryData.items);
      console.log('⚠️ WARNING: Creating bulk delivery_items records. Unit tracking should auto-generate individual units via triggers.');
      
      const items = deliveryData.items.map(item => ({
        delivery_id: delivery.id,
        product_id: item.product_id,
        quantity_delivered: item.quantity_delivered,
      }));

      const { error: itemsError } = await supabase
        .from('delivery_items')
        .insert(items);

      if (itemsError) {
        console.error('Delivery items creation error:', itemsError);
        throw itemsError;
      }
      
      console.log('Delivery items created successfully - triggers should now create individual delivery_item_units');
      
      // Debug: Check if units were actually created
      for (const item of items) {
        const { data: unitsCheck } = await supabase
          .from('delivery_item_units')
          .select('*')
          .eq('delivery_item_id', delivery.id);
        console.log(`Units created for delivery ${delivery.id}:`, unitsCheck?.length || 0);
      }
    }

    return delivery;
  },

  async getDeliveryById(id: string): Promise<Delivery | null> {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getDeliveryItems(deliveryId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('delivery_items')
      .select('*')
      .eq('delivery_id', deliveryId);

    if (error) throw error;
    return data || [];
  },

  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<Delivery> {
    const { data, error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDelivery(id: string): Promise<void> {
    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async unlinkDeliveryFromPO(deliveryId: string): Promise<any> {
    const { data, error } = await supabase
      .from('deliveries')
      .update({ purchase_order_id: null })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAdvanceDeliveriesByClient(clientId: string): Promise<any[]> {
    // Get all deliveries for the client that are either:
    // 1. Completely unlinked (advance deliveries)
    // 2. Linked but potentially have remaining items that could be linked to other POs
    const { data, error } = await (supabase as any)
      .from('deliveries')
      .select(`
        *,
        delivery_items (
          id,
          product_id,
          quantity_delivered,
          product:products(id, name, sku, category, color, description)
        )
      `)
      .eq('client_id', clientId)
      .order('delivery_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async linkAdvanceDeliveryToPO(deliveryId: string, purchaseOrderId: string): Promise<any> {
    const { data, error } = await supabase
      .from('deliveries')
      .update({ purchase_order_id: purchaseOrderId })
      .eq('id', deliveryId)
      .select()
      .single();

    if (error) throw error;

    // Update the purchase order status after linking the delivery
    try {
      const { purchaseOrderService } = await import('./purchaseOrderService');
      await purchaseOrderService.updatePurchaseOrderStatus(purchaseOrderId);
    } catch (statusError) {
      console.error('Error updating PO status after linking delivery:', statusError);
      // Don't throw this error to avoid breaking the linking process
    }

    return data;
  },

  async linkDeliveryItemsToPO(linkItems: Array<{
    deliveryItemId: string;
    poItemId: string;
    linkQuantity: number;
  }>, purchaseOrderId: string): Promise<any> {
    try {
      // Use the proper delivery item link service
      const { deliveryItemLinkService } = await import('./deliveryItemLinkService');
      
      const linkDataArray = linkItems.map(linkItem => ({
        delivery_item_id: linkItem.deliveryItemId,
        purchase_order_item_id: linkItem.poItemId,
        linked_quantity: linkItem.linkQuantity,
      }));

      const results = await deliveryItemLinkService.createMultipleDeliveryItemLinks(linkDataArray);

      // Update the purchase order status after linking items
      try {
        const { purchaseOrderService } = await import('./purchaseOrderService');
        await purchaseOrderService.updatePurchaseOrderStatus(purchaseOrderId);
      } catch (statusError) {
        console.error('Error updating PO status after linking items:', statusError);
      }

      return results;
    } catch (error) {
      console.error('Error linking delivery items to PO:', error);
      throw error;
    }
  },

  async getItemLinksForDelivery(deliveryId: string): Promise<Array<{
    itemId: string;
    linkedToPO: string | null;
    linkedToPOItem: string | null;
    linkedQuantity: number;
    linkedAt: string | null;
  }>> {
    try {
      // Use the proper delivery item link service
      const { deliveryItemLinkService } = await import('./deliveryItemLinkService');
      
      const links = await deliveryItemLinkService.getDeliveryItemLinksByDelivery(deliveryId);
      
      // Transform to the expected format
      return links.map(link => ({
        itemId: link.delivery_item_id || '',
        linkedToPO: link.purchase_order_item?.purchase_order_id || null,
        linkedToPOItem: link.purchase_order_item_id || null,
        linkedQuantity: link.linked_quantity,
        linkedAt: link.created_at || null
      }));
    } catch (error) {
      console.error('Error fetching item links for delivery:', error);
      return [];
    }
  },

  // New method to get all deliveries with their item links
  async getDeliveryWithLinks(deliveryId: string): Promise<any> {
    try {
      const [deliveryData, itemLinks] = await Promise.all([
        this.getDeliveryWithItems(deliveryId),
        import('./deliveryItemLinkService').then(({ deliveryItemLinkService }) => 
          deliveryItemLinkService.getDeliveryItemLinksByDelivery(deliveryId)
        )
      ]);

      return {
        ...deliveryData,
        item_links: itemLinks
      };
    } catch (error) {
      console.error('Error fetching delivery with links:', error);
      throw error;
    }
  },

  // New method to check if a delivery has any item links
  async hasItemLinks(deliveryId: string): Promise<boolean> {
    try {
      const { deliveryItemLinkService } = await import('./deliveryItemLinkService');
      const links = await deliveryItemLinkService.getDeliveryItemLinksByDelivery(deliveryId);
      return links.length > 0;
    } catch (error) {
      console.error('Error checking item links for delivery:', error);
      return false;
    }
  }
};
