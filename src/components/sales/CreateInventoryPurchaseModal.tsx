import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, ShoppingCart, X, Edit } from 'lucide-react';
import { inventoryPurchaseService, CreateInventoryPurchaseData } from '@/services/inventoryPurchaseService';
import { useQuery } from '@tanstack/react-query';
import { supplierService } from '@/services/supplierService';
import { productService } from '@/services/productService';
import { Product } from '@/types/sales';
import { toast } from 'sonner';

interface CreateInventoryPurchaseModalProps {
  onClose: () => void;
  onSuccess: () => void;
  budgetItems?: BudgetItem[];
  originalPurchaseOrderId?: string;
}

interface BudgetItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
  remaining_quantity: number;
  recommended_supplier?: {
    id: string;
    supplier_name: string;
    current_price: number;
  };
  potential_savings?: number;
}

interface FormData {
  supplier_id: string;
  reference_number: string;
  purchase_date: string;
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
}

export const CreateInventoryPurchaseModal = ({ 
  onClose, 
  onSuccess, 
  budgetItems, 
  originalPurchaseOrderId 
}: CreateInventoryPurchaseModalProps) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    supplier_id: '',
    reference_number: budgetItems ? `INV-${Date.now()}` : '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: budgetItems ? `Inventory purchase budget for PO #${originalPurchaseOrderId?.slice(0, 8)}` : ''
  });
  
  // Product search states
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState<POItemForm[]>([]);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [qtyPromptOpen, setQtyPromptOpen] = useState(false);
  const [qtyPromptProduct, setQtyPromptProduct] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Get suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers()
  });

  // Initialize with budget items if provided
  useEffect(() => {
    if (budgetItems && budgetItems.length > 0) {
      const budgetProducts: POItemForm[] = budgetItems
        .filter(item => item.recommended_supplier && item.remaining_quantity > 0)
        .map(item => ({
          id: item.id,
          name: item.model || 'Unknown Product',
          sku: '',
          color: '',
          quantity: item.remaining_quantity,
          unit_price: item.recommended_supplier!.current_price,
          product_id: item.product_id || item.id
        }));
      
      setAddedProducts(budgetProducts);
      
      // Set the primary supplier if available
      if (budgetItems[0]?.recommended_supplier) {
        const supplierName = budgetItems[0].recommended_supplier.supplier_name;
        const supplier = suppliers.find(s => s.name === supplierName);
        if (supplier) {
          setFormData(prev => ({ ...prev, supplier_id: supplier.id }));
        }
      }
    }
  }, [budgetItems, suppliers]);

  // Update prices when supplier changes
  useEffect(() => {
    const updatePricesForSupplier = async () => {
      if (!formData.supplier_id || addedProducts.length === 0) return;

      console.log('Updating prices for supplier:', formData.supplier_id);
      
      const updatedProducts = await Promise.all(
        addedProducts.map(async (product) => {
          try {
            const productWithSuppliers = await productService.getProductWithSuppliers(product.product_id);
            if (productWithSuppliers && productWithSuppliers.suppliers) {
              const supplierEntry = productWithSuppliers.suppliers.find((s: any) => s.supplier_id === formData.supplier_id);
              const newPrice = supplierEntry ? supplierEntry.current_price || supplierEntry.unit_price : 0;
              console.log(`Price for ${product.name}: ${newPrice}`);
              return { ...product, unit_price: newPrice };
            }
            return product;
          } catch (error) {
            console.error('Error fetching price for product:', product.name, error);
            return product;
          }
        })
      );

      setAddedProducts(updatedProducts);
    };

    if (formData.supplier_id && addedProducts.length > 0) {
      updatePricesForSupplier();
    }
  }, [formData.supplier_id, addedProducts.length]);

  // Product search logic
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
      // Fetch price for the product from supplier
      let unitPrice = 0;
      
      try {
        if (formData.supplier_id) {
          const productWithSuppliers = await productService.getProductWithSuppliers(qtyPromptProduct.id);
          if (productWithSuppliers && productWithSuppliers.suppliers) {
            const supplierEntry = productWithSuppliers.suppliers.find((s: any) => s.supplier_id === formData.supplier_id);
            unitPrice = supplierEntry ? supplierEntry.current_price || supplierEntry.unit_price : 0;
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
        product_id: qtyPromptProduct.id
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

  const validateProducts = () => {
    if (!budgetItems || budgetItems.length === 0) {
      return { isValid: true, summary: null }; // No budget items to validate
    }

    // Check which budget items were added to the purchase order
    const addedProductIds = new Set(addedProducts.map(p => p.product_id));
    
    const validItems = budgetItems.filter(item => 
      item.remaining_quantity > 0 && 
      item.product_id && 
      addedProductIds.has(item.product_id)
    );

    const invalidItems = budgetItems.filter(item => 
      item.remaining_quantity > 0 && 
      (!item.product_id || !addedProductIds.has(item.product_id))
    );

    const totalBudgetItems = budgetItems.filter(item => item.remaining_quantity > 0).length;
    const isValid = validItems.length > 0; // At least one item should be valid

    const summary = {
      totalBudgetItems,
      validItems: validItems.length,
      invalidItems: invalidItems.map(item => ({
        name: item.model || 'Unknown Product',
        reason: !item.product_id 
          ? "Missing product ID"
          : !item.recommended_supplier 
          ? "No recommended supplier found"
          : "Not included in purchase order"
      }))
    };

    return { isValid, summary };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    if (!formData.reference_number.trim()) {
      toast.error('Please enter a reference number');
      return;
    }

    if (addedProducts.length === 0) {
      toast.error('Please add at least one product to the inventory purchase');
      return;
    }

    // Validate products if budget items exist
    const { isValid, summary } = validateProducts();
    if (summary && summary.invalidItems.length > 0) {
      const message = `Note: ${summary.validItems} of ${summary.totalBudgetItems} budget items included. ${summary.invalidItems.length} items excluded due to missing data.`;
      toast.warning(message, { duration: 4000 });
    }
    
    setLoading(true);

    try {
      // Get supplier name for the inventory purchase
      const supplierName = suppliers.find(s => s.id === formData.supplier_id)?.name;

      if (!supplierName) {
        throw new Error('Supplier not found');
      }

      // Create the inventory purchase with items
      const inventoryPurchaseData: CreateInventoryPurchaseData = {
        supplier_id: formData.supplier_id,
        supplier_name: supplierName,
        reference_number: formData.reference_number,
        purchase_date: formData.purchase_date,
        notes: formData.notes,
        status: 'pending',
        items: addedProducts.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          product_sku: item.sku,
          quantity: item.quantity,
          unit_cost: item.unit_price
        }))
      };

      await inventoryPurchaseService.createInventoryPurchase(inventoryPurchaseData);
      toast.success('Inventory purchase created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating inventory purchase:', error);
      toast.error('Failed to create inventory purchase');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (index: number) => {
    setAddedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity > 0) {
      setAddedProducts(prev => prev.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const updatePrice = (index: number, newPrice: number) => {
    if (newPrice >= 0) {
      setAddedProducts(prev => prev.map((item, i) => 
        i === index ? { ...item, unit_price: newPrice } : item
      ));
    }
  };

  const calculateTotal = () => {
    return addedProducts.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const canSubmit = () => {
    if (!formData.supplier_id) return false;
    if (!formData.reference_number.trim()) return false;
    if (addedProducts.length === 0) return false;
    return true;
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingCart size={20} />
              <span>Create Inventory Purchase Order</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label htmlFor="supplier_select">Select Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                type="date"
                id="purchase_date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                required
              />
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                type="text"
                id="reference_number"
                placeholder="Enter reference number"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Items</Label>
                <Button type="button" size="sm" onClick={() => setAddItemModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {/* Added Products */}
              {addedProducts.length > 0 && (
                <div className="space-y-2">
                  {addedProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          {product.sku && `SKU: ${product.sku}`}
                          {product.color && ` • Color: ${product.color}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="1"
                        />
                        <span className="text-sm">×</span>
                        <Input
                          type="number"
                          value={product.unit_price}
                          onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          step="0.01"
                          min="0"
                        />
                        <span className="text-sm font-medium w-20 text-right">
                          ₱{(product.quantity * product.unit_price).toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-lg font-semibold">
                      Total: ₱{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canSubmit()}>
                {loading ? 'Creating...' : 'Create Inventory Purchase'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      {addItemModalOpen && (
        <Dialog open onOpenChange={setAddItemModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-search">Search Products</Label>
                <Input
                  id="product-search"
                  placeholder="Type to search products..."
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                />
              </div>
              
              {productSearchLoading && (
                <div className="text-center py-4">Searching...</div>
              )}
              
              {productResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {productResults.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        handleAddProductClick(product);
                        setAddItemModalOpen(false);
                      }}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        {product.sku && `SKU: ${product.sku}`}
                        {product.color && ` • ${product.color}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quantity Prompt Modal */}
      {qtyPromptOpen && qtyPromptProduct && (
        <Dialog open onOpenChange={handleCancelQty}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Quantity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="font-medium">{qtyPromptProduct.name}</div>
                <div className="text-sm text-gray-600">
                  {qtyPromptProduct.sku && `SKU: ${qtyPromptProduct.sku}`}
                </div>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  ref={qtyInputRef}
                  id="quantity"
                  type="number"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(parseInt(e.target.value) || 1)}
                  min="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmQty();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelQty}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmQty}>
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};