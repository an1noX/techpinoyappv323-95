import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DeliveryItemLink = Database['public']['Tables']['delivery_item_links']['Row'];
type DeliveryItemLinkInsert = Database['public']['Tables']['delivery_item_links']['Insert'];
type DeliveryItemLinkUpdate = Database['public']['Tables']['delivery_item_links']['Update'];

export interface DeliveryItemLinkWithDetails extends DeliveryItemLink {
  delivery_item?: {
    id: string;
    delivery_id: string;
    product_id: string | null;
    quantity_delivered: number;
    product?: {
      id: string;
      name: string;
      sku: string;
      category: string;
      color?: string;
    } | null;
    delivery?: {
      id: string;
      delivery_receipt_number: string | null;
      delivery_date: string;
    } | null;
  } | null;
  purchase_order_item?: {
    id: string;
    purchase_order_id: string;
    product_id: string | null;
    model: string;
    quantity: number;
    unit_price: number;
    purchase_order?: {
      id: string;
      client_po: string | null;
      supplier_name: string;
    } | null;
  } | null;
}

export interface CreateDeliveryItemLinkData {
  delivery_item_id: string;
  purchase_order_item_id: string;
  linked_quantity: number;
}

export interface DeliveryItemLinkSummary {
  delivery_id: string;
  purchase_order_id: string;
  linked_items_count: number;
  total_linked_quantity: number;
  linked_items: DeliveryItemLinkWithDetails[];
}

