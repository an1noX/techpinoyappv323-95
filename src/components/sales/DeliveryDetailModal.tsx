import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Package, Truck, FileText } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { usePurchaseOrdersEnhanced } from '@/hooks/usePurchaseOrdersEnhanced';
import { deliveryService } from '@/services/deliveryService';
import { Delivery } from '@/types/purchaseOrder';

interface DeliveryDetailModalProps {
  deliveryId: string;
  onClose: () => void;
}

export const DeliveryDetailModal = ({ deliveryId, onClose }: DeliveryDetailModalProps) => {
  const { getPurchaseOrderWithDetails } = usePurchaseOrdersEnhanced();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<any[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deliveryData, deliveryWithItems] = await Promise.all([
          deliveryService.getDeliveryById(deliveryId),
          deliveryService.getDeliveryWithItems(deliveryId)
        ]);
        
        // Add this console.log to inspect the data
        console.log('Delivery items:', deliveryWithItems?.delivery_items);
        
        setDelivery(deliveryData);
        setDeliveryItems(deliveryWithItems?.delivery_items || []);

        if (deliveryData?.purchase_order_id) {
          const poData = await getPurchaseOrderWithDetails(deliveryData.purchase_order_id);
          setPurchaseOrder(poData);
        }
      } catch (error) {
        console.error('Error fetching delivery details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deliveryId, getPurchaseOrderWithDetails]);

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Loading delivery details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!delivery) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Delivery not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Truck size={20} />
            <span>
              {delivery.delivery_receipt_number || `Delivery #${delivery.id.slice(0, 8)}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery Date:</span>
                  <span className="font-medium">{new Date(delivery.delivery_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Receipt Number:</span>
                  <span className="font-medium">{delivery.delivery_receipt_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">{new Date(delivery.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {purchaseOrder && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Related Purchase Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">PO ID:</span>
                    <span className="font-medium">#{purchaseOrder.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="font-medium">{purchaseOrder.supplier_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{purchaseOrder.status}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Delivered Items */}
          {deliveryItems && deliveryItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package size={16} />
                  <span>Delivered Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveryItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        {/* Color indicator */}
                        {item.products?.color && (
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: item.products.color }}
                            title={item.products.color}
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {item.products?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-600">
                            SKU: {item.products?.sku || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          Qty: {item.quantity_delivered}
                        </div>
                        {/* Temporarily remove status until we confirm its purpose */}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {delivery.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText size={16} />
                  <span>Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{delivery.notes}</p>
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
  );
};
