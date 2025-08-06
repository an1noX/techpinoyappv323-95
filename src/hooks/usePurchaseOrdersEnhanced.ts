
import { useState, useEffect } from 'react';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { paymentService } from '@/services/paymentService';
import { Database } from '@/integrations/supabase/types';
import { CreatePurchaseOrderData, PurchaseOrderWithDetails } from '@/types/purchaseOrder';
import { toast } from 'sonner';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

export const usePurchaseOrdersEnhanced = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await purchaseOrderService.getAllPurchaseOrders();
      setPurchaseOrders(data as PurchaseOrder[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createPurchaseOrder = async (poData: CreatePurchaseOrderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newPO = await purchaseOrderService.createPurchaseOrder(poData);
      setPurchaseOrders(prev => [newPO as PurchaseOrder, ...prev]);
      toast.success('Purchase order created successfully');
      return newPO;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create purchase order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPO = await purchaseOrderService.updatePurchaseOrder(id, updates);
      setPurchaseOrders(prev => prev.map(po => po.id === id ? updatedPO as PurchaseOrder : po));
      toast.success('Purchase order updated successfully');
      return updatedPO;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update purchase order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await purchaseOrderService.deletePurchaseOrder(id);
      setPurchaseOrders(prev => prev.filter(po => po.id !== id));
      toast.success('Purchase order deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete purchase order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPurchaseOrderWithDetails = async (id: string): Promise<PurchaseOrderWithDetails | null> => {
    try {
      const result = await purchaseOrderService.getPurchaseOrderById(id);
      return result as PurchaseOrderWithDetails;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch purchase order details';
      toast.error(errorMessage);
      return null;
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const getDeliveryCompletionStatus = async (id: string) => {
    try {
      return await purchaseOrderService.getDeliveryCompletionStatus(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check delivery status';
      toast.error(errorMessage);
      return { isCompletelyDelivered: false, deliveryPercentage: 0 };
    }
  };

  const markPurchaseOrderAsPaid = async (id: string, saleInvoiceNumber: string, amount?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPO = await paymentService.markAsPaid(id, saleInvoiceNumber, amount);
      setPurchaseOrders(prev => prev.map(po => po.id === id ? updatedPO as PurchaseOrder : po));
      toast.success('Purchase order marked as paid successfully');
      return updatedPO;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark purchase order as paid';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    purchaseOrders,
    loading,
    error,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrderWithDetails,
    getDeliveryCompletionStatus,
    markPurchaseOrderAsPaid,
    refetch: fetchPurchaseOrders
  };
};
