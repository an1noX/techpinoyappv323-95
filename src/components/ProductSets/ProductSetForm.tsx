import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { productSetsService } from '@/services/productSetsService';
import { ProductSetWithItems, CreateProductSetData, UpdateProductSetData } from '@/types/productSets';
import { Product } from '@/types/database';
import { Search, Plus, Minus, X } from 'lucide-react';
import { getColorBadgeClass, getColorDisplayName } from '@/utils/seriesSetGrouping';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface ProductSetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingSet?: ProductSetWithItems;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

export const ProductSetForm: React.FC<ProductSetFormProps> = ({
  isOpen,
  onClose,
  editingSet
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: ''
  });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts()
  });

  const { data: groupedProducts = {} } = useQuery({
    queryKey: ['grouped-products'],
    queryFn: () => productSetsService.getProductsGroupedBySimilarSku()
  });

  const { data: existingProductSets = [] } = useQuery({
    queryKey: ['product-sets'],
    queryFn: () => productSetsService.getProductSets()
  });

  // Initialize form when editing
  useEffect(() => {
    if (editingSet) {
      setFormData({
        name: editingSet.name,
        description: editingSet.description || '',
        sku: editingSet.sku
      });
      
      const selected = editingSet.items.map(item => ({
        product: {
          ...item.product!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        quantity: item.quantity
      }));
      setSelectedProducts(selected);
    } else {
      setFormData({ name: '', description: '', sku: '' });
      setSelectedProducts([]);
    }
  }, [editingSet, isOpen]);

  // Get all product IDs that are already in existing sets (excluding current editing set)
  const productsInExistingSets = new Set(
    existingProductSets
      .filter(set => editingSet ? set.id !== editingSet.id : true)
      .flatMap(set => set.items.map(item => item.product_id))
  );

  // Get all SKUs that are already used by existing sets (excluding current editing set)
  const existingSetSkus = new Set(
    existingProductSets
      .filter(set => editingSet ? set.id !== editingSet.id : true)
      .map(set => set.sku)
  );

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const notInExistingSet = !productsInExistingSets.has(product.id);
    
    return matchesSearch && notInExistingSet;
  });

  // Filter grouped products to exclude those that match existing set SKUs
  const filteredGroupedProducts = Object.fromEntries(
    Object.entries(groupedProducts).filter(([baseSku, group]) => {
      // Check if any product's SKU in this group matches an existing set SKU
      const hasMatchingSetSku = group.some(product => existingSetSkus.has(product.sku));
      return !hasMatchingSetSku;
    })
  );

  const handleAddProduct = (product: Product) => {
    const exists = selectedProducts.find(sp => sp.product.id === product.id);
    if (!exists) {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(sp => sp.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(selectedProducts.map(sp =>
      sp.product.id === productId ? { ...sp, quantity } : sp
    ));
  };

  const handleAddGroup = (baseSku: string, group: Product[]) => {
    const newProducts = group.filter(product => 
      !selectedProducts.find(sp => sp.product.id === product.id)
    );
    
    const toAdd = newProducts.map(product => ({ product, quantity: 1 }));
    setSelectedProducts([...selectedProducts, ...toAdd]);
    
    // Auto-fill the Name and SKU based on the group using the first product's actual SKU
    if (!formData.name.trim() && !formData.sku.trim()) {
      const firstProductSku = group[0]?.sku || baseSku;
      setFormData({ 
        ...formData, 
        name: `${firstProductSku} Set`,
        sku: firstProductSku 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast({
        title: "Error",
        description: "Name and SKU are required",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product to the set",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const productIds = selectedProducts.map(sp => ({
        productId: sp.product.id,
        quantity: sp.quantity
      }));

      if (editingSet) {
        const updateData: UpdateProductSetData = {
          ...formData,
          productIds
        };
        await productSetsService.updateProductSet(editingSet.id, updateData);
        toast({
          title: "Success",
          description: "Product set updated successfully",
        });
      } else {
        const createData: CreateProductSetData = {
          ...formData,
          productIds
        };
        await productSetsService.createProductSet(createData);
        toast({
          title: "Success",
          description: "Product set created successfully",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving product set:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingSet ? 'update' : 'create'} product set`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSet ? 'Edit Product Set' : 'Create Product Set'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter set name"
                required
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Enter set SKU"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div>
              <Label>Selected Products ({selectedProducts.length})</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {selectedProducts.map((sp) => (
                  <div key={sp.product.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sp.product.name}</span>
                      <Badge variant="outline" className="text-xs">{sp.product.sku}</Badge>
                      {sp.product.color && (
                        <Badge className={`text-xs ${getColorBadgeClass(sp.product.color)}`}>
                          {getColorDisplayName(sp.product.color)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(sp.product.id, sp.quantity - 1)}
                        disabled={sp.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{sp.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(sp.product.id, sp.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(sp.product.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Groups */}
          {Object.keys(filteredGroupedProducts).length > 0 && (
            <div>
              <Label>Quick Add: Product Groups by Similar SKU</Label>
              <div className="grid gap-2 mt-2 max-h-32 overflow-y-auto">
                {Object.entries(filteredGroupedProducts).map(([baseSku, group]) => (
                  <Card key={baseSku} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Base SKU: {baseSku}</p>
                        <p className="text-xs text-gray-500">
                          {group.length} products with different colors
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddGroup(baseSku, group)}
                      >
                        Add All
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Product Search */}
          <div>
            <Label>Add Products</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, or category..."
                className="pl-10"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-gray-500 p-4">No products found</p>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.some(sp => sp.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                        onClick={() => !isSelected && handleAddProduct(product)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{product.name}</span>
                          <Badge variant="outline" className="text-xs">{product.sku}</Badge>
                          {product.color && (
                            <Badge className={`text-xs ${getColorBadgeClass(product.color)}`}>
                              {getColorDisplayName(product.color)}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">{product.category}</span>
                        </div>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">Added</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingSet ? 'Update Set' : 'Create Set'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};