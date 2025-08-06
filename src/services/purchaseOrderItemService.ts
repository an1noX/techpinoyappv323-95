import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];

export interface UpdatePurchaseOrderItemData {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

export interface CreatePurchaseOrderItemData {
  purchase_order_id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

export const purchaseOrderItemService = {
  async getPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updatePurchaseOrderItem(itemData: UpdatePurchaseOrderItemData): Promise<PurchaseOrderItem> {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .update({
        product_id: itemData.product_id,
        model: itemData.model || '',
        quantity: itemData.quantity,
        unit_price: itemData.unit_price,
      })
      .eq('id', itemData.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createPurchaseOrderItem(itemData: CreatePurchaseOrderItemData): Promise<PurchaseOrderItem> {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .insert({
        purchase_order_id: itemData.purchase_order_id,
        product_id: itemData.product_id,
        model: itemData.model || '',
        quantity: itemData.quantity,
        unit_price: itemData.unit_price,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePurchaseOrderItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  async updateMultipleItems(items: UpdatePurchaseOrderItemData[]): Promise<PurchaseOrderItem[]> {
    const results: PurchaseOrderItem[] = [];
    
    for (const item of items) {
      const result = await this.updatePurchaseOrderItem(item);
      results.push(result);
    }
    
    return results;
  }
};