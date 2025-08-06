import { useState, useCallback } from 'react';
import { purchaseOrderService } from '@/services/purchaseOrderService';

export const usePOSuggestions = () => {
  const [poSuggestions, setPOSuggestions] = useState<string[]>([]);

  const getPOSuggestions = useCallback(async (clientId: string, searchValue: string) => {
    if (!clientId || !searchValue) {
      setPOSuggestions([]);
      return;
    }

    try {
      const data = await purchaseOrderService.getAllPurchaseOrders();
      const clientPOs = data
        ?.filter((po: any) => po.supplier_client_id === clientId && po.client_po)
        .map((po: any) => po.client_po)
        .filter((po: string) => po.toLowerCase().includes(searchValue.toLowerCase()))
        .filter((po: string, index: number, arr: string[]) => arr.indexOf(po) === index)
        .slice(0, 5);

      setPOSuggestions(clientPOs || []);
    } catch (error) {
      console.error('Error fetching PO suggestions:', error);
      setPOSuggestions([]);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setPOSuggestions([]);
  }, []);

  return {
    poSuggestions,
    getPOSuggestions,
    clearSuggestions
  };
};