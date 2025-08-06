import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Delivery } from '@/types/purchaseOrder';
import { X, Edit, Save, RotateCcw, Eye, Trash2 } from 'lucide-react';
import { deliveryService } from '@/services/deliveryService';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditableDeliveryItemsTable } from './EditableDeliveryItemsTable';
import { EditableDeliveryHeader } from './EditableDeliveryHeader';

interface PurchaseDeliveryPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery;
  onViewDetails?: (deliveryId: string) => void;
  onDelete?: (deliveryId: string) => void;
}

export const PurchaseDeliveryPreview: React.FC<PurchaseDeliveryPreviewProps> = ({
  isOpen,
  onClose,
  delivery,
  onViewDetails,
  onDelete
}) => {
  const [deliveryDetails, setDeliveryDetails] = useState<any>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDelivery, setEditedDelivery] = useState<any>(null);
  const [editedPurchaseOrder, setEditedPurchaseOrder] = useState<any>(null);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDeliveryDetails();
      setIsEditing(false);
    }
  }, [isOpen]);

  const fetchDeliveryDetails = async () => {
    setLoading(true);
    try {
      // Fetch delivery details with items
      const [deliveryData, poData] = await Promise.all([
        deliveryService.getDeliveryWithItems(delivery.id),
        delivery.purchase_order_id ? purchaseOrderService.getPurchaseOrderWithItems(delivery.purchase_order_id) : Promise.resolve(null)
      ]);
      
      setDeliveryDetails(deliveryData);
      setPurchaseOrder(poData);
      
      // Initialize edit state
      setEditedDelivery(deliveryData);
      setEditedPurchaseOrder(poData);
      setEditedItems(deliveryData?.delivery_items || []);
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      toast.error('Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original data
      setEditedDelivery(deliveryDetails);
      setEditedPurchaseOrder(purchaseOrder);
      setEditedItems(deliveryDetails?.delivery_items || []);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editedDelivery) return;

    setSaving(true);
    try {
      // Update delivery details
      const deliveryUpdates = {
        delivery_date: editedDelivery.delivery_date,
        delivery_receipt_number: editedDelivery.delivery_receipt_number,
        notes: editedDelivery.notes,
      };

      await deliveryService.updateDelivery(delivery.id, deliveryUpdates);

      // Update purchase order if it exists and client_po changed
      if (editedPurchaseOrder && purchaseOrder?.client_po !== editedPurchaseOrder.client_po) {
        await purchaseOrderService.updatePurchaseOrder(editedPurchaseOrder.id, {
          client_po: editedPurchaseOrder.client_po
        });
      }

      // For simplicity, recreate all delivery items
      // Delete all existing items for this delivery
      const existingItems = deliveryDetails?.delivery_items || [];
      for (const existingItem of existingItems) {
        await supabase
          .from('delivery_items')
          .delete()
          .eq('id', existingItem.id);
      }

      // Create all new items
      const itemsToCreate = editedItems
        .filter(item => item.product_id && item.quantity_delivered > 0)
        .map(item => ({
          delivery_id: delivery.id,
          product_id: item.product_id,
          quantity_delivered: item.quantity_delivered
        }));

      if (itemsToCreate.length > 0) {
        await supabase
          .from('delivery_items')
          .insert(itemsToCreate);
      }

      toast.success('Delivery updated successfully');
      setIsEditing(false);
      
      // Refresh data
      fetchDeliveryDetails();
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update delivery');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliveryChange = (field: string, value: string) => {
    if (editedDelivery) {
      setEditedDelivery({
        ...editedDelivery,
        [field]: value
      });
    }
  };

  const handlePurchaseOrderChange = (field: string, value: string) => {
    if (editedPurchaseOrder) {
      setEditedPurchaseOrder({
        ...editedPurchaseOrder,
        [field]: value
      });
    }
  };

  const currentDelivery = isEditing ? editedDelivery : deliveryDetails;
  const currentPurchaseOrder = isEditing ? editedPurchaseOrder : purchaseOrder;
  const currentItems = isEditing ? editedItems : (deliveryDetails?.delivery_items || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #delivery-receipt-preview, #delivery-receipt-preview * {
                visibility: visible !important;
              }
              #delivery-receipt-preview {
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
              
              /* Input adjustments for edit mode */
              .mobile-scaled-content input,
              .mobile-scaled-content select,
              .mobile-scaled-content textarea {
                font-size: 11px;
                padding: 4px 6px;
                min-height: 28px;
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
            <span className="text-lg font-semibold">{isEditing ? 'Edit Delivery Receipt' : 'Delivery Receipt Preview'}</span>
            <div className="flex gap-2">
              {onViewDetails && (
                <Button 
                  onClick={() => onViewDetails(delivery.id)} 
                  variant="outline" 
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              )}
              <Button 
                onClick={handleEditToggle} 
                variant="outline" 
                size="sm"
                className={isEditing ? 'bg-blue-100' : ''}
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? 'View Mode' : 'Edit Mode'}
              </Button>
              {isEditing && (
                <Button 
                  onClick={handleSaveChanges} 
                  variant="default" 
                  size="sm"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              <Button onClick={handlePrint} variant="outline" size="sm">
                Print
              </Button>
              {onDelete && (
                <Button 
                  onClick={() => onDelete(delivery.id)} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mobile-scroll-container">

          <div id="delivery-receipt-preview" className="bg-white p-8 space-y-6 mobile-scaled-content zoomable-content">
            {/* Header */}
            <EditableDeliveryHeader
              delivery={currentDelivery}
              purchaseOrder={currentPurchaseOrder}
              isEditing={isEditing}
              onDeliveryChange={handleDeliveryChange}
              onPurchaseOrderChange={handlePurchaseOrderChange}
            />

            {/* Supplier/Customer Information */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-800 mb-2 border-b">DELIVERY FROM</h3>
                <div className="text-sm space-y-1">
                  <p><strong>TechPinoy</strong></p>
                  <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
                  <p>Makati, Metro Manila, Philippines</p>
                  <p>Phone: +63 2 1234 5678</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2 border-b">DELIVERY TO</h3>
                <div className="text-sm space-y-1">
                  {currentPurchaseOrder ? (
                    <>
                      <p><strong>{currentPurchaseOrder.supplier_name || 'N/A'}</strong></p>
                      <p>Address: N/A</p>
                      <p>Phone: N/A</p>
                      <p>Email: N/A</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Customer Information</strong></p>
                      <p>Address: N/A</p>
                      <p>Phone: N/A</p>
                      <p>Email: N/A</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              {loading && <span className="text-sm text-gray-500 mb-4 block">Loading delivery items...</span>}
              
              <EditableDeliveryItemsTable
                deliveryItems={currentItems}
                onItemsChange={setEditedItems}
                isEditing={isEditing}
              />
            </div>

            {/* Summary Information */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-800 mb-2 border-b">DELIVERY SUMMARY</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Total Items:</strong> {currentItems.length}</p>
                  <p><strong>Total Quantity:</strong> {currentItems.reduce((sum, item) => sum + item.quantity_delivered, 0)}</p>
                  <p><strong>Delivery Status:</strong> 
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      DELIVERED
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2 border-b">NOTES</h3>
                <div className="text-sm">
                  {currentDelivery?.notes || 'No additional notes'}
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t">
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 pb-8"></div>
                <p className="text-sm font-semibold">DELIVERED BY</p>
                <p className="text-xs text-gray-600">Signature & Date</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 pb-8"></div>
                <p className="text-sm font-semibold">RECEIVED BY</p>
                <p className="text-xs text-gray-600">Signature & Date</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p>This delivery receipt was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p>TechPinoy - Your Trusted Tech Partner</p>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDeliveryPreview;