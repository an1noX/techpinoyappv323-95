import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TransactionRecord } from '@/services/transactionService';
import { getStatusBadgeVariant } from './TransactionRecordsList';
import { supabase } from '@/integrations/supabase/client';

interface ExpandedPurchaseOrderViewProps {
  poNumber: string;
  poTransactions: TransactionRecord[];
  onRowClick: (transaction: TransactionRecord) => void;
}

interface EnhancedItem {
  id: string;
  original_id: string;
  model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dr_number: string;
  delivery_date?: string;
  status: 'delivered' | 'pending';
  is_split_item: boolean;
  split_index: number;
  split_total: number;
  customer?: string;
  purchase_order_number?: string;
  sales_invoice_number?: string;
  original_transaction: TransactionRecord;
}

export const ExpandedPurchaseOrderView: React.FC<ExpandedPurchaseOrderViewProps> = ({
  poNumber,
  poTransactions,
  onRowClick
}) => {
  const [enhancedItems, setEnhancedItems] = useState<EnhancedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactionData = async () => {
      setLoading(true);
      try {
        // Get purchase order ID from transactions or query it directly
        let purchaseOrderId = poTransactions[0]?.purchase_order_id;
        
        if (!purchaseOrderId) {
          const { data: purchaseOrder } = await supabase
            .from('purchase_orders')
            .select('id')
            .eq('client_po', poNumber)
            .single();
            
          purchaseOrderId = purchaseOrder?.id;
        }
        
        if (!purchaseOrderId) {
          throw new Error('Could not find purchase order ID');
        }
        
        // Using same data loading approach as PODetailModal.tsx
        // Get purchase order data
        const { data: purchaseOrderData, error: poError } = await supabase
          .from('purchase_orders')
          .select(`
            id,
            client_po,
            sale_invoice_number,
            created_at,
            supplier_client_id,
            clients (
              name
            ),
            purchase_order_items (
              id,
              quantity,
              product_id,
              unit_price,
              total_price,
              products (
                id,
                name
              )
            )
          `)
          .eq('id', purchaseOrderId)
          .single();

        if (poError) throw poError;

        // Get fulfillments data
        const { data: fulfillmentData, error: fulfillmentError } = await supabase
          .from('fulfillments')
          .select('*')
          .eq('po_id', purchaseOrderId);

        if (fulfillmentError) throw fulfillmentError;

        // Get delivery receipts data
        const { data: deliveriesData, error: drError } = await supabase
          .from('deliveries')
          .select(`
            id,
            delivery_receipt_number,
            delivery_date,
            delivery_items (
              id,
              quantity_delivered,
              product_id
            )
          `);

        if (drError) throw drError;
        
        // Map DR numbers
        const drNumberMap: Record<string, any> = {};
        (deliveriesData || []).forEach(dr => {
          drNumberMap[dr.id] = {
            number: dr.delivery_receipt_number,
            date: dr.delivery_date,
            items: dr.delivery_items || []
          };
        });

        // Prepare to track each PO item's fulfillment status
        const poItems = purchaseOrderData.purchase_order_items || [];
        const clientName = purchaseOrderData.clients?.name || 'Unknown Client';
        
        // Build enhanced items using the same logic as getPOFulfillmentData in PODetailModal.tsx
        const result: EnhancedItem[] = [];
        
        poItems.forEach((poItem, poItemIndex) => {
          const itemFulfillments = (fulfillmentData || []).filter((f: any) => f.po_item_id === poItem.id);
          
          // If we have fulfillments, create an item for each one
          if (itemFulfillments.length > 0) {
            itemFulfillments.forEach((fulfillment: any, fulfillmentIndex) => {
              const drInfo = drNumberMap[fulfillment.dr_id] || {};
              
              // Create delivered item
              result.push({
                id: `${poItem.id}-${fulfillmentIndex}`,
                original_id: poItem.id,
                model: poItem.products?.name || 'Unknown Product',
                quantity: fulfillment.fulfilled_quantity,
                unit_price: poItem.unit_price,
                total_price: poItem.unit_price * fulfillment.fulfilled_quantity,
                dr_number: drInfo.number || `DR-${fulfillment.dr_id.slice(0, 8)}`,
                delivery_date: drInfo.date,
                status: 'delivered',
                is_split_item: itemFulfillments.length > 1 || fulfillment.fulfilled_quantity < poItem.quantity,
                split_index: fulfillmentIndex,
                split_total: itemFulfillments.length + (fulfillment.fulfilled_quantity < poItem.quantity ? 1 : 0),
                customer: clientName,
                purchase_order_number: purchaseOrderData.client_po,
                sales_invoice_number: purchaseOrderData.sale_invoice_number,
                original_transaction: {
                  ...poItem,
                  model: poItem.products?.name || 'Unknown Product',
                  date: drInfo.date || purchaseOrderData.created_at,
                  status: 'delivered',
                  customer: clientName,
                  purchase_order_number: purchaseOrderData.client_po,
                  purchase_order_id: purchaseOrderId,
                  delivery_receipt_number: drInfo.number,
                  sales_invoice_number: purchaseOrderData.sale_invoice_number,
                  type: 'fulfillment',
                  created_at: purchaseOrderData.created_at,
                  updated_at: purchaseOrderData.created_at
                }
              });
            });
            
            // Calculate remaining quantity
            const totalFulfilled = itemFulfillments.reduce((sum: number, f: any) => sum + f.fulfilled_quantity, 0);
            const remaining = poItem.quantity - totalFulfilled;
            
            // If there are unfulfilled items, add a pending entry
            if (remaining > 0) {
              result.push({
                id: `${poItem.id}-pending`,
                original_id: poItem.id,
                model: poItem.products?.name || 'Unknown Product',
                quantity: remaining,
                unit_price: poItem.unit_price,
                total_price: poItem.unit_price * remaining,
                dr_number: 'PENDING',
                status: 'pending',
                is_split_item: true,
                split_index: itemFulfillments.length,
                split_total: itemFulfillments.length + 1,
                customer: clientName,
                purchase_order_number: purchaseOrderData.client_po,
                sales_invoice_number: purchaseOrderData.sale_invoice_number,
                original_transaction: {
                  ...poItem,
                  model: poItem.products?.name || 'Unknown Product',
                  date: purchaseOrderData.created_at,
                  status: 'pending',
                  customer: clientName,
                  purchase_order_number: purchaseOrderData.client_po,
                  purchase_order_id: purchaseOrderId,
                  sales_invoice_number: purchaseOrderData.sale_invoice_number,
                  type: 'pending_po',
                  created_at: purchaseOrderData.created_at,
                  updated_at: purchaseOrderData.created_at
                }
              });
            }
          } else {
            // No fulfillments, create a pending item for the full quantity
            result.push({
              id: `${poItem.id}-0`,
              original_id: poItem.id,
              model: poItem.products?.name || 'Unknown Product',
              quantity: poItem.quantity,
              unit_price: poItem.unit_price,
              total_price: poItem.unit_price * poItem.quantity,
              dr_number: 'PENDING',
              status: 'pending',
              is_split_item: false,
              split_index: 0,
              split_total: 1,
              customer: clientName,
              purchase_order_number: purchaseOrderData.client_po,
              sales_invoice_number: purchaseOrderData.sale_invoice_number,
              original_transaction: {
                ...poItem,
                model: poItem.products?.name || 'Unknown Product',
                date: purchaseOrderData.created_at,
                status: 'pending',
                customer: clientName,
                purchase_order_number: purchaseOrderData.client_po,
                purchase_order_id: purchaseOrderId,
                sales_invoice_number: purchaseOrderData.sale_invoice_number,
                type: 'pending_po',
                created_at: purchaseOrderData.created_at,
                updated_at: purchaseOrderData.created_at
              }
            });
          }
        });
        
        setEnhancedItems(result);
      } catch (error) {
        console.error('Error loading transaction data:', error);
        
        // Fallback to simple display using provided transactions
        const simpleItems = poTransactions.map((transaction, index) => ({
          id: `${transaction.id}-${index}`,
          original_id: transaction.id,
          model: transaction.model,
          quantity: transaction.quantity,
          unit_price: transaction.unit_price,
          total_price: transaction.total_price,
          dr_number: transaction.delivery_receipt_number || 'PENDING',
          delivery_date: transaction.delivery_receipt_number ? transaction.date : undefined,
          status: (transaction.delivery_receipt_number ? 'delivered' : 'pending') as 'delivered' | 'pending',
          is_split_item: false,
          split_index: 0,
          split_total: 1,
          customer: transaction.customer,
          purchase_order_number: transaction.purchase_order_number,
          sales_invoice_number: transaction.sales_invoice_number,
          original_transaction: transaction
        }));
        setEnhancedItems(simpleItems);
      } finally {
        setLoading(false);
      }
    };

    loadTransactionData();
  }, [poTransactions, poNumber]);

  if (loading) {
    return (
      <tr className="bg-muted/10 border-b border-border">
        <td className="px-3 py-2 text-center">
          <div className="w-4"></div>
        </td>
        <td colSpan={9} className="px-3 py-4 text-center text-foreground text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
          Loading item details...
        </td>
      </tr>
    );
  }

  return (
    <>
      {enhancedItems.map((item) => (
        <tr
          key={item.id}
          className={`
            border-b border-border cursor-pointer
            ${item.is_split_item ? 'bg-blue-50/50' : 'bg-muted/20'}
            ${item.status === 'delivered' ? 'hover:bg-green-50' : 'hover:bg-yellow-50'}
          `}
          onClick={() => onRowClick(item.original_transaction)}
        >
          <td className="px-3 py-3 text-center">
            <div className="flex items-center justify-center w-4">
              {/* Split indicators completely removed */}
            </div>
          </td>
          <td className="px-3 py-3 text-foreground text-sm">
            {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : 
             item.original_transaction.date ? new Date(item.original_transaction.date).toLocaleDateString() : '-'}
          </td>
          <td className="px-3 py-3 text-foreground text-sm">
            <div className="truncate max-w-[120px]" title={item.customer || 'N/A'}>
              {item.customer || 'N/A'}
            </div>
          </td>
          <td className="px-3 py-3 text-foreground text-sm">
            <div className="flex items-center">
              {/* "Split:" label completely removed */}
              <div className="truncate max-w-[140px]" title={item.model || 'N/A'}>
                {item.model || 'N/A'}
              </div>
            </div>
          </td>
          <td className="px-3 py-3 text-center text-foreground text-sm font-medium">
            {item.quantity}
          </td>
          <td className="px-3 py-3 text-center text-foreground">
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {item.purchase_order_number?.startsWith('client_po_') || 
               item.purchase_order_number?.length > 36 ? 
               item.purchase_order_number?.substring(0, 8) + '...' : item.purchase_order_number || '-'}
            </span>
          </td>
          <td className="px-3 py-3 text-center text-foreground">
            {item.dr_number === 'PENDING' ? (
              <Badge variant="outline" className="text-xs">
                Pending
              </Badge>
            ) : (
              <span className="text-xs bg-muted px-2 py-1 rounded">
                {item.dr_number}
              </span>
            )}
          </td>
          <td className="px-3 py-3 text-center text-foreground">
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {item.sales_invoice_number || '-'}
            </span>
          </td>
          <td className="px-3 py-3">
            <Badge 
              variant={item.status === 'delivered' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {item.status === 'delivered' ? 'Delivered' : 'Pending'}
            </Badge>
          </td>
          <td className="px-3 py-3 font-medium text-foreground text-right text-sm">
            ₱{item.total_price?.toFixed(2) || '0.00'}
          </td>
        </tr>
      ))}
    </>
  );
};