import { useMemo } from "react";
import { DeliveryReceipt, PurchaseOrder, Fulfillment, ItemFulfillmentSummary, FulfillmentStatus } from "../types";

export const useFulfillmentData = (
  deliveryReceipts: DeliveryReceipt[], 
  purchaseOrders: PurchaseOrder[], 
  fulfillments: Fulfillment[]
) => {
  const fulfillmentSummaries = useMemo(() => {
    const summaries: Map<string, ItemFulfillmentSummary> = new Map();

    // Initialize all DR items
    deliveryReceipts.forEach(dr => {
      dr.items.forEach(item => {
        summaries.set(item.id, {
          drItemId: item.id,
          requiredQuantity: item.quantity,
          fulfilledQuantity: 0,
          status: 'unfulfilled',
          fulfillments: []
        });
      });
    });

    // Process fulfillments
    fulfillments.forEach(fulfillment => {
      const summary = summaries.get(fulfillment.drItemId);
      if (summary) {
        summary.fulfilledQuantity += fulfillment.fulfilledQuantity;
        summary.fulfillments.push(fulfillment);
      }
    });

    // Calculate status for each item
    summaries.forEach(summary => {
      if (summary.fulfilledQuantity === 0) {
        summary.status = 'unfulfilled';
      } else if (summary.fulfilledQuantity >= summary.requiredQuantity) {
        summary.status = 'fulfilled';
      } else {
        summary.status = 'partial';
      }
    });

    return Array.from(summaries.values());
  }, [deliveryReceipts, fulfillments]);

  const updatedDeliveryReceipts = useMemo(() => {
    return deliveryReceipts.map(dr => {
      const drItemSummaries = dr.items.map(item => 
        fulfillmentSummaries.find(summary => summary.drItemId === item.id)
      );

      let drStatus: FulfillmentStatus = 'unfulfilled';
      
      const totalItems = drItemSummaries.length;
      const fulfilledItems = drItemSummaries.filter(summary => summary?.status === 'fulfilled').length;
      const partialItems = drItemSummaries.filter(summary => summary?.status === 'partial').length;

      if (fulfilledItems === totalItems) {
        drStatus = 'fulfilled';
      } else if (fulfilledItems > 0 || partialItems > 0) {
        drStatus = 'partial';
      } else {
        drStatus = 'unfulfilled';
      }

      return { ...dr, status: drStatus };
    });
  }, [deliveryReceipts, fulfillmentSummaries]);

  const getFulfillmentForItem = (drItemId: string) => {
    return fulfillmentSummaries.find(summary => summary.drItemId === drItemId);
  };

  const getPOItem = (poId: string, poItemId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    return po?.items.find(item => item.id === poItemId);
  };

  const getDRItem = (drId: string, drItemId: string) => {
    const dr = deliveryReceipts.find(d => d.id === drId);
    return dr?.items.find(item => item.id === drItemId);
  };

  return {
    fulfillmentSummaries,
    updatedDeliveryReceipts,
    getFulfillmentForItem,
    getPOItem,
    getDRItem
  };
};