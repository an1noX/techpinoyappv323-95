import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowLeft, ChevronDown, ChevronRight, Package, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryItem {
  id: string;
  product_id: string;
  quantity: number;
  price?: number;
  total?: number;
  purpose?: 'warranty' | 'replacement' | 'demo' | null;
  products?: {
    id: string;
    name: string;
  };
}

interface Delivery {
  id: string;
  delivery_receipt_number: string;
  delivery_date: string;
  delivery_items?: DeliveryItem[];
  purchase_order_id?: string | null;
  notes?: string | null;
  client_id: string;
}

interface PurchaseOrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total?: number;
  product_id?: string;
  products?: {
    id: string;
    name: string;
  };
}

interface PurchaseOrder {
  id: string;
  purchase_order_number: string;
  created_at: string;
  supplier_name?: string;
  total_amount?: number;
  supplier_client_id?: string;
  purchase_order_items: PurchaseOrderItem[];
}

interface MatchedItem {
  deliveryItemId: string;
  poItemId: string;
  itemName: string;
  deliveryQuantity: number;
  poQuantity: number;
  maxFulfillable: number;
  selectedQuantity: number;
}

interface AutoMatchFulfillmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPO: PurchaseOrder;
  onCreateFulfillments: (fulfillments: Array<{
    dr_id: string;
    dr_item_id: string;
    po_id: string;
    po_item_id: string;
    fulfilled_quantity: number;
    date: string;
  }>) => void;
}

