import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitTrackingService } from '@/services/unitTrackingService';
import {
  CreateUnitDeliveryLinkData,
  UpdateUnitDeliveryLinkData,
  UnitSearchCriteria,
  BulkCreateUnitLinksData,
  UpdatePurchaseOrderItemUnitData,
  UpdateDeliveryItemUnitData
} from '@/types/unitTracking';
import { toast } from 'sonner';

export const useUnitTracking = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Get PO units
  const usePurchaseOrderItemUnits = (purchaseOrderItemId: string) => {
    return useQuery({
      queryKey: ['purchaseOrderItemUnits', purchaseOrderItemId],
      queryFn: () => unitTrackingService.getPurchaseOrderItemUnits(purchaseOrderItemId),
      enabled: !!purchaseOrderItemId
    });
  };

  // Get delivery units
  const useDeliveryItemUnits = (deliveryItemId: string) => {
    return useQuery({
      queryKey: ['deliveryItemUnits', deliveryItemId],
      queryFn: () => unitTrackingService.getDeliveryItemUnits(deliveryItemId),
      enabled: !!deliveryItemId
    });
  };

  // Get unit links
  const useUnitDeliveryLinks = (purchaseOrderId?: string, deliveryId?: string) => {
    return useQuery({
      queryKey: ['unitDeliveryLinks', purchaseOrderId, deliveryId],
      queryFn: () => unitTrackingService.getUnitDeliveryLinks(purchaseOrderId, deliveryId),
      enabled: !!(purchaseOrderId || deliveryId)
    });
  };

  // Get tracking stats
  const useUnitTrackingStats = (purchaseOrderId?: string, deliveryId?: string) => {
    return useQuery({
      queryKey: ['unitTrackingStats', purchaseOrderId, deliveryId],
      queryFn: () => unitTrackingService.getUnitTrackingStats(purchaseOrderId, deliveryId),
      enabled: !!(purchaseOrderId || deliveryId)
    });
  };

  // Get reconciliation report
  const useReconciliationReport = (purchaseOrderId: string, deliveryId?: string) => {
    return useQuery({
      queryKey: ['reconciliationReport', purchaseOrderId, deliveryId],
      queryFn: () => unitTrackingService.generateReconciliationReport(purchaseOrderId, deliveryId),
      enabled: !!purchaseOrderId
    });
  };

  // Create unit link mutation
  const createUnitLink = useMutation({
    mutationFn: async (linkData: CreateUnitDeliveryLinkData) => {
      // Validate before creating
      const validation = await unitTrackingService.validateUnitLinking(
        linkData.purchase_order_unit_id,
        linkData.delivery_unit_id
      );

      if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
      }

      if (validation.warnings.length > 0) {
        console.warn('Unit linking warnings:', validation.warnings);
      }

      return unitTrackingService.createUnitDeliveryLink(linkData);
    },
    onSuccess: () => {
      toast.success('Units linked successfully');
      queryClient.invalidateQueries({ queryKey: ['unitDeliveryLinks'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['unitTrackingStats'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliationReport'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link units');
    }
  });

  // Create bulk unit links mutation
  const createBulkUnitLinks = useMutation({
    mutationFn: async (bulkData: BulkCreateUnitLinksData) => {
      // Validate all links before creating
      for (const link of bulkData.links) {
        const validation = await unitTrackingService.validateUnitLinking(
          link.purchase_order_unit_id,
          link.delivery_unit_id
        );

        if (!validation.valid) {
          throw new Error(`Validation failed for unit link: ${validation.errors.join('; ')}`);
        }
      }

      return unitTrackingService.createBulkUnitLinks(bulkData);
    },
    onSuccess: (data) => {
      toast.success(`Successfully linked ${data.length} units`);
      queryClient.invalidateQueries({ queryKey: ['unitDeliveryLinks'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['unitTrackingStats'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliationReport'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create bulk unit links');
    }
  });

  // Update unit link mutation
  const updateUnitLink = useMutation({
    mutationFn: unitTrackingService.updateUnitDeliveryLink,
    onSuccess: () => {
      toast.success('Unit link updated successfully');
      queryClient.invalidateQueries({ queryKey: ['unitDeliveryLinks'] });
      queryClient.invalidateQueries({ queryKey: ['unitTrackingStats'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliationReport'] });
    },
    onError: () => {
      toast.error('Failed to update unit link');
    }
  });

  // Delete unit link mutation
  const deleteUnitLink = useMutation({
    mutationFn: unitTrackingService.deleteUnitDeliveryLink,
    onSuccess: () => {
      toast.success('Unit link removed successfully');
      queryClient.invalidateQueries({ queryKey: ['unitDeliveryLinks'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['unitTrackingStats'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliationReport'] });
    },
    onError: () => {
      toast.error('Failed to remove unit link');
    }
  });

  // Update PO unit mutation
  const updatePOUnit = useMutation({
    mutationFn: unitTrackingService.updatePurchaseOrderItemUnit,
    onSuccess: () => {
      toast.success('Purchase order unit updated successfully');
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['unitTrackingStats'] });
    },
    onError: () => {
      toast.error('Failed to update purchase order unit');
    }
  });

  // Update delivery unit mutation
  const updateDeliveryUnit = useMutation({
    mutationFn: unitTrackingService.updateDeliveryItemUnit,
    onSuccess: () => {
      toast.success('Delivery unit updated successfully');
      queryClient.invalidateQueries({ queryKey: ['deliveryItemUnits'] });
      queryClient.invalidateQueries({ queryKey: ['unitTrackingStats'] });
    },
    onError: () => {
      toast.error('Failed to update delivery unit');
    }
  });

  // Search units
  const searchUnits = useCallback(async (criteria: UnitSearchCriteria) => {
    setIsLoading(true);
    try {
      const results = await unitTrackingService.searchUnits(criteria);
      return results;
    } catch (error) {
      console.error('Error searching units:', error);
      toast.error('Failed to search units');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate unit linking
  const validateUnitLinking = useCallback(async (
    purchaseOrderUnitId: string,
    deliveryUnitId: string
  ) => {
    try {
      return await unitTrackingService.validateUnitLinking(purchaseOrderUnitId, deliveryUnitId);
    } catch (error) {
      console.error('Error validating unit linking:', error);
      toast.error('Failed to validate unit linking');
      throw error;
    }
  }, []);

  // Auto-link units by matching criteria
  const autoLinkUnits = useCallback(async (
    purchaseOrderId: string,
    deliveryId: string,
    matchBySerial: boolean = false,
    matchByBatch: boolean = false
  ) => {
    setIsLoading(true);
    try {
      // Search for unlinked units
      const [poResults, deliveryResults] = await Promise.all([
        unitTrackingService.searchUnits({
          purchase_order_id: purchaseOrderId,
          unit_status: ['ordered']
        }),
        unitTrackingService.searchUnits({
          delivery_id: deliveryId,
          unit_status: ['delivered']
        })
      ]);

      const unlinkedPOUnits = poResults.po_units.filter(u => !u.unit_links?.length);
      const unlinkedDeliveryUnits = deliveryResults.delivery_units.filter(u => !u.unit_links?.length);

      const linksToCreate: CreateUnitDeliveryLinkData[] = [];

      // Match units based on criteria
      for (const poUnit of unlinkedPOUnits) {
        for (const deliveryUnit of unlinkedDeliveryUnits) {
          // Check if products match
          if (poUnit.purchase_order_item?.product_id !== deliveryUnit.delivery_item?.product_id) {
            continue;
          }

          // Check serial number match if required
          if (matchBySerial && poUnit.serial_number !== deliveryUnit.serial_number) {
            continue;
          }

          // Check batch number match if required
          if (matchByBatch && poUnit.batch_number !== deliveryUnit.batch_number) {
            continue;
          }

          // Check if delivery unit is already being linked
          if (linksToCreate.some(link => link.delivery_unit_id === deliveryUnit.id)) {
            continue;
          }

          // Create the link
          linksToCreate.push({
            purchase_order_unit_id: poUnit.id,
            delivery_unit_id: deliveryUnit.id,
            link_status: 'linked',
            notes: 'Auto-linked based on matching criteria'
          });

          break; // Move to next PO unit
        }
      }

      if (linksToCreate.length > 0) {
        await createBulkUnitLinks.mutateAsync({ links: linksToCreate });
        toast.success(`Auto-linked ${linksToCreate.length} units`);
      } else {
        toast.info('No matching units found for auto-linking');
      }

      return linksToCreate.length;
    } catch (error) {
      console.error('Error auto-linking units:', error);
      toast.error('Failed to auto-link units');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createBulkUnitLinks]);

  return {
    // Queries
    usePurchaseOrderItemUnits,
    useDeliveryItemUnits,
    useUnitDeliveryLinks,
    useUnitTrackingStats,
    useReconciliationReport,

    // Mutations
    createUnitLink,
    createBulkUnitLinks,
    updateUnitLink,
    deleteUnitLink,
    updatePOUnit,
    updateDeliveryUnit,

    // Utility functions
    searchUnits,
    validateUnitLinking,
    autoLinkUnits,

    // Loading state
    isLoading
  };
};