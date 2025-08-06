import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar, Package, AlertCircle, CheckCircle, Link, BarChart3, Search } from 'lucide-react';
import { deliveryService } from '@/services/deliveryService';
import { Delivery } from '@/types/purchaseOrder';
import { DeliveryItemLinkingInterface } from './DeliveryItemLinkingInterface';
import { LinkConfirmationModal } from './LinkConfirmationModal';
import { DeliveryItemsDisplay } from './DeliveryItemsDisplay';
import { toast } from 'sonner';
import { getAvailableMatchingItems, getDeliveryLinkingStatus } from '@/utils/deliveryLinkingUtils';
import { AvailabilityDisplay } from './AvailabilityDisplay';

interface LinkAdvanceDeliveryModalProps {
  clientId: string;
  purchaseOrderId: string;
  purchaseOrderDate?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LinkAdvanceDeliveryModal = ({ 
  clientId,
  purchaseOrderId,
  purchaseOrderDate,
  onClose, 
  onSuccess 
}: LinkAdvanceDeliveryModalProps) => {
  const [advanceDeliveries, setAdvanceDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<Record<string, any[]>>({});
  const [poItems, setPOItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId, purchaseOrderId]);

  // Filter deliveries based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDeliveries(advanceDeliveries);
    } else {
      const filtered = advanceDeliveries.filter(delivery => 
        delivery.delivery_receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeliveries(filtered);
    }
  }, [advanceDeliveries, searchTerm]);

  const fetchData = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch advance deliveries for the client and PO items in parallel
      const [deliveries, poData] = await Promise.all([
        deliveryService.getAdvanceDeliveriesByClient(clientId),
        import('@/services/purchaseOrderService').then(({ purchaseOrderService }) => 
          purchaseOrderService.getPurchaseOrderWithItems(purchaseOrderId)
        )
      ]);
      
      setAdvanceDeliveries(deliveries);
      setPOItems(poData?.purchase_order_items || []);

      // Fetch delivery items for each advance delivery
      if (deliveries.length > 0) {
        const deliveryItemsData: Record<string, any[]> = {};
        const validationErrorsData: Record<string, string> = {};

        await Promise.all(
          deliveries.map(async (delivery) => {
            try {
              // Since getAdvanceDeliveriesByClient now returns delivery_items, use them directly
              const items = delivery.delivery_items || [];
              deliveryItemsData[delivery.id] = items;

              // Enhanced validation with detailed comparison
              const validationMessages: string[] = [];
              
              // Check if delivery has matching products with PO that aren't fully linked
              const availableMatchingItems = await getAvailableMatchingItems(delivery.id, purchaseOrderId, items, poData?.purchase_order_items || []);
              
              if (availableMatchingItems.length === 0 && items.length > 0) {
                // Check if there are any product matches at all
                const hasAnyMatchingProduct = items.some(item => 
                  poData?.purchase_order_items?.some(poItem => 
                    poItem.product_id === item.product_id
                  )
                );
                
                if (hasAnyMatchingProduct) {
                  validationMessages.push('All matching items in this delivery are already fully linked to other purchase orders');
                } else {
                  validationMessages.push('No products in this delivery match the purchase order items');
                }
              }

              // Note: We no longer prevent linking based on delivery date vs PO date
              // Advance deliveries are allowed to be linked regardless of timing

              if (validationMessages.length > 0) {
                validationErrorsData[delivery.id] = validationMessages.join('; ');
              }
            } catch (error) {
              console.error(`Error processing delivery items for ${delivery.id}:`, error);
              deliveryItemsData[delivery.id] = [];
              validationErrorsData[delivery.id] = 'Error loading delivery items';
            }
          })
        );
        
        setDeliveryItems(deliveryItemsData);
        setValidationErrors(validationErrorsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch advance deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDelivery = async (delivery: Delivery) => {
    // Check for validation errors before proceeding
    if (validationErrors[delivery.id]) {
      toast.error(validationErrors[delivery.id]);
      return;
    }

    // Set selected delivery and show confirmation modal
    setSelectedDelivery(delivery);
    setShowConfirmation(true);
  };

  const handleConfirmLinking = async (linkItems: any[]) => {
    if (!selectedDelivery) return;

    setLinking(selectedDelivery.id);
    try {
      // Use ONLY item-level linking to allow deliveries to link to multiple POs
      if (linkItems.length > 0 && linkItems[0].actualLinkQuantity !== undefined) {
        // Import the delivery item link service
        const { deliveryItemLinkService } = await import('@/services/deliveryItemLinkService');
        
        // Create delivery item links
        const linkData = linkItems.map(item => ({
          delivery_item_id: item.deliveryItemId,
          purchase_order_item_id: item.poItemId,
          linked_quantity: item.actualLinkQuantity
        }));
        
        await deliveryItemLinkService.createMultipleDeliveryItemLinks(linkData);
        
        // DO NOT update delivery.purchase_order_id - this prevents multiple PO linking
        // The delivery remains "advance" and can be linked to multiple POs via item links
        
        toast.success(`Successfully linked ${linkItems.length} specific items from delivery to purchase order`);
      } else {
        toast.error('No items selected for linking');
        return;
      }
      
      setShowConfirmation(false);
      setSelectedDelivery(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error linking delivery:', error);
      toast.error('Failed to link advance delivery');
    } finally {
      setLinking(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package size={20} />
            <span>Link Advance Delivery</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="full-delivery" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="full-delivery" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Link Full Delivery
            </TabsTrigger>
            <TabsTrigger value="item-level" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link Individual Items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full-delivery" className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by DR number or delivery ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
              <AlertCircle size={16} className="inline mr-2" />
              Select an existing advance delivery to link to this purchase order. Only deliveries with matching products can be linked.
            </div>

          {!clientId ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <div className="text-lg font-medium mb-2">No Client Information</div>
              <div className="text-sm">
                Client information is required to link advance deliveries.
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading advance deliveries...</span>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <div className="text-lg font-medium mb-2">
                {searchTerm ? 'No Matching Deliveries Found' : 'No Advance Deliveries Found'}
              </div>
              <div className="text-sm">
                {searchTerm 
                  ? `No deliveries found matching "${searchTerm}". Try a different search term.`
                  : 'No advance deliveries found for this client that can be linked to this purchase order.'
                }
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeliveries.map((delivery) => {
                const hasError = validationErrors[delivery.id];
                const items = deliveryItems[delivery.id] || [];
                
                return (
                  <Card key={delivery.id} className={`hover:shadow-md transition-shadow ${hasError ? 'border-red-200 bg-red-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {delivery.delivery_receipt_number || `Delivery #${delivery.id.slice(0, 8)}`}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {delivery.purchase_order_id ? 'Partially Linked' : 'Advance Delivery'}
                            </Badge>
                            {hasError && (
                              <Badge variant="destructive" className="text-xs">
                                Cannot Link
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{new Date(delivery.delivery_date).toLocaleDateString()}</span>
                              {purchaseOrderDate && (
                                <span className="text-xs ml-2">
                                  (PO: {new Date(purchaseOrderDate).toLocaleDateString()})
                                </span>
                              )}
                            </div>
                            {items.length > 0 && (
                              <div className="text-xs">
                                {items.length} item{items.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>

                          {/* Show delivery items with improved arrangement */}
                          {items.length > 0 && (
                            <DeliveryItemsDisplay 
                              items={items}
                              poItems={poItems}
                            />
                          )}

                          {hasError && (
                            <div className="text-sm text-red-600 mb-3 flex items-center gap-1">
                              <AlertCircle size={16} />
                              <span>{hasError}</span>
                            </div>
                          )}

                          {delivery.notes && (
                            <div className="text-sm text-gray-600 mb-3">
                              <strong>Notes:</strong> {delivery.notes}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col gap-2">
                          {/* Business Analysis Button */}
                          <Button
                            onClick={() => handleLinkDelivery(delivery)}
                            disabled={linking === delivery.id || !!hasError}
                            size="sm"
                            variant={hasError ? "outline" : "default"}
                            className="w-full"
                          >
                            {linking === delivery.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : hasError ? (
                              <>
                                <AlertCircle size={16} className="mr-2" />
                                Cannot Link
                              </>
                            ) : (
                              <>
                                <BarChart3 size={16} className="mr-2" />
                                Analyze & Link
                              </>
                            )}
                          </Button>
                          
                           {/* Show matching summary with availability */}
                          {!hasError && items.length > 0 && (
                            <AvailabilityDisplay 
                              deliveryId={delivery.id}
                              purchaseOrderId={purchaseOrderId}
                              deliveryItems={items}
                              poItems={poItems}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </TabsContent>

          <TabsContent value="item-level" className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by DR number or delivery ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
              <AlertCircle size={16} className="inline mr-2" />
              Link specific items from deliveries to purchase order items. This allows partial linking and keeps remaining quantities available for other purchase orders.
            </div>
            
            {!clientId ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <div className="text-lg font-medium mb-2">No Client Information</div>
                <div className="text-sm">
                  Client information is required for item-level linking.
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading deliveries...</span>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <div className="text-lg font-medium mb-2">
                  {searchTerm ? 'No Matching Deliveries Found' : 'No Advance Deliveries Found'}
                </div>
                <div className="text-sm">
                  {searchTerm 
                    ? `No deliveries found matching "${searchTerm}". Try a different search term.`
                    : 'No advance deliveries found for this client.'
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">
                            {delivery.delivery_receipt_number || `Delivery #${delivery.id.slice(0, 8)}`}
                          </h3>
                          <div className="text-sm text-gray-600">
                            {new Date(delivery.delivery_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Item-Level Linking
                        </Badge>
                      </div>
                      
                      <DeliveryItemLinkingInterface
                        deliveryId={delivery.id}
                        purchaseOrderId={purchaseOrderId}
                        onLinkingComplete={onSuccess}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Link Confirmation Modal */}
        {showConfirmation && selectedDelivery && (
          <LinkConfirmationModal
            isOpen={showConfirmation}
            onClose={() => {
              setShowConfirmation(false);
              setSelectedDelivery(null);
            }}
            onConfirm={handleConfirmLinking}
            delivery={selectedDelivery}
            deliveryItems={deliveryItems[selectedDelivery.id] || []}
            poItems={poItems}
            loading={linking === selectedDelivery.id}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};