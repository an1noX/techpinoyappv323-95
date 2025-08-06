import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type InventoryPurchase = Database['public']['Tables']['inventory_purchases']['Row'];
type InventoryPurchaseItem = Database['public']['Tables']['inventory_purchase_items']['Row'];

export interface InventoryPurchaseWithItems extends InventoryPurchase {
  inventory_purchase_items: InventoryPurchaseItem[];
}

export interface CreateInventoryPurchaseData {
  supplier_id?: string;
  supplier_name: string;
  purchase_date: string;
  reference_number: string;
  notes?: string;
  status?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_cost: number;
  }>;
}

export const inventoryPurchaseService = {
  async getAllInventoryPurchases(): Promise<InventoryPurchaseWithItems[]> {
    const { data, error } = await supabase
      .from('inventory_purchases')
      .select(`
        *,
        inventory_purchase_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInventoryPurchaseById(id: string): Promise<InventoryPurchaseWithItems | null> {
    const { data, error } = await supabase
      .from('inventory_purchases')
      .select(`
        *,
        inventory_purchase_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createInventoryPurchase(purchaseData: CreateInventoryPurchaseData): Promise<InventoryPurchase> {
    // Calculate total amount
    const totalAmount = purchaseData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_cost), 0
    );

    // Create the inventory purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('inventory_purchases')
      .insert({
        supplier_id: purchaseData.supplier_id,
        supplier_name: purchaseData.supplier_name,
        purchase_date: purchaseData.purchase_date,
        reference_number: purchaseData.reference_number,
        total_amount: totalAmount,
        notes: purchaseData.notes,
        status: purchaseData.status || 'pending',
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Create the inventory purchase items
    if (purchaseData.items && purchaseData.items.length > 0) {
      const items = purchaseData.items.map(item => ({
        inventory_purchase_id: purchase.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from('inventory_purchase_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return purchase;
  },

  async updateInventoryPurchase(id: string, updates: Partial<InventoryPurchase>): Promise<InventoryPurchase> {
    const { data, error } = await supabase
      .from('inventory_purchases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInventoryPurchase(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};