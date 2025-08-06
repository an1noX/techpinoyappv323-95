import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/types/database';
import { productService } from '@/services/productService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import ColorIndicator from '@/components/ColorIndicator';

interface AdminProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsSelected: (products: Product[]) => void;
  allProducts: Product[];
  initialSelectedProduct?: Product;
}

const AdminProductSelectionModal: React.FC<AdminProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onProductsSelected,
  allProducts,
  initialSelectedProduct,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialSelectedProduct && isOpen) {
      setSelectedProducts([initialSelectedProduct]);
    } else {
      setSelectedProducts([]);
    }
  }, [initialSelectedProduct, isOpen]);

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleProduct = (product: Product) => {
    setSelectedProducts(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedProducts.length >= 2) {
      onProductsSelected(selectedProducts);
    } else {
      // You might want to show a toast notification here
      console.log("Please select at least 2 products to merge.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Products to Merge</DialogTitle>
          <DialogDescription>
            Choose 2 or more products from the list to merge them.
          </DialogDescription>
        </DialogHeader>
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ScrollArea className="h-[400px] border rounded-md p-4">
          <div className="space-y-2">
            {filteredProducts.map(product => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                <Checkbox
                  id={`product-${product.id}`}
                  checked={selectedProducts.some(p => p.id === product.id)}
                  onCheckedChange={() => handleToggleProduct(product)}
                />
                <label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>SKU: {product.sku}</span>
                    {product.color && <ColorIndicator color={product.color} />}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={selectedProducts.length < 2}>
            Proceed to Merge ({selectedProducts.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProductSelectionModal; 