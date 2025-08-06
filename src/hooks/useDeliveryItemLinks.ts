import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryItemLinkService } from '@/services/deliveryItemLinkService';
import { CreateDeliveryItemLinkData, DeliveryItemLink } from '@/types/deliveryItemLink';
import { toast } from 'sonner';

export const useDeliveryItemLinks = () => {
  const queryClient = useQueryClient();

  const createLink = useMutation({
    mutationFn: async (linkData: CreateDeliveryItemLinkData) => {
      // Validate before creating
      const validation = await deliveryItemLinkService.validateDeliveryItemLink(
        linkData.delivery_item_id,
        linkData.purchase_order_item_id,
        linkData.linked_quantity
      );

      if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
      }

      return deliveryItemLinkService.createDeliveryItemLink(linkData);
    },
    onSuccess: () => {
      toast.success('Items linked successfully');
      queryClient.invalidateQueries({ queryKey: ['deliveryItemLinks'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link items');
    }
  });

  const deleteLink = useMutation({
    mutationFn: deliveryItemLinkService.deleteDeliveryItemLink,
    onSuccess: () => {
      toast.success('Link removed successfully');
      queryClient.invalidateQueries({ queryKey: ['deliveryItemLinks'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
    onError: () => {
      toast.error('Failed to remove link');
    }
  });

  const getDeliveryItemsWithLinks = useCallback((deliveryId: string) => {
    return useQuery({
      queryKey: ['deliveryItemLinks', 'delivery', deliveryId],
      queryFn: () => deliveryItemLinkService.getDeliveryItemLinksByDelivery(deliveryId),
      enabled: !!deliveryId
    });
  }, []);

  const getPurchaseOrderItemsWithLinks = useCallback((purchaseOrderId: string) => {
    return useQuery({
      queryKey: ['deliveryItemLinks', 'purchaseOrder', purchaseOrderId],
      queryFn: () => deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId),
      enabled: !!purchaseOrderId
    });
  }, []);

  const getLinksForDelivery = useCallback((deliveryId: string) => {
    return useQuery({
      queryKey: ['deliveryItemLinks', 'deliveryLinks', deliveryId],
      queryFn: () => deliveryItemLinkService.getDeliveryItemLinksByDelivery(deliveryId),
      enabled: !!deliveryId
    });
  }, []);

  const getLinksForPurchaseOrder = useCallback((purchaseOrderId: string) => {
    return useQuery({
      queryKey: ['deliveryItemLinks', 'poLinks', purchaseOrderId],
      queryFn: () => deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId),
      enabled: !!purchaseOrderId
    });
  }, []);

  return {
    createLink,
    deleteLink,
    getDeliveryItemsWithLinks,
    getPurchaseOrderItemsWithLinks,
    getLinksForDelivery,
    getLinksForPurchaseOrder
  };
};