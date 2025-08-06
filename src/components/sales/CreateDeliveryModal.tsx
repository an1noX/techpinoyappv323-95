import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Package, AlertCircle, Users, StickyNote } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { usePurchaseOrdersEnhanced } from '@/hooks/usePurchaseOrdersEnhanced';
import { useClients } from '@/hooks/useClients';
import { CreateDeliveryData, PurchaseOrderItem } from '@/types/purchaseOrder';
import { Client } from '@/types/database';
import { Product } from '@/types/sales';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { deliveryService } from '@/services/deliveryService';
import { productService } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { deliveryReceiptService } from '@/services/deliveryReceiptService';

interface CreateDeliveryModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  purchaseOrderId?: string;
}

interface DeliveryItemForm {
  product_id?: string;
  name: string;
  sku?: string;
  color?: string;
  model?: string;
  quantity_delivered: number;
  unit_price: number;
  purchase_order_item_id?: string;
  ordered_quantity?: number;
  already_delivered?: number;
  max_remaining?: number;
}

export const CreateDeliveryModal = ({ onClose, onSuccess, purchaseOrderId }: CreateDeliveryModalProps) => {
  const { createDelivery, getDeliveriesByPurchaseOrder } = useDeliveries();
  const { purchaseOrders } = usePurchaseOrdersEnhanced();
  const { clients, loading: clientsLoading } = useClients();
  const [loading, setLoading] = useState(false);
  const [poItems, setPOItems] = useState<PurchaseOrderItem[]>([]);
  const [availablePOs, setAvailablePOs] = useState<any[]>([]);
  const [isAdvanceDelivery, setIsAdvanceDelivery] = useState(!purchaseOrderId);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  
  const [formData, setFormData] = useState({
    purchase_order_id: purchaseOrderId || 'none',
    client_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_receipt_number: '',
    notes: ''
  });
  
  const [items, setItems] = useState<DeliveryItemForm[]>([]);
  // Editable price logic
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  // Editable price handlers
  const handlePriceEdit = (index: number) => {
    setEditingPriceIndex(index);
    setTempPrice(items[index].unit_price.toString());
  };

  const handlePriceCancel = () => {
    setEditingPriceIndex(null);
    setTempPrice('');
  };

  const handlePriceConfirm = (index: number) => {
    const newPrice = parseFloat(tempPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    updateItem(index, 'unit_price', newPrice);
    setEditingPriceIndex(null);
    setTempPrice('');
  };

  // New state declarations for product search
  const [selectProductOpen, setSelectProductOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [qtyPromptOpen, setQtyPromptOpen] = useState(false);
  const [qtyPromptProduct, setQtyPromptProduct] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [generatingDR, setGeneratingDR] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Filter available purchase orders to exclude completed ones and those with no remaining items
  useEffect(() => {
    const filterAvailablePOs = async () => {
      const available = [];
      for (const po of purchaseOrders) {
        // Skip completed purchase orders
        if (po.status === 'completed') continue;
        
        try {
          const poData = await purchaseOrderService.getPurchaseOrderWithItems(po.id);
          if (poData?.purchase_order_items) {
            // Get deliveries to check remaining quantities
            const deliveries = await getDeliveriesByPurchaseOrder(po.id);
            const deliveredQuantities: Record<string, number> = {};
            
            for (const delivery of deliveries) {
              const deliveryWithItems = await deliveryService.getDeliveryWithItems(delivery.id);
              if (deliveryWithItems?.delivery_items) {
                deliveryWithItems.delivery_items.forEach((item: any) => {
                  const productId = item.product_id;
                  if (productId) {
                    deliveredQuantities[productId] = (deliveredQuantities[productId] || 0) + item.quantity_delivered;
                  }
                });
              }
            }
            
            // Check if any items have remaining quantities
            const hasRemainingItems = poData.purchase_order_items.some(item => {
              const alreadyDelivered = deliveredQuantities[item.product_id || ''] || 0;
              return alreadyDelivered < item.quantity;
            });
            
            if (hasRemainingItems) {
              available.push(po);
            }
          }
        } catch (error) {
          console.error(`Error checking PO ${po.id}:`, error);
        }
      }
      setAvailablePOs(available);
    };

    if (purchaseOrders.length > 0) {
      filterAvailablePOs();
    }
  }, [purchaseOrders, getDeliveriesByPurchaseOrder]);

  // Auto-fill client from PO when PO is selected
  useEffect(() => {
    if (formData.purchase_order_id && formData.purchase_order_id !== 'none') {
      setIsAdvanceDelivery(false);
      loadPOItems(formData.purchase_order_id);
      
      // Auto-fill client from PO
      const selectedPO = purchaseOrders.find(po => po.id === formData.purchase_order_id);
      if (selectedPO?.supplier_client_id) {
        const client = clients.find(c => c.id === selectedPO.supplier_client_id);
        if (client) {
          setSelectedClient(client);
          setFormData(prev => ({ ...prev, client_id: client.id }));
        }
      }
    } else {
      setIsAdvanceDelivery(true);
      setPOItems([]);
      setItems([]);
      // Reset client selection for advance delivery
      setSelectedClient(null);
      setFormData(prev => ({ ...prev, client_id: '' }));
    }
  }, [formData.purchase_order_id, purchaseOrders, clients]);

  // Auto-generate DR number on component mount if empty
  useEffect(() => {
    const initializeDRNumber = async () => {
      if (!formData.delivery_receipt_number) {
        try {
          const nextDRNumber = await deliveryReceiptService.generateNextDRNumber();
          setFormData(prev => ({ ...prev, delivery_receipt_number: nextDRNumber }));
        } catch (error) {
          console.error('Error auto-generating DR number on init:', error);
          // Don't show error toast on init, just fail silently
        }
      }
    };

    initializeDRNumber();
  }, []); // Only run once on mount

  const loadPOItems = async (poId: string) => {
    try {
      const poData = await purchaseOrderService.getPurchaseOrderWithItems(poId);
      if (poData && poData.purchase_order_items) {
        setPOItems(poData.purchase_order_items);
        
        // Get all deliveries for this PO to calculate already delivered quantities
        const deliveries = await getDeliveriesByPurchaseOrder(poId);
        const deliveredQuantities: Record<string, number> = {};
        
        // Calculate total delivered quantity for each product
        for (const delivery of deliveries) {
          const deliveryWithItems = await deliveryService.getDeliveryWithItems(delivery.id);
          if (deliveryWithItems?.delivery_items) {
            deliveryWithItems.delivery_items.forEach((item: any) => {
              const productId = item.product_id;
              if (productId) {
                deliveredQuantities[productId] = (deliveredQuantities[productId] || 0) + item.quantity_delivered;
              }
            });
          }
        }

        // Filter items to only include those that haven't been fully delivered
        const availableItems = poData.purchase_order_items.filter(item => {
          const alreadyDelivered = deliveredQuantities[item.product_id || ''] || 0;
          return alreadyDelivered < item.quantity;
        });

        if (availableItems.length === 0) {
          toast.info('All items from this purchase order have been fully delivered.');
          setItems([]);
          return;
        }

        // Pre-populate items with remaining quantities and fetch product details
        const deliveryItems = await Promise.all(availableItems.map(async (item, index) => {
          const alreadyDelivered = deliveredQuantities[item.product_id || ''] || 0;
          const remainingQuantity = item.quantity - alreadyDelivered;
          
          // Fetch product details to get SKU and color
          let productDetails = null;
          if (item.product_id) {
            try {
              productDetails = await productService.getProductById(item.product_id);
            } catch (error) {
              console.error('Error fetching product details:', error);
            }
          }
          
          return {
            product_id: item.product_id || undefined,
            name: productDetails?.name || item.model || `Item ${index + 1}`,
            sku: productDetails?.sku,
            color: productDetails?.color,
            model: item.model || undefined,
            quantity_delivered: remainingQuantity,
            unit_price: item.unit_price,
            purchase_order_item_id: item.id,
            ordered_quantity: item.quantity,
            already_delivered: alreadyDelivered,
            max_remaining: remainingQuantity
          };
        }));
        setItems(deliveryItems);
      }
    } catch (error) {
      console.error('Error loading PO items:', error);
      toast.error('Failed to load purchase order items');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Validation for advance deliveries
      if (isAdvanceDelivery && !formData.client_id) {
        toast.error('Please select a client for advance deliveries');
        setLoading(false);
        return;
      }

      // Check for duplicate delivery receipt number
      if (formData.delivery_receipt_number?.trim()) {
        const { data: existingDeliveries, error } = await supabase
          .from('deliveries')
          .select('id, delivery_receipt_number')
          .eq('delivery_receipt_number', formData.delivery_receipt_number.trim())
          .limit(1);

        if (error) {
          console.error('Error checking for duplicate DR:', error);
          toast.error('Error validating delivery receipt number');
          setLoading(false);
          return;
        }

        if (existingDeliveries && existingDeliveries.length > 0) {
          toast.error(`Delivery receipt number "${formData.delivery_receipt_number}" already exists. Please use a different number.`);
          setLoading(false);
          return;
        }
      }

      const validItems = items.filter(item => 
        item.quantity_delivered > 0 && (item.product_id || item.model)
      );
      if (validItems.length === 0) {
        toast.error('Please add at least one item with quantity > 0');
        setLoading(false);
        return;
      }

      const deliveryData: CreateDeliveryData = {
        purchase_order_id: formData.purchase_order_id && formData.purchase_order_id !== 'none' 
          ? formData.purchase_order_id 
          : undefined,
        client_id: formData.client_id || undefined,
        delivery_date: formData.delivery_date,
        delivery_receipt_number: formData.delivery_receipt_number || undefined,
        notes: formData.notes || undefined,
        items: validItems.map(item => ({
          product_id: item.product_id,
          quantity_delivered: item.quantity_delivered
        }))
      };

      const createdDelivery = await createDelivery(deliveryData);
      
      // Auto-create fulfillments if this delivery is linked to a PO
      if (formData.purchase_order_id && formData.purchase_order_id !== 'none' && createdDelivery) {
        await createAutoFulfillments(createdDelivery.id, formData.purchase_order_id, validItems);
      }
      
      if (isAdvanceDelivery) {
        toast.success('Advance delivery recorded successfully! You can link this to a purchase order later.');
      } else {
        toast.success('Delivery recorded successfully!');
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      
      // Provide specific error messages based on the error type
      if (error?.code === '42501') {
        toast.error('Permission denied: Unable to create delivery records. Please check your database permissions.');
      } else if (error?.message?.includes('permission denied')) {
        toast.error('Database permission error: Please contact your administrator.');
      } else {
        toast.error(error?.message || 'Failed to create delivery');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItemForm, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const maxAllowed = item.max_remaining || Infinity;
        const validQuantity = Math.max(0, Math.min(quantity, maxAllowed));
        return { ...item, quantity_delivered: validQuantity };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Inline product addition for advance delivery
  const addAdvanceItem = () => {
    const newItem: DeliveryItemForm = {
      name: `Product ${items.length + 1}`,
      quantity_delivered: 1,
      unit_price: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  // Product search logic (similar to CreatePurchaseOrderModal)
  const searchProducts = async (query: string) => {
    setProductSearchLoading(true);
    try {
      const results = await productService.searchProducts(query.trim() ? query : "");
      setProductResults(results);
    } catch (err) {
      setProductResults([]);
    } finally {
      setProductSearchLoading(false);
    }
  };

  const handleAddProductClick = (product: Product) => {
    setQtyPromptProduct(product);
    setQtyInput(1);
    setQtyPromptOpen(true);
    setTimeout(() => { qtyInputRef.current?.focus(); }, 100);
  };

  const handleConfirmQty = async () => {
    if (qtyPromptProduct && qtyInput > 0) {
      // Fetch price for the product
      let unitPrice = 0;
      try {
        if (formData.client_id) {
          const productWithClients = await productService.getProductWithClients(qtyPromptProduct.id);
          if (productWithClients && productWithClients.clients) {
            const clientEntry = productWithClients.clients.find((c: any) => c.client_id === formData.client_id);
            unitPrice = clientEntry ? clientEntry.quoted_price : 0;
          }
        }
      } catch (error) {
        console.error('Error fetching product price:', error);
      }

      const newItem: DeliveryItemForm = {
        product_id: qtyPromptProduct.id,
        name: qtyPromptProduct.name,
        sku: qtyPromptProduct.sku,
        color: qtyPromptProduct.color,
        quantity_delivered: qtyInput,
        unit_price: unitPrice,
        model: qtyPromptProduct.name
      };

      setItems(prev => [...prev, newItem]);
    }
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
  };

  const handleCancelQty = () => {
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
  };

  const generateDRNumber = async () => {
    setGeneratingDR(true);
    try {
      const nextDRNumber = await deliveryReceiptService.generateNextDRNumber();
      setFormData(prev => ({ ...prev, delivery_receipt_number: nextDRNumber }));
      toast.success(`Generated DR number: ${nextDRNumber}`);
    } catch (error) {
      console.error('Error generating DR number:', error);
      toast.error('Failed to generate DR number');
    } finally {
      setGeneratingDR(false);
    }
  };

  const createAutoFulfillments = async (deliveryId: string, purchaseOrderId: string, deliveryItems: DeliveryItemForm[]) => {
    try {
      // Get delivery items with their IDs from the created delivery
      const { data: createdDeliveryItems, error: deliveryItemsError } = await supabase
        .from('delivery_items')
        .select('id, product_id, quantity_delivered')
        .eq('delivery_id', deliveryId);

      if (deliveryItemsError) throw deliveryItemsError;

      // Get PO items for matching
      const { data: poItems, error: poItemsError } = await supabase
        .from('purchase_order_items')
        .select('id, product_id, quantity')
        .eq('purchase_order_id', purchaseOrderId);

      if (poItemsError) throw poItemsError;

      // Create fulfillments for matching items
      const fulfillments = [];
      
      for (const deliveryItem of createdDeliveryItems || []) {
        const matchingPOItem = poItems?.find(poItem => poItem.product_id === deliveryItem.product_id);
        
        if (matchingPOItem) {
          // Get existing fulfillments to calculate remaining quantity needed
          const { data: existingFulfillments } = await supabase
            .from('fulfillments')
            .select('fulfilled_quantity')
            .eq('po_item_id', matchingPOItem.id);

          const alreadyFulfilled = existingFulfillments?.reduce((sum, f) => sum + f.fulfilled_quantity, 0) || 0;
          const remainingNeeded = Math.max(0, matchingPOItem.quantity - alreadyFulfilled);
          
          // Fulfill up to the minimum of what's delivered and what's still needed
          const fulfillQuantity = Math.min(deliveryItem.quantity_delivered, remainingNeeded);
          
          if (fulfillQuantity > 0) {
            fulfillments.push({
              dr_id: deliveryId,
              dr_item_id: deliveryItem.id,
              po_id: purchaseOrderId,
              po_item_id: matchingPOItem.id,
              fulfilled_quantity: fulfillQuantity,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      // Insert fulfillments if any were created
      if (fulfillments.length > 0) {
        const { error: fulfillmentError } = await supabase
          .from('fulfillments')
          .insert(fulfillments);

        if (fulfillmentError) throw fulfillmentError;

        toast.success(`Auto-created ${fulfillments.length} fulfillment records`);
      }
    } catch (error) {
      console.error('Error creating auto-fulfillments:', error);
      toast.error('Failed to create automatic fulfillments');
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity_delivered * item.unit_price), 0);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isAdvanceDelivery ? 'Record Advance Delivery' : 'Record Delivery'}
            </DialogTitle>
            
            {/* Purchase Order selection moved to header */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Purchase Order:</Label>
              {purchaseOrderId ? (
                <div className="px-3 py-1 bg-gray-100 rounded text-sm">
                  PO #{purchaseOrderId.slice(0, 8)}
                </div>
              ) : (
                <Select 
                  value={formData.purchase_order_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, purchase_order_id: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select PO or Advance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Package size={14} />
                        <span>Advance Delivery</span>
                      </div>
                    </SelectItem>
                    {availablePOs.map(po => (
                      <SelectItem key={po.id} value={po.id}>
                        PO #{po.id.slice(0, 8)} - {po.supplier_name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client and Delivery Information Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client selection - left side */}
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Client
                {isAdvanceDelivery && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {!isAdvanceDelivery && selectedClient ? (
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">{selectedClient.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Auto-filled from purchase order
                  </p>
                </div>
              ) : (
                <>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, client_id: value }));
                      const client = clients.find(c => c.id === value);
                      setSelectedClient(client || null);
                    }}
                    disabled={clientsLoading}
                  >
                    <SelectTrigger className="bg-white border border-gray-300 shadow-sm">
                      <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select a client"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id} className="hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>{client.name}</span>
                            {client.client_code && (
                              <span className="text-xs text-gray-500">({client.client_code})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isAdvanceDelivery && !formData.client_id && (
                    <p className="text-xs text-red-500">
                      Client selection is required for advance deliveries
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Delivery Date - right side */}
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* DR Number below delivery date */}
          <div className="space-y-2">
            <Label htmlFor="delivery_receipt_number">
              Delivery Receipt Number
              {isAdvanceDelivery && <span className="text-xs text-gray-500 ml-1">(Recommended for tracking)</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id="delivery_receipt_number"
                placeholder="DR-001 (optional)"
                value={formData.delivery_receipt_number}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_receipt_number: e.target.value }))}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateDRNumber}
                disabled={generatingDR}
                className="whitespace-nowrap"
              >
                {generatingDR ? 'Generating...' : 'Auto Generate'}
              </Button>
            </div>
          </div>

          {/* Notes section - only show when toggled */}
          {showNotesInput && (
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes
                {isAdvanceDelivery && <span className="text-xs text-gray-500 ml-1">(Details help with future PO linking)</span>}
              </Label>
              <Textarea
                id="notes"
                placeholder={isAdvanceDelivery 
                  ? "Advance delivery details - supplier, context, expected PO link, etc." 
                  : "Delivery notes (optional)"
                }
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {isAdvanceDelivery && (
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => {
                    if (!formData.client_id) {
                      toast.error('Please select a client first');
                      return;
                    }
                    setSelectProductOpen(true);
                    searchProducts("");
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Add Item
                </Button>
              )}
            </div>

            {!isAdvanceDelivery && formData.purchase_order_id !== 'none' && poItems.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Purchase Order Delivery:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Only items not yet fully delivered are shown below</li>
                      <li>• Adjust quantities for partial deliveries or set to 0 to exclude</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!isAdvanceDelivery && items.length === 0 && formData.purchase_order_id !== 'none' && (
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <AlertCircle size={24} className="text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-700 font-medium">
                  All items from this purchase order have been fully delivered.
                </p>
              </div>
            )}

            {/* Added Products List - Table Layout from CreatePurchaseOrderModal */}
            {items.length > 0 && (
              <div className="space-y-2">
                {/* Header row for columns */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pb-2 border-b">
                  <Label>Product</Label>
                  <Label>SKU</Label>
                  <Label>Quantity</Label>
                  <Label>Unit Price</Label>
                  <Label className="text-right">Subtotal</Label>
                </div>

                {/* Product rows */}
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-gray-50 p-3 rounded">
                    <div>
                      {/* ...existing code for product info... */}
                      <div className="font-medium">{item.name || item.model || `Item ${index + 1}`}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.sku && <span className="text-xs text-gray-500">SKU: {item.sku}</span>}
                        {item.color && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300" 
                              style={{ backgroundColor: item.color || '#ffffff' }}
                            />
                            <span className="text-xs text-gray-500">{item.color}</span>
                          </div>
                        )}
                      </div>
                      {isAdvanceDelivery && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block mt-1">
                          Advance
                        </span>
                      )}
                      {/* Show delivery context for PO items */}
                      {!isAdvanceDelivery && item.ordered_quantity && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span>Remaining: <strong>{item.max_remaining}</strong></span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{item.sku || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={!isAdvanceDelivery ? (item.max_remaining || undefined) : undefined}
                        value={item.quantity_delivered}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                        required
                        className={`w-20 ${!isAdvanceDelivery && item.quantity_delivered > (item.max_remaining || Infinity) ? 'border-red-500' : ''}`}
                      />
                      {!isAdvanceDelivery && item.max_remaining && (
                        <span className="text-xs text-gray-500">
                          (Max: {item.max_remaining})
                        </span>
                      )}
                      {!isAdvanceDelivery && item.quantity_delivered > (item.max_remaining || Infinity) && (
                        <p className="text-xs text-red-500">
                          Cannot exceed remaining quantity of {item.max_remaining}
                        </p>
                      )}
                    </div>
                    {/* Editable price cell */}
                    <div>
                      {editingPriceIndex === index ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={tempPrice}
                            onChange={e => setTempPrice(e.target.value)}
                            className="w-20 h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePriceConfirm(index)}
                            className="h-8 w-8 p-0"
                          >
                            ✓
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handlePriceCancel}
                            className="h-8 w-8 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>₱{item.unit_price.toFixed(2)}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePriceEdit(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Package size={12} />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600">
                        ₱{(item.quantity_delivered * item.unit_price).toFixed(2)}
                      </span>
                      {(items.length > 1 || isAdvanceDelivery) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total section */}
            <div className="text-right border-t pt-3">
              <div className="text-lg font-semibold">
                Total: ₱{calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="flex items-center gap-2"
            >
              <StickyNote size={16} />
              {showNotesInput ? 'Hide Notes' : 'Add Notes'}
            </Button>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={loading || items.filter(item => item.quantity_delivered > 0).length === 0 || (isAdvanceDelivery && !formData.client_id)}
              >
                {loading ? 'Recording...' : (isAdvanceDelivery ? 'Record Advance Delivery' : 'Record Delivery')}
              </Button>
            </div>
          </div>
        </form>

        {/* Add Item Modal - Similar to CreatePurchaseOrderModal */}
        {selectProductOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl shadow-2xl w-full max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Add Item to Delivery
                </h3>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <Input
                  type="text"
                  placeholder="Search products to add..."
                  value={productQuery}
                  onChange={e => {
                    setProductQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  className="mb-3 h-11 text-sm"
                />
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto">
                  {productSearchLoading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                  ) : productResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">No products found</div>
                  ) : (
                    productResults.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => handleAddProductClick(product)}
                      >
                        <div className="flex items-center gap-3 w-full min-w-0">
                          {product.color && (
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: product.color }}
                              title={product.color}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm truncate">{product.name}</div>
                            {product.sku && (
                              <div className="text-xs text-gray-500 truncate">SKU: {product.sku}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  className="w-full h-11 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
                  onClick={() => setSelectProductOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Prompt Modal - Similar to CreatePurchaseOrderModal */}
        {qtyPromptOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs">
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Enter Quantity
                </h3>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min={1}
                  value={qtyInput}
                  onChange={e => setQtyInput(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-11"
                />
              </div>
              <div className="flex gap-2 p-4 pt-0">
                <button
                  className="flex-1 h-11 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
                  onClick={handleCancelQty}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
                  onClick={handleConfirmQty}
                  disabled={qtyInput < 1}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
