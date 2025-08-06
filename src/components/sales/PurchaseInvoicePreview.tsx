import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PurchaseOrderWithDetails } from '@/types/purchaseOrder';
import { X, Edit, Plus, Trash2, Save, XCircle, Check, Unlink, FileText, Package, DollarSign } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { deliveryService } from '@/services/deliveryService';
import { productService } from '@/services/productService';
import { usePurchaseOrderItems } from '@/hooks/usePurchaseOrderItems';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/database';
import { AutoMatchFulfillmentDialog } from "@/transactions/components/AutoMatchFulfillmentDialog";
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import { MarkAsPaidModal } from './MarkAsPaidModal';
import { BudgetPlanModal } from './BudgetPlanModal';
import { useAuth } from '@/hooks/useAuth';
import { paymentTermsService } from '@/services/paymentTermsService';
import { UnitTrackingSetupGuide } from '@/components/UnitTrackingSetupGuide';
import { useUnitTracking } from '@/hooks/useUnitTracking';
import { unitTrackingService } from '@/services/unitTrackingService';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseInvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrderWithDetails;
}

export const PurchaseInvoicePreview: React.FC<PurchaseInvoicePreviewProps> = ({
  isOpen,
  onClose,
  purchaseOrder
}) => {
  const isMobile = useIsMobile();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [editedPurchaseOrder, setEditedPurchaseOrder] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [newItem, setNewItem] = useState<any>({
    product_id: '',
    quantity: 0,
    unit_price: 0
  });
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState(false);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(2);
  const [discount, setDiscount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAutoMatchDialog, setShowAutoMatchDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [showBudgetPlanModal, setShowBudgetPlanModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unlinkedDeliveries, setUnlinkedDeliveries] = useState<Set<string>>(new Set());
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string>('due-on-receipt');
  
  // Soft state for item changes
  const [softEditedItems, setSoftEditedItems] = useState<any[]>([]);
  const [softAddedItems, setSoftAddedItems] = useState<any[]>([]);
  const [softDeletedItems, setSoftDeletedItems] = useState<Set<string>>(new Set());
  
  // Authentication hook
  const { userProfile } = useAuth();

  // Unit tracking hooks
  const { useReconciliationReport, useUnitTrackingStats } = useUnitTracking();
  
  // Unit-level completion data
  const { data: reconciliationReport } = useReconciliationReport(purchaseOrder.id);
  const { data: unitStats } = useUnitTrackingStats(purchaseOrder.id);

  const { 
    items: purchaseOrderItems, 
    updateItem, 
    createItem, 
    deleteItem,
    refetch 
  } = usePurchaseOrderItems(purchaseOrder.id);

  useEffect(() => {
    if (isOpen) {
      fetchRelatedData();
      setEditedPurchaseOrder(purchaseOrder);
      
      // Load saved tax settings from notes if they exist
      if (purchaseOrder.notes) {
        const taxSettingsMatch = purchaseOrder.notes.match(/\[TAX_SETTINGS: (.*?)\]/);
        if (taxSettingsMatch) {
          try {
            const savedSettings = JSON.parse(taxSettingsMatch[1]);
            setDiscount(savedSettings.discount || 0);
            setWithholdingTaxEnabled(savedSettings.withholdingTaxEnabled || false);
            setWithholdingTaxRate(savedSettings.withholdingTaxRate || 2);
            setSelectedPaymentTerms(savedSettings.paymentTerms || 'due-on-receipt');
          } catch (error) {
            console.error('Error parsing saved tax settings:', error);
          }
        }
      }
      
      // Reset all soft changes when opening
      setHasUnsavedChanges(false);
      setUnlinkedDeliveries(new Set());
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
    }
  }, [isOpen, purchaseOrder]);

  const fetchRelatedData = async () => {
    setLoading(true);
    try {
      // Fetch deliveries with their items (like in PurchaseOrders.tsx)
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select(`
          id,
          delivery_receipt_number,
          delivery_date,
          created_at,
          delivery_items (
            id,
            quantity_delivered,
            product_id,
            products (
              id,
              name
            )
          )
        `);
      
      if (deliveriesError) throw deliveriesError;
      
      // Fetch fulfillments data (like in PurchaseOrders.tsx)
      const { data: fulfillmentsData, error: fulfillmentsError } = await supabase
        .from('fulfillments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fulfillmentsError) throw fulfillmentsError;
      
      // Get product data for display
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;
      
      // Enrich delivery items with fulfillment information (following PurchaseOrders.tsx approach)
      const enrichedDeliveries = deliveriesData.map(delivery => {
        const enrichedItems = delivery.delivery_items?.map(item => {
          // Find fulfillments that connect this delivery item to the current PO
          const itemFulfillments = fulfillmentsData.filter(fulfillment => 
            fulfillment.dr_item_id === item.id && 
            fulfillment.po_id === purchaseOrder.id
          );
          
          // Filter out unlinked fulfillments (those marked for unlinking in current session)
          const activeFulfillments = itemFulfillments.filter(fulfillment => 
            !unlinkedDeliveries.has(fulfillment.id)
          );
          
          return {
            ...item,
            _fulfillment_id: activeFulfillments.length > 0 ? activeFulfillments[0].id : null,
            fulfilled_quantity: activeFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0)
          };
        });
        
        return {
          ...delivery,
          delivery_items: enrichedItems
        };
      });
      
      // Filter deliveries to only include those with items fulfilled for this PO (active fulfillments only)
      const fulfilledDeliveries = enrichedDeliveries.filter(delivery => 
        delivery.delivery_items?.some(item => item._fulfillment_id)
      );
      
      console.log('Final fulfilled deliveries after fetch:', fulfilledDeliveries);
      setDeliveries(fulfilledDeliveries);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setIsEditing(false);
    setEditingItem(null);
    setTimeout(() => window.print(), 100);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset all changes to original values
      setEditedPurchaseOrder(purchaseOrder);
      
      // Reset unlinked deliveries
      setUnlinkedDeliveries(new Set());
      
      // Reset tax settings to saved values from notes if they exist
      if (purchaseOrder.notes) {
        const taxSettingsMatch = purchaseOrder.notes.match(/\[TAX_SETTINGS: (.*?)\]/);
        if (taxSettingsMatch) {
          try {
            const savedSettings = JSON.parse(taxSettingsMatch[1]);
            setDiscount(savedSettings.discount || 0);
            setWithholdingTaxEnabled(savedSettings.withholdingTaxEnabled || false);
            setWithholdingTaxRate(savedSettings.withholdingTaxRate || 2);
          } catch (error) {
            console.error('Error parsing saved tax settings:', error);
            // Reset to defaults if parsing fails
            setDiscount(0);
            setWithholdingTaxEnabled(false);
            setWithholdingTaxRate(2);
          }
        } else {
          // No saved settings, reset to defaults
          setDiscount(0);
          setWithholdingTaxEnabled(false);
          setWithholdingTaxRate(2);
        }
      } else {
        // No notes, reset to defaults
        setDiscount(0);
        setWithholdingTaxEnabled(false);
        setWithholdingTaxRate(2);
      }
      
      setHasUnsavedChanges(false);
      
      // Reset soft item changes
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
    }
    setIsEditing(!isEditing);
    setEditingItem(null);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Import the purchase order service
      const { purchaseOrderService } = await import('@/services/purchaseOrderService');
      
      // Process soft item changes first
      
      // 1. Apply soft deleted items
      for (const itemId of softDeletedItems) {
        try {
          await deleteItem(itemId);
        } catch (error) {
          console.error(`Error deleting item ${itemId}:`, error);
          throw new Error(`Failed to delete item ${itemId}`);
        }
      }
      
      // 2. Apply soft edited items
      for (const editedItem of softEditedItems) {
        try {
          await updateItem({
            id: editedItem.id,
            product_id: editedItem.product_id,
            model: editedItem.model,
            quantity: editedItem.quantity,
            unit_price: editedItem.unit_price
          });
        } catch (error) {
          console.error(`Error updating item ${editedItem.id}:`, error);
          throw new Error(`Failed to update item ${editedItem.id}`);
        }
      }
      
      // 3. Apply soft added items
      for (const newItem of softAddedItems) {
        try {
          await createItem({
            purchase_order_id: newItem.purchase_order_id,
            product_id: newItem.product_id,
            model: newItem.model,
            quantity: newItem.quantity,
            unit_price: newItem.unit_price
          });
        } catch (error) {
          console.error(`Error creating new item:`, error);
          throw new Error(`Failed to add new item`);
        }
      }
      
      // Apply unlinked fulfillments (delete from fulfillments table)
      if (unlinkedDeliveries.size > 0) {
        console.log('Unlinking fulfillments:', Array.from(unlinkedDeliveries));
        
        for (const fulfillmentId of unlinkedDeliveries) {
          try {
            const { error } = await supabase
              .from('fulfillments')
              .delete()
              .eq('id', fulfillmentId);
            
            if (error) throw error;
            
            console.log(`Successfully unlinked fulfillment ${fulfillmentId}`);
          } catch (error) {
            console.error(`Error unlinking fulfillment ${fulfillmentId}:`, error);
            throw new Error(`Failed to unlink fulfillment ${fulfillmentId}: ${error}`);
          }
        }
        
        console.log('All fulfillments unlinked successfully');
        
        // Update PO status after unlinking fulfillments
        try {
          const { purchaseOrderService } = await import('@/services/purchaseOrderService');
          await purchaseOrderService.updatePurchaseOrderStatus(purchaseOrder.id);
          console.log('PO status updated after unlinking');
        } catch (statusError) {
          console.error('Error updating PO status after unlinking fulfillments:', statusError);
        }
        
        // Refresh delivery data after successful unlinking to reflect changes
        try {
          await fetchRelatedData();
          console.log('Delivery data refreshed after unlinking');
        } catch (fetchError) {
          console.error('Error refreshing delivery data after unlinking:', fetchError);
        }
      }
      
      // Save purchase order changes
      if (editedPurchaseOrder) {
        await purchaseOrderService.updatePurchaseOrder(editedPurchaseOrder.id, {
          client_po: editedPurchaseOrder.client_po,
          notes: editedPurchaseOrder.notes,
          supplier_name: editedPurchaseOrder.supplier_name,
          // Add other editable fields as needed
        });
      }
      
      // Save tax and discount settings and payment terms as PO metadata or notes
      const taxSettings = {
        discount,
        withholdingTaxEnabled,
        withholdingTaxRate,
        paymentTerms: selectedPaymentTerms,
        savedAt: new Date().toISOString()
      };
      
      // For now, append tax settings to notes (can be improved with dedicated metadata table)
      const updatedNotes = editedPurchaseOrder?.notes ? 
        `${editedPurchaseOrder.notes}\n\n[TAX_SETTINGS: ${JSON.stringify(taxSettings)}]` :
        `[TAX_SETTINGS: ${JSON.stringify(taxSettings)}]`;
      
      await purchaseOrderService.updatePurchaseOrder(editedPurchaseOrder.id, {
        notes: updatedNotes
      });
      
      toast.success('Changes saved successfully');
      setHasUnsavedChanges(false);
      setUnlinkedDeliveries(new Set()); // Clear unlinked deliveries
      
      // Clear all soft state changes
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
      
      setIsEditing(false);
      
      // Only refresh purchase order items, not delivery data to avoid overriding unlink changes
      await refetch();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item.original_id);
    setEditValues({
      id: item.original_id,
      product_id: item.product_id || '',
      model: item.model || '',
      quantity: item.quantity,
      unit_price: item.unit_price
    });
  };

  const handleSaveEdit = () => {
    // Soft save - update the item in soft state, don't persist to DB yet
    const selectedProduct = products.find(p => p.id === editValues.product_id);
    const updatedItem = {
      id: editValues.id,
      product_id: editValues.product_id,
      model: selectedProduct ? getProductDisplayName(selectedProduct) : editValues.model,
      quantity: Number(editValues.quantity),
      unit_price: Number(editValues.unit_price)
    };
    
    setSoftEditedItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === editValues.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedItem;
        return updated;
      } else {
        return [...prev, updatedItem];
      }
    });
    
    setEditingItem(null);
    setEditValues({});
    setHasUnsavedChanges(true);
    toast.info('Item updated. Click Save to apply changes.');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.quantity || !newItem.unit_price) {
      toast.error('Please fill all fields');
      return;
    }

    // Soft add - add to soft state, don't persist to DB yet
    const selectedProduct = products.find(p => p.id === newItem.product_id);
    const tempItem = {
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary unique ID
      purchase_order_id: purchaseOrder.id,
      product_id: newItem.product_id,
      model: selectedProduct ? getProductDisplayName(selectedProduct) : '',
      quantity: Number(newItem.quantity),
      unit_price: Number(newItem.unit_price),
      total_price: Number(newItem.quantity) * Number(newItem.unit_price),
      created_at: new Date().toISOString(),
      isTemp: true // Mark as temporary
    };
    
    setSoftAddedItems(prev => [...prev, tempItem]);
    setNewItem({ product_id: '', quantity: 0, unit_price: 0 });
    setHasUnsavedChanges(true);
    toast.info('Item added. Click Save to apply changes.');
  };

  const handleDeleteItem = (itemId: string) => {
    // Check if it's a soft-added item (temp ID)
    const isSoftAddedItem = softAddedItems.some(item => item.id === itemId);
    
    if (isSoftAddedItem) {
      // Remove from soft added items
      setSoftAddedItems(prev => prev.filter(item => item.id !== itemId));
      toast.info('New item removed.');
    } else {
      // Mark existing item for deletion
      setSoftDeletedItems(prev => new Set([...prev, itemId]));
      toast.info('Item marked for deletion. Click Save to apply changes.');
    }
    
    setHasUnsavedChanges(true);
  };

  const handlePurchaseOrderChange = (field: string, value: string) => {
    if (editedPurchaseOrder) {
      setEditedPurchaseOrder({
        ...editedPurchaseOrder,
        [field]: value
      });
      setHasUnsavedChanges(true);
    }
  };

  // Handle tax setting changes
  const handleDiscountChange = (value: number) => {
    setDiscount(value);
    setHasUnsavedChanges(true);
  };

  const handleWithholdingTaxToggle = (enabled: boolean) => {
    setWithholdingTaxEnabled(enabled);
    setHasUnsavedChanges(true);
  };

  const handleWithholdingTaxRateChange = (rate: number) => {
    setWithholdingTaxRate(rate);
    setHasUnsavedChanges(true);
  };

  const handlePaymentTermsChange = (value: string) => {
    setSelectedPaymentTerms(value);
    setHasUnsavedChanges(true);
  };

  const getProductDisplayName = (product?: Product) => {
    if (!product) return 'N/A';
    
    const parts = [product.name];
    if (product.sku) parts.push(`(${product.sku})`);
    if (product.color) {
      // Abbreviate colors
      const colorAbbreviations: { [key: string]: string } = {
        'black': 'BK',
        'cyan': 'CY', 
        'yellow': 'YL',
        'magenta': 'MG',
        'blue': 'BL',
        'red': 'RD',
        'green': 'GR',
        'white': 'WH',
        'gray': 'GY',
        'grey': 'GY',
        'orange': 'OR',
        'purple': 'PR',
        'pink': 'PK',
        'brown': 'BR'
      };
      
      const colorLower = product.color.toLowerCase();
      const abbreviation = colorAbbreviations[colorLower] || product.color.substring(0, 2).toUpperCase();
      parts.push(abbreviation);
    }
    
    return parts.join(' ');
  };

  const handleUnlinkDelivery = async (deliveryId: string, deliveryItemId: string) => {
    // Find the delivery and item
    const delivery = deliveries.find(d => d.id === deliveryId);
    const deliveryItem = delivery?.delivery_items?.find(item => item.id === deliveryItemId);
    const fulfillmentId = deliveryItem?._fulfillment_id;

    if (!fulfillmentId) {
      toast.error('Unable to find fulfillment reference for this item');
      return;
    }

    // Track for removal during save
    setUnlinkedDeliveries(prev => new Set([...prev, fulfillmentId]));

    // Update local state so UI reflects unlink immediately
    setDeliveries(currentDeliveries =>
      currentDeliveries.map(d => {
        if (d.id === deliveryId) {
          return {
            ...d,
            delivery_items: d.delivery_items?.map(item => {
              if (item.id === deliveryItemId) {
                return { ...item, _fulfillment_id: null, fulfilled_quantity: 0 };
              }
              return item;
            })
          };
        }
        return d;
      })
    );

    setHasUnsavedChanges(true);
    toast.info('Item fulfillment marked for removal. Click Save to apply changes.');
  };

  const handleDeletePurchaseOrder = async () => {
    setDeleting(true);
    try {
      const { purchaseOrderService } = await import('@/services/purchaseOrderService');
      await purchaseOrderService.deletePurchaseOrder(purchaseOrder.id);
      toast.success('Purchase Order deleted successfully');
      setShowDeleteConfirm(false);
      onClose(); // Close the modal after deletion
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error('Failed to delete purchase order');
    } finally {
      setDeleting(false);
    }
  };

  // Get current items with soft changes applied
  const getCurrentItems = () => {
    // Start with original items
    let items = purchaseOrderItems.length > 0 ? purchaseOrderItems : (purchaseOrder.items || purchaseOrder.purchase_order_items || []);
    
    // Apply soft edits
    items = items.map(item => {
      const softEdit = softEditedItems.find(editedItem => editedItem.id === item.id);
      if (softEdit) {
        return {
          ...item,
          ...softEdit,
          total_price: softEdit.quantity * softEdit.unit_price
        };
      }
      return item;
    });
    
    // Filter out soft deleted items
    items = items.filter(item => !softDeletedItems.has(item.id));
    
    // Add soft added items
    items = [...items, ...softAddedItems];
    
    return items;
  };
  
  const currentItems = getCurrentItems();
  const currentPurchaseOrder = isEditing ? editedPurchaseOrder : purchaseOrder;
  
  // Determine if this should be shown as quotation or invoice
  const hasClientPO = currentPurchaseOrder.client_po && currentPurchaseOrder.client_po.trim() !== '';
  const hasLinkedDeliveries = deliveries && deliveries.length > 0;
  const isQuotationMode = !hasClientPO && !hasLinkedDeliveries;
  
  // Create enhanced item breakdown based on fulfillments (following PurchaseOrders.tsx approach exactly)
  // Get fulfillment data for each item using the same logic as in PurchaseOrders.tsx
  const getPOFulfillmentData = (item: any) => {
    // Filter fulfillments for this specific item by matching product names
    const itemFulfillments = deliveries.flatMap(delivery => 
      (delivery.delivery_items || [])
        .filter(dItem => {
          // Match by product and ensure there's a fulfillment reference
          const hasFulfillment = dItem._fulfillment_id && dItem.fulfilled_quantity > 0;
          const productMatches = dItem.product?.name === item.model || dItem.product_id === item.product_id;
          
          return hasFulfillment && productMatches;
        })
        .map(dItem => ({
          dr_id: delivery.id,
          dr_item_id: dItem.id,
          delivery_receipt_number: delivery.delivery_receipt_number || `DR-${delivery.id.slice(0, 8)}`,
          delivery_date: delivery.delivery_date,
          fulfilled_quantity: dItem.fulfilled_quantity,
          fulfillment_reference: dItem._fulfillment_id
        }))
    );
    
    // Filter out unfulfilled items (those marked for unlinking in current session)
    const activeFulfillments = itemFulfillments.filter(fulfillment => 
      !unlinkedDeliveries.has(fulfillment.fulfillment_reference)
    );
    
    // Deduplicate fulfillments by dr_id to avoid double counting (like in PurchaseOrders.tsx)
    const uniqueFulfillments = activeFulfillments.reduce((acc, current) => {
      const existing = acc.find(item => item.dr_id === current.dr_id && item.dr_item_id === current.dr_item_id);
      if (!existing) {
        acc.push(current);
      } else {
        // If there are duplicates, keep the one with higher fulfilled_quantity
        if (current.fulfilled_quantity > existing.fulfilled_quantity) {
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
      }
      return acc;
    }, [] as typeof activeFulfillments);
    
    // Calculate total fulfilled and remaining quantities
    const totalFulfilled = uniqueFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
    const remaining = Math.max(0, item.quantity - totalFulfilled);
    const status = totalFulfilled === 0 ? 'pending' : 
                 remaining === 0 ? 'delivered' : 'partial';
    
    return {
      ...item,
      totalFulfilled,
      remaining,
      status,
      fulfillments: uniqueFulfillments
    };
  };
  
  const getItemBreakdown = (item: any, itemIndex: number) => {
    const breakdown = [];
    const itemUniqueKey = `${item.id}-${itemIndex}`;
    
    // Get fulfillment data for this item using the corrected approach (following PurchaseOrders.tsx)
    const fulfillmentData = getPOFulfillmentData(item);
    
    // Add delivered quantities from each fulfillment
    fulfillmentData.fulfillments.forEach(fulfillment => {
      breakdown.push({
        ...item,
        dr_number: fulfillment.delivery_receipt_number,
        quantity: fulfillment.fulfilled_quantity,
        total_price: fulfillment.fulfilled_quantity * item.unit_price,
        delivery_date: fulfillment.delivery_date,
        delivery_id: fulfillment.dr_id,
        delivery_item_id: fulfillment.dr_item_id,
        status: 'delivered',
        po_item_unique_key: itemUniqueKey,
        fulfillment_reference: fulfillment.fulfillment_reference
      });
    });
    
    // Add pending quantity if any remains
    if (fulfillmentData.remaining > 0) {
      breakdown.push({
        ...item,
        dr_number: 'PENDING',
        quantity: fulfillmentData.remaining,
        total_price: fulfillmentData.remaining * item.unit_price,
        delivery_date: null,
        status: 'pending',
        po_item_unique_key: itemUniqueKey
      });
    }
    
    // If no fulfillments found, show as pending
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
  const allItems = currentItems.reduce((acc, item, itemIndex) => {
    // Use the new function to get breakdown with better fulfillment tracking
    const itemBreakdown = getItemBreakdown(item, itemIndex);
    
    itemBreakdown.forEach((breakdownItem, breakdownIndex) => {
      acc.push({
        ...breakdownItem,
        id: `${item.id}-${itemIndex}-${breakdownIndex}`,
        original_id: item.id,
        po_line_item_index: itemIndex,
        is_split_item: itemBreakdown.length > 1,
        split_index: breakdownIndex,
        split_total: itemBreakdown.length,
        // Add unique tracking to prevent edit conflicts
        can_edit: breakdownItem.status === 'pending',
        is_original_po_item: true
      });
    });
    
    return acc;
  }, [] as any[]);

  // Tax computation logic
  const totalInclusiveAmount = allItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const VAT_RATE = 0.12;
  
  const vatAmount = totalInclusiveAmount > 0 ? (totalInclusiveAmount * VAT_RATE) / (1 + VAT_RATE) : 0;
  const netOfVat = totalInclusiveAmount - vatAmount;
  const withholdingTax = withholdingTaxEnabled ? netOfVat * (withholdingTaxRate / 100) : 0;
  const totalAmountDue = netOfVat - discount + vatAmount - withholdingTax;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #purchase-invoice-preview, #purchase-invoice-preview * {
                visibility: visible !important;
              }
              #purchase-invoice-preview {
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
                max-height: 95vh !important;
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
              
              /* Company header responsive */
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
              
              /* Grid layouts responsive */
              .mobile-scaled-content .grid-cols-2 {
                grid-template-columns: 1fr 1fr;
                gap: 8px;
              }
              
              /* Table optimization */
              .mobile-scaled-content table {
                width: 100%;
                font-size: 11px;
                border-collapse: collapse;
              }
              
              .mobile-scaled-content th {
                padding: 6px 4px;
                font-size: 10px;
                font-weight: 600;
                background-color: #3b82f6;
                color: white;
              }
              
              .mobile-scaled-content td {
                padding: 6px 4px;
                font-size: 11px;
                border-bottom: 1px solid #e5e7eb;
              }
              
              /* Specific column widths for items table */
              .mobile-scaled-content .items-table {
                table-layout: fixed;
                width: 100%;
              }
              
              .mobile-scaled-content .items-table th:nth-child(1),
              .mobile-scaled-content .items-table td:nth-child(1) {
                width: 12%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              
              .mobile-scaled-content .items-table th:nth-child(2),
              .mobile-scaled-content .items-table td:nth-child(2) {
                width: 45%;
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
                max-width: 0;
              }
              
              .mobile-scaled-content .items-table th:nth-child(3),
              .mobile-scaled-content .items-table td:nth-child(3) {
                width: 8%;
                text-align: center;
                white-space: nowrap;
              }
              
              .mobile-scaled-content .items-table th:nth-child(4),
              .mobile-scaled-content .items-table td:nth-child(4) {
                width: 15%;
                text-align: right;
                white-space: nowrap;
              }
              
              .mobile-scaled-content .items-table th:nth-child(5),
              .mobile-scaled-content .items-table td:nth-child(5) {
                width: 20%;
                text-align: right;
                white-space: nowrap;
              }
              
              /* Product name specific styling */
              .mobile-scaled-content .product-name {
                font-size: 11px;
                line-height: 1.2;
                word-break: break-word;
                hyphens: auto;
                -webkit-hyphens: auto;
                -moz-hyphens: auto;
                overflow-wrap: anywhere;
              }
              
              /* Quantity input styling */
              .mobile-scaled-content .qty-cell {
                font-family: monospace;
                font-size: 10px;
                text-align: center;
                padding: 2px 4px;
              }
              
              /* Price formatting */
              .mobile-scaled-content .price-cell {
                font-family: monospace;
                font-size: 10px;
                white-space: nowrap;
              }
              
              /* Totals section */
              .mobile-scaled-content .totals-section {
                font-size: 11px;
              }
              
              .mobile-scaled-content .totals-section .font-bold {
                font-size: 12px;
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
              
              .mobile-scaled-content table {
                font-size: 10px;
              }
              
              .mobile-scaled-content th {
                padding: 4px 2px;
                font-size: 9px;
              }
              
              .mobile-scaled-content td {
                padding: 4px 2px;
                font-size: 10px;
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
            
            .modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: #9ca3af #e5e7eb;
            }
            
            .modal-scroll::-webkit-scrollbar {
              width: 8px;
            }
            
            .modal-scroll::-webkit-scrollbar-track {
              background: #e5e7eb;
              border-radius: 4px;
            }
            
            .modal-scroll::-webkit-scrollbar-thumb {
              background: #9ca3af;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            
            .modal-scroll::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }
          `}
        </style>
        
        <div className="h-full flex flex-col bg-white">
          <div className="flex-shrink-0 px-6 py-4 border-b bg-white no-print mobile-header">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Purchase Invoice Preview</span>
              <div className="flex gap-2">
                {isEditing && (
                  <Button 
                    onClick={handleSaveChanges} 
                    variant="default" 
                    size="sm"
                    disabled={saving || (!hasUnsavedChanges && softEditedItems.length === 0 && softAddedItems.length === 0 && softDeletedItems.size === 0)}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                )}
                {/* Only show Add DR button if there are items still to be delivered */}
                {(() => {
                  // Use unit-level tracking if data is available, fallback to old logic
                  let hasItemsToDeliver = false;
                  
                   if (reconciliationReport && unitStats) {
                     // Unit-level logic: Check completion percentage based on PO line items
                     const isNotFullyComplete = reconciliationReport.completion_percentage < 100;
                     
                     hasItemsToDeliver = isNotFullyComplete;
                     
                     console.log('Unit tracking data:', {
                       completion_percentage: reconciliationReport.completion_percentage,
                       hasItemsToDeliver,
                       unmatched_po_units_count: reconciliationReport.unmatched_po_units.length
                     });
                   } else {
                     // Fallback to item-level logic - check each PO line item individually
                     hasItemsToDeliver = false;
                     
                     for (const poItem of currentItems) {
                       let itemDelivered = 0;
                       
                       // Find all delivery items linked to this specific PO line item
                       for (const delivery of deliveries) {
                         const deliveryItemsForDelivery = delivery.delivery_items || [];
                         for (const deliveryItem of deliveryItemsForDelivery) {
                           // Check if this delivery item is linked to this PO item
                           if (deliveryItem.delivery_item_links) {
                             const isLinkedToThisPOItem = deliveryItem.delivery_item_links.some(
                               (link: any) => link.purchase_order_item_id === poItem.id
                             );
                             if (isLinkedToThisPOItem) {
                               itemDelivered += deliveryItem.quantity_delivered;
                             }
                           }
                         }
                       }
                       
                       // If this PO line item is not fully fulfilled, we have items to deliver
                       if (itemDelivered < poItem.quantity) {
                         hasItemsToDeliver = true;
                         break;
                       }
                     }
                     
                     console.log('Fallback to item-level logic (per line item):', {
                       hasItemsToDeliver,
                       items_check: currentItems.map(item => ({
                         id: item.id,
                         quantity: item.quantity,
                         product_id: item.product_id
                       }))
                     });
                   }
                  
                   return hasItemsToDeliver && (
                     <Button 
                       onClick={() => {
                         console.log('🔥 Add DR button clicked - PO data:', {
                           id: purchaseOrder.id,
                           supplier_client_id: purchaseOrder.supplier_client_id,
                           supplier_name: purchaseOrder.supplier_name,
                           client_po: purchaseOrder.client_po,
                           hasSupplierClientId: !!purchaseOrder.supplier_client_id,
                           fullPO: purchaseOrder
                         });
                         setShowAutoMatchDialog(true);
                       }} 
                       variant="outline" 
                       size="sm"
                     >
                       <Package className="h-4 w-4 mr-1" />
                       Add DR
                     </Button>
                   );
                })()}
                <Button 
                  onClick={() => setShowMarkAsPaidModal(true)} 
                  variant="outline"
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Add Payment
                </Button>
                <Button 
                  onClick={() => setShowDetailsModal(true)} 
                  variant="outline" 
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  onClick={() => setShowBudgetPlanModal(true)} 
                  variant="outline" 
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Budget Plan
                </Button>
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this purchase order? This action cannot be undone.
                        All associated items and delivery links will also be removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeletePurchaseOrder}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button 
                  onClick={handleEditToggle} 
                  variant="outline" 
                  size="sm"
                  className={isEditing ? 'bg-blue-100' : ''}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!isEditing && (
                  <Button onClick={handlePrint} variant="outline" size="sm">
                    Print
                  </Button>
                )}
                <Button onClick={onClose} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto modal-scroll mobile-scroll-container" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            <div id="purchase-invoice-preview" className="bg-white p-8 space-y-6 mobile-scaled-content zoomable-content">
              {/* Header */}
              <div className="border-b pb-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-800">TechPinoy</h1>
                    <p className="text-sm text-gray-600 mt-1">Your Trusted Tech Partner</p>
                    <div className="text-xs text-gray-500 mt-2">
                      <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
                      <p>Makati, Metro Manila, Philippines</p>
                      <p>Phone: +63 2 1234 5678 | Email: info@techpinoy.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <h2 className="text-2xl font-bold text-blue-800 mb-2">
                       {isQuotationMode ? 'QUOTATION' : 'INVOICE'}
                     </h2>
                    <div className="text-sm space-y-1">
                      {!isQuotationMode && (
                        <p><strong>Invoice #:</strong> PI-{currentPurchaseOrder.id.slice(0, 8)}</p>
                      )}
                      {!isQuotationMode && (
                        <p><strong>PO #:</strong> {currentPurchaseOrder.id.slice(0, 8)}</p>
                      )}
                      {!isQuotationMode && (
                        <p><strong>Client PO #:</strong> {currentPurchaseOrder.client_po || 'N/A'}</p>
                      )}
                      <p><strong>Date:</strong> {new Date(currentPurchaseOrder.created_at).toLocaleDateString()}</p>
                      {!isQuotationMode && (
                        <p><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            currentPurchaseOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                            currentPurchaseOrder.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {currentPurchaseOrder.status.toUpperCase()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                {isEditing && (
                  <div className="grid grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="po-date" className="text-sm font-medium text-gray-700">
                        P.O Date
                      </Label>
                      <Input
                        id="po-date"
                        type="date"
                        value={currentPurchaseOrder.created_at ? new Date(currentPurchaseOrder.created_at).toISOString().split('T')[0] : ''}
                        onChange={(e) => handlePurchaseOrderChange('created_at', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="client-po" className="text-sm font-medium text-gray-700">
                        Client PO #
                      </Label>
                      <Input
                        id="client-po"
                        type="text"
                        placeholder="Enter Client PO Number"
                        value={currentPurchaseOrder.client_po || ''}
                        onChange={(e) => handlePurchaseOrderChange('client_po', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

               {/* Customer Information */}
               <div className="grid grid-cols-2 gap-8">
                 <div>
                   <h3 className="font-bold text-gray-800 mb-2 border-b">
                     {isQuotationMode ? 'CUSTOMER INFORMATION' : 'BILL TO'}
                   </h3>
                   <div className="text-sm space-y-1">
                     <p><strong>Name:</strong> {currentPurchaseOrder.supplier_name || 'N/A'}</p>
                     <p><strong>Address:</strong> N/A</p>
                     <p><strong>Phone:</strong> N/A</p>
                     <p><strong>Email:</strong> N/A</p>
                   </div>
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800 mb-2 border-b">PREPARED BY</h3>
                   <div className="text-sm space-y-1">
                     <p><strong>{userProfile?.full_name || 'Sales Representative'}</strong></p>
                     <p>{userProfile?.email || 'sales@techpinoy.com'}</p>
                     <p>Sales Manager</p>
                     <p>Phone: +63 2 1234 5678</p>
                     <p><strong>TechPinoy</strong></p>
                     <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
                     <p>Makati, Metro Manila, Philippines</p>
                   </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">ITEMS</h3>
                </div>
                 
                {/* Always use table view, no mobile card switching */}
                <table className="w-full border-collapse border border-gray-300 items-table">
                  <thead>
                      <tr className="bg-blue-800 text-white">
                         <th className="border border-gray-300 px-4 py-2 text-left">
                           {isQuotationMode ? 'Item No.' : 'DR #'}
                         </th>
                       <th className="border border-gray-300 px-4 py-2 text-left">PRODUCT NAME</th>
                       <th className="border border-gray-300 px-4 py-2 text-center">QTY</th>
                       <th className="border border-gray-300 px-4 py-2 text-right">UNIT PRICE</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">TOTAL</th>
                      </tr>
                   </thead>
                  <tbody>
                    {allItems.length > 0 ? allItems.map((item, index) => (
                      <tr 
                        key={`${item.id}-${index}`} 
                        className={[
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white',
                          item.status === 'pending' ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : '',
                          item.status === 'delivered' ? 'bg-green-50 border-l-4 border-l-green-400' : ''
                        ].filter(Boolean).join(' ')}
                      >
                         <td className="border border-gray-300 px-4 py-2">
                           <div className="flex items-center gap-2">
                             {isQuotationMode ? (
                               <span className="text-gray-700 font-medium">{index + 1}</span>
                             ) : (
                               <>
                                 {item.dr_number === 'PENDING' && isEditing ? (
                                   <span className="text-yellow-700 font-medium">PENDING</span>
                                 ) : (
                                   <div className="flex items-center gap-2">
                                      <span className={
                                        unlinkedDeliveries.has(item.link_reference) 
                                          ? 'text-red-600 font-medium line-through' 
                                          : item.status === 'pending' 
                                            ? 'text-yellow-700 font-medium' 
                                            : 'text-green-700'
                                      }>
                                        {unlinkedDeliveries.has(item.link_reference) ? 'PENDING' : item.dr_number}
                                      </span>
                                      {item.status === 'delivered' && isEditing && !unlinkedDeliveries.has(item.link_reference) && (
                                       <Button
                                         onClick={() => handleUnlinkDelivery(item.delivery_id, item.delivery_item_id)}
                                         size="sm"
                                         variant="ghost"
                                         className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                         title="Unlink delivery"
                                       >
                                         <Unlink className="h-3 w-3" />
                                       </Button>
                                     )}
                                   </div>
                                 )}
                                 {item.status === 'delivered' && item.delivery_date && (
                                   <span className="text-xs text-gray-500">
                                     ({new Date(item.delivery_date).toLocaleDateString('en-US', { 
                                       month: 'numeric', 
                                       day: 'numeric', 
                                       year: '2-digit' 
                                     })})
                                   </span>
                                 )}
                               </>
                             )}
                           </div>
                         </td>
                          <td className="border border-gray-300 px-2 py-2 product-name">
                            {isEditing && item.status !== 'delivered' && !(item.is_split_item && item.status === 'pending') ? (
                              <Select
                                value={item.product_id || ''}
                                onValueChange={(value) => {
                                  const selectedProduct = products.find(p => p.id === value);
                                  const updatedItem = {
                                    id: item.original_id,
                                    product_id: value,
                                    model: selectedProduct ? getProductDisplayName(selectedProduct) : '',
                                    quantity: item.quantity,
                                    unit_price: item.unit_price
                                  };
                                  
                                  setSoftEditedItems(prev => {
                                    const existingIndex = prev.findIndex(editedItem => editedItem.id === item.original_id);
                                    if (existingIndex >= 0) {
                                      const updated = [...prev];
                                      updated[existingIndex] = { ...updated[existingIndex], ...updatedItem };
                                      return updated;
                                    } else {
                                      return [...prev, updatedItem];
                                    }
                                  });
                                  setHasUnsavedChanges(true);
                                }}
                              >
                                <SelectTrigger className="w-full text-xs">
                                  <SelectValue placeholder="Select product..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border shadow-lg z-50">
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {getProductDisplayName(product)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs">
                                {(() => {
                                  // Find the product to get proper display name
                                  const product = products.find(p => p.id === item.product_id);
                                  return product ? getProductDisplayName(product) : (item.model || 'N/A');
                                })()}
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-1 py-2 text-center qty-cell">
                            {isEditing && item.status !== 'delivered' && !(item.is_split_item && item.status === 'pending') ? (
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const updatedItem = {
                                    id: item.original_id,
                                    product_id: item.product_id,
                                    model: item.model,
                                    quantity: Number(e.target.value),
                                    unit_price: item.unit_price
                                  };
                                  
                                  setSoftEditedItems(prev => {
                                    const existingIndex = prev.findIndex(editedItem => editedItem.id === item.original_id);
                                    if (existingIndex >= 0) {
                                      const updated = [...prev];
                                      updated[existingIndex] = { ...updated[existingIndex], ...updatedItem };
                                      return updated;
                                    } else {
                                      return [...prev, updatedItem];
                                    }
                                  });
                                  setHasUnsavedChanges(true);
                                }}
                                className="w-12 text-xs text-center p-1"
                                min="0"
                                max="999"
                              />
                            ) : (
                              <span className={`text-xs ${item.status === 'pending' ? 'text-red-600 font-semibold' : ''}`}>
                                {item.quantity}
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right price-cell">
                            {isEditing && item.status !== 'delivered' && !(item.is_split_item && item.status === 'pending') ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => {
                                  const updatedItem = {
                                    id: item.original_id,
                                    product_id: item.product_id,
                                    model: item.model,
                                    quantity: item.quantity,
                                    unit_price: Number(e.target.value)
                                  };
                                  
                                  setSoftEditedItems(prev => {
                                    const existingIndex = prev.findIndex(editedItem => editedItem.id === item.original_id);
                                    if (existingIndex >= 0) {
                                      const updated = [...prev];
                                      updated[existingIndex] = { ...updated[existingIndex], ...updatedItem };
                                      return updated;
                                    } else {
                                      return [...prev, updatedItem];
                                    }
                                  });
                                  setHasUnsavedChanges(true);
                                }}
                                className="w-20 text-xs text-right p-1"
                              />
                            ) : (
                              <span className="text-xs">₱{item.unit_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right price-cell">
                            {isEditing && item.status !== 'delivered' && !(item.is_split_item && item.status === 'pending') ? (
                              <span className="text-xs">₱{(item.quantity * item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-xs">₱{item.total_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            )}
                          </td>
                       </tr>
                    )) : (
                       <tr>
                         <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                           No items found
                         </td>
                       </tr>
                    )}
                    
                     {/* Add new item row */}
                     {isEditing && (
                       <tr className="bg-blue-50">
                         <td className="border border-gray-300 px-4 py-2 text-center">
                           <span className="text-sm text-gray-500">{isQuotationMode ? (allItems.length + 1) : 'NEW'}</span>
                         </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Select
                            value={newItem.product_id || ''}
                            onValueChange={(value) => {
                              const selectedProduct = products.find(p => p.id === value);
                              setNewItem({
                                ...newItem, 
                                product_id: value,
                                model: selectedProduct ? getProductDisplayName(selectedProduct) : ''
                              });
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border shadow-lg z-50">
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {getProductDisplayName(product)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={newItem.quantity || ''}
                            onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                            className="w-20"
                          />
                        </td>
                         <td className="border border-gray-300 px-4 py-2">
                           <Input
                             type="number"
                             step="0.01"
                             placeholder="Price"
                             value={newItem.unit_price || ''}
                             onChange={(e) => setNewItem({...newItem, unit_price: e.target.value})}
                             onBlur={() => {
                               if (newItem.product_id && newItem.quantity && newItem.unit_price) {
                                 handleAddItem();
                               }
                             }}
                             className="w-24"
                           />
                         </td>
                         <td className="border border-gray-300 px-4 py-2 text-right">
                           ₱{(Number(newItem.quantity) * Number(newItem.unit_price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                         </td>
                       </tr>
                    )}
                   </tbody>
                </table>
               </div>

              {/* Quote Note, Terms and Tax Computation */}
              <div className="flex justify-between items-start gap-8">
                {/* Quote Note - Only show in quotation mode */}
                {isQuotationMode && (
                  <div className="w-1/2">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <strong>Note:</strong> This quotation is not a contract or a bill. It is our best guess at the total price for the service and goods described above. 
                        The customer will be billed after indicating acceptance of this quote. Payment will be due prior to the delivery of service 
                        or goods listed on the signed contract.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Terms - Only show in invoice mode */}
                {!isQuotationMode && (
                  <div className="w-1/2">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-2">TERMS</h4>
                      {isEditing ? (
                        <Select
                          value={selectedPaymentTerms}
                          onValueChange={handlePaymentTermsChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select payment terms..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-50">
                            <SelectItem value="due-on-receipt">Due upon Receipt</SelectItem>
                            <SelectItem value="net-15">NET 15</SelectItem>
                            <SelectItem value="net-30">NET 30</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-700">
                          {(() => {
                            const term = paymentTermsService.getPaymentTermById(selectedPaymentTerms);
                            return term?.name || 'Due upon Receipt';
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tax Computation */}
                <div className={isQuotationMode || !isQuotationMode ? "w-80" : "w-full max-w-md ml-auto"}>
                  <table className="w-full text-sm border border-gray-300">
                    <tbody>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2 font-medium text-gray-800">Total (Incl.)</td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right font-bold text-green-600">
                          ₱{totalInclusiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2 text-gray-800">Net of VAT</td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right text-gray-800">
                          ₱{netOfVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2 text-gray-800">VAT (12%)</td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right text-gray-800">
                          ₱{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2 text-gray-800">Discount</td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right text-gray-800">
                           {isEditing ? (
                             <input
                               type="number"
                               min={0}
                               step="0.01"
                               value={discount}
                               onChange={e => handleDiscountChange(Number(e.target.value))}
                               className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs bg-white text-gray-800 text-right"
                               placeholder="0.00"
                             />
                           ) : (
                             `₱${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                           )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2">
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={withholdingTaxEnabled}
                                onChange={e => handleWithholdingTaxToggle(e.target.checked)}
                                className="accent-blue-800"
                              />
                              <span className="text-gray-800">Withhold.</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={withholdingTaxRate}
                                onChange={e => handleWithholdingTaxRateChange(Number(e.target.value))}
                                className="w-8 px-1 py-0.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                                disabled={!withholdingTaxEnabled}
                              />
                              <span className="text-gray-800">%</span>
                            </label>
                          ) : (
                            <span className="text-gray-800">Withholding Tax ({withholdingTaxRate}%)</span>
                          )}
                        </td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right text-gray-800">
                          ₱{withholdingTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-3 font-bold text-base text-center text-gray-800" colSpan={2}>
                          TOTAL DUE
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3 font-bold text-lg text-center text-green-600" colSpan={2}>
                          ₱{totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes - Filter out TAX_SETTINGS */}
              {(() => {
                if (!currentPurchaseOrder.notes) return null;
                
                // Remove TAX_SETTINGS from notes display
                const cleanNotes = currentPurchaseOrder.notes.replace(/\[TAX_SETTINGS: .*?\]/g, '').trim();
                
                if (!cleanNotes) return null;
                
                return (
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-800 mb-2">NOTES</h3>
                    <p className="text-sm text-gray-600">{cleanNotes}</p>
                  </div>
                );
              })()}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-1">This is a computer-generated document. No signature required.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Link Advance Delivery Modal */}
        {showAutoMatchDialog && (
          <AutoMatchFulfillmentDialog
            open={showAutoMatchDialog}
            onOpenChange={setShowAutoMatchDialog}
            selectedPO={purchaseOrder as any}
            onCreateFulfillments={async (fulfillments) => {
              try {
                console.log('🔄 Creating fulfillments from PurchaseInvoicePreview:', fulfillments);
                console.log('🔍 PO data being passed to dialog:', {
                  id: purchaseOrder.id,
                  supplier_client_id: purchaseOrder.supplier_client_id,
                  supplier_name: purchaseOrder.supplier_name,
                  client_po: purchaseOrder.client_po,
                  fullPO: purchaseOrder
                });
                
                // Insert fulfillments into database
                const { error } = await supabase
                  .from('fulfillments')
                  .insert(fulfillments);
                
                if (error) throw error;
                
                toast.success(`Successfully created ${fulfillments.length} fulfillment(s)`);
                
                // Refresh the delivery data to show new fulfillments
                await fetchRelatedData();
                
                setShowAutoMatchDialog(false);
              } catch (error) {
                console.error('Error creating fulfillments:', error);
                toast.error('Failed to create fulfillments');
              }
            }}
          />
        )}

        {/* Purchase Order Detail Modal */}
        {showDetailsModal && (
          <PurchaseOrderDetailModal
            purchaseOrderId={purchaseOrder.id}
            onClose={() => setShowDetailsModal(false)}
          />
        )}

        {/* Budget Plan Modal */}
        {showBudgetPlanModal && (
          <BudgetPlanModal
            purchaseOrderId={purchaseOrder.id}
            onClose={() => setShowBudgetPlanModal(false)}
          />
        )}

        {/* Mark As Paid Modal */}
        {showMarkAsPaidModal && (
          <MarkAsPaidModal
            isOpen={showMarkAsPaidModal}
            purchaseOrderId={purchaseOrder.id}
            supplierName={purchaseOrder.supplier_name}
            totalAmount={currentItems.reduce((total, item) => total + (item.total_price || (item.quantity * item.unit_price)), 0)}
            onClose={() => setShowMarkAsPaidModal(false)}
            onConfirm={async (paymentData) => {
              // Handle payment confirmation logic here
              console.log('Payment data:', paymentData);
              setShowMarkAsPaidModal(false);
              toast.success('Payment recorded successfully');
            }}
          />
        )}
        
        {/* Unit Tracking Setup Guide */}
        <UnitTrackingSetupGuide />
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseInvoicePreview;