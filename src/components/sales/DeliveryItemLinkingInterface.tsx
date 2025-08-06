import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, CheckCircle, AlertCircle, Link } from 'lucide-react';
import { deliveryService } from '@/services/deliveryService';
import { deliveryItemLinkService } from '@/services/deliveryItemLinkService';
import { getAvailableMatchingItems } from '@/utils/deliveryLinkingUtils';
import { toast } from 'sonner';

interface DeliveryItem {
  id: string;
  product_id?: string;
  quantity_delivered: number;
  products?: {
    id: string;
    name: string;
    sku?: string;
    color?: string;
  };
}

interface POItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

interface ItemLink {
  deliveryItemId: string;
  poItemId: string;
  linkQuantity: number;
  maxQuantity: number;
  productName: string;
  deliveredQuantity: number;
  poQuantity: number;
  availableDeliveryQuantity: number;
  availablePOQuantity: number;
  existingLinkedQuantity: number;
}

interface DeliveryItemLinkingInterfaceProps {
  deliveryId: string;
  purchaseOrderId: string;
  onLinkingComplete?: () => void;
}

export const DeliveryItemLinkingInterface = ({ 
  deliveryId, 
  purchaseOrderId, 
  onLinkingComplete 
}: DeliveryItemLinkingInterfaceProps) => {
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [itemLinks, setItemLinks] = useState<ItemLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [deliveryId, purchaseOrderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch delivery with items and PO with items
      const [deliveryData, poData] = await Promise.all([
        deliveryService.getDeliveryWithItems(deliveryId),
        import('@/services/purchaseOrderService').then(({ purchaseOrderService }) => 
          purchaseOrderService.getPurchaseOrderWithItems(purchaseOrderId)
        )
      ]);

      const dItems = deliveryData?.delivery_items || [];
      const pItems = poData?.purchase_order_items || [];
      
      setDeliveryItems(dItems);
      setPOItems(pItems);

      // Get available matching items considering existing links
      const availableItems = await getAvailableMatchingItems(
        deliveryId,
        purchaseOrderId,
        dItems,
        pItems
      );

      // Create item links based on available matches
      const links: ItemLink[] = availableItems.map(availableItem => {
        const suggestedQuantity = Math.min(
          availableItem.availableDeliveryQuantity,
          availableItem.availablePOQuantity
        );

        return {
          deliveryItemId: availableItem.deliveryItem.id,
          poItemId: availableItem.poItem.id,
          linkQuantity: suggestedQuantity,
          maxQuantity: availableItem.maxLinkableQuantity,
          productName: (availableItem.deliveryItem as any).products?.name || 
                      (availableItem.deliveryItem as any).product?.name || 
                      availableItem.poItem.model || 'Unknown Product',
          deliveredQuantity: availableItem.deliveryItem.quantity_delivered,
          poQuantity: availableItem.poItem.quantity,
          availableDeliveryQuantity: availableItem.availableDeliveryQuantity,
          availablePOQuantity: availableItem.availablePOQuantity,
          existingLinkedQuantity: availableItem.deliveryItem.quantity_delivered - availableItem.availableDeliveryQuantity
        };
      });
      
      setItemLinks(links);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load linking data');
    } finally {
      setLoading(false);
    }
  };

  const updateLinkQuantity = (index: number, quantity: number) => {
    const updatedLinks = [...itemLinks];
    const link = updatedLinks[index];
    const validQuantity = Math.max(0, Math.min(quantity, link.maxQuantity));
    
    updatedLinks[index] = {
      ...link,
      linkQuantity: validQuantity
    };
    
    setItemLinks(updatedLinks);
  };

  const handleLinkItems = async () => {
    const validLinks = itemLinks.filter(link => link.linkQuantity > 0);
    
    if (validLinks.length === 0) {
      toast.error('Please specify quantities to link');
      return;
    }

    setLinking(true);
    try {
      // Use the new delivery item link service directly
      await deliveryItemLinkService.createMultipleDeliveryItemLinks(
        validLinks.map(link => ({
          delivery_item_id: link.deliveryItemId,
          purchase_order_item_id: link.poItemId,
          linked_quantity: link.linkQuantity
        }))
      );

      // Update PO status after linking
      try {
        const { purchaseOrderService } = await import('@/services/purchaseOrderService');
        await purchaseOrderService.updatePurchaseOrderStatus(purchaseOrderId);
      } catch (statusError) {
        console.error('Error updating PO status after linking items:', statusError);
      }

      toast.success(`Successfully linked ${validLinks.length} delivery items to purchase order`);
      onLinkingComplete?.();
    } catch (error) {
      console.error('Error linking items:', error);
      toast.error('Failed to link delivery items');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading linking interface...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Link Individual Delivery Items
        </h3>
        <Badge variant="outline">
          {itemLinks.length} Matching Product{itemLinks.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {itemLinks.length === 0 ? (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">No Matching Products</h4>
              <p className="text-sm text-yellow-700">
                No products in this delivery match the purchase order items. Please check the product catalog or delivery contents.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Item Linking Grid */}
          <div className="space-y-4">
            {itemLinks.map((link, index) => (
              <Card key={`${link.deliveryItemId}-${link.poItemId}`} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{link.productName}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-4">
                          <span>Delivered: <strong>{link.deliveredQuantity}</strong></span>
                          <span>PO Required: <strong>{link.poQuantity}</strong></span>
                          <span>Available to Link: <strong>{link.maxQuantity}</strong></span>
                          {link.existingLinkedQuantity > 0 && (
                            <span className="text-green-600">Already Linked: <strong>{link.existingLinkedQuantity}</strong></span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.linkQuantity > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Link Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        max={link.maxQuantity}
                        value={link.linkQuantity}
                        onChange={(e) => updateLinkQuantity(index, parseInt(e.target.value) || 0)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Status</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 rounded text-sm">
                        {link.linkQuantity === 0 ? (
                          <span className="text-gray-500">Not Linked</span>
                        ) : link.linkQuantity === link.maxQuantity ? (
                          <span className="text-green-600">Full Match</span>
                        ) : (
                          <span className="text-blue-600">Partial Link</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">After Linking</Label>
                      <div className="mt-1 px-3 py-2 bg-blue-50 rounded text-sm font-medium">
                        <span className="text-blue-700">
                          DR Available: {link.availableDeliveryQuantity - link.linkQuantity} | 
                          PO Needed: {link.availablePOQuantity - link.linkQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary and Actions */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Linking Summary</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {itemLinks.filter(link => link.linkQuantity > 0).length} of {itemLinks.length} items will be linked
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedLinks = itemLinks.map(link => ({
                        ...link,
                        linkQuantity: link.maxQuantity
                      }));
                      setItemLinks(updatedLinks);
                    }}
                  >
                    Link All Max
                  </Button>
                  <Button
                    onClick={handleLinkItems}
                    disabled={linking || itemLinks.filter(link => link.linkQuantity > 0).length === 0}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {linking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Linking...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 mr-2" />
                        Link Items
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};