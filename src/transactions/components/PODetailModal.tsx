import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link, X, DollarSign, Edit, Plus, Trash2, Save, XCircle, Check, Package, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AutoMatchFulfillmentDialog } from "./AutoMatchFulfillmentDialog";
import { CreateDeliveryModal } from "@/components/sales/CreateDeliveryModal";
import { BudgetPlanModal } from "@/components/sales/BudgetPlanModal";
import { paymentTermsService } from "@/services/paymentTermsService";
import { getPOFulfillmentData, calculatePOFulfillmentStatus } from "@/transactions/utils/poStatusCalculation";
import { usePurchaseOrderItems } from '@/hooks/usePurchaseOrderItems';
import { productService } from '@/services/productService';
import { Product } from '@/types/database';
import { toast as sonnerToast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { SeriesSetItem, groupIntoSeriesSets, getColorDisplayName, getColorBadgeClass } from "@/utils/seriesSetGrouping";

interface PurchaseOrderWithItems {
  id: string;
  purchase_order_number?: string;
  supplier_name?: string;
  status?: string;
  payment_status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  client_po?: string;
  po_date?: string;
  sale_invoice_number?: string;
  expected_delivery_date?: string;
  due_date?: string;
  client_id?: string;
  supplier_client_id?: string;
  purchase_order_items: Array<{
    id: string;
    quantity: number;
    unit_price?: number;
    products: {
      id: string;
      name: string;
    };
    client_product_pricing?: {
      quoted_price: number;
      margin_percentage: number;
    };
  }>;
}

interface PODetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poNumber: string;
}

export function PODetailModal({ open, onOpenChange, poNumber }: PODetailModalProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithItems | null>(null);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [drNumbers, setDrNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showAutoMatchDialog, setShowAutoMatchDialog] = useState(false);
  const [showBudgetPlanModal, setShowBudgetPlanModal] = useState(false);
  const [showCreateDeliveryModal, setShowCreateDeliveryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string>('due-on-receipt');
  const [discount, setDiscount] = useState(0);
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState(false);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(2);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientTaxInfo, setClientTaxInfo] = useState<{ tax: string; wht: string } | null>(null);
  
  // Advanced edit mode state
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [editedPurchaseOrder, setEditedPurchaseOrder] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [newItem, setNewItem] = useState<any>({
    product_id: '',
    quantity: 0,
    unit_price: 0
  });
  
  // Soft state for item changes
  const [softEditedItems, setSoftEditedItems] = useState<any[]>([]);
  const [softAddedItems, setSoftAddedItems] = useState<any[]>([]);
  const [softDeletedItems, setSoftDeletedItems] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unlinkedDeliveries, setUnlinkedDeliveries] = useState<Set<string>>(new Set());
  
  // Series set grouping state removed
  
  // SKU Set selection and grouping state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSetGrouping, setShowSetGrouping] = useState(false);
  const [availableProductSets, setAvailableProductSets] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [groupedSets, setGroupedSets] = useState<Map<string, any>>(new Map()); // Track which items are grouped as sets
  
  // Purchase order items hook
  const { 
    items: purchaseOrderItems, 
    updateItem, 
    createItem, 
    deleteItem,
    refetch 
  } = usePurchaseOrderItems(purchaseOrder?.id || '');

  useEffect(() => {
    if (open && poNumber) {
      loadPODetails();
      loadFulfillments();
      loadDRNumbers();
      loadProducts();
      loadProductSets();
    } else if (!open) {
      // Reset all modal-specific state when modal is closed
      setGroupedSets(new Map());
      setSelectedItems(new Set());
      setValidationResults(null);
      setShowSetGrouping(false);
    }
  }, [open, poNumber]);

  useEffect(() => {
    if (purchaseOrder) {
      loadTaxSettings();
      setEditedPurchaseOrder(purchaseOrder);
      
      // Reset all soft changes when opening
      setHasUnsavedChanges(false);
      setUnlinkedDeliveries(new Set());
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
    }
  }, [purchaseOrder]);

  const loadTaxSettings = async () => {
    try {
      // First, try to get client's tax information from clients table  
      if (purchaseOrder?.supplier_client_id) {
        try {
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', purchaseOrder.supplier_client_id)
            .single();
          
          if (!error && clientData) {
            // Check if tax and wht columns exist in the response
            const tax = (clientData as any).tax || '';
            const wht = (clientData as any).wht || '';
            
            setClientTaxInfo({ tax, wht });
            
            // Set default withholding tax based on client data
            if (wht) {
              const whtValue = parseFloat(wht);
              if (!isNaN(whtValue)) {
                setWithholdingTaxEnabled(whtValue > 0);
                setWithholdingTaxRate(whtValue);
              }
            }
          }
        } catch (clientError) {
          console.log('Client tax data not available, using defaults');
        }
      }

      // Then load any saved tax settings from notes (this overrides client defaults)
      if (purchaseOrder?.notes) {
        const taxSettingsMatch = purchaseOrder.notes.match(/\[TAX_SETTINGS: (.*?)\]/);
        if (taxSettingsMatch) {
          const savedSettings = JSON.parse(taxSettingsMatch[1]);
          setDiscount(savedSettings.discount || 0);
          setWithholdingTaxEnabled(savedSettings.withholdingTaxEnabled || false);
          setWithholdingTaxRate(savedSettings.withholdingTaxRate || 2);
          setSelectedPaymentTerms(savedSettings.paymentTerms || 'due-on-receipt');
        }
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
    }
  };

  const loadPODetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            id,
            quantity,
            unit_price,
            product_id,
            products (
              id,
              name,
              sku,
              color
            )
          )
        `)
        .eq('client_po', poNumber)
        .single();

      if (error) throw error;
      
      // Get pricing data for each item
      const itemsWithPricing = await Promise.all(data.purchase_order_items?.map(async (item: any) => {
        const { data: pricingData } = await supabase
          .from('product_clients')
          .select('quoted_price, margin_percentage')
          .eq('product_id', item.product_id)
          .eq('client_id', data.supplier_client_id)
          .single();
        
        return {
          ...item,
          client_product_pricing: pricingData
        };
      }) || []);
      
      setPurchaseOrder({
        ...data,
        purchase_order_items: itemsWithPricing
      });
    } catch (error) {
      console.error('Error loading PO details:', error);
      toast({
        title: "Error loading purchase order",
        description: "Failed to load purchase order details",
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

  const loadDRNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_receipt_number');

      if (error) throw error;
      
      const drNumberMap: Record<string, string> = {};
      (data || []).forEach(dr => {
        drNumberMap[dr.id] = dr.delivery_receipt_number;
      });
      
      setDrNumbers(drNumberMap);
    } catch (error) {
      console.error('Error loading DR numbers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, color, category, description, created_at, updated_at');
      
      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadProductSets = async () => {
    try {
      const { data: productSetsData, error: productSetsError } = await supabase
        .from('product_sets')
        .select(`
          *,
          items:product_set_items(
            *,
            product:products(id, name, sku, color, category)
          )
        `);
      
      if (productSetsError) throw productSetsError;
      setAvailableProductSets(productSetsData || []);
    } catch (error) {
      console.error('Error loading product sets:', error);
    }
  };

  // SKU Set selection and validation functions
  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (isSelected) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
    
    // Clear validation results when selection changes
    setValidationResults(null);
  };

  const validateSelectedItems = () => {
    if (selectedItems.size === 0) {
      setValidationResults({ isValid: false, message: 'No items selected' });
      return;
    }

    const currentItems = getCurrentItems();
    const selectedItemsData = currentItems.filter(item => selectedItems.has(item.id));
    
    // Check if selected items match any existing product set
    const matchingSet = availableProductSets.find(set => {
      const setProductIds = set.items.map((item: any) => item.product_id).sort();
      const selectedProductIds = selectedItemsData.map(item => item.product_id).sort();
      
      return setProductIds.length === selectedProductIds.length &&
             setProductIds.every((id: string, index: number) => id === selectedProductIds[index]);
    });

    if (matchingSet) {
      // Validate quantities match the set requirements
      const quantitiesMatch = matchingSet.items.every((setItem: any) => {
        const selectedItem = selectedItemsData.find(item => item.product_id === setItem.product_id);
        return selectedItem && selectedItem.quantity === setItem.quantity;
      });

      if (quantitiesMatch) {
        setValidationResults({
          isValid: true,
          matchingSet,
          message: `Valid SKU Set: ${matchingSet.name} (${matchingSet.sku})`,
          canGroup: true
        });
      } else {
        setValidationResults({
          isValid: false,
          matchingSet,
          message: `Selected items match set "${matchingSet.name}" but quantities don't match requirements`,
          canGroup: false
        });
      }
    } else {
      setValidationResults({
        isValid: false,
        message: 'Selected items do not match any existing product set',
        canGroup: false
      });
    }
  };

  const handleGroupIntoSet = async () => {
    if (!validationResults?.isValid || !validationResults?.matchingSet) {
      toast({
        title: "Cannot group items",
        description: "Selected items do not form a valid set",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a unique group ID for this set
      const groupId = `set_${Date.now()}`;
      const currentItems = getCurrentItems();
      const selectedItemsData = currentItems.filter(item => selectedItems.has(item.id));
      
      // Create grouped set entry
      const newGroupedSet = {
        id: groupId,
        setDefinition: validationResults.matchingSet,
        items: selectedItemsData,
        totalQuantity: selectedItemsData.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: selectedItemsData.reduce((sum, item) => {
           const unitPrice = item.unit_price || item.client_product_pricing?.quoted_price || 0;
          return sum + (unitPrice * item.quantity);
        }, 0)
      };
      
      // Update grouped sets state
      const newGroupedSets = new Map(groupedSets);
      newGroupedSets.set(groupId, newGroupedSet);
      setGroupedSets(newGroupedSets);
      
      toast({
        title: "Items grouped successfully",
        description: `Grouped as SKU Set: ${validationResults.matchingSet.name}`,
      });
      
      setSelectedItems(new Set());
      setValidationResults(null);
      setShowSetGrouping(false);
      setHasUnsavedChanges(true);
      
    } catch (error) {
      console.error('Error grouping items:', error);
      toast({
        title: "Error grouping items",
        description: "Failed to group selected items into set",
        variant: "destructive",
      });
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setValidationResults(null);
    setShowSetGrouping(false);
  };

  const ungroupSet = (groupId: string) => {
    const newGroupedSets = new Map(groupedSets);
    newGroupedSets.delete(groupId);
    setGroupedSets(newGroupedSets);
    
    toast({
      title: "Set ungrouped",
      description: "Items are now displayed individually",
    });
    setHasUnsavedChanges(true);
  };

  // Get items to display - either individual items or grouped sets - only for THIS modal's context
  const getDisplayItems = () => {
    // Only process display items if this modal is open and has a valid purchase order
    if (!open || !purchaseOrder) return [];
    
    const currentItems = getCurrentItems();
    const groupedItemIds = new Set();
    
    // Collect all items that are part of grouped sets
    groupedSets.forEach(groupedSet => {
      groupedSet.items.forEach((item: any) => groupedItemIds.add(item.id));
    });
    
    // Get individual items that are not grouped
    const individualItems = currentItems.filter(item => !groupedItemIds.has(item.id));
    
    // Combine grouped sets and individual items
    const displayItems = [
      ...Array.from(groupedSets.values()),
      ...individualItems
    ];
    
    return displayItems;
  };

  // Use shared utility functions for consistency
  const getLocalPOFulfillmentData = (po: PurchaseOrderWithItems) => {
    const sharedData = getPOFulfillmentData(po, fulfillments);
    
    // Enhance with additional UI-specific data
    return sharedData.map(item => {
      const originalItem = po.purchase_order_items.find(p => p.id === item.id);
      return {
        ...originalItem,
        ...item,
        products: originalItem?.products,
        client_product_pricing: originalItem?.client_product_pricing
      };
    });
  };

  const handleCreateFulfillments = async (fulfillments: Array<{
    dr_id: string;
    dr_item_id: string;
    po_id: string;
    po_item_id: string;
    fulfilled_quantity: number;
    date: string;
  }>) => {
    try {
      const { error } = await supabase
        .from('fulfillments')
        .insert(fulfillments.map(f => ({
          dr_id: f.dr_id,
          dr_item_id: f.dr_item_id,
          po_id: f.po_id,
          po_item_id: f.po_item_id,
          fulfilled_quantity: f.fulfilled_quantity,
          date: f.date
        })));

      if (error) throw error;

      toast({
        title: "Fulfillments created successfully",
        description: `Created ${fulfillments.length} fulfillment records`,
      });

      // Reload data
      loadPODetails();
      loadFulfillments();
      loadDRNumbers();
    } catch (error) {
      toast({
        title: "Error creating fulfillments",
        description: "Failed to create fulfillment records",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
          <div className="flex items-center justify-center p-8">
            <div className="text-center py-8">Loading purchase order...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!purchaseOrder) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
          <div className="flex items-center justify-center p-8">
            <div className="text-center py-8">Purchase order not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handlePrint = () => {
    setIsEditing(false);
    setTimeout(() => window.print(), 100);
  };

  const handleGenerateDR = () => {
    setShowCreateDeliveryModal(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset all changes to original values
      setEditedPurchaseOrder(purchaseOrder);
      
      // Reset unlinked deliveries
      setUnlinkedDeliveries(new Set());
      
      // Reset tax settings to saved values from notes if they exist
      if (purchaseOrder?.notes) {
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
    if (!purchaseOrder) return;
    
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
          await purchaseOrderService.updatePurchaseOrderStatus(purchaseOrder.id);
          console.log('PO status updated after unlinking');
        } catch (statusError) {
          console.error('Error updating PO status after unlinking fulfillments:', statusError);
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
      
      setPurchaseOrder(prev => prev ? { ...prev, notes: updatedNotes } : null);
      setHasUnsavedChanges(false);
      setUnlinkedDeliveries(new Set()); // Clear unlinked deliveries
      
      // Clear all soft state changes
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
      
      setIsEditing(false);
      
      // Only refresh purchase order items, not delivery data to avoid overriding unlink changes
      await refetch();
      
      toast({
        title: "Changes saved successfully",
        description: "All changes have been applied successfully",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error saving changes",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

  // Helper function to abbreviate color names
  const abbreviateColor = (color: string) => {
    if (!color) return '';
    const colorMap: { [key: string]: string } = {
      'yellow': 'YL',
      'black': 'BLK', 
      'magenta': 'MG',
      'cyan': 'CY'
    };
    return colorMap[color.toLowerCase()] || color;
  };

  // Helper function to format product display name consistently
  const formatProductDisplay = (productData: any, fallbackModel?: string) => {
    if (!productData) {
      return fallbackModel || 'Unknown Product';
    }
    
    const name = productData.name || fallbackModel || 'Unknown Product';
    const sku = productData.sku ? ` - ${productData.sku}` : '';
    const color = productData.color ? ` '${abbreviateColor(productData.color)}'` : '';
    
    return `${name}${sku}${color}`.trim();
  };

  // Individual item editing functions
  const handleEditItem = (item: any) => {
    setEditingItem(item.id);
    // Use the same pricing logic as display - prioritize quoted_price over unit_price
    const currentUnitPrice = item.client_product_pricing?.quoted_price || item.unit_price || 0;
    setEditValues({
      id: item.id,
      product_id: item.product_id || '',
      model: item.model || '',
      quantity: item.quantity,
      unit_price: currentUnitPrice
    });
  };

  const handleSaveEdit = () => {
    // Soft save - update the item in soft state, don't persist to DB yet
    const selectedProduct = products.find(p => p.id === editValues.product_id);
    const originalItem = purchaseOrder?.purchase_order_items?.find(item => item.id === editValues.id);
    
    const updatedItem = {
      id: editValues.id,
      product_id: editValues.product_id,
      model: selectedProduct ? formatProductDisplay(selectedProduct) : editValues.model,
      quantity: Number(editValues.quantity),
      unit_price: Number(editValues.unit_price),
      // If the original item had client_product_pricing and we're changing the unit_price,
      // update the quoted_price to match the new unit_price so they stay in sync
      client_product_pricing: originalItem?.client_product_pricing ? {
        ...originalItem.client_product_pricing,
        quoted_price: Number(editValues.unit_price)
      } : undefined
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
    sonnerToast.info('Item updated. Click Save to apply changes.');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.quantity || !newItem.unit_price) {
      sonnerToast.error('Please fill all fields');
      return;
    }

    // Soft add - add to soft state, don't persist to DB yet
    const selectedProduct = products.find(p => p.id === newItem.product_id);
    const tempItem = {
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary unique ID
      purchase_order_id: purchaseOrder?.id,
      product_id: newItem.product_id,
      model: selectedProduct ? formatProductDisplay(selectedProduct) : '',
      quantity: Number(newItem.quantity),
      unit_price: Number(newItem.unit_price),
      total_price: Number(newItem.quantity) * Number(newItem.unit_price),
      created_at: new Date().toISOString(),
      isTemp: true // Mark as temporary
    };
    
    setSoftAddedItems(prev => [...prev, tempItem]);
    setNewItem({ product_id: '', quantity: 0, unit_price: 0 });
    setHasUnsavedChanges(true);
    sonnerToast.info('Item added. Click Save to apply changes.');
  };

  const handleDeleteItem = (itemId: string) => {
    // Check if it's a soft-added item (temp ID)
    const isSoftAddedItem = softAddedItems.some(item => item.id === itemId);
    
    if (isSoftAddedItem) {
      // Remove from soft added items
      setSoftAddedItems(prev => prev.filter(item => item.id !== itemId));
      sonnerToast.info('Item removed. Click Save to apply changes.');
    } else {
      // Mark for deletion (soft delete for existing items)
      setSoftDeletedItems(prev => new Set(prev).add(itemId));
      setHasUnsavedChanges(true);
      sonnerToast.info('Item marked for deletion. Click Save to apply changes.');
    }
  };

  // Get current items including soft changes
  const getCurrentItems = () => {
    if (!purchaseOrder) return [];
    
    // Start with existing items from purchaseOrder to preserve products relation
    let currentItems: any[] = [...(purchaseOrder.purchase_order_items || [])];
    
    // If we have items from the hook, merge them to get the latest data while preserving products
    if (purchaseOrderItems && purchaseOrderItems.length > 0) {
      currentItems = currentItems.map(item => {
        const hookItem = purchaseOrderItems.find(hi => hi.id === item.id);
        return hookItem ? { ...hookItem, products: item.products, client_product_pricing: item.client_product_pricing } : item;
      });
      
      // Add any new items from hook that aren't in original purchaseOrder
      const newHookItems = purchaseOrderItems.filter(hookItem => 
        !currentItems.some(item => item.id === hookItem.id)
      );
      currentItems = [...currentItems, ...newHookItems];
    }
    
    // Remove soft deleted items
    currentItems = currentItems.filter(item => !softDeletedItems.has(item.id));
    
    // Apply soft edits
    currentItems = currentItems.map(item => {
      const editedItem = softEditedItems.find(edit => edit.id === item.id);
      return editedItem ? { ...item, ...editedItem } : item;
    });
    
    // Add soft added items
    currentItems = [...currentItems, ...softAddedItems];
    
    return currentItems;
  };

  // Convert PO items to SeriesSetItem format - only for THIS modal's context
  const convertToSeriesSetItems = (items: any[]): SeriesSetItem[] => {
    // Only process if this modal is open and has a valid purchase order
    if (!open || !purchaseOrder) return [];
    
    return items.map(item => ({
      id: item.id,
      sku: item.products?.sku || item.sku || item.products?.name || 'Unknown',
      color: item.products?.color || item.color || 'unknown',
      name: item.products?.name || item.model || 'Unknown Product',
      quantity: item.quantity || 1,
      status: (() => {
        const fulfillmentData = getLocalPOFulfillmentData(purchaseOrder).find(fd => fd.id === item.id);
        return fulfillmentData?.status || 'pending';
      })(),
      poReference: purchaseOrder?.client_po || `PO-${purchaseOrder?.id?.slice(0, 8)}`,
      alias: item.products?.alias || item.alias
    }));
  };

  // Get series sets from current items - only for THIS modal's context
  const getSeriesSets = () => {
    // Only process series sets if this modal is open and has a specific PO
    if (!open || !purchaseOrder) return [];
    
    const currentItems = getCurrentItems();
    const seriesSetItems = convertToSeriesSetItems(currentItems);
    return groupIntoSeriesSets(seriesSetItems);
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
          <style>
            {`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #po-detail-preview, #po-detail-preview * {
                  visibility: visible !important;
                }
                #po-detail-preview {
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
            <div className="flex-shrink-0 px-4 py-3 border-b bg-white no-print mobile-header">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-lg font-semibold">Purchase Order Details</span>
                
                {/* Button container with responsive layout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  {/* Edit mode actions */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 order-1 sm:order-none">
                      <Button 
                        onClick={handleSaveChanges} 
                        variant="default" 
                        size="sm"
                        disabled={saving || (!hasUnsavedChanges && groupedSets.size === 0)}
                        className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        onClick={handleEditToggle}
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 whitespace-nowrap"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleEditToggle}
                        variant="outline" 
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 order-1 sm:order-none whitespace-nowrap"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        onClick={handleGenerateDR}
                        variant="outline" 
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50 order-1 sm:order-none whitespace-nowrap"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Generate DR
                      </Button>
                    </div>
                  )}
                  
                  {/* Utility actions */}
                  <div className="flex flex-wrap items-center gap-2 order-2 sm:order-none">
                    <Button 
                      onClick={() => setShowAutoMatchDialog(true)}
                      variant="outline" 
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <Link className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Link to DR</span>
                    </Button>
                    <Button 
                      onClick={() => setShowBudgetPlanModal(true)} 
                      variant="outline" 
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <DollarSign className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Budget</span>
                    </Button>
                    {!isEditing && (
                      <Button onClick={handlePrint} variant="outline" size="sm" className="whitespace-nowrap">
                        Print
                      </Button>
                    )}
                    <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto mobile-scroll-container" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <div id="po-detail-preview" className="bg-white p-4 sm:p-6 lg:p-8 space-y-6 mobile-scaled-content zoomable-content min-h-full min-w-0">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">PURCHASE ORDER</h1>
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="text-left">
                      <p><strong>PO Number:</strong> {purchaseOrder.client_po || `PO-${purchaseOrder.id.slice(0, 8)}`}</p>
                      <p><strong>Date:</strong> {(purchaseOrder.po_date || purchaseOrder.created_at) ? new Date(purchaseOrder.po_date || purchaseOrder.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'completed' ? 'bg-green-100 text-green-800' :
                          calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'completed' ? 'Completed' :
                           calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'partial' ? 'Partial' :
                           'Pending'}
                        </span>
                      </p>
                      <p><strong>Created:</strong> {purchaseOrder.created_at ? new Date(purchaseOrder.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 border-b">ORDERED FROM</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>TechPinoy</strong></p>
                      <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
                      <p>Makati, Metro Manila, Philippines</p>
                      <p>Phone: +63 2 1234 5678</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 border-b">SUPPLIER</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>{purchaseOrder.supplier_name || 'N/A'}</strong></p>
                      <p>Supplier ID: {purchaseOrder.client_id || 'N/A'}</p>
                      <p>Expected Delivery: {purchaseOrder.expected_delivery_date ? new Date(purchaseOrder.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
                      <p>Due Date: {purchaseOrder.due_date ? new Date(purchaseOrder.due_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                 {/* Items & Fulfillment Status */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold border-b pb-2">ITEMS & FULFILLMENT STATUS</h4>
                    <div className="flex gap-2">
                      {isEditing && (
                        <Button
                          onClick={() => setEditingItem('new')}
                          variant="outline"
                          size="sm"
                          className="no-print"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      )}
                      {isEditing && (
                        <Button
                          onClick={() => setShowSetGrouping(!showSetGrouping)}
                          variant="outline"
                          size="sm"
                          className="no-print"
                          disabled={selectedItems.size === 0}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Group into Set ({selectedItems.size})
                        </Button>
                      )}
                    </div>
                  </div>
                   
                   <div className="overflow-x-auto">
                     <table className="w-full min-w-[800px] border-collapse border border-gray-300 items-table">
                      <thead>
                        <tr className="bg-blue-800 text-white">
                          {isEditing && <th className="border border-gray-300 px-4 py-2 text-center no-print">SELECT</th>}
                          <th className="border border-gray-300 px-4 py-2 text-left">ITEM NAME</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">ORDERED QTY</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">UNIT PRICE</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">TOTAL</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">FULFILLED QTY</th>
                          {isEditing && <th className="border border-gray-300 px-4 py-2 text-center no-print">ACTIONS</th>}
                        </tr>
                      </thead>
                    <tbody>
                      {/* Add New Item Row */}
                      {isEditing && editingItem === 'new' && (
                        <tr className="no-print bg-blue-50">
                           <td className="border border-gray-300 px-4 py-2">
                             <div className="space-y-1">
                               <Select
                                 value={newItem.product_id}
                                 onValueChange={(value) => setNewItem(prev => ({ ...prev, product_id: value }))}
                               >
                                 <SelectTrigger className="w-full">
                                   <SelectValue placeholder="Select product..." />
                                 </SelectTrigger>
                                 <SelectContent>
                                   {products.map(product => (
                                     <SelectItem key={product.id} value={product.id}>
                                        {formatProductDisplay(product)}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                               <Badge variant="outline" className="bg-blue-100 text-blue-800">New</Badge>
                             </div>
                           </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <Input
                              type="number"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                              className="w-20"
                              min="1"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            <Input
                              type="number"
                              value={newItem.unit_price}
                              onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">₱{(newItem.quantity * newItem.unit_price).toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">0/{newItem.quantity}</td>
                           <td className="border border-gray-300 px-4 py-2 text-center no-print">
                             <div className="flex gap-1 justify-center">
                               <Button 
                                 onClick={handleAddItem} 
                                 size="sm" 
                                 variant="outline"
                                 className="h-7 w-7 p-0 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                               >
                                 <Check className="w-3 h-3" />
                               </Button>
                               <Button 
                                 onClick={() => {
                                   setEditingItem(null);
                                   setNewItem({ product_id: '', quantity: 0, unit_price: 0 });
                                 }} 
                                 size="sm" 
                                 variant="outline"
                                 className="h-7 w-7 p-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                               >
                                 <X className="w-3 h-3" />
                               </Button>
                             </div>
                           </td>
                        </tr>
                      )}


                      {/* Display Items (Individual + Grouped Sets) */}
                      {getDisplayItems().map((item: any) => {
                        // Check if this is a grouped set
                        if (item.setDefinition) {
                          // This is a grouped set
                          const groupId = item.id;
                          const setName = `${item.setDefinition.name} (${item.setDefinition.sku})`;
                          
                          return (
                            <TableRow key={groupId} className="bg-blue-50 border-l-4 border-l-blue-500">
                              {isEditing && (
                                <TableCell className="no-print text-center">
                                  <Button
                                    onClick={() => ungroupSet(groupId)}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6"
                                  >
                                    Ungroup
                                  </Button>
                                </TableCell>
                              )}
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <div className="font-medium text-blue-800">
                                        {item.setDefinition.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {item.items.map((setItem: any, index: number) => 
                                          setItem.products?.name || setItem.model || 'Unknown Product'
                                        ).join(', ')}
                                      </div>
                                      <div className="mt-1">
                                        {(() => {
                                          const allFulfilled = item.items.every((setItem: any) => {
                                            const fulfillmentData = getLocalPOFulfillmentData(purchaseOrder).find(fd => fd.id === setItem.id);
                                            return fulfillmentData?.status === 'fulfilled';
                                          });
                                          
                                          return (
                                            <Badge 
                                              variant={allFulfilled ? "default" : "secondary"}
                                              className={allFulfilled 
                                                ? "bg-green-100 text-green-800" 
                                                : "bg-yellow-100 text-yellow-800"
                                              }
                                            >
                                              {allFulfilled ? 'Complete' : 'Partial'}
                                            </Badge>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              <TableCell className="text-center">
                                {item.totalQuantity}
                              </TableCell>
                               <TableCell className="text-right">
                                 <div>
                                   <div>{`₱${(item.totalPrice / item.totalQuantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div>
                                   <div className="text-xs text-gray-500">
                                     {(() => {
                                       // Calculate net unit price for grouped set
                                       const getVATRate = () => {
                                         if (clientTaxInfo?.tax) {
                                           const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
                                           if (match) {
                                             return parseFloat(match[1]) / 100;
                                           }
                                         }
                                         return 0.12; // Default VAT 12%
                                       };
                                       
                                       const vatRate = getVATRate();
                                       const netUnitPrice = (item.totalPrice / item.totalQuantity) / (1 + vatRate);
                                       return `₱${netUnitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} net of VAT`;
                                     })()}
                                   </div>
                                 </div>
                               </TableCell>
                               <TableCell className="text-right">
                                 <div>
                                   <div>{`₱${item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div>
                                   <div className="text-xs text-gray-500">
                                     {(() => {
                                       // Calculate net total for grouped set
                                       const getVATRate = () => {
                                         if (clientTaxInfo?.tax) {
                                           const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
                                           if (match) {
                                             return parseFloat(match[1]) / 100;
                                           }
                                         }
                                         return 0.12; // Default VAT 12%
                                       };
                                       
                                       const vatRate = getVATRate();
                                       const netTotal = item.totalPrice / (1 + vatRate);
                                       return `₱${netTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} net of VAT`;
                                     })()}
                                   </div>
                                 </div>
                               </TableCell>
                               <TableCell className="text-center">
                                 {(() => {
                                   const totalFulfilled = item.items.reduce((sum: number, setItem: any) => {
                                     const fulfillmentData = getLocalPOFulfillmentData(purchaseOrder).find(fd => fd.id === setItem.id);
                                     return sum + (fulfillmentData?.totalFulfilled || 0);
                                   }, 0);
                                   return `${totalFulfilled}/${item.totalQuantity}`;
                                 })()}
                               </TableCell>
                               {isEditing && (
                                 <TableCell className="no-print text-center">
                                   {/* No individual actions for grouped sets */}
                                 </TableCell>
                               )}
                            </TableRow>
                          );
                        } else {
                          // This is an individual item (existing logic)
                          const fulfillmentData = getLocalPOFulfillmentData(purchaseOrder).find(fd => fd.id === item.id);
                          const unitPrice = item.unit_price || item.client_product_pricing?.quoted_price || 0;
                          const total = unitPrice * item.quantity;
                          const isDeleted = softDeletedItems.has(item.id);
                          const isEditingThisItem = editingItem === item.id;
                          
                          if (isDeleted) {
                              return (
                                <tr key={item.id} className="bg-red-50 opacity-50 no-print">
                                  <td colSpan={isEditing ? 7 : 6} className="border border-gray-300 px-4 py-2 text-center text-red-600">
                                    Item marked for deletion - will be removed when saved
                                  </td>
                                </tr>
                              );
                          }
                          
                          return (
                            <TableRow 
                              key={item.id}
                              className={`${fulfillmentData?.status === 'fulfilled' ? 'bg-green-50' : ''} ${item.isTemp ? 'bg-blue-50' : ''}`}
                            >
                              {isEditing && (
                                <TableCell className="no-print text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.has(item.id)}
                                    onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                                {isEditingThisItem ? (
                                  <Select
                                    value={editValues.product_id}
                                    onValueChange={(value) => setEditValues(prev => ({ ...prev, product_id: value }))}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map(product => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {formatProductDisplay(product)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                 ) : (
                                   <div className="flex items-center space-x-2">
                                      <div>
                                        <div className="font-medium">
                                          {item.products?.name || item.model || 'Unknown Product'}
                                        </div>
                                        {item.products?.sku && (
                                          <div className="text-xs text-gray-500">
                                            {item.products.sku}{item.products.color ? ` ${abbreviateColor(item.products.color)}` : ''}
                                          </div>
                                        )}
                                        <div className="mt-1 flex items-center gap-2">
                                          <Badge 
                                            variant={fulfillmentData?.status === 'fulfilled' ? "default" : "secondary"}
                                            className={fulfillmentData?.status === 'fulfilled' 
                                              ? "bg-green-100 text-green-800" 
                                              : "bg-yellow-100 text-yellow-800"
                                            }
                                          >
                                            {fulfillmentData?.status === 'fulfilled' ? 'Fulfilled' : 'Pending'}
                                          </Badge>
                                          {item.isTemp && (
                                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                              New
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                   </div>
                                 )}
                                 {fulfillmentData?.fulfillments?.length > 0 && !isEditingThisItem && (
                                   <div className="text-xs text-gray-500 mt-1">
                                     Fulfilled by DR: {Array.from(new Set(fulfillmentData.fulfillments.map(f => 
                                       drNumbers[f.dr_id] || f.dr_id
                                     ))).filter(Boolean).join(', ')}
                                   </div>
                                 )}
                              </TableCell>
                              <TableCell className="text-center">
                                {isEditingThisItem ? (
                                  <Input
                                    type="number"
                                    value={editValues.quantity}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                    className="w-20"
                                    min="1"
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isEditingThisItem ? (
                                  <Input
                                    type="number"
                                    value={editValues.unit_price}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                                    className="w-24"
                                    min="0"
                                    step="0.01"
                                  />
                                 ) : (
                                   <div>
                                     <div>{`₱${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div>
                                     <div className="text-xs text-gray-500">
                                       {(() => {
                                         // Calculate net unit price (VAT-exclusive)
                                         const getVATRate = () => {
                                           if (clientTaxInfo?.tax) {
                                             const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
                                             if (match) {
                                               return parseFloat(match[1]) / 100;
                                             }
                                           }
                                           return 0.12; // Default VAT 12%
                                         };
                                         
                                         const vatRate = getVATRate();
                                         const netUnitPrice = unitPrice / (1 + vatRate);
                                         return `₱${netUnitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} net of VAT`;
                                       })()}
                                     </div>
                                   </div>
                                 )}
                              </TableCell>
                               <TableCell className="text-right">
                                 <div>
                                   <div>{`₱${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</div>
                                   <div className="text-xs text-gray-500">
                                     {(() => {
                                       // Calculate net total (VAT-exclusive)
                                       const getVATRate = () => {
                                         if (clientTaxInfo?.tax) {
                                           const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
                                           if (match) {
                                             return parseFloat(match[1]) / 100;
                                           }
                                         }
                                         return 0.12; // Default VAT 12%
                                       };
                                       
                                       const vatRate = getVATRate();
                                       const netTotal = total / (1 + vatRate);
                                       return `₱${netTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} net of VAT`;
                                     })()}
                                   </div>
                                 </div>
                               </TableCell>
                               <TableCell className="text-center">
                                 {`${fulfillmentData?.totalFulfilled || 0}/${item.quantity}`}
                               </TableCell>
                               {isEditing && (
                                 <TableCell className="no-print text-center">
                                   <div className="flex items-center gap-1 justify-center">
                                     {isEditingThisItem ? (
                                       <>
                                         <Button
                                           onClick={() => handleSaveEdit()}
                                           variant="outline"
                                           size="sm"
                                           className="h-7 w-7 p-0 bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                         >
                                           <Check className="w-3 h-3" />
                                         </Button>
                                         <Button
                                           onClick={() => {
                                             setEditingItem(null);
                                             setEditValues({});
                                           }}
                                           variant="outline"
                                           size="sm"
                                           className="h-7 w-7 p-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                         >
                                           <X className="w-3 h-3" />
                                         </Button>
                                       </>
                                     ) : (
                                       <>
                                         <Button
                                           onClick={() => handleEditItem(item)}
                                           variant="outline"
                                           size="sm"
                                           className="h-7 w-7 p-0 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                         >
                                           <Edit className="w-3 h-3" />
                                         </Button>
                                         <Button
                                           onClick={() => handleDeleteItem(item.id)}
                                           variant="outline"
                                           size="sm"
                                           className="h-7 w-7 p-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                         >
                                           <Trash2 className="w-3 h-3" />
                                         </Button>
                                       </>
                                     )}
                                   </div>
                                 </TableCell>
                               )}
                            </TableRow>
                          );
                        }
                      })}
                     </tbody>
                   </table>
                   </div>
                  
                  {/* SKU Set Grouping Panel */}
                  {isEditing && showSetGrouping && selectedItems.size > 0 && (
                    <Card className="mt-4 p-4 bg-blue-50 border-blue-200 no-print">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-800">
                          SKU Set Grouping - {selectedItems.size} items selected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={validateSelectedItems}
                              variant="outline"
                              size="sm"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Validate Selection
                            </Button>
                            <Button
                              onClick={clearSelection}
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Selection
                            </Button>
                          </div>
                          
                          {validationResults && (
                            <div className={`p-3 rounded-md ${
                              validationResults.isValid 
                                ? 'bg-green-100 border border-green-300' 
                                : 'bg-red-100 border border-red-300'
                            }`}>
                              <p className={`text-sm font-medium ${
                                validationResults.isValid ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {validationResults.message}
                              </p>
                              
                              {validationResults.canGroup && (
                                <div className="mt-2">
                                  <Button
                                    onClick={handleGroupIntoSet}
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Package className="w-4 h-4 mr-2" />
                                    Group into SKU Set
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Summary Section */}
                  {purchaseOrder.purchase_order_items.some(item => 
                    getLocalPOFulfillmentData(purchaseOrder).find(fd => fd.id === item.id)?.remaining > 0
                  ) && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                      <h5 className="font-medium text-orange-800 mb-2">Fulfillment Summary</h5>
                      <p className="text-sm text-orange-700">
                        This purchase order has items that are not fully fulfilled. 
                        Click "Link to DR" to fulfill remaining quantities.
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary Information */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 border-b">ORDER SUMMARY</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Total Items:</strong> {purchaseOrder.purchase_order_items.length}</p>
                      <p><strong>Total Quantity:</strong> {purchaseOrder.purchase_order_items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                      <p><strong>Order Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'completed' ? 'bg-green-100 text-green-800' :
                          calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'completed' ? 'Completed' :
                           calculatePOFulfillmentStatus(purchaseOrder, fulfillments) === 'partial' ? 'Partial' :
                           'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 border-b">NOTES</h3>
                    <div className="text-sm">
                      {(() => {
                        if (!purchaseOrder.notes) return 'No additional notes';
                        
                        // Remove TAX_SETTINGS from notes display
                        const cleanNotes = purchaseOrder.notes.replace(/\[TAX_SETTINGS: .*?\]/g, '').trim();
                        
                        return cleanNotes || 'No additional notes';
                      })()}
                    </div>
                  </div>
                </div>

                {/* Terms and Tax Computation */}
                <div className="flex justify-between items-start gap-8">
                  {/* Terms Section */}
                  <div className="w-1/2">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-2">TERMS</h4>
                      {isEditing ? (
                        <Select
                          value={selectedPaymentTerms}
                          onValueChange={handlePaymentTermsChange}
                        >
                          <SelectTrigger className="w-full bg-white border shadow-lg z-50">
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
                  
                  {/* Tax Computation */}
                  <div className="w-1/2">
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-3">TAX COMPUTATION</h4>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const subtotal = purchaseOrder.purchase_order_items.reduce((sum, item) => {
                            const unitPrice = item.unit_price || item.client_product_pricing?.quoted_price || 0;
                            return sum + (unitPrice * item.quantity);
                          }, 0);
                          
                          // Get VAT rate from client tax info or default to 12%
                          const getVATRate = () => {
                            if (clientTaxInfo?.tax) {
                              const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
                              if (match) {
                                return parseFloat(match[1]) / 100;
                              }
                            }
                            return 0.12; // Default VAT 12%
                          };
                          
                          // Get WHT rate from client info or default to 0%
                          const getWHTRate = () => {
                            if (clientTaxInfo?.wht) {
                              const whtValue = parseFloat(clientTaxInfo.wht);
                              if (!isNaN(whtValue)) {
                                return whtValue / 100;
                              }
                            }
                            return withholdingTaxEnabled ? (withholdingTaxRate / 100) : 0;
                          };
                          
                          const vatRate = getVATRate();
                          const whtRate = getWHTRate();
                          const vatAmount = subtotal * vatRate;
                          const netOfVat = subtotal - vatAmount;
                          const withholdingTax = netOfVat * whtRate;
                          const totalAmountDue = netOfVat - discount + vatAmount - withholdingTax;
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal (Inclusive):</span>
                                <span>₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>VAT ({(vatRate * 100).toFixed(1)}%):</span>
                                <span>₱{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Net of VAT:</span>
                                <span>₱{netOfVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Discount:</span>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => handleDiscountChange(Number(e.target.value))}
                                    className="w-20 h-6 text-xs text-right"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  <span>₱{discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  {isEditing ? (
                                    <>
                                      <input
                                        type="checkbox"
                                        checked={withholdingTaxEnabled}
                                        onChange={e => handleWithholdingTaxToggle(e.target.checked)}
                                        className="w-3 h-3"
                                      />
                                      <span>Withholding Tax</span>
                                      <Input
                                        type="number"
                                        value={withholdingTaxRate}
                                        onChange={e => handleWithholdingTaxRateChange(Number(e.target.value))}
                                        className="w-12 h-6 text-xs text-center"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        disabled={!withholdingTaxEnabled}
                                      />
                                      <span>%</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-800">Withholding Tax ({(whtRate * 100).toFixed(1)}%)</span>
                                  )}
                                </div>
                                <span>
                                  ₱{withholdingTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold text-lg">
                                  <span>TOTAL AMOUNT DUE:</span>
                                  <span>₱{totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="border-b border-gray-400 mb-2 pb-8"></div>
                    <p className="text-sm font-semibold">ORDERED BY</p>
                    <p className="text-xs text-gray-600">Signature & Date</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-gray-400 mb-2 pb-8"></div>
                    <p className="text-sm font-semibold">APPROVED BY</p>
                    <p className="text-xs text-gray-600">Signature & Date</p>
                  </div>
                </div>

                 {/* Footer */}
                <div className="text-center text-xs text-gray-500 pt-4 border-t">
                  <p>This purchase order was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                  <p>TechPinoy - Your Trusted Tech Partner</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {purchaseOrder && (
        <AutoMatchFulfillmentDialog
          open={showAutoMatchDialog}
          onOpenChange={setShowAutoMatchDialog}
          selectedPO={purchaseOrder as any}
          onCreateFulfillments={handleCreateFulfillments}
        />
      )}

      {/* Budget Plan Modal */}
      {showBudgetPlanModal && purchaseOrder && (
        <BudgetPlanModal
          purchaseOrderId={purchaseOrder.id}
          onClose={() => setShowBudgetPlanModal(false)}
        />
      )}

      {/* Create Delivery Modal */}
      {showCreateDeliveryModal && purchaseOrder && (
        <CreateDeliveryModal
          purchaseOrderId={purchaseOrder.id}
          onClose={() => setShowCreateDeliveryModal(false)}
          onSuccess={() => {
            setShowCreateDeliveryModal(false);
            // Refresh the PO data to show updated fulfillment status
            loadPODetails();
            loadFulfillments();
          }}
        />
      )}
    </>
  );
}