import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Minus, ShoppingCart, X, Edit } from 'lucide-react';
import { usePurchaseOrdersEnhanced } from '@/hooks/usePurchaseOrdersEnhanced';
import { CreatePurchaseOrderData } from '@/types/purchaseOrder';
import { Switch } from "@/components/ui/switch";
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';
import { supplierService } from '@/services/supplierService';
import { productService } from '@/services/productService';
import { Product } from '@/types/sales';
import { toast } from 'sonner';
import { purchaseOrderNumberService } from '@/services/purchaseOrderNumberService';

interface CreatePurchaseOrderModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  type: 'supplier' | 'client';
  supplier_client_id: string;
  client_po?: string;
  date: string;
  expected_delivery_date?: string;
  purchase_order_number: string;
  notes?: string;
}

interface POItemForm {
  id: string;
  name: string;
  sku?: string;
  color?: string;
  quantity: number;
  unit_price: number;
  product_id: string;
  original_price?: number; // Store the original price from database
  product_client_id?: string; // Store the product_client relationship ID for updates
}

export const CreatePurchaseOrderModal = ({ onClose, onSuccess }: CreatePurchaseOrderModalProps) => {
  const { createPurchaseOrder } = usePurchaseOrdersEnhanced();
  const [loading, setLoading] = useState(false);
  const [generatingPO, setGeneratingPO] = useState(false);
  
  // Auto-generate PO number on component mount
  useEffect(() => {
    const generateInitialPONumber = async () => {
      setGeneratingPO(true);
      try {
        const nextPONumber = await purchaseOrderNumberService.generateNextPONumber();
        setFormData(prev => ({ ...prev, client_po: nextPONumber }));
      } catch (error) {
        console.error('Error generating initial PO number:', error);
        toast.error('Failed to generate PO number');
      } finally {
        setGeneratingPO(false);
      }
    };

    generateInitialPONumber();
  }, []);

  // Manual PO number generation function
  const handleGeneratePONumber = async () => {
    setGeneratingPO(true);
    try {
      const nextPONumber = await purchaseOrderNumberService.generateNextPONumber();
      setFormData(prev => ({ ...prev, client_po: nextPONumber }));
      toast.success('PO number generated successfully');
    } catch (error) {
      console.error('Error generating PO number:', error);
      toast.error('Failed to generate PO number');
    } finally {
      setGeneratingPO(false);
    }
  };

  // Update the initial form state
  const [formData, setFormData] = useState<FormData>({
    type: 'client',
    supplier_client_id: '',
    client_po: '',
    date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    purchase_order_number: '',
    notes: ''
  });
  
  // Product search states (similar to AddSalesModal)
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState<POItemForm[]>([]);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [qtyPromptOpen, setQtyPromptOpen] = useState(false);
  const [qtyPromptProduct, setQtyPromptProduct] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({});
  
  // Price confirmation states
  const [priceConfirmOpen, setPriceConfirmOpen] = useState(false);
  const [priceConfirmData, setPriceConfirmData] = useState<{
    itemIndex: number;
    newPrice: number;
    originalPrice: number;
    productName: string;
    productClientId?: string;
  } | null>(null);
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Add queries for clients and suppliers
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients()
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers()
  });

  // Product search logic (similar to AddSalesModal)
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
      let productClientId: string | undefined;
      
      try {
        if (formData.type === 'client' && formData.supplier_client_id) {
          const productWithClients = await productService.getProductWithClients(qtyPromptProduct.id);
          if (productWithClients && productWithClients.clients) {
            const clientEntry = productWithClients.clients.find((c: any) => c.client_id === formData.supplier_client_id);
            if (clientEntry) {
              unitPrice = clientEntry.quoted_price;
              productClientId = clientEntry.id;
            }
          }
        } else if (formData.type === 'supplier' && formData.supplier_client_id) {
          const productWithSuppliers = await productService.getProductWithSuppliers(qtyPromptProduct.id);
          if (productWithSuppliers && productWithSuppliers.suppliers) {
            const supplierEntry = productWithSuppliers.suppliers.find((s: any) => s.supplier_id === formData.supplier_client_id);
            unitPrice = supplierEntry ? supplierEntry.unit_price : 0;
          }
        }
      } catch (error) {
        console.error('Error fetching product price:', error);
      }

      const newItem: POItemForm = {
        id: qtyPromptProduct.id,
        name: qtyPromptProduct.name,
        sku: qtyPromptProduct.sku,
        color: qtyPromptProduct.color,
        quantity: qtyInput,
        unit_price: unitPrice,
        product_id: qtyPromptProduct.id,
        original_price: unitPrice,
        product_client_id: productClientId
      };

      setAddedProducts(prev => [...prev, newItem]);
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

  // Function to refetch and update prices for existing products
  const updateExistingProductPrices = async () => {
    if (!formData.supplier_client_id || addedProducts.length === 0) return;

    try {
      const updatedProducts = await Promise.all(
        addedProducts.map(async (item) => {
          let unitPrice = 0;
          let productClientId: string | undefined;
          
          try {
            if (formData.type === 'client') {
              const productWithClients = await productService.getProductWithClients(item.product_id);
              if (productWithClients && productWithClients.clients) {
                const clientEntry = productWithClients.clients.find((c: any) => c.client_id === formData.supplier_client_id);
                if (clientEntry) {
                  unitPrice = clientEntry.quoted_price;
                  productClientId = clientEntry.id;
                }
              }
            } else if (formData.type === 'supplier') {
              const productWithSuppliers = await productService.getProductWithSuppliers(item.product_id);
              if (productWithSuppliers && productWithSuppliers.suppliers) {
                const supplierEntry = productWithSuppliers.suppliers.find((s: any) => s.supplier_id === formData.supplier_client_id);
                unitPrice = supplierEntry ? supplierEntry.unit_price : 0;
              }
            }
          } catch (error) {
            console.error('Error fetching product price for', item.name, ':', error);
          }

          // Preserve all data except unit_price and add original_price
          return {
            ...item,
            unit_price: unitPrice,
            original_price: unitPrice,
            product_client_id: productClientId
          };
        })
      );

      setAddedProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating product prices:', error);
    }
  };

  // Effect to update prices when supplier/client changes
  useEffect(() => {
    updateExistingProductPrices();
  }, [formData.supplier_client_id, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate PO number doesn't already exist
      if (formData.client_po) {
        const exists = await purchaseOrderNumberService.isPONumberExists(formData.client_po);
        if (exists) {
          toast.error('PO number already exists. Please generate a new one or use a different number.');
          setLoading(false);
          return;
        }
      }

      // Get supplier name for the PO
      const supplierName = formData.type === 'supplier' ? 
        suppliers.find(s => s.id === formData.supplier_client_id)?.name :
        clients.find(c => c.id === formData.supplier_client_id)?.name;

      // Create the purchase order with items
      const purchaseOrderData: CreatePurchaseOrderData = {
        supplier_client_id: formData.supplier_client_id,
        supplier_name: supplierName,
        client_po: formData.client_po || undefined,
        po_date: formData.date,
        status: 'pending',
        payment_status: 'unpaid',
        notes: formData.notes,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        items: addedProducts.map(item => ({
          product_id: item.product_id,
          model: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await createPurchaseOrder(purchaseOrderData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (index: number) => {
    setAddedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return addedProducts.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  // Price editing functions
  const handlePriceEdit = (index: number) => {
    setEditingPriceIndex(index);
    setTempPrice(addedProducts[index].unit_price.toString());
  };

  const handlePriceCancel = () => {
    setEditingPriceIndex(null);
    setTempPrice('');
  };

  const handlePriceConfirm = (index: number) => {
    const newPrice = parseFloat(tempPrice);
    const item = addedProducts[index];
    
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    // Check if price is different from original
    if (item.original_price && Math.abs(newPrice - item.original_price) > 0.01) {
      setPriceConfirmData({
        itemIndex: index,
        newPrice,
        originalPrice: item.original_price,
        productName: item.name,
        productClientId: item.product_client_id
      });
      setPriceConfirmOpen(true);
    } else {
      // Price is same as original or no original price, just update
      updateItemPrice(index, newPrice);
    }
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    setAddedProducts(prev => prev.map((item, i) => 
      i === index ? { ...item, unit_price: newPrice } : item
    ));
    setEditingPriceIndex(null);
    setTempPrice('');
  };

  const handleConfirmPriceUpdate = async (updateDatabase: boolean) => {
    if (!priceConfirmData) return;

    const { itemIndex, newPrice, productClientId } = priceConfirmData;

    try {
      if (updateDatabase && productClientId && formData.type === 'client') {
        // Update the database price
        await clientService.updateClientQuote(
          productClientId,
          newPrice
        );
        toast.success('Price updated in database');
        
        // Update original_price to reflect the new database value
        setAddedProducts(prev => prev.map((item, i) => 
          i === itemIndex ? { ...item, unit_price: newPrice, original_price: newPrice } : item
        ));
      } else {
        // Update only for this purchase order
        updateItemPrice(itemIndex, newPrice);
        toast.success('Price updated for this purchase order only');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price in database');
      // Still update the local price even if database update fails
      updateItemPrice(itemIndex, newPrice);
    }

    setPriceConfirmOpen(false);
    setPriceConfirmData(null);
  };

  const canSubmit = () => {
    if (!formData.supplier_client_id) return false;
    if (addedProducts.length === 0) return false;
    if (!formData.client_po?.trim()) return false;
    return true;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Order Type</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="type-toggle" className={formData.type === 'supplier' ? 'text-primary' : 'text-muted-foreground'}>
                  Supplier
                </Label>
                <Switch
                  id="type-toggle"
                  checked={formData.type === 'client'}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      type: checked ? 'client' : 'supplier',
                      supplier_client_id: ''
                    }))
                  }
                />
                <Label htmlFor="type-toggle" className={formData.type === 'client' ? 'text-primary' : 'text-muted-foreground'}>
                  Client
                </Label>
              </div>
            </div>

            {/* Dynamic Selection based on type */}
            <div className="space-y-2">
              <Label htmlFor="entity_select">
                {formData.type === 'supplier' ? 'Select Supplier' : 'Select Client'}
              </Label>
              <Select
                value={formData.supplier_client_id}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    supplier_client_id: value
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${formData.type === 'supplier' ? 'Supplier' : 'Client'}`} />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'supplier' ? (
                    suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add after supplier/client selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Expected Delivery Date Field */}
          <div className="space-y-2">
            <Label htmlFor="expected_delivery_date">Expected Delivery Date (Optional)</Label>
            <Input
              type="date"
              id="expected_delivery_date"
              value={formData.expected_delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              If not specified, defaults to 3 days from purchase order date. Payment due date will be 30 days from this date.
            </p>
          </div>

          {/* Client PO Field with Auto-Generation */}
          <div className="space-y-2">
            <Label htmlFor="client_po">PO Number</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                id="client_po"
                placeholder="PO number will be auto-generated"
                value={formData.client_po}
                onChange={(e) => setFormData(prev => ({ ...prev, client_po: e.target.value }))}
                disabled={generatingPO}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePONumber}
                disabled={generatingPO}
                className="shrink-0"
              >
                {generatingPO ? 'Generating...' : 'Generate'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PO number is auto-generated. You can override it manually if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            {/* Single header section */}
            <div className="flex justify-between items-center">
              <Label>Items</Label>
              <Button type="button" size="sm" onClick={() => {
                setAddItemModalOpen(true);
                searchProducts("");
              }}>
                <Plus size={14} className="mr-1" />
                Add Item
              </Button>
            </div>

            {/* Added Products List */}
            {addedProducts.length > 0 && (
              <div className="space-y-2">
                {/* Header row for columns - Updated with Unit Price (Editable) */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pb-2 border-b">
                  <Label>Product</Label>
                  <Label>SKU</Label>
                  <Label>Quantity</Label>
                  <Label>Unit Price (Editable)</Label>
                  <Label className="text-right">Subtotal</Label>
                  <Label className="text-right">Actions</Label>
                </div>

                {/* Updated Product rows */}
                {addedProducts.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-gray-50 p-3 rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.color && <div className="text-xs text-gray-500">Color: {item.color}</div>}
                    </div>
                    <div className="text-sm text-gray-600">{item.sku || 'N/A'}</div>
                    <div>{item.quantity}</div>
                    <div className="flex items-center gap-1">
                      {editingPriceIndex === index ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
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
                            <Edit size={12} />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600">
                        ₱{(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus size={14} />
                      </Button>
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || generatingPO || !canSubmit()}>
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>

        {/* Add Item Modal - Similar to AddSalesModal */}
        {addItemModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-t-2xl shadow-2xl w-full max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Add Product to Purchase Order
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
                  onClick={() => setAddItemModalOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Prompt Modal - Similar to AddSalesModal */}
        {qtyPromptOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs">
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
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

        {/* Price Confirmation Dialog */}
        <AlertDialog open={priceConfirmOpen} onOpenChange={setPriceConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Price Change Detected</AlertDialogTitle>
              <AlertDialogDescription>
                The price for "{priceConfirmData?.productName}" has been changed from ₱{priceConfirmData?.originalPrice?.toFixed(2)} to ₱{priceConfirmData?.newPrice?.toFixed(2)}.
                
                <div className="mt-4 space-y-2">
                  <p className="font-medium">Would you like to:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Update Database:</strong> Save this new price for future orders with this client</li>
                    <li><strong>This Order Only:</strong> Use this price only for this purchase order</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => {
                setPriceConfirmOpen(false);
                setPriceConfirmData(null);
                handlePriceCancel();
              }}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => handleConfirmPriceUpdate(false)}
              >
                This Order Only
              </Button>
              <AlertDialogAction
                onClick={() => handleConfirmPriceUpdate(true)}
                disabled={!priceConfirmData?.productClientId || formData.type !== 'client'}
              >
                Update Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
