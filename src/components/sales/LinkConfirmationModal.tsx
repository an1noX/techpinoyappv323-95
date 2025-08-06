import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Package, DollarSign, Calendar } from 'lucide-react';

interface DeliveryItem {
  id: string;
  product_id?: string;
  quantity_delivered: number;
  products?: {
    name: string;
    sku?: string;
  };
}

interface POItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

interface LinkItem {
  deliveryItemId: string;
  poItemId: string;
  productName: string;
  deliveredQuantity: number;
  poQuantity: number;
  suggestedLinkQuantity: number;
  actualLinkQuantity: number;
  unitPrice: number;
  impact: 'positive' | 'negative' | 'neutral';
  reason: string;
}

interface LinkConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (linkItems: LinkItem[]) => void;
  delivery: {
    id: string;
    delivery_receipt_number?: string;
    delivery_date: string;
    notes?: string;
  };
  deliveryItems: DeliveryItem[];
  poItems: POItem[];
  loading?: boolean;
}

export const LinkConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  delivery,
  deliveryItems,
  poItems,
  loading = false
}: LinkConfirmationModalProps) => {
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Initialize link items when modal opens
  useEffect(() => {
    if (isOpen && deliveryItems.length > 0 && poItems.length > 0) {
      const initialLinkItems: LinkItem[] = [];
      
      deliveryItems.forEach(deliveryItem => {
        const matchingPOItem = poItems.find(poItem => 
          poItem.product_id === deliveryItem.product_id
        );
        
        if (matchingPOItem) {
          const suggestedQuantity = Math.min(
            deliveryItem.quantity_delivered,
            matchingPOItem.quantity
          );
          
          const impact = getBusinessImpact(deliveryItem, matchingPOItem);
          
          initialLinkItems.push({
            deliveryItemId: deliveryItem.id,
            poItemId: matchingPOItem.id,
            productName: deliveryItem.products?.name || matchingPOItem.model || 'Unknown Product',
            deliveredQuantity: deliveryItem.quantity_delivered,
            poQuantity: matchingPOItem.quantity,
            suggestedLinkQuantity: suggestedQuantity,
            actualLinkQuantity: suggestedQuantity,
            unitPrice: matchingPOItem.unit_price,
            impact: impact.type,
            reason: impact.reason
          });
        }
      });
      
      setLinkItems(initialLinkItems);
    }
  }, [isOpen, deliveryItems, poItems]);

  const getBusinessImpact = (deliveryItem: DeliveryItem, poItem: POItem) => {
    const deliveredQty = deliveryItem.quantity_delivered;
    const poQty = poItem.quantity;
    
    if (deliveredQty > poQty) {
      return {
        type: 'negative' as const,
        reason: `Over-delivery by ${deliveredQty - poQty} units. May require inventory adjustment.`
      };
    } else if (deliveredQty < poQty) {
      return {
        type: 'neutral' as const,
        reason: `Partial delivery. ${poQty - deliveredQty} units still needed.`
      };
    } else {
      return {
        type: 'positive' as const,
        reason: 'Perfect match. Complete fulfillment of PO requirement.'
      };
    }
  };

  const updateLinkQuantity = (index: number, quantity: number) => {
    const updatedItems = [...linkItems];
    const item = updatedItems[index];
    
    // Validate quantity
    const maxQuantity = Math.min(item.deliveredQuantity, item.poQuantity);
    const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    
    updatedItems[index] = {
      ...item,
      actualLinkQuantity: validQuantity
    };
    
    setLinkItems(updatedItems);
  };

  const getTotalValue = () => {
    return linkItems.reduce((total, item) => 
      total + (item.actualLinkQuantity * item.unitPrice), 0
    );
  };

  const getCompletionPercentage = () => {
    const totalPOQuantity = linkItems.reduce((total, item) => total + item.poQuantity, 0);
    const totalLinkedQuantity = linkItems.reduce((total, item) => total + item.actualLinkQuantity, 0);
    return totalPOQuantity > 0 ? (totalLinkedQuantity / totalPOQuantity) * 100 : 0;
  };

  const hasValidLinking = linkItems.some(item => item.actualLinkQuantity > 0);

  const businessAnalysis = {
    fulfillmentRate: getCompletionPercentage(),
    totalValue: getTotalValue(),
    itemsToLink: linkItems.filter(item => item.actualLinkQuantity > 0).length,
    totalItems: linkItems.length,
    overDeliveries: linkItems.filter(item => item.deliveredQuantity > item.poQuantity).length,
    underDeliveries: linkItems.filter(item => item.deliveredQuantity < item.poQuantity).length
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Confirm Delivery Linking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Delivery Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Delivery Details</span>
                <Badge variant="outline">
                  {delivery.delivery_receipt_number || `#${delivery.id.slice(0, 8)}`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(delivery.delivery_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span>{linkItems.length} matching items</span>
                </div>
              </div>
              {delivery.notes && (
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Notes:</strong> {delivery.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Impact Analysis */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Business Impact Analysis</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                >
                  {showAnalysis ? 'Hide' : 'Show'} Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {businessAnalysis.fulfillmentRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Fulfillment Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₱{businessAnalysis.totalValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {businessAnalysis.itemsToLink}/{businessAnalysis.totalItems}
                  </div>
                  <div className="text-xs text-gray-600">Items to Link</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {businessAnalysis.overDeliveries}
                  </div>
                  <div className="text-xs text-gray-600">Over-deliveries</div>
                </div>
              </div>

              {showAnalysis && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Linking {businessAnalysis.itemsToLink} items will fulfill {businessAnalysis.fulfillmentRate.toFixed(1)}% of PO requirements</span>
                    </div>
                    {businessAnalysis.overDeliveries > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>{businessAnalysis.overDeliveries} items have quantities exceeding PO requirements</span>
                      </div>
                    )}
                    {businessAnalysis.underDeliveries > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-yellow-500" />
                        <span>{businessAnalysis.underDeliveries} items are partially fulfilled</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Linking Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Item Quantities - Review & Edit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {linkItems.map((item, index) => (
                  <div key={`${item.deliveryItemId}-${item.poItemId}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <div className="text-sm text-gray-600">
                          Delivered: {item.deliveredQuantity} • PO Required: {item.poQuantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.impact === 'positive' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {item.impact === 'negative' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {item.impact === 'neutral' && <TrendingDown className="h-4 w-4 text-yellow-500" />}
                        <Badge variant={
                          item.impact === 'positive' ? 'default' : 
                          item.impact === 'negative' ? 'destructive' : 'secondary'
                        }>
                          {item.impact === 'positive' ? 'Perfect' : 
                           item.impact === 'negative' ? 'Over' : 'Partial'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Link Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          max={Math.min(item.deliveredQuantity, item.poQuantity)}
                          value={item.actualLinkQuantity}
                          onChange={(e) => updateLinkQuantity(index, parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <div className="mt-1 px-3 py-2 bg-gray-50 rounded text-sm">
                          ₱{item.unitPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Line Total</Label>
                        <div className="mt-1 px-3 py-2 bg-green-50 rounded text-sm font-medium">
                          ₱{(item.actualLinkQuantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Impact:</strong> {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Linking Summary</div>
                  <div className="text-xs text-gray-600">
                    {linkItems.filter(item => item.actualLinkQuantity > 0).length} items • 
                    {linkItems.reduce((sum, item) => sum + item.actualLinkQuantity, 0)} total units
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ₱{getTotalValue().toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(linkItems.filter(item => item.actualLinkQuantity > 0))}
            disabled={!hasValidLinking || loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Linking
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};