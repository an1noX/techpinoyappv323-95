import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Package } from 'lucide-react';
import { deliveryService } from '@/services/deliveryService';
import { TransactionRecord } from '@/services/transactionService';
import { toast } from 'sonner';

interface TransactionItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord;
}

interface MergedItem {
  id: string;
  original_id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dr_number?: string;
  delivery_date?: string;
  status: 'delivered' | 'pending';
  is_split_item: boolean;
  split_index: number;
  split_total: number;
}

export const TransactionItemsModal: React.FC<TransactionItemsModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const [loading, setLoading] = useState(true);
  const [mergedItems, setMergedItems] = useState<MergedItem[]>([]);
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !transaction) return;
    
    fetchData();
  }, [isOpen, transaction]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Transaction data:', transaction);
      
      // TransactionRecord is already an individual line item
      // Just display it directly - no need to fetch PO items
      const item: MergedItem = {
        id: transaction.id,
        original_id: transaction.id,
        product_id: transaction.product_id,
        model: transaction.model,
        quantity: transaction.quantity,
        unit_price: transaction.unit_price,
        total_price: transaction.total_price,
        dr_number: transaction.delivery_receipt_number || 'N/A',
        delivery_date: transaction.date,
        status: transaction.delivery_receipt_number ? 'delivered' : 'pending',
        is_split_item: false,
        split_index: 0,
        split_total: 1
      };

      console.log('Displaying transaction item:', item);
      setMergedItems([item]);

    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to load transaction items');
    } finally {
      setLoading(false);
    }
  };

  // Exact same merging logic as PurchaseInvoicePreview.tsx
  const mergeItemsWithDeliveries = (poItems: any[], deliveries: any[]): MergedItem[] => {
    const deliveryConsumption = new Map(); // Track how much of each delivery has been consumed
    
    const getItemBreakdown = (item: any, itemIndex: number) => {
      const breakdown = [];
      let remainingQuantity = item.quantity;
      
      // Create unique identifier for this specific PO line item
      const itemUniqueKey = `${item.id}-${itemIndex}`;
      
      // Check if this item appears in any deliveries - only match by product_id
      const itemDeliveries = deliveries.filter(delivery => {
        const deliveryItems = delivery.delivery_items || [];
        return deliveryItems.some(dItem => dItem.product_id === item.product_id);
      });
      
      // Sort deliveries by date to consume oldest first
      itemDeliveries.sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime());
      
      // Add delivered quantities from each delivery
      itemDeliveries.forEach(delivery => {
        const deliveryItems = delivery.delivery_items || [];
        const matchingDeliveryItems = deliveryItems.filter(dItem => 
          dItem.product_id === item.product_id
        );
        
        matchingDeliveryItems.forEach(dItem => {
          const deliveryKey = `${delivery.id}-${dItem.id}`;
          
          // Get how much of this delivery item has already been consumed by other PO items
          const alreadyConsumed = deliveryConsumption.get(deliveryKey) || 0;
          const availableQty = Math.max(0, dItem.quantity_delivered - alreadyConsumed);
          
          // Calculate how much this PO item can consume from this delivery
          const consumableQty = Math.min(availableQty, remainingQuantity);
          
          if (consumableQty > 0) {
            // Track the consumption
            deliveryConsumption.set(deliveryKey, alreadyConsumed + consumableQty);
            
            breakdown.push({
              ...item,
              dr_number: delivery.delivery_receipt_number || `DR-${delivery.id.slice(0, 8)}`,
              quantity: consumableQty,
              total_price: consumableQty * item.unit_price,
              delivery_date: delivery.delivery_date,
              delivery_id: delivery.id,
              delivery_item_id: dItem.id,
              status: 'delivered',
              po_item_unique_key: itemUniqueKey
            });
            remainingQuantity -= consumableQty;
          }
        });
      });
      
      // Add pending quantity if any remains
      if (remainingQuantity > 0) {
        breakdown.push({
          ...item,
          dr_number: 'PENDING',
          quantity: remainingQuantity,
          total_price: remainingQuantity * item.unit_price,
          delivery_date: null,
          status: 'pending',
          po_item_unique_key: itemUniqueKey
        });
      }
      
      // If no deliveries found, show as pending
      if (breakdown.length === 0) {
        breakdown.push({
          ...item,
          dr_number: 'PENDING',
          quantity: item.quantity,
          total_price: item.quantity * item.unit_price,
          delivery_date: null,
          status: 'pending',
          po_item_unique_key: itemUniqueKey
        });
      }
      
      return breakdown;
    };

    // Transform items to show delivery breakdown
    const allItems = poItems.reduce((acc, item, itemIndex) => {
      const itemBreakdown = getItemBreakdown(item, itemIndex);
      
      itemBreakdown.forEach((breakdownItem, breakdownIndex) => {
        acc.push({
          id: `${item.id}-${itemIndex}-${breakdownIndex}`,
          original_id: item.id,
          product_id: item.product_id,
          model: item.model,
          quantity: breakdownItem.quantity,
          unit_price: item.unit_price,
          total_price: breakdownItem.total_price,
          dr_number: breakdownItem.dr_number,
          delivery_date: breakdownItem.delivery_date,
          status: breakdownItem.status,
          is_split_item: itemBreakdown.length > 1,
          split_index: breakdownIndex,
          split_total: itemBreakdown.length
        });
      });
      
      return acc;
    }, [] as MergedItem[]);

    return allItems;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package size={20} />
            <span>Transaction Items</span>
            {transaction.purchase_order_number && (
              <span className="text-sm text-gray-600">
                - PO #{transaction.purchase_order_number}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Date:</span>
                <div className="font-medium">{new Date(transaction.date).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Client:</span>
                <div className="font-medium">{transaction.customer || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-600">PO#:</span>
                <div className="font-medium">{transaction.purchase_order_number || '-'}</div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant="secondary" className="text-xs">
                  {transaction.status || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Loading items...</span>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium">Product</th>
                      <th className="px-4 py-3 text-center font-medium">Qty</th>
                      <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-center font-medium">DR#</th>
                      <th className="px-4 py-3 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      mergedItems.map((item, index) => (
                        <tr 
                          key={item.id} 
                          className={`
                            border-b border-gray-200 last:border-b-0
                            ${item.is_split_item ? 'bg-blue-50' : 'bg-white'}
                            ${item.status === 'delivered' ? 'text-green-800' : 'text-gray-800'}
                          `}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {item.is_split_item && (
                                <span className="text-xs text-blue-600 mr-2">
                                  {item.split_index + 1}/{item.split_total}
                                </span>
                              )}
                              <div>
                                <div className="font-medium">{item.model || 'Unknown Product'}</div>
                                {item.is_split_item && item.split_index === 0 && (
                                  <div className="text-xs text-gray-500">Split Item</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ₱{item.unit_price?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ₱{item.total_price?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.dr_number === 'PENDING' ? (
                              <Badge variant="outline" className="text-xs">
                                Pending
                              </Badge>
                            ) : (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {item.dr_number || '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge 
                              variant={item.status === 'delivered' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {item.status === 'delivered' ? 'Delivered' : 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {mergedItems.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-3">Total</td>
                        <td className="px-4 py-3 text-center">
                          {mergedItems.reduce((total, item) => total + item.quantity, 0)}
                        </td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right">
                          ₱{mergedItems.reduce((total, item) => total + (item.total_price || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};