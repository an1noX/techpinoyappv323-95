import { useState, useEffect } from 'react';
import { purchaseOrderItemService, UpdatePurchaseOrderItemData, CreatePurchaseOrderItemData } from '@/services/purchaseOrderItemService';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];

export const usePurchaseOrderItems = (purchaseOrderId?: string) => {
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!purchaseOrderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await purchaseOrderItemService.getPurchaseOrderItems(purchaseOrderId);
      setItems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase order items';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemData: UpdatePurchaseOrderItemData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedItem = await purchaseOrderItemService.updatePurchaseOrderItem(itemData);
      setItems(prev => prev.map(item => item.id === itemData.id ? updatedItem : item));
      toast.success('Item updated successfully');
      return updatedItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: CreatePurchaseOrderItemData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newItem = await purchaseOrderItemService.createPurchaseOrderItem(itemData);
      setItems(prev => [...prev, newItem]);
      toast.success('Item added successfully');
      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await purchaseOrderItemService.deletePurchaseOrderItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMultipleItems = async (itemsData: UpdatePurchaseOrderItemData[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedItems = await purchaseOrderItemService.updateMultipleItems(itemsData);
      
      setItems(prev => {
        const updated = [...prev];
        updatedItems.forEach(updatedItem => {
          const index = updated.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            updated[index] = updatedItem;
          }
        });
        return updated;
      });
      
      toast.success('Items updated successfully');
      return updatedItems;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update items';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseOrderId) {
      fetchItems();
    }
  }, [purchaseOrderId]);

  return {
    items,
    loading,
    error,
    updateItem,
    createItem,
    deleteItem,
    updateMultipleItems,
    refetch: fetchItems
  };
};