export const AutoMatchFulfillmentDialog = ({ 
  open, 
  onOpenChange, 
  selectedPO,
  onCreateFulfillments 
}: AutoMatchFulfillmentDialogProps) => {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [existingFulfillments, setExistingFulfillments] = useState<Array<{
    id: string;
    dr_item_id: string;
    po_item_id: string;
    fulfilled_quantity: number;
  }>>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<Map<string, MatchedItem>>(new Map());
  const [loading, setLoading] = useState(false);
  const [expandedDeliveries, setExpandedDeliveries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && selectedPO) {
      loadDeliveries();
      loadExistingFulfillments();
    }
  }, [open, selectedPO]);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      // Debug: log the supplier_client_id and full PO details
      console.log('🔍 AutoMatchFulfillmentDialog Debug:', {
        poId: selectedPO.id,
        supplier_client_id: selectedPO.supplier_client_id,
        supplier_name: selectedPO.supplier_name,
        fullPO: selectedPO
      });
      
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          delivery_items (
            id,
            product_id,
            quantity_delivered,
            purpose,
            products (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by same client if PO has supplier_client_id
      if (selectedPO.supplier_client_id) {
        query = query.eq('client_id', selectedPO.supplier_client_id);
        console.log('✅ Filtering deliveries by client_id:', selectedPO.supplier_client_id);
      } else {
        console.warn('⚠️ No supplier_client_id found in PO - will show NO deliveries to prevent confusion');
        // If no supplier_client_id, return empty result to avoid confusion
        setDeliveries([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform to match interface
      const transformedDeliveries: Delivery[] = (data || []).map(delivery => ({
        id: delivery.id,
        delivery_receipt_number: delivery.delivery_receipt_number,
        delivery_date: delivery.delivery_date,
        purchase_order_id: delivery.purchase_order_id,
        notes: delivery.notes,
        client_id: delivery.client_id,
        delivery_items: (delivery as any).delivery_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity_delivered,
          purpose: item.purpose,
          products: item.products
        })) || []
      }));

      console.log('✅ Loaded deliveries for client:', {
        clientId: selectedPO.supplier_client_id,
        deliveryCount: transformedDeliveries.length,
        deliveries: transformedDeliveries.map(d => ({ 
          id: d.id, 
          number: d.delivery_receipt_number, 
          client_id: d.client_id,
          itemCount: d.delivery_items?.length || 0
        }))
      });
      setDeliveries(transformedDeliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast({
        title: "Error loading deliveries",
        description: "Failed to load delivery data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingFulfillments = async () => {
    try {
      // Load ALL fulfillments to properly track delivery item usage across all POs
      const { data, error } = await supabase
        .from('fulfillments')
        .select('id, dr_item_id, po_item_id, fulfilled_quantity');

      if (error) throw error;

      setExistingFulfillments(data || []);
      console.log('Loaded all fulfillments:', data);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
    }
  };

  // Find deliveries that have matching items with the PO and still have remaining quantities
  const getDeliveriesWithMatches = () => {
    return deliveries.filter(delivery => {
      return delivery.delivery_items?.some(deliveryItem => {
        // Exclude items with special purposes from matching
        if (deliveryItem.purpose && ['warranty', 'replacement', 'demo'].includes(deliveryItem.purpose)) {
          return false;
        }
        
        // Check if this delivery item has remaining quantity
        const remainingQuantity = getDeliveryItemRemainingQuantity(deliveryItem.id, deliveryItem.quantity);
        if (remainingQuantity <= 0) return false;
        
        // Check if it matches any PO item that still needs fulfillment
        return selectedPO.purchase_order_items.some(poItem => {
          if (deliveryItem.products?.name === poItem.products?.name) {
            const alreadyFulfilled = getAlreadyFulfilledQuantity(poItem.id);
            const poRemainingNeeded = Math.max(0, poItem.quantity - alreadyFulfilled);
            return poRemainingNeeded > 0;
          }
          return false;
        });
      }) || false;
    });
  };

  // Calculate already fulfilled quantities for PO items
  const getAlreadyFulfilledQuantity = (poItemId: string) => {
    return existingFulfillments
      .filter(f => f.po_item_id === poItemId)
      .reduce((sum, f) => sum + f.fulfilled_quantity, 0);
  };

  // Calculate remaining quantity for delivery items (how much has been used already)
  const getDeliveryItemRemainingQuantity = (deliveryItemId: string, originalQuantity: number) => {
    const alreadyUsed = existingFulfillments
      .filter(f => f.dr_item_id === deliveryItemId)
      .reduce((sum, f) => sum + f.fulfilled_quantity, 0);
    
    return Math.max(0, originalQuantity - alreadyUsed);
  };

  // Find matching items between selected delivery and PO
  const getMatchingItemsForDelivery = (delivery: Delivery) => {
    const matches: MatchedItem[] = [];
    
    delivery.delivery_items?.forEach(deliveryItem => {
      // Exclude items with special purposes from matching
      if (deliveryItem.purpose && ['warranty', 'replacement', 'demo'].includes(deliveryItem.purpose)) {
        return;
      }
      
      // First check if this delivery item has any remaining quantity
      const deliveryRemainingQuantity = getDeliveryItemRemainingQuantity(deliveryItem.id, deliveryItem.quantity);
      
      if (deliveryRemainingQuantity > 0) {
        selectedPO.purchase_order_items.forEach(poItem => {
          if (deliveryItem.products?.name === poItem.products?.name) {
            // Calculate remaining quantity needed for this PO item
            const alreadyFulfilled = getAlreadyFulfilledQuantity(poItem.id);
            const poRemainingNeeded = Math.max(0, poItem.quantity - alreadyFulfilled);
            
            // Only include items that still need fulfillment AND have delivery quantity available
            if (poRemainingNeeded > 0) {
              // The maximum we can fulfill is the minimum of:
              // 1. What the delivery has remaining
              // 2. What the PO still needs
              const maxFulfillable = Math.min(deliveryRemainingQuantity, poRemainingNeeded);
              
              matches.push({
                deliveryItemId: deliveryItem.id,
                poItemId: poItem.id,
                itemName: deliveryItem.products?.name || `Product ${deliveryItem.product_id}`,
                deliveryQuantity: deliveryRemainingQuantity, // Show remaining delivery quantity instead of original
                poQuantity: poRemainingNeeded, // Show remaining needed instead of total
                maxFulfillable,
                selectedQuantity: maxFulfillable
              });
            }
          }
        });
      }
    });

    return matches;
  };

  // Get detailed breakdown of delivery items vs PO items
  const getDeliveryItemsBreakdown = (delivery: Delivery) => {
    const breakdown = {
      matching: [] as Array<{
        deliveryItem: DeliveryItem;
        poItem: PurchaseOrderItem;
        remainingQty: number;
        maxFulfillable: number;
      }>,
      nonMatching: [] as DeliveryItem[]
    };

    delivery.delivery_items?.forEach(deliveryItem => {
      const remainingQty = getDeliveryItemRemainingQuantity(deliveryItem.id, deliveryItem.quantity);
      let foundMatch = false;

      // Exclude items with special purposes from matching
      if (deliveryItem.purpose && ['warranty', 'replacement', 'demo'].includes(deliveryItem.purpose)) {
        if (remainingQty > 0) {
          breakdown.nonMatching.push(deliveryItem);
        }
        return;
      }

      selectedPO.purchase_order_items.forEach(poItem => {
        if (deliveryItem.products?.name === poItem.products?.name) {
          const alreadyFulfilled = getAlreadyFulfilledQuantity(poItem.id);
          const poRemainingNeeded = Math.max(0, poItem.quantity - alreadyFulfilled);
          
          if (poRemainingNeeded > 0 && remainingQty > 0) {
            const maxFulfillable = Math.min(remainingQty, poRemainingNeeded);
            breakdown.matching.push({
              deliveryItem,
              poItem,
              remainingQty,
              maxFulfillable
            });
            foundMatch = true;
          }
        }
      });

      if (!foundMatch && remainingQty > 0) {
        breakdown.nonMatching.push(deliveryItem);
      }
    });

    return breakdown;
  };

  const toggleDeliveryExpansion = (deliveryId: string) => {
    const newExpanded = new Set(expandedDeliveries);
    if (newExpanded.has(deliveryId)) {
      newExpanded.delete(deliveryId);
    } else {
      newExpanded.add(deliveryId);
    }
    setExpandedDeliveries(newExpanded);
  };

  const deliveriesWithMatches = getDeliveriesWithMatches();
  const matchingItems = selectedDelivery ? getMatchingItemsForDelivery(selectedDelivery) : [];

  const handleSelectDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    
    // Automatically select all matching items with max fulfillable quantities
    const matches = getMatchingItemsForDelivery(delivery);
    const autoSelectedMatches = new Map<string, MatchedItem>();
    
    matches.forEach(match => {
      const matchKey = `${match.deliveryItemId}-${match.poItemId}`;
      autoSelectedMatches.set(matchKey, match);
    });
    
    setSelectedMatches(autoSelectedMatches);
  };

  const toggleItemSelection = (matchKey: string, match: MatchedItem) => {
    const newSelected = new Map(selectedMatches);
    if (newSelected.has(matchKey)) {
      newSelected.delete(matchKey);
    } else {
      newSelected.set(matchKey, match);
    }
    setSelectedMatches(newSelected);
  };

  const updateQuantity = (matchKey: string, quantity: number) => {
    const match = selectedMatches.get(matchKey);
    if (match) {
      const updatedMatch = { ...match, selectedQuantity: Math.min(quantity, match.maxFulfillable) };
      setSelectedMatches(new Map(selectedMatches.set(matchKey, updatedMatch)));
    }
  };

  const handleCreateFulfillments = () => {
    if (!selectedDelivery) return;

    const fulfillments = Array.from(selectedMatches.values()).map(match => ({
      dr_id: selectedDelivery.id,
      dr_item_id: match.deliveryItemId,
      po_id: selectedPO.id,
      po_item_id: match.poItemId,
      fulfilled_quantity: match.selectedQuantity,
      date: new Date().toISOString().split('T')[0]
    }));

    if (fulfillments.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to fulfill",
        variant: "destructive",
      });
      return;
    }

    onCreateFulfillments(fulfillments);
    setSelectedMatches(new Map());
    setSelectedDelivery(null);
    onOpenChange(false);
  };

  const handleBackToDeliveryList = () => {
    setSelectedDelivery(null);
    setSelectedMatches(new Map());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="auto-match-description">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {selectedDelivery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDeliveryList}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-business-green">
              {selectedDelivery 
                ? `Match Items: DR ${selectedDelivery.delivery_receipt_number} → PO ${selectedPO.purchase_order_number}`
                : `Select Delivery to Link with PO ${selectedPO.purchase_order_number}`
              }
            </DialogTitle>
          </div>
          <div id="auto-match-description" className="text-sm text-muted-foreground">
            {selectedDelivery 
              ? "Select items to fulfill from the delivery receipt and specify quantities."
              : "Choose a delivery receipt that contains items matching this purchase order."
            }
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading deliveries...</p>
            </div>
          ) : !selectedDelivery ? (
            // Delivery Selection View
            <>
              {deliveriesWithMatches.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="space-y-3">
                      <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">No matching deliveries found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {!selectedPO.supplier_client_id 
                            ? "This purchase order doesn't have a supplier/client assigned"
                            : `No delivery receipts found for client: ${selectedPO.supplier_name || selectedPO.supplier_client_id}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total deliveries checked: {deliveries.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a delivery that contains items matching this purchase order. Click to expand and see item details.
                  </p>
                  {deliveriesWithMatches.map(delivery => {
                    const breakdown = getDeliveryItemsBreakdown(delivery);
                    const matchCount = breakdown.matching.length;
                    const nonMatchCount = breakdown.nonMatching.length;
                    const isExpanded = expandedDeliveries.has(delivery.id);
                    
                    return (
                      <Card key={delivery.id} className="border">
                        <Collapsible 
                          open={isExpanded} 
                          onOpenChange={() => toggleDeliveryExpansion(delivery.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <CollapsibleTrigger asChild>
                                <div className="cursor-pointer hover:bg-accent p-2 rounded flex items-center space-x-3 min-w-0 flex-1">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-business-blue truncate">DR {delivery.delivery_receipt_number}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Date: {new Date(delivery.delivery_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="default" className="bg-business-green">
                                  {matchCount} matching
                                </Badge>
                                {nonMatchCount > 0 && (
                                  <Badge variant="secondary">
                                    {nonMatchCount} non-matching
                                  </Badge>
                                )}
                                <Button 
                                  variant="business-blue"
                                  size="sm" 
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Select DR clicked for delivery:', delivery.id);
                                    handleSelectDelivery(delivery);
                                  }}
                                >
                                  Select DR
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-4">
                              {/* Matching Items */}
                              {breakdown.matching.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-business-green flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Matching Items ({breakdown.matching.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {breakdown.matching.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-4 h-4 text-business-green" />
                                          <span className="font-medium">{item.deliveryItem.products?.name}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          DR: {item.remainingQty} • PO needs: {item.poItem.quantity - getAlreadyFulfilledQuantity(item.poItem.id)} • Can fulfill: {item.maxFulfillable}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Non-matching Items */}
                              {breakdown.nonMatching.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-orange-600 flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Non-matching Items ({breakdown.nonMatching.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {breakdown.nonMatching.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-4 h-4 text-orange-600" />
                                          <span className="font-medium">{item.products?.name}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Available: {getDeliveryItemRemainingQuantity(item.id, item.quantity)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            // Item Matching View
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-business-blue">
                    Matching Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Item Name</TableHead>
                         <TableHead>DR Available</TableHead>
                         <TableHead>PO Remaining</TableHead>
                        <TableHead>Max Fulfillable</TableHead>
                        <TableHead>Fulfill Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {matchingItems.map((match) => {
                        const matchKey = `${match.deliveryItemId}-${match.poItemId}`;
                        const isSelected = selectedMatches.has(matchKey);
                        
                        return (
                          <TableRow key={matchKey}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleItemSelection(matchKey, match)}
                              >
                                {isSelected ? (
                                  <CheckCircle className="w-4 h-4 text-business-green" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{match.itemName}</TableCell>
                            <TableCell>{match.deliveryQuantity}</TableCell>
                            <TableCell>{match.poQuantity}</TableCell>
                            <TableCell>{match.maxFulfillable}</TableCell>
                            <TableCell>
                              {isSelected ? (
                                <Input
                                  type="number"
                                  value={selectedMatches.get(matchKey)?.selectedQuantity || 0}
                                  onChange={(e) => updateQuantity(matchKey, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  max={match.maxFulfillable}
                                  step="0.01"
                                  className="w-20"
                                />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedMatches.size} item(s) selected for fulfillment
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => onOpenChange(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button 
                    variant="business-green"
                    onClick={handleCreateFulfillments}
                    disabled={selectedMatches.size === 0}
                  >
                    Create Fulfillments ({selectedMatches.size})
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};