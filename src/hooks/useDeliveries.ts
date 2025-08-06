
import { useState, useEffect } from 'react';
import { deliveryService, Delivery, CreateDeliveryData } from '@/services/deliveryService';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { toast } from 'sonner';

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await deliveryService.getAllDeliveries();
      setDeliveries(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deliveries';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createDelivery = async (deliveryData: CreateDeliveryData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newDelivery = await deliveryService.createDelivery(deliveryData);
      setDeliveries(prev => [newDelivery, ...prev]);
      
      // Update PO status after delivery creation
      if (deliveryData.purchase_order_id) {
        await purchaseOrderService.updatePurchaseOrderStatus(deliveryData.purchase_order_id);
      }
      
      toast.success('Delivery record created successfully');
      return newDelivery;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create delivery';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDelivery = async (id: string, updates: Partial<Delivery>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedDelivery = await deliveryService.updateDelivery(id, updates);
      setDeliveries(prev => prev.map(delivery => delivery.id === id ? updatedDelivery : delivery));
      toast.success('Delivery updated successfully');
      return updatedDelivery;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update delivery';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDelivery = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await deliveryService.deleteDelivery(id);
      setDeliveries(prev => prev.filter(delivery => delivery.id !== id));
      toast.success('Delivery deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete delivery';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDeliveriesByPurchaseOrder = async (purchaseOrderId: string): Promise<Delivery[]> => {
    try {
      return await deliveryService.getDeliveriesByPurchaseOrder(purchaseOrderId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deliveries for purchase order';
      toast.error(errorMessage);
      return [];
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  return {
    deliveries,
    loading,
    error,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    getDeliveriesByPurchaseOrder,
    refetch: fetchDeliveries
  };
};
