export interface POItemWithFulfillment {
  id: string;
  quantity: number;
  totalFulfilled: number;
  remaining: number;
  status: 'unfulfilled' | 'fulfilled' | 'partial';
  fulfillments: any[];
}

export interface PurchaseOrderForStatus {
  purchase_order_items?: Array<{
    id: string;
    quantity: number;
  }>;
  items?: Array<{
    id: string;
    quantity: number;
  }>;
}

/**
 * Processes PO fulfillment data and returns enriched item data
 */
export const getPOFulfillmentData = (
  po: PurchaseOrderForStatus, 
  fulfillments: any[]
): POItemWithFulfillment[] => {
  const items = po.purchase_order_items || po.items || [];
  
  return items.map(poItem => {
    const itemFulfillments = fulfillments.filter(f => f.po_item_id === poItem.id);
    
    // Deduplicate fulfillments by dr_id
    const uniqueFulfillments = itemFulfillments.reduce((acc, current) => {
      const existing = acc.find(item => item.dr_id === current.dr_id);
      if (!existing) {
        acc.push(current);
      } else {
        if (current.fulfilled_quantity > existing.fulfilled_quantity) {
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
      }
      return acc;
    }, [] as typeof itemFulfillments);
    
    const totalFulfilled = uniqueFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
    const remaining = Math.max(0, poItem.quantity - totalFulfilled);
    const status = totalFulfilled === 0 ? 'unfulfilled' : 
                 remaining === 0 ? 'fulfilled' : 'partial';

    return {
      id: poItem.id,
      quantity: poItem.quantity,
      totalFulfilled,
      remaining,
      status,
      fulfillments: uniqueFulfillments
    };
  });
};

/**
 * Calculate overall PO fulfillment status based on all items
 */
export const calculatePOFulfillmentStatus = (
  po: PurchaseOrderForStatus, 
  fulfillments: any[]
): 'completed' | 'partial' | 'pending' => {
  const itemData = getPOFulfillmentData(po, fulfillments);
  if (itemData.length === 0) return 'pending';

  let allItemsCompleted = true;
  let anyItemsFulfilled = false;

  for (const item of itemData) {
    if (item.totalFulfilled === 0) {
      // No fulfillment for this item
      allItemsCompleted = false;
    } else if (item.totalFulfilled >= item.quantity) {
      // Item is fully fulfilled
      anyItemsFulfilled = true;
      // Don't set allItemsCompleted to false - this item is complete
    } else {
      // Item has partial fulfillment
      anyItemsFulfilled = true;
      allItemsCompleted = false;
    }
  }

  if (allItemsCompleted) return 'completed';
  if (anyItemsFulfilled) return 'partial';
  return 'pending';
};