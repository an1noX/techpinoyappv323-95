import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Package, AlertCircle } from "lucide-react";

interface UnaccountedItem {
  id: string;
  product_name: string;
  quantity_remaining: number;
  delivery_receipt_number: string;
  delivery_date: string;
  product_id: string;
}

interface UnaccountedItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drNumbers: string[];
}

export function UnaccountedItemsModal({ open, onOpenChange, drNumbers }: UnaccountedItemsModalProps) {
  const { toast } = useToast();
  const [unaccountedItems, setUnaccountedItems] = useState<UnaccountedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && drNumbers.length > 0) {
      loadUnaccountedItems();
    }
  }, [open, drNumbers]);

  const loadUnaccountedItems = async () => {
    try {
      setLoading(true);
      
      // Get all deliveries that match the DR numbers
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          id,
          delivery_receipt_number,
          delivery_date,
          delivery_items (
            id,
            quantity_delivered,
            product_id,
            products (
              id,
              name
            )
          )
        `)
        .in('delivery_receipt_number', drNumbers);

      if (deliveriesError) throw deliveriesError;

      // Get all fulfillments to calculate remaining quantities
      const { data: fulfillments, error: fulfillmentsError } = await supabase
        .from('fulfillments')
        .select('*');

      if (fulfillmentsError) throw fulfillmentsError;

      const items: UnaccountedItem[] = [];

      // Process each delivery to find unaccounted items
      deliveries?.forEach(delivery => {
        delivery.delivery_items?.forEach(item => {
          // Calculate total fulfilled quantity for this item
          const itemFulfillments = fulfillments?.filter(f => f.dr_item_id === item.id) || [];
          const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
          const remainingQuantity = item.quantity_delivered - totalFulfilled;

          // Only include items with remaining quantity > 0
          if (remainingQuantity > 0) {
            items.push({
              id: item.id,
              product_name: item.products?.name || `Product ID: ${item.product_id}`,
              quantity_remaining: remainingQuantity,
              delivery_receipt_number: delivery.delivery_receipt_number || `DR-${delivery.id.slice(0, 8)}`,
              delivery_date: delivery.delivery_date,
              product_id: item.product_id
            });
          }
        });
      });

      setUnaccountedItems(items);
    } catch (error) {
      console.error('Error loading unaccounted items:', error);
      toast({
        title: "Error loading unaccounted items",
        description: "Failed to load unaccounted items details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
          <div className="flex items-center justify-center p-8">
            <div className="text-center py-8">Loading unaccounted items...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalUnaccountedItems = unaccountedItems.length;
  const totalQuantity = unaccountedItems.reduce((sum, item) => sum + item.quantity_remaining, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #unaccounted-detail-preview, #unaccounted-detail-preview * {
                visibility: visible !important;
              }
              #unaccounted-detail-preview {
                position: absolute !important;
                left: 0; top: 0; width: 100vw; min-height: 100vh;
                background: white !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 20px !important;
                z-index: 9999 !important;
              }
              .no-print {
                display: none !important;
              }
            }
            
            /* Mobile optimization styles */
            @media (max-width: 768px) {
              .mobile-optimized {
                max-width: 100vw !important;
                width: 100vw !important;
                max-h-[95vh] !important;
                margin: 0 !important;
                border-radius: 0 !important;
              }
              
              .mobile-scaled-content {
                transform: none !important;
                width: 100% !important;
                height: auto !important;
                padding: 12px !important;
                font-size: 12px;
                line-height: 1.3;
                touch-action: pinch-zoom;
                user-select: text;
              }
              
              .mobile-header {
                padding: 6px 8px !important;
                flex-wrap: wrap;
                gap: 4px !important;
              }
              
              .mobile-scroll-container {
                height: calc(95vh - 50px);
                overflow-x: auto;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                touch-action: manipulation;
              }
              
              /* Responsive text sizes */
              .mobile-scaled-content .text-2xl {
                font-size: 18px !important;
              }
              
              .mobile-scaled-content .text-xl {
                font-size: 16px !important;
              }
              
              .mobile-scaled-content .text-lg {
                font-size: 14px !important;
              }
              
              .mobile-scaled-content .text-base {
                font-size: 12px !important;
              }
              
              .mobile-scaled-content .text-sm {
                font-size: 11px !important;
              }
              
              .mobile-scaled-content .text-xs {
                font-size: 10px !important;
              }
              
              /* Grid layouts responsive */
              .mobile-scaled-content .grid-cols-2 {
                grid-template-columns: 1fr 1fr;
                gap: 8px;
              }
              
              /* Spacing adjustments */
              .mobile-scaled-content .space-y-6 > * + * {
                margin-top: 12px;
              }
              
              .mobile-scaled-content .space-y-4 > * + * {
                margin-top: 8px;
              }
              
              .mobile-scaled-content .space-y-2 > * + * {
                margin-top: 4px;
              }
              
              /* Button adjustments */
              .mobile-scaled-content button {
                font-size: 10px;
                padding: 4px 6px;
                min-height: 24px;
              }
            }
            
            @media (max-width: 480px) {
              .mobile-scaled-content {
                padding: 8px !important;
                font-size: 11px;
              }
              
              .mobile-header button {
                padding: 2px 4px !important;
                font-size: 9px !important;
                min-width: auto !important;
              }
              
              .mobile-scaled-content .text-2xl {
                font-size: 16px !important;
              }
              
              .mobile-scaled-content .text-xl {
                font-size: 14px !important;
              }
              
              .mobile-scaled-content .text-lg {
                font-size: 12px !important;
              }
              
              .mobile-scaled-content .grid-cols-2 {
                gap: 6px;
              }
            }
            
            /* Enhanced pinch-to-zoom support */
            @media (max-width: 768px) {
              .zoomable-content {
                touch-action: pinch-zoom;
                user-select: text;
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                overscroll-behavior: contain;
              }
            }
          `}
        </style>
        
        <div className="h-full flex flex-col bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b bg-white no-print mobile-header">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Unaccounted Items Details</span>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline" size="sm">
                  Print
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mobile-scroll-container">
            <div id="unaccounted-detail-preview" className="bg-white p-8 space-y-6 mobile-scaled-content zoomable-content">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">UNACCOUNTED ITEMS REPORT</h1>
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div className="text-left">
                    <p><strong>Delivery Receipts:</strong> {drNumbers.length} DRs</p>
                    <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Status:</strong> 
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                        UNACCOUNTED
                      </span>
                    </p>
                    <p><strong>Total Items:</strong> {totalUnaccountedItems}</p>
                  </div>
                </div>
              </div>

              {/* Summary Information */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 border-b">SUMMARY</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Delivery Receipts:</strong> {drNumbers.length}</p>
                    <p><strong>Unaccounted Items:</strong> {totalUnaccountedItems}</p>
                    <p><strong>Total Quantity:</strong> {totalQuantity}</p>
                    <p><strong>Status:</strong> Awaiting PO Assignment</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 border-b">DELIVERY RECEIPTS</h3>
                  <div className="text-sm space-y-1">
                    {drNumbers.map((drNumber, index) => (
                      <p key={index}><strong>DR #{index + 1}:</strong> {drNumber}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unaccounted Items Table */}
              {unaccountedItems.length > 0 ? (
                <div>
                  <h4 className="text-lg font-semibold mb-4 border-b pb-2">UNACCOUNTED ITEMS</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>DR Reference</TableHead>
                        <TableHead>Delivery Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unaccountedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{item.product_name}</span>
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                Unaccounted
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              Product ID: {item.product_id}
                            </div>
                          </TableCell>
                          <TableCell className="text-purple-800 font-medium">
                            {item.quantity_remaining}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Available
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-600">
                              {item.delivery_receipt_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {new Date(item.delivery_date).toLocaleDateString()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Summary Section */}
                  {unaccountedItems.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium mb-2">Unaccounted Items Summary</h5>
                      <p className="text-sm text-gray-600">
                        This report shows {totalUnaccountedItems} unaccounted item(s) 
                        from {drNumbers.length} delivery receipt(s). These items are awaiting PO assignment.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No unaccounted items found for the selected delivery receipts.
                </div>
              )}

              {/* Summary Information */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 border-b">UNACCOUNTED SUMMARY</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Total Delivery Receipts:</strong> {drNumbers.length}</p>
                    <p><strong>Total Unaccounted Items:</strong> {totalUnaccountedItems}</p>
                    <p><strong>Total Quantity:</strong> {totalQuantity}</p>
                    <p><strong>Status:</strong> 
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                        UNACCOUNTED
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 border-b">NOTES</h3>
                  <div className="text-sm">
                    These items require PO assignment to proceed with fulfillment processing. 
                    Contact the procurement team to link these items to appropriate purchase orders.
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t">
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-2 pb-8"></div>
                  <p className="text-sm font-semibold">PREPARED BY</p>
                  <p className="text-xs text-gray-600">Signature & Date</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-2 pb-8"></div>
                  <p className="text-sm font-semibold">REVIEWED BY</p>
                  <p className="text-xs text-gray-600">Signature & Date</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 pt-4 border-t">
                <p>This unaccounted items report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p>TechPinoy - Your Trusted Tech Partner</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}