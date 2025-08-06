import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TransactionRecord } from '@/services/transactionService';
import { useDeliveries } from '@/hooks/useDeliveries';
import { deliveryService } from '@/services/deliveryService';

interface ExpandedDeliveryViewProps {
  poNumber: string;
  poTransactions: TransactionRecord[];
  onRowClick: (transaction: TransactionRecord) => void;
}

export const ExpandedDeliveryView: React.FC<ExpandedDeliveryViewProps> = ({
  poNumber,
  poTransactions,
  onRowClick
}) => {
  const [deliveriesData, setDeliveriesData] = useState<any[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<Record<string, any[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const { getDeliveriesByPurchaseOrder } = useDeliveries();

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        // Get purchase order ID from the first transaction
        const purchaseOrderId = poTransactions[0]?.purchase_order_id;
        if (!purchaseOrderId) {
          setLoadingDeliveries(false);
          return;
        }

        // Get deliveries for this purchase order
        const deliveries = await getDeliveriesByPurchaseOrder(purchaseOrderId);
        setDeliveriesData(deliveries);

        // Load delivery items for each delivery
        if (deliveries && deliveries.length > 0) {
          const deliveryItemsData: Record<string, any[]> = {};
          await Promise.all(
            deliveries.map(async (delivery) => {
              try {
                const deliveryWithItems = await deliveryService.getDeliveryWithItems(delivery.id);
                if (deliveryWithItems) {
                  deliveryItemsData[delivery.id] = deliveryWithItems.delivery_items || [];
                }
              } catch (error) {
                console.error(`Error fetching delivery items for ${delivery.id}:`, error);
                deliveryItemsData[delivery.id] = [];
              }
            })
          );
          setDeliveryItems(deliveryItemsData);
        }
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoadingDeliveries(false);
      }
    };

    fetchDeliveries();
  }, [poTransactions[0]?.purchase_order_id, getDeliveriesByPurchaseOrder]);

  if (loadingDeliveries) {
    return (
      <tr className="bg-muted/10 border-b border-border">
        <td className="px-3 py-2 text-center">
          <div className="w-4"></div>
        </td>
        <td colSpan={9} className="px-3 py-4 text-center text-foreground text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
          Loading deliveries...
        </td>
      </tr>
    );
  }

  if (deliveriesData.length === 0) {
    return (
      <tr className="bg-muted/10 border-b border-border">
        <td className="px-3 py-2 text-center">
          <div className="w-4"></div>
        </td>
        <td colSpan={9} className="px-3 py-4 text-center text-foreground text-sm text-muted-foreground">
          No deliveries recorded yet
        </td>
      </tr>
    );
  }

  return (
    <>
      {deliveriesData.map((delivery) => (
        <React.Fragment key={`${poNumber}-${delivery.id}`}>
          {/* Delivery group header */}
          <tr className="bg-muted/10 border-b border-border">
            <td className="px-3 py-2 text-center">
              <div className="w-4"></div>
            </td>
            <td colSpan={9} className="px-3 py-2 text-foreground text-sm font-medium">
              <div className="flex items-center gap-2">
                <span>DR#{delivery.delivery_receipt_number || delivery.id.slice(0, 8)}</span>
                <span className="text-xs text-muted-foreground">
                  • {new Date(delivery.delivery_date).toLocaleDateString()}
                  {deliveryItems[delivery.id] && ` • (${deliveryItems[delivery.id].length} ${deliveryItems[delivery.id].length === 1 ? 'item' : 'items'})`}
                </span>
              </div>
            </td>
          </tr>
          {/* Individual delivery items */}
          {deliveryItems[delivery.id] && deliveryItems[delivery.id].length > 0 ? 
            deliveryItems[delivery.id].map((item: any) => (
              <tr
                key={item.id}
                className="border-b border-border bg-muted/20 hover:bg-muted/30 cursor-pointer"
                onClick={() => {
                  // Create a transaction record for this delivery item to maintain consistency
                  const deliveryTransaction: TransactionRecord = {
                    id: item.id,
                    status: 'delivered',
                    date: delivery.delivery_date,
                    type: 'delivery_receipt',
                    customer: delivery.client?.name || 'Unknown Client',
                    model: item.products?.name || 'Unknown Product',
                    quantity: item.quantity_delivered,
                    unit_price: item.unit_price || 0,
                    total_price: (item.unit_price || 0) * item.quantity_delivered,
                    sales_invoice_number: null,
                    delivery_receipt_number: delivery.delivery_receipt_number,
                    purchase_order_number: poNumber !== 'No PO' ? poNumber : null,
                    notes: delivery.notes,
                    product_id: item.product_id,
                    purchase_order_id: delivery.purchase_order_id,
                    delivery_id: delivery.id,
                    supplier_client_id: delivery.client_id,
                    created_at: item.created_at || delivery.created_at,
                    updated_at: item.created_at || delivery.created_at
                  };
                  onRowClick(deliveryTransaction);
                }}
              >
                <td className="px-3 py-3 text-center">
                  <div className="w-4"></div>
                </td>
                <td className="px-3 py-3 text-foreground text-sm">
                  {new Date(delivery.delivery_date).toLocaleDateString()}
                </td>
                <td className="px-3 py-3 text-foreground text-sm">
                  <div className="truncate max-w-[120px]" title={delivery.client?.name || 'N/A'}>
                    {delivery.client?.name || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-3 text-foreground text-sm">
                  <div className="truncate max-w-[140px]" title={item.products?.name || 'Unknown Product'}>
                    {item.products?.name || 'Unknown Product'}
                    {item.products?.sku && ` (${item.products.sku})`}
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-foreground text-sm">
                  {item.quantity_delivered}
                </td>
                <td className="px-3 py-3 text-center text-foreground">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {poNumber !== 'No PO' ? poNumber : '-'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-foreground">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {delivery.delivery_receipt_number || '-'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-foreground">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    -
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="default" className="text-xs">
                    Delivered
                  </Badge>
                </td>
                <td className="px-3 py-3 font-medium text-foreground text-right text-sm">
                  ₱{((item.unit_price || 0) * item.quantity_delivered).toFixed(2)}
                </td>
              </tr>
            )) : (
              <tr className="border-b border-border bg-muted/20">
                <td className="px-3 py-3 text-center">
                  <div className="w-4"></div>
                </td>
                <td colSpan={9} className="px-3 py-4 text-center text-foreground text-sm text-muted-foreground">
                  No delivery items found
                </td>
              </tr>
            )
          }
        </React.Fragment>
      ))}
    </>
  );
};