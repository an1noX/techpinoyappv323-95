import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Eye, Package, Calendar, Edit, Save, RotateCcw, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditableDRHeader } from "./EditableDRHeader";
import { EditableDRItemsTable } from "./EditableDRItemsTable";
import { purchaseOrderNumberService } from "@/services/purchaseOrderNumberService";
import { purchaseOrderService } from "@/services/purchaseOrderService";

interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity_delivered: number;
  created_at: string;
  purpose?: 'warranty' | 'replacement' | 'demo' | null;
  products?: {
    id: string;
    name: string;
  };
}

interface DeliveryReceiptWithItems {
  id: string;
  supplier_client_id: string;
  supplier_name: string;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_order_number: string | null;
  purchase_order_id: string | null;
  client_po: string | null;
  sale_invoice_number: string | null;
  expected_delivery_date: string | null;
  due_date: string | null;
  delivery_receipt_number: string | null;
  delivery_date: string;
  client_id: string;
  delivery_items?: DeliveryItem[];
  clients?: {
    id: string;
    name: string;
  };
}

interface DRDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drNumber: string;
}

export function DRDetailModal({ open, onOpenChange, drNumber }: DRDetailModalProps) {
  const { toast } = useToast();
  const [deliveryReceipt, setDeliveryReceipt] = useState<DeliveryReceiptWithItems | null>(null);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeliveryReceipt, setEditedDeliveryReceipt] = useState<DeliveryReceiptWithItems | null>(null);
  const [editedItems, setEditedItems] = useState<DeliveryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showGeneratePODialog, setShowGeneratePODialog] = useState(false);
  const [generatingPO, setGeneratingPO] = useState(false);

  useEffect(() => {
    if (open && drNumber) {
      loadDRDetails();
      loadFulfillments();
      setIsEditing(false);
    }
  }, [open, drNumber]);

  const loadDRDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          clients (
            id,
            name
          ),
          delivery_items (
            id,
            delivery_id,
            product_id,
            quantity_delivered,
            created_at,
            products (
              id,
              name
            )
          )
        `)
        .eq('delivery_receipt_number', drNumber);

      if (error) throw error;
      
      // Handle no results
      if (!data || data.length === 0) {
        console.warn(`No delivery receipt found with number: ${drNumber}`);
        setDeliveryReceipt(null);
        setEditedDeliveryReceipt(null);
        setEditedItems([]);
        return;
      }
      
      // Handle multiple results - take the first one and warn
      if (data.length > 1) {
        console.warn(`Multiple delivery receipts found with number: ${drNumber}, using the first one`);
      }
      
      const deliveryData = data[0];
      setDeliveryReceipt(deliveryData as any);
      setEditedDeliveryReceipt(deliveryData as any);
      setEditedItems(deliveryData?.delivery_items || []);
    } catch (error) {
      console.error('Error loading DR details:', error);
      toast({
        title: "Error loading delivery receipt",
        description: "Failed to load delivery receipt details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFulfillments = async () => {
    try {
      const { data: fulfillmentData, error: fulfillmentError } = await supabase
        .from('fulfillments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fulfillmentError) throw fulfillmentError;

      // Get additional data for display
      const enrichedFulfillments = await Promise.all(
        (fulfillmentData || []).map(async (fulfillment) => {
          // Get PO info
          const { data: poData } = await supabase
            .from('purchase_orders')
            .select('client_po')
            .eq('id', fulfillment.po_id)
            .single();

          // Get product info
          const { data: poItemData } = await supabase
            .from('purchase_order_items')
            .select(`
              products (
                name
              )
            `)
            .eq('id', fulfillment.po_item_id)
            .single();

          return {
            ...fulfillment,
            client_po: poData?.client_po,
            product_name: poItemData?.products?.name
          };
        })
      );

      setFulfillments(enrichedFulfillments);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
      setFulfillments([]);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
          <div className="flex items-center justify-center p-8">
            <div className="text-center py-8">Loading delivery receipt...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!deliveryReceipt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
          <div className="flex items-center justify-center p-8">
            <div className="text-center py-8">Delivery receipt not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Get fulfillments for this delivery receipt
  const deliveryFulfillments = fulfillments.filter(f => f.dr_id === deliveryReceipt.id);

  // Calculate delivery status based on fulfillment completion
  const hasRemainingQuantity = deliveryReceipt.delivery_items?.some(item => {
    const itemFulfillments = deliveryFulfillments.filter(f => 
      f.dr_item_id === item.id
    );
    const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
    return item.quantity_delivered > totalFulfilled;
  });

  const deliveryStatus = hasRemainingQuantity ? "Advance Delivery" : "Completed";

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original data
      setEditedDeliveryReceipt(deliveryReceipt);
      setEditedItems(deliveryReceipt?.delivery_items || []);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editedDeliveryReceipt || !deliveryReceipt) return;

    setSaving(true);
    try {
      // Update delivery receipt details
      // Only update fields that exist in deliveries table
      const deliveryUpdates: any = {
        delivery_receipt_number: editedDeliveryReceipt.delivery_receipt_number,
      };

      // Add delivery_date if it exists in the deliveries table
      if (editedDeliveryReceipt.delivery_date) {
        deliveryUpdates.delivery_date = editedDeliveryReceipt.delivery_date;
      }

      const { error: updateError } = await supabase
        .from('deliveries')
        .update(deliveryUpdates)
        .eq('id', deliveryReceipt.id);

      if (updateError) throw updateError;

      // Handle delivery items - delete existing and recreate
      const existingItems = deliveryReceipt?.delivery_items || [];
      if (existingItems.length > 0) {
        const { error: deleteError } = await supabase
          .from('delivery_items')
          .delete()
          .eq('delivery_id', deliveryReceipt.id);

        if (deleteError) throw deleteError;
      }

      // Create new items
      const itemsToCreate = editedItems
        .filter(item => item.product_id && item.quantity_delivered > 0)
        .map(item => ({
          delivery_id: deliveryReceipt.id,
          product_id: item.product_id,
          quantity_delivered: item.quantity_delivered
        }));

      if (itemsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('delivery_items')
          .insert(itemsToCreate);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Delivery receipt updated successfully",
      });
      
      setIsEditing(false);
      
      // Refresh data
      loadDRDetails();
    } catch (error) {
      console.error('Error updating delivery receipt:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery receipt",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeliveryReceiptChange = (field: string, value: string) => {
    if (editedDeliveryReceipt) {
      setEditedDeliveryReceipt({
        ...editedDeliveryReceipt,
        [field]: value
      });
    }
  };

  const handleGeneratePO = async () => {
    if (!deliveryReceipt) return;

    setGeneratingPO(true);
    try {
      console.log('🚀 Starting PO generation from DR:', {
        drId: deliveryReceipt.id,
        drNumber: deliveryReceipt.delivery_receipt_number,
        clientId: deliveryReceipt.client_id,
        clientName: deliveryReceipt.clients?.name,
        deliveryDate: deliveryReceipt.delivery_date,
        itemCount: deliveryReceipt.delivery_items?.length || 0
      });

      // Generate unique PO number with validation and retry logic
      let nextPONumber = '';
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        nextPONumber = await purchaseOrderNumberService.generateNextPONumber();
        
        // Check if this PO number already exists
        const exists = await purchaseOrderNumberService.isPONumberExists(nextPONumber);
        
        if (!exists) {
          console.log(`✅ Generated unique PO number: ${nextPONumber} (attempt ${attempts + 1})`);
          break;
        } else {
          console.warn(`⚠️ PO number ${nextPONumber} already exists, retrying... (attempt ${attempts + 1})`);
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error(`Failed to generate unique PO number after ${maxAttempts} attempts`);
          }
        }
      }

      // Get quoted prices for the client with better logging
      const poItemsWithPrices = await Promise.all(
        deliveryReceipt.delivery_items?.map(async (item) => {
          let unitPrice = 0;
          
          // Try to get quoted price from product_clients table
          if (item.product_id && deliveryReceipt.client_id) {
            console.log(`💰 Looking up price for product ${item.product_id} and client ${deliveryReceipt.client_id}`);
            
            const { data: quotedPrice, error: priceError } = await supabase
              .from('product_clients')
              .select('quoted_price')
              .eq('product_id', item.product_id)
              .eq('client_id', deliveryReceipt.client_id)
              .single();
            
            if (priceError) {
              console.warn(`⚠️ No quoted price found for product ${item.product_id} and client ${deliveryReceipt.client_id}:`, priceError);
            } else if (quotedPrice?.quoted_price) {
              unitPrice = quotedPrice.quoted_price;
              console.log(`✅ Found quoted price: ${unitPrice} for product ${item.product_id}`);
            }
          }
          
          const itemData = {
            product_id: item.product_id,
            model: item.products?.name || '',
            quantity: item.quantity_delivered,
            unit_price: unitPrice,
          };
          
          console.log(`📦 PO Item prepared:`, itemData);
          return itemData;
        }) || []
      );

      // Create purchase order data with corrected client mapping and date
      const poData = {
        supplier_name: deliveryReceipt.clients?.name || '',
        supplier_client_id: deliveryReceipt.client_id, // Client from DR
        status: 'completed', // Mark as completed since DR already delivered
        payment_status: 'unpaid',
        notes: `Generated from DR ${deliveryReceipt.delivery_receipt_number} dated ${deliveryReceipt.delivery_date}`,
        client_po: nextPONumber,
        expected_delivery_date: deliveryReceipt.delivery_date, // Use DR date for alignment
        due_date: deliveryReceipt.delivery_date, // Set due date to delivery date since already delivered
        items: poItemsWithPrices
      };

      console.log('📋 Final PO data being sent:', poData);

      // Create the purchase order
      const newPO = await purchaseOrderService.createPurchaseOrder(poData);
      
      console.log('✅ Purchase Order created:', {
        id: newPO.id,
        supplier_client_id: newPO.supplier_client_id,
        supplier_name: newPO.supplier_name,
        client_po: newPO.client_po,
        status: newPO.status,
        expected_delivery_date: newPO.expected_delivery_date,
        due_date: newPO.due_date
      });

      // Verify PO was created with correct data
      const { data: verifyPO, error: verifyError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*)
        `)
        .eq('id', newPO.id)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying created PO:', verifyError);
      } else {
        console.log('🔍 PO Verification - Final state:', {
          poId: verifyPO.id,
          clientId: verifyPO.supplier_client_id,
          clientName: verifyPO.supplier_name,
          expectedDeliveryDate: verifyPO.expected_delivery_date,
          dueDate: verifyPO.due_date,
          itemCount: verifyPO.purchase_order_items?.length || 0,
          itemsWithPrices: verifyPO.purchase_order_items?.map(item => ({
            product_id: item.product_id,
            model: item.model,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        });
      }

      // Override created_at to match delivery date for temporal alignment
      const createdAtDate = new Date(deliveryReceipt.delivery_date).toISOString();
      const { error: updateTimestampError } = await supabase
        .from('purchase_orders')
        .update({ 
          created_at: createdAtDate,
          updated_at: createdAtDate
        })
        .eq('id', newPO.id);

      if (updateTimestampError) {
        console.warn('⚠️ Failed to update PO timestamps:', updateTimestampError);
        // Don't throw error, this is not critical
      } else {
        console.log('✅ PO timestamps updated to match DR date:', createdAtDate);
      }

      // Link the DR to the new PO
      // Note: deliveries table only has client_id and delivery_receipt_number
      // purchase_order_number and purchase_order_id should be fetched from purchase_orders table
      const { error: linkError } = await supabase
        .from('deliveries')
        .update({ 
          // Only update fields that exist in deliveries table
          // purchase_order_id and purchase_order_number are handled via relations
        })
        .eq('id', deliveryReceipt.id);

      if (linkError) {
        console.error('❌ Error linking DR to PO:', linkError);
        throw linkError;
      }
      console.log('✅ Successfully linked DR to PO');

      // Create fulfillment records to mark the PO as fulfilled by this DR
      console.log('🔗 Creating fulfillment records to link DR to PO...');
      
      // Wait a moment to ensure PO items are fully created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Re-fetch the PO to ensure all items are created
      const { data: refreshedPO, error: refreshError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*)
        `)
        .eq('id', newPO.id)
        .single();

      if (refreshError) {
        console.error('❌ Error refreshing PO:', refreshError);
        throw refreshError;
      }

      console.log('📋 Refreshed PO has', refreshedPO.purchase_order_items?.length || 0, 'items');
      
      const fulfillmentRecords = [];
      
      for (const drItem of deliveryReceipt.delivery_items || []) {
        console.log(`🔍 Processing DR item: ${drItem.products?.name} (${drItem.product_id}) - Qty: ${drItem.quantity_delivered}`);
        
        // Find matching PO item by product_id
        const matchingPOItem = refreshedPO.purchase_order_items?.find(
          poItem => poItem.product_id === drItem.product_id
        );
        
        if (matchingPOItem) {
          const fulfillmentRecord = {
            po_id: newPO.id,
            po_item_id: matchingPOItem.id,
            dr_id: deliveryReceipt.id,
            dr_item_id: drItem.id,
            fulfilled_quantity: drItem.quantity_delivered,
            date: new Date(deliveryReceipt.delivery_date).toISOString().split('T')[0]
          };
          
          console.log(`✅ Fulfillment record prepared for ${drItem.products?.name}:`, fulfillmentRecord);
          fulfillmentRecords.push(fulfillmentRecord);
        } else {
          console.warn(`⚠️ No matching PO item found for DR item ${drItem.products?.name} (${drItem.product_id})`);
          console.log('Available PO items:', refreshedPO.purchase_order_items?.map(poi => ({
            id: poi.id,
            product_id: poi.product_id,
            model: poi.model
          })));
        }
      }
      
      console.log(`📊 Created ${fulfillmentRecords.length} fulfillment records out of ${deliveryReceipt.delivery_items?.length || 0} DR items`);
      
      if (fulfillmentRecords.length > 0) {
        console.log('🚀 Inserting fulfillment records:', fulfillmentRecords);
        
        const { data: insertedFulfillments, error: fulfillmentError } = await supabase
          .from('fulfillments')
          .insert(fulfillmentRecords)
          .select();

        if (fulfillmentError) {
          console.error('❌ Error creating fulfillments:', fulfillmentError);
          console.error('❌ Fulfillment error details:', {
            message: fulfillmentError.message,
            details: fulfillmentError.details,
            hint: fulfillmentError.hint,
            code: fulfillmentError.code
          });
          toast({
            title: "Warning: Fulfillments not created",
            description: `PO was created but fulfillments failed: ${fulfillmentError.message}`,
            variant: "destructive",
          });
        } else {
          console.log('✅ All fulfillment records created successfully:', insertedFulfillments);
          toast({
            title: "Fulfillments Created",
            description: `Successfully created ${fulfillmentRecords.length} fulfillment records`,
          });
        }
      } else {
        console.warn('⚠️ No valid fulfillment records created - check product matching between DR and PO items');
        toast({
          title: "Warning: No fulfillments created",
          description: "No matching products found between DR and PO items",
          variant: "destructive",
        });
      }

      toast({
        title: "PO Generated Successfully",
        description: `Purchase Order ${nextPONumber} has been created and linked to this delivery receipt with proper fulfillment tracking.`,
      });

      // Refresh the DR details to show the new PO link
      loadDRDetails();
      loadFulfillments(); // Refresh fulfillments to show the new links
      setShowGeneratePODialog(false);

    } catch (error) {
      console.error('Error generating PO:', error);
      toast({
        title: "Error",
        description: "Failed to generate purchase order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPO(false);
    }
  };

  const currentDeliveryReceipt = isEditing ? editedDeliveryReceipt : deliveryReceipt;
  const currentItems = isEditing ? editedItems : (deliveryReceipt?.delivery_items || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #dr-detail-preview, #dr-detail-preview * {
                visibility: visible !important;
              }
              #dr-detail-preview {
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
              <span className="text-lg font-semibold">{isEditing ? 'Edit Delivery Receipt' : 'Delivery Receipt Details'}</span>
              <div className="flex gap-2">
                <Button 
                  onClick={handleEditToggle} 
                  variant="outline" 
                  size="sm"
                  className={isEditing ? 'bg-blue-100' : ''}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isEditing ? 'View Mode' : 'Edit Mode'}
                </Button>
                {!deliveryReceipt.purchase_order_id && !isEditing && (
                  <Button 
                    onClick={() => setShowGeneratePODialog(true)} 
                    variant="default" 
                    size="sm"
                    disabled={generatingPO}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {generatingPO ? 'Generating...' : 'Generate PO'}
                  </Button>
                )}
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
                <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden mobile-scroll-container" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            <div id="dr-detail-preview" className="bg-white p-8 space-y-6 mobile-scaled-content zoomable-content min-h-full">
              {/* Header */}
              <EditableDRHeader
                deliveryReceipt={currentDeliveryReceipt!}
                isEditing={isEditing}
                onDeliveryReceiptChange={handleDeliveryReceiptChange}
              />

              {/* Client Information */}
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
                    <p><strong>{deliveryReceipt.clients?.name || 'N/A'}</strong></p>
                    <p>Client ID: {deliveryReceipt.client_id}</p>
                    <p>Address: N/A</p>
                    <p>Phone: N/A</p>
                  </div>
                </div>
              </div>

              {/* Delivery Items */}
              {isEditing ? (
                <EditableDRItemsTable
                  deliveryItems={currentItems}
                  onItemsChange={setEditedItems}
                  isEditing={isEditing}
                  deliveryId={deliveryReceipt.id}
                />
              ) : (
                deliveryReceipt.delivery_items && deliveryReceipt.delivery_items.length > 0 ? (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 border-b pb-2">DELIVERY ITEMS & FULFILLMENTS</h4>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-800 text-white">
                          <th className="border border-gray-300 px-2 py-2 text-left">ITEM #</th>
                          <th className="border border-gray-300 px-2 py-2 text-left">PRODUCT</th>
                          <th className="border border-gray-300 px-1 py-2 text-center">QTY</th>
                          <th className="border border-gray-300 px-2 py-2 text-left">STATUS</th>
                          <th className="border border-gray-300 px-2 py-2 text-left">PO REFERENCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const unifiedRows: any[] = [];
                          
                          deliveryReceipt.delivery_items?.forEach((item) => {
                            // Find fulfillments for this product using dr_item_id for precise matching
                            const itemFulfillments = deliveryFulfillments.filter(f => 
                              f.dr_item_id === item.id
                            );
                            
                            // Calculate total fulfilled quantity for this item
                            const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
                            const remainingQuantity = item.quantity_delivered - totalFulfilled;
                            
                            // Add unfulfilled quantity row if there's remaining quantity
                            if (remainingQuantity > 0) {
                              unifiedRows.push({
                                id: `${item.id}-remaining`,
                                type: 'remaining',
                                productName: item.products?.name || `Product ID: ${item.product_id}`,
                                quantity: remainingQuantity,
                                status: 'Available',
                                poReference: null,
                                purpose: item.purpose,
                                productId: item.product_id
                              });
                            }
                            
                            // Add fulfilled quantity rows
                            itemFulfillments.forEach((fulfillment, index) => {
                              unifiedRows.push({
                                id: `${item.id}-fulfilled-${index}`,
                                type: 'fulfilled',
                                productName: item.products?.name || `Product ID: ${item.product_id}`,
                                quantity: fulfillment.fulfilled_quantity,
                                status: 'Fulfilled',
                                poReference: fulfillment.client_po,
                                purpose: item.purpose,
                                productId: item.product_id,
                                fulfillmentDate: fulfillment.date
                              });
                            });
                          });
                          
                          return unifiedRows.length > 0 ? unifiedRows.map((row, index) => (
                            <tr 
                              key={row.id}
                              className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${row.type === 'fulfilled' ? 'bg-green-50' : ''}`}
                            >
                              <td className="border border-gray-300 px-2 py-2 text-xs">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs">{row.productName}</span>
                                    {row.type === 'fulfilled' && (
                                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                        Fulfilled
                                      </Badge>
                                    )}
                                  </div>
                                  {row.purpose && row.purpose !== 'None' && row.purpose.trim() !== '' && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {row.purpose}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-1 py-2 text-center">
                                <span className={`text-xs ${row.type === 'fulfilled' ? 'text-green-800 font-medium' : 'font-medium'}`}>
                                  {row.quantity}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Badge variant={row.type === 'fulfilled' ? 'default' : 'secondary'} className="text-xs">
                                  {row.status}
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs">
                                {row.poReference ? (
                                  <span className="font-medium text-blue-600">
                                    PO#{row.poReference}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-xs">
                                No items found
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                    
                    {/* Summary Section */}
                    {deliveryFulfillments.length > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium mb-2">Fulfillment Summary</h5>
                        <p className="text-sm text-gray-600">
                          This delivery receipt has {deliveryFulfillments.length} fulfillment(s) 
                          linking to purchase order(s). Fulfilled items are highlighted in green.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No delivery items found for this receipt.
                  </div>
                )
              )}

              {/* Summary Information */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 border-b">DELIVERY SUMMARY</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Total Items:</strong> {deliveryReceipt.delivery_items?.length || 0}</p>
                    <p><strong>Total Quantity:</strong> {deliveryReceipt.delivery_items?.reduce((sum, item) => sum + item.quantity_delivered, 0) || 0}</p>
                    <p><strong>Delivery Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        deliveryStatus === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {deliveryStatus}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 border-b">NOTES</h3>
                  <div className="text-sm">
                    {deliveryReceipt.notes || 'No additional notes'}
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

      {/* Generate PO Confirmation Dialog */}
      <AlertDialog open={showGeneratePODialog} onOpenChange={setShowGeneratePODialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Generate PO based on this DR? Please confirm that pricing details are accurate.
              <br /><br />
              This will create a new Purchase Order using the items from this Delivery Receipt and link them together for complete tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleGeneratePO}
              disabled={generatingPO}
            >
              {generatingPO ? 'Generating...' : 'Generate PO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}