export const deliveryItemLinkService = {
  /**
   * Create a new delivery item link
   */
  async createDeliveryItemLink(linkData: CreateDeliveryItemLinkData): Promise<DeliveryItemLink> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .insert({
        delivery_item_id: linkData.delivery_item_id,
        purchase_order_item_id: linkData.purchase_order_item_id,
        linked_quantity: linkData.linked_quantity,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create multiple delivery item links in a transaction
   */
  async createMultipleDeliveryItemLinks(linkDataArray: CreateDeliveryItemLinkData[]): Promise<DeliveryItemLink[]> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .insert(linkDataArray.map(linkData => ({
        delivery_item_id: linkData.delivery_item_id,
        purchase_order_item_id: linkData.purchase_order_item_id,
        linked_quantity: linkData.linked_quantity,
      })))
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all delivery item links for a specific delivery
   */
  async getDeliveryItemLinksByDelivery(deliveryId: string): Promise<DeliveryItemLinkWithDetails[]> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .select(`
        *,
        delivery_item:delivery_items!delivery_item_links_delivery_item_id_fkey(
          id,
          delivery_id,
          product_id,
          quantity_delivered,
          product:products(id, name, sku, category, color),
          delivery:deliveries(id, delivery_receipt_number, delivery_date)
        ),
        purchase_order_item:purchase_order_items!delivery_item_links_purchase_order_item_id_fkey(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price,
          purchase_order:purchase_orders(id, client_po, supplier_name)
        )
      `)
      .eq('delivery_item.delivery_id', deliveryId);

    if (error) throw error;
    return (data || []) as DeliveryItemLinkWithDetails[];
  },

  /**
   * Get all delivery item links for a specific purchase order
   */
  async getDeliveryItemLinksByPurchaseOrder(purchaseOrderId: string): Promise<DeliveryItemLinkWithDetails[]> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .select(`
        *,
        delivery_item:delivery_items!delivery_item_links_delivery_item_id_fkey(
          id,
          delivery_id,
          product_id,
          quantity_delivered,
          product:products(id, name, sku, category, color),
          delivery:deliveries(id, delivery_receipt_number, delivery_date)
        ),
        purchase_order_item:purchase_order_items!delivery_item_links_purchase_order_item_id_fkey(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price,
          purchase_order:purchase_orders(id, client_po, supplier_name)
        )
      `)
      .eq('purchase_order_item.purchase_order_id', purchaseOrderId);

    if (error) throw error;
    return (data || []) as DeliveryItemLinkWithDetails[];
  },

  /**
   * Get delivery item links for a specific delivery item
   */
  async getDeliveryItemLinksByDeliveryItem(deliveryItemId: string): Promise<DeliveryItemLinkWithDetails[]> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .select(`
        *,
        delivery_item:delivery_items!delivery_item_links_delivery_item_id_fkey(
          id,
          delivery_id,
          product_id,
          quantity_delivered,
          product:products(id, name, sku, category, color),
          delivery:deliveries(id, delivery_receipt_number, delivery_date)
        ),
        purchase_order_item:purchase_order_items!delivery_item_links_purchase_order_item_id_fkey(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price,
          purchase_order:purchase_orders(id, client_po, supplier_name)
        )
      `)
      .eq('delivery_item_id', deliveryItemId);

    if (error) throw error;
    return (data || []) as DeliveryItemLinkWithDetails[];
  },

  /**
   * Update a delivery item link
   */
  async updateDeliveryItemLink(id: string, updates: DeliveryItemLinkUpdate): Promise<DeliveryItemLink> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a delivery item link
   */
  async deleteDeliveryItemLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_item_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Delete all delivery item links for a delivery
   */
  async deleteDeliveryItemLinksByDelivery(deliveryId: string): Promise<void> {
    // First get all delivery items for this delivery
    const { data: deliveryItems, error: itemsError } = await supabase
      .from('delivery_items')
      .select('id')
      .eq('delivery_id', deliveryId);

    if (itemsError) throw itemsError;

    if (deliveryItems && deliveryItems.length > 0) {
      const deliveryItemIds = deliveryItems.map(item => item.id);
      
      const { error } = await supabase
        .from('delivery_item_links')
        .delete()
        .in('delivery_item_id', deliveryItemIds);

      if (error) throw error;
    }
  },

  /**
   * Delete all delivery item links for a purchase order
   */
  async deleteDeliveryItemLinksByPurchaseOrder(purchaseOrderId: string): Promise<void> {
    // First get all purchase order items for this PO
    const { data: poItems, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select('id')
      .eq('purchase_order_id', purchaseOrderId);

    if (itemsError) throw itemsError;

    if (poItems && poItems.length > 0) {
      const poItemIds = poItems.map(item => item.id);
      
      const { error } = await supabase
        .from('delivery_item_links')
        .delete()
        .in('purchase_order_item_id', poItemIds);

      if (error) throw error;
    }
  },

  /**
   * Get delivery-to-PO linking summary - which deliveries are linked to which POs
   */
  async getDeliveryToPOLinkSummary(deliveryId?: string, purchaseOrderId?: string): Promise<DeliveryItemLinkSummary[]> {
    let query = supabase
      .from('delivery_item_links')
      .select(`
        *,
        delivery_item:delivery_items!delivery_item_links_delivery_item_id_fkey(
          id,
          delivery_id,
          product_id,
          quantity_delivered,
          product:products(id, name, sku, category, color),
          delivery:deliveries(id, delivery_receipt_number, delivery_date)
        ),
        purchase_order_item:purchase_order_items!delivery_item_links_purchase_order_item_id_fkey(
          id,
          purchase_order_id,
          product_id,
          model,
          quantity,
          unit_price,
          purchase_order:purchase_orders(id, client_po, supplier_name)
        )
      `);

    if (deliveryId) {
      query = query.eq('delivery_item.delivery_id', deliveryId);
    }
    if (purchaseOrderId) {
      query = query.eq('purchase_order_item.purchase_order_id', purchaseOrderId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by delivery_id and purchase_order_id
    const linkMap = new Map<string, DeliveryItemLinkWithDetails[]>();
    (data || []).forEach((link: DeliveryItemLinkWithDetails) => {
      const deliveryId = link.delivery_item?.delivery_id;
      const purchaseOrderId = link.purchase_order_item?.purchase_order_id;
      if (deliveryId && purchaseOrderId) {
        const key = `${deliveryId}-${purchaseOrderId}`;
        if (!linkMap.has(key)) {
          linkMap.set(key, []);
        }
        linkMap.get(key)!.push(link);
      }
    });

    // Convert to summary format
    const summaries: DeliveryItemLinkSummary[] = [];
    linkMap.forEach((links, key) => {
      const [deliveryId, purchaseOrderId] = key.split('-');
      summaries.push({
        delivery_id: deliveryId,
        purchase_order_id: purchaseOrderId,
        linked_items_count: links.length,
        total_linked_quantity: links.reduce((sum, link) => sum + link.linked_quantity, 0),
        linked_items: links
      });
    });

    return summaries;
  },

  /**
   * Get total linked quantity for a delivery item
   */
  async getTotalLinkedQuantityForDeliveryItem(deliveryItemId: string): Promise<number> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .select('linked_quantity')
      .eq('delivery_item_id', deliveryItemId);

    if (error) throw error;

    return (data || []).reduce((sum, link) => sum + link.linked_quantity, 0);
  },

  /**
   * Get total linked quantity for a purchase order item
   */
  async getTotalLinkedQuantityForPOItem(purchaseOrderItemId: string): Promise<number> {
    const { data, error } = await supabase
      .from('delivery_item_links')
      .select('linked_quantity')
      .eq('purchase_order_item_id', purchaseOrderItemId);

    if (error) throw error;

    return (data || []).reduce((sum, link) => sum + link.linked_quantity, 0);
  },

  /**
   * Check if delivery item can be linked to PO item (validates quantity limits)
   */
  async validateDeliveryItemLink(deliveryItemId: string, purchaseOrderItemId: string, proposedQuantity: number): Promise<{
    valid: boolean;
    maxAllowedQuantity: number;
    currentLinkedQuantity: number;
    availableDeliveryQuantity: number;
    availablePOQuantity: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Get delivery item details
    const { data: deliveryItem, error: deliveryItemError } = await supabase
      .from('delivery_items')
      .select('quantity_delivered')
      .eq('id', deliveryItemId)
      .single();

    if (deliveryItemError) {
      errors.push('Failed to fetch delivery item details');
      return {
        valid: false,
        maxAllowedQuantity: 0,
        currentLinkedQuantity: 0,
        availableDeliveryQuantity: 0,
        availablePOQuantity: 0,
        errors
      };
    }

    // Get PO item details
    const { data: poItem, error: poItemError } = await supabase
      .from('purchase_order_items')
      .select('quantity')
      .eq('id', purchaseOrderItemId)
      .single();

    if (poItemError) {
      errors.push('Failed to fetch purchase order item details');
      return {
        valid: false,
        maxAllowedQuantity: 0,
        currentLinkedQuantity: 0,
        availableDeliveryQuantity: 0,
        availablePOQuantity: 0,
        errors
      };
    }

    // Get current linked quantities
    const currentDeliveryLinked = await this.getTotalLinkedQuantityForDeliveryItem(deliveryItemId);
    const currentPOLinked = await this.getTotalLinkedQuantityForPOItem(purchaseOrderItemId);

    const availableDeliveryQuantity = deliveryItem.quantity_delivered - currentDeliveryLinked;
    const availablePOQuantity = poItem.quantity - currentPOLinked;

    if (proposedQuantity <= 0) {
      errors.push('Proposed quantity must be greater than 0');
    }

    if (proposedQuantity > availableDeliveryQuantity) {
      errors.push(`Proposed quantity (${proposedQuantity}) exceeds available delivery quantity (${availableDeliveryQuantity})`);
    }

    if (proposedQuantity > availablePOQuantity) {
      errors.push(`Proposed quantity (${proposedQuantity}) exceeds available PO quantity (${availablePOQuantity})`);
    }

    const maxAllowedQuantity = Math.min(availableDeliveryQuantity, availablePOQuantity);

    return {
      valid: errors.length === 0,
      maxAllowedQuantity,
      currentLinkedQuantity: currentDeliveryLinked,
      availableDeliveryQuantity,
      availablePOQuantity,
      errors
    };
  }
};