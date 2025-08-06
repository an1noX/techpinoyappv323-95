
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Package, Truck, DollarSign, FileText, Plus, Calculator, Unlink } from 'lucide-react';
import { usePurchaseOrdersEnhanced } from '@/hooks/usePurchaseOrdersEnhanced';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useDeliveryItemLinks } from '@/hooks/useDeliveryItemLinks';
import { PurchaseOrderWithDetails, Delivery } from '@/types/purchaseOrder';
import { CreateDeliveryModal } from './CreateDeliveryModal';
import { LinkAdvanceDeliveryModal } from './LinkAdvanceDeliveryModal';
import { BudgetPlanModal } from './BudgetPlanModal';
import { deliveryService } from '@/services/deliveryService';
import { ItemDeliveryStatus } from './ItemDeliveryStatus';
import { DeliveryLinksDisplay } from './DeliveryLinksDisplay';
import { UnitTrackingLinksDisplay } from './UnitTrackingLinksDisplay';
import { toast } from 'sonner';

interface PurchaseOrderDetailModalProps {
  purchaseOrderId: string;
  onClose: () => void;
  isNewSearch?: boolean;
}

export const PurchaseOrderDetailModal = ({ purchaseOrderId, onClose, isNewSearch = false }: PurchaseOrderDetailModalProps) => {
  const { getPurchaseOrderWithDetails } = usePurchaseOrdersEnhanced();
  const { getDeliveriesByPurchaseOrder } = useDeliveries();
  const { getLinksForPurchaseOrder } = useDeliveryItemLinks();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithDetails | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [showCreateAdvanceDelivery, setShowCreateAdvanceDelivery] = useState(false);
  const [showBudgetPlan, setShowBudgetPlan] = useState(false);
  const [deliveryItems, setDeliveryItems] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Get item links for this purchase order
  const { data: itemLinks = [] } = getLinksForPurchaseOrder(purchaseOrderId);
  
  // Get ALL delivery item links to properly show cross-PO links
  const { getDeliveryItemsWithLinks } = useDeliveryItemLinks();
  const [allDeliveryLinks, setAllDeliveryLinks] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        // Get both PO data and deliveries
        const poData = await getPurchaseOrderWithDetails(purchaseOrderId);
        let deliveryData = await getDeliveriesByPurchaseOrder(purchaseOrderId);
        
        // Also get deliveries that have items linked to this PO (advance deliveries)
        // Only include deliveries that don't already belong to this PO AND have items actually linked to this PO
        try {
          const { deliveryItemLinkService } = await import('@/services/deliveryItemLinkService');
          const linkedItemsForPO = await deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId);
          
          if (linkedItemsForPO && linkedItemsForPO.length > 0) {
            // Get unique delivery IDs from linked items that are actually linked to this PO
            const linkedDeliveryIds = [...new Set(linkedItemsForPO.map(link => link.delivery_item?.delivery_id).filter(Boolean))];
            
            // Only fetch deliveries that:
            // 1. Have items specifically linked to this PO
            // 2. Are not already in our direct deliveries list
            // 3. Don't belong directly to this PO (advance delivery case)
            const additionalDeliveries = await Promise.all(
              linkedDeliveryIds
                .filter(deliveryId => !deliveryData.some(d => d.id === deliveryId))
                .map(async (deliveryId) => {
                  try {
                    const delivery = await deliveryService.getDeliveryById(deliveryId);
                    // Only include if delivery doesn't belong to current PO AND has items linked to current PO
                    if (delivery && delivery.purchase_order_id !== purchaseOrderId) {
                      // Verify this delivery actually has items linked to current PO
                      const hasLinkedItems = linkedItemsForPO.some(link => 
                        link.delivery_item?.delivery_id === deliveryId
                      );
                      return hasLinkedItems ? delivery : null;
                    }
                    return null;
                  } catch (error) {
                    console.error(`Error fetching delivery ${deliveryId}:`, error);
                    return null;
                  }
                })
            );
            
            // Add non-null additional deliveries (advance deliveries with actual links only)
            deliveryData = [...deliveryData, ...additionalDeliveries.filter(Boolean)];
          }
        } catch (error) {
          console.error('Error fetching linked deliveries:', error);
        }
        
        if (!isMounted) return;
        
        setPurchaseOrder(poData);
        setDeliveries(deliveryData);

        // Load delivery items for all deliveries automatically
        if (deliveryData && deliveryData.length > 0) {
          const deliveryItemsData: Record<string, any[]> = {};
          const allLinksData: any[] = [];
          
          await Promise.all([
            // Load delivery items
            ...deliveryData.map(async (delivery) => {
              if (!isMounted) return;
              try {
                const deliveryWithItems = await deliveryService.getDeliveryWithItems(delivery.id);
                if (deliveryWithItems && isMounted) {
                  deliveryItemsData[delivery.id] = deliveryWithItems.delivery_items || [];
                }
              } catch (error) {
                console.error(`Error fetching delivery items for ${delivery.id}:`, error);
                if (isMounted) {
                  deliveryItemsData[delivery.id] = [];
                }
              }
            }),
            // Load delivery links ONLY for this specific purchase order
            (async () => {
              if (!isMounted) return;
              try {
                const { deliveryItemLinkService } = await import('@/services/deliveryItemLinkService');
                const poLinks = await deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId);
                if (isMounted && poLinks) {
                  allLinksData.push(...poLinks);
                }
              } catch (error) {
                console.error('Error fetching PO delivery links:', error);
              }
            })()
          ]);
          
          if (isMounted) {
            setDeliveryItems(deliveryItemsData);
            setAllDeliveryLinks(allLinksData);
          }
        }
      } catch (error) {
        console.error('Error fetching PO details:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [purchaseOrderId]); // Removed the function dependencies to prevent infinite loop

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeliverySuccess = async () => {
    try {
      // Get both direct deliveries and linked deliveries
      let deliveryData = await getDeliveriesByPurchaseOrder(purchaseOrderId);
      
      // Also get deliveries that have items linked to this PO (advance deliveries)
      // Only include deliveries that don't already belong to this PO AND have items actually linked to this PO
      try {
        const { deliveryItemLinkService } = await import('@/services/deliveryItemLinkService');
        const linkedItemsForPO = await deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId);
        
        if (linkedItemsForPO && linkedItemsForPO.length > 0) {
          // Get unique delivery IDs from linked items that are actually linked to this PO
          const linkedDeliveryIds = [...new Set(linkedItemsForPO.map(link => link.delivery_item?.delivery_id).filter(Boolean))];
          
          // Only fetch deliveries that:
          // 1. Have items specifically linked to this PO
          // 2. Are not already in our direct deliveries list
          // 3. Don't belong directly to this PO (advance delivery case)
          const additionalDeliveries = await Promise.all(
            linkedDeliveryIds
              .filter(deliveryId => !deliveryData.some(d => d.id === deliveryId))
              .map(async (deliveryId) => {
                try {
                  const delivery = await deliveryService.getDeliveryById(deliveryId);
                  // Only include if delivery doesn't belong to current PO AND has items linked to current PO
                  if (delivery && delivery.purchase_order_id !== purchaseOrderId) {
                    // Verify this delivery actually has items linked to current PO
                    const hasLinkedItems = linkedItemsForPO.some(link => 
                      link.delivery_item?.delivery_id === deliveryId
                    );
                    return hasLinkedItems ? delivery : null;
                  }
                  return null;
                } catch (error) {
                  console.error(`Error fetching delivery ${deliveryId}:`, error);
                  return null;
                }
              })
          );
          
          // Add non-null additional deliveries (advance deliveries with actual links only)
          deliveryData = [...deliveryData, ...additionalDeliveries.filter(Boolean)];
        }
      } catch (error) {
        console.error('Error fetching linked deliveries:', error);
      }
      
      setDeliveries(deliveryData);
      
      // Refresh PO data to get updated status
      const poData = await getPurchaseOrderWithDetails(purchaseOrderId);
      setPurchaseOrder(poData);

      // Reload delivery items for all deliveries
      if (deliveryData && deliveryData.length > 0) {
        const deliveryItemsData: Record<string, any[]> = {};
        const allLinksData: any[] = [];
        
        await Promise.all([
          // Load delivery items
          ...deliveryData.map(async (delivery) => {
            try {
              const deliveryWithItems = await deliveryService.getDeliveryWithItems(delivery.id);
              if (deliveryWithItems) {
                deliveryItemsData[delivery.id] = deliveryWithItems.delivery_items || [];
              }
            } catch (error) {
              console.error(`Error fetching delivery items for ${delivery.id}:`, error);
              deliveryItemsData[delivery.id] = [];
            }
          }),
          // Load delivery links ONLY for this specific purchase order
          (async () => {
            try {
              const { deliveryItemLinkService } = await import('@/services/deliveryItemLinkService');
              const poLinks = await deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId);
              if (poLinks) {
                allLinksData.push(...poLinks);
              }
            } catch (error) {
              console.error('Error fetching PO delivery links:', error);
            }
          })()
        ]);
        
        setDeliveryItems(deliveryItemsData);
        setAllDeliveryLinks(allLinksData);
      }
    } catch (error) {
      console.error('Error refreshing delivery data:', error);
    } finally {
      setShowCreateDelivery(false);
    }
  };

  const handleAdvanceDeliverySuccess = async () => {
    // Refresh delivery data after linking advance delivery
    await handleDeliverySuccess();
    setShowCreateAdvanceDelivery(false);
  };

  const handleUnlinkDelivery = async (deliveryId: string, deliveryNumber: string) => {
    try {
      await deliveryService.unlinkDeliveryFromPO(deliveryId);
      toast.success(`Delivery ${deliveryNumber} unlinked successfully`);
      
      // Update PO status after unlinking delivery
      try {
        const { purchaseOrderService } = await import('@/services/purchaseOrderService');
        await purchaseOrderService.updatePurchaseOrderStatus(purchaseOrderId);
      } catch (statusError) {
        console.error('Error updating PO status after unlinking delivery:', statusError);
      }
      
      // Refresh data after unlinking
      await handleDeliverySuccess();
    } catch (error) {
      console.error('Error unlinking delivery:', error);
      toast.error('Failed to unlink delivery');
    }
  };


  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Loading purchase order details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!purchaseOrder) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Purchase order not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText size={20} />
                <span>Purchase Order #{purchaseOrder.id.slice(0, 8)}</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* First Row - Order Information and Delivery Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="font-medium">{purchaseOrder.supplier_name || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className={getStatusColor(purchaseOrder.status)}>
                      {purchaseOrder.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment:</span>
                    <Badge className={getPaymentStatusColor(purchaseOrder.payment_status)}>
                      {purchaseOrder.payment_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm">{new Date(purchaseOrder.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Delivery Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-medium">{purchaseOrder.purchase_order_items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivered:</span>
                    <span className="font-medium text-green-600">
                      {purchaseOrder.purchase_order_items?.filter((item: any) => {
                        const linkedQuantity = itemLinks
                          .filter(link => link.purchase_order_item?.id === item.id)
                          .reduce((total, link) => total + link.linked_quantity, 0);
                        return linkedQuantity > 0;
                      }).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining:</span>
                    <span className="font-medium text-yellow-600">
                      {purchaseOrder.purchase_order_items?.filter((item: any) => {
                        const linkedQuantity = itemLinks
                          .filter(link => link.purchase_order_item?.id === item.id)
                          .reduce((total, link) => total + link.linked_quantity, 0);
                        return item.quantity - linkedQuantity > 0;
                      }).length || 0}
                    </span>
                  </div>
                  {purchaseOrder.total_ordered && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${purchaseOrder.completion_percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        {purchaseOrder.completion_percentage || 0}% Complete
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Second Row - Items Delivered and Items to be Delivered */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Items Delivered */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck size={16} />
                    <span>Items Delivered</span>
                  </CardTitle>
                </CardHeader>
                 <CardContent>
                  {itemLinks.length > 0 ? (
                    <div className="space-y-3">
                      {purchaseOrder.purchase_order_items?.map((item: any) => {
                        // Get linked items for this PO item
                        const linkedItems = itemLinks.filter(link => link.purchase_order_item?.id === item.id);
                        const totalLinkedQty = linkedItems.reduce((total, link) => total + link.linked_quantity, 0);
                        
                        return totalLinkedQty > 0 ? (
                          <div key={item.id} className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">{item.model || 'Unknown Product'}</div>
                                <div className="text-xs text-gray-600">
                                  Total Linked: {totalLinkedQty} of {item.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">₱{item.unit_price}</div>
                                <div className="text-xs text-green-600">
                                  {totalLinkedQty >= item.quantity ? '✓ Complete' : 'Partial'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                      {purchaseOrder.purchase_order_items?.every((item: any) => {
                        const linkedItems = itemLinks.filter(link => link.purchase_order_item?.id === item.id);
                        const totalLinkedQty = linkedItems.reduce((total, link) => total + link.linked_quantity, 0);
                        return totalLinkedQty === 0;
                      }) && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No items linked yet
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No items linked
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items to be Delivered */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package size={16} />
                    <span>Items to be Delivered</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {purchaseOrder.purchase_order_items && purchaseOrder.purchase_order_items.length > 0 ? (
                    <div className="space-y-3">
                      {purchaseOrder.purchase_order_items.map((item: any) => {
                        // Get linked quantity from itemLinks
                        const linkedQuantity = itemLinks
                          .filter(link => link.purchase_order_item?.id === item.id)
                          .reduce((total, link) => total + link.linked_quantity, 0);
                        
                        const remainingQuantity = item.quantity - linkedQuantity;
                        
                        // Only show items that still need to be delivered (not fully linked)
                        return remainingQuantity > 0 ? (
                          <ItemDeliveryStatus 
                            key={item.id}
                            item={item}
                            className="p-3 bg-gray-50 rounded border-l-4 border-l-blue-400"
                          />
                        ) : null;
                      })}
                      {purchaseOrder.purchase_order_items.every((item: any) => {
                        const linkedQuantity = itemLinks
                          .filter(link => link.purchase_order_item?.id === item.id)
                          .reduce((total, link) => total + link.linked_quantity, 0);
                        return item.quantity - linkedQuantity <= 0;
                      }) && (
                        <div className="text-center py-4 text-green-600 text-sm">
                          ✓ All items have been delivered
                        </div>
                      )}
                      {purchaseOrder.purchase_order_items.filter((item: any) => {
                        const linkedQuantity = itemLinks
                          .filter(link => link.purchase_order_item?.id === item.id)
                          .reduce((total, link) => total + link.linked_quantity, 0);
                        return item.quantity - linkedQuantity > 0;
                      }).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No items pending delivery
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No items to deliver
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Third Row - Unit-Level Delivery Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck size={16} />
                  <span>Linked Delivery Units</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UnitTrackingLinksDisplay 
                  purchaseOrderId={purchaseOrderId}
                  onUnlink={() => {
                    // Refresh data when units are unlinked
                    handleDeliverySuccess();
                  }}
                />
              </CardContent>
            </Card>

            {/* Fourth Row - Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => setShowCreateDelivery(true)} 
                className="w-full"
                size="lg"
                disabled={purchaseOrder.status === 'completed'}
              >
                <Plus size={16} className="mr-2" />
                Record Delivery
              </Button>
              <Button 
                onClick={() => setShowCreateAdvanceDelivery(true)} 
                className="w-full"
                size="lg"
                variant="outline"
                disabled={(() => {
                  if (purchaseOrder.status === 'completed') return true;
                  
                  // Calculate total ordered vs total fulfilled (including both direct deliveries and linked items)
                  const totalOrdered = purchaseOrder.purchase_order_items?.reduce((total, item) => total + item.quantity, 0) || 0;
                  const totalLinked = itemLinks.reduce((total, link) => total + link.linked_quantity, 0);
                  const totalDirectDelivered = deliveries.reduce((total, delivery) => {
                    if (delivery.purchase_order_id === purchaseOrderId) {
                      const deliveryItemsForDelivery = deliveryItems[delivery.id] || [];
                      return total + deliveryItemsForDelivery.reduce((sum, item) => sum + item.quantity_delivered, 0);
                    }
                    return total;
                  }, 0);
                  
                  return totalOrdered <= (totalLinked + totalDirectDelivered);
                })()}
              >
                <Package size={16} className="mr-2" />
                Add Advance Delivery
              </Button>
              <Button 
                onClick={() => setShowBudgetPlan(true)} 
                className="w-full"
                size="lg"
                variant="secondary"
              >
                <Calculator size={16} className="mr-2" />
                Generate Budget Plan
              </Button>
            </div>

            {/* Notes */}
            {purchaseOrder.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{purchaseOrder.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showCreateDelivery && (
        <CreateDeliveryModal
          purchaseOrderId={purchaseOrderId}
          onClose={() => setShowCreateDelivery(false)}
          onSuccess={handleDeliverySuccess}
        />
      )}

      {showCreateAdvanceDelivery && (
        <LinkAdvanceDeliveryModal
          clientId={purchaseOrder?.supplier_client_id || ''}
          purchaseOrderId={purchaseOrderId}
          purchaseOrderDate={purchaseOrder?.due_date || purchaseOrder?.expected_delivery_date || purchaseOrder?.created_at}
          onClose={() => setShowCreateAdvanceDelivery(false)}
          onSuccess={handleAdvanceDeliverySuccess}
        />
      )}

      {showBudgetPlan && (
        <BudgetPlanModal
          purchaseOrderId={purchaseOrderId}
          onClose={() => setShowBudgetPlan(false)}
        />
      )}
    </>
  );
};
