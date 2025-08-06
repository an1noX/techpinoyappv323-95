import { deliveryItemLinkService } from '@/services/deliveryItemLinkService';

interface DeliveryItem {
  id: string;
  product_id?: string;
  quantity_delivered: number;
}

interface POItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

interface AvailableMatchingItem {
  deliveryItem: DeliveryItem;
  poItem: POItem;
  availableDeliveryQuantity: number;
  availablePOQuantity: number;
  maxLinkableQuantity: number;
}

/**
 * Get items from a delivery that can be linked to a purchase order
 * considering existing links
 */
export const getAvailableMatchingItems = async (
  deliveryId: string,
  purchaseOrderId: string,
  deliveryItems: DeliveryItem[],
  poItems: POItem[]
): Promise<AvailableMatchingItem[]> => {
  const availableItems: AvailableMatchingItem[] = [];

  for (const deliveryItem of deliveryItems) {
    // Find matching PO items by product_id
    const matchingPOItems = poItems.filter(poItem => 
      poItem.product_id === deliveryItem.product_id
    );

    for (const poItem of matchingPOItems) {
      // Get current linked quantities
      const [deliveryLinkedQty, poLinkedQty] = await Promise.all([
        deliveryItemLinkService.getTotalLinkedQuantityForDeliveryItem(deliveryItem.id),
        deliveryItemLinkService.getTotalLinkedQuantityForPOItem(poItem.id)
      ]);

      const availableDeliveryQuantity = deliveryItem.quantity_delivered - deliveryLinkedQty;
      const availablePOQuantity = poItem.quantity - poLinkedQty;
      const maxLinkableQuantity = Math.min(availableDeliveryQuantity, availablePOQuantity);

      // Only include if there's something available to link
      if (maxLinkableQuantity > 0) {
        availableItems.push({
          deliveryItem,
          poItem,
          availableDeliveryQuantity,
          availablePOQuantity,
          maxLinkableQuantity
        });
      }
    }
  }

  return availableItems;
};

/**
 * Check if a delivery has any items available for linking to a specific PO
 */
export const hasAvailableItemsForLinking = async (
  deliveryId: string,
  purchaseOrderId: string,
  deliveryItems: DeliveryItem[],
  poItems: POItem[]
): Promise<boolean> => {
  const availableItems = await getAvailableMatchingItems(
    deliveryId,
    purchaseOrderId,
    deliveryItems,
    poItems
  );
  return availableItems.length > 0;
};

/**
 * Get linking status for a delivery relative to a purchase order
 */
export const getDeliveryLinkingStatus = async (
  deliveryId: string,
  purchaseOrderId: string,
  deliveryItems: DeliveryItem[],
  poItems: POItem[]
): Promise<{
  status: 'not_linked' | 'partially_linked' | 'fully_linked' | 'no_matches';
  availableItems: number;
  totalMatchingItems: number;
  linkedItems: number;
}> => {
  const availableItems = await getAvailableMatchingItems(
    deliveryId,
    purchaseOrderId,
    deliveryItems,
    poItems
  );

  // Count total matching items (regardless of linking status)
  const matchingItems = deliveryItems.filter(deliveryItem =>
    poItems.some(poItem => poItem.product_id === deliveryItem.product_id)
  );

  const totalMatchingItems = matchingItems.length;
  const availableItemsCount = availableItems.length;
  const linkedItems = totalMatchingItems - availableItemsCount;

  let status: 'not_linked' | 'partially_linked' | 'fully_linked' | 'no_matches';

  if (totalMatchingItems === 0) {
    status = 'no_matches';
  } else if (linkedItems === 0) {
    status = 'not_linked';
  } else if (availableItemsCount > 0) {
    status = 'partially_linked';
  } else {
    status = 'fully_linked';
  }

  return {
    status,
    availableItems: availableItemsCount,
    totalMatchingItems,
    linkedItems
  };
};

/**
 * Validate if a delivery item can be linked to a PO item with a specific quantity
 */
export const validateItemLinking = async (
  deliveryItemId: string,
  purchaseOrderItemId: string,
  proposedQuantity: number
): Promise<{
  valid: boolean;
  errors: string[];
  availableDeliveryQuantity: number;
  availablePOQuantity: number;
}> => {
  return await deliveryItemLinkService.validateDeliveryItemLink(
    deliveryItemId,
    purchaseOrderItemId,
    proposedQuantity
  );
};