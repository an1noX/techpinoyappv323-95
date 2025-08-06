import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/types/database';
import { productService } from '@/services/productService';
import { printerService } from '@/services/printerService';
import { toast } from 'sonner';
import ColorSelector from '@/components/ColorSelector';

interface AdminEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onProductUpdated: () => void;
  onStartMerge?: (product: Product) => void;
  variants?: Product[];
}

const AdminEditProductModal: React.FC<AdminEditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
  variants = [],
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Product>(product);
  const [name, setName] = useState(product.name || '');
  const [sku, setSku] = useState(product.sku || '');
  const [alias, setAlias] = useState(product.alias || '');
  const [category, setCategory] = useState(product.category || '');
  const [color, setColor] = useState(product.color || '');
  const [printers, setPrinters] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const variant = selectedVariant || product;
    setName(variant.name || '');
    setSku(variant.sku || '');
    setCategory(variant.category || '');
    setColor(variant.color || '');
    setAlias(variant.alias || '');
    // Fetch and set supported printers
    const fetchPrinters = async () => {
      try {
        const supportedPrinters = await printerService.getProductPrinters(variant.id);
        setPrinters(supportedPrinters.map(p => p.name).join(', '));
      } catch (error) {
        console.error('Failed to fetch product printers', error);
        setPrinters('');
      }
    };
    fetchPrinters();
  }, [selectedVariant, product]);

  // When product prop changes, update selectedVariant
  useEffect(() => {
    setSelectedVariant(product);
  }, [product]);

  const handleUpdate = async () => {
    if (!selectedVariant) return;
    setIsLoading(true);
    try {
      const productData = { name, sku, category, color, alias };
      await productService.updateProduct(selectedVariant.id, productData);
      const printerNames = printers.split(',').map(p => p.trim()).filter(Boolean);
      await printerService.addPrintersToProduct(selectedVariant.id, printerNames);
      toast.success('Product updated successfully.');
      onProductUpdated();
      onClose();
    } catch (error) {
      toast.error('Failed to update product.');
      console.error('Failed to update product', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVariant) return;
    setIsLoading(true);
    try {
      await productService.deleteProduct(selectedVariant.id);
      toast.success('Product deleted successfully.');
      onProductUpdated();
      onClose();
    } catch (error) {
      toast.error('Failed to delete product.');
      console.error('Failed to delete product', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Product</DialogTitle>
        </DialogHeader>
        {variants.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Variant</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={selectedVariant.id}
              onChange={e => {
                const variant = variants.find(v => v.id === e.target.value);
                if (variant) setSelectedVariant(variant);
              }}
            >
              {variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} (SKU: {variant.sku}) {variant.color ? `- ${variant.color}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku" className="text-sm font-medium">SKU *</Label>
            <Input 
              id="sku" 
              value={sku} 
              onChange={(e) => setSku(e.target.value)} 
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alias" className="text-sm font-medium">Alias</Label>
            <Input 
              id="alias" 
              value={alias} 
              onChange={(e) => setAlias(e.target.value)} 
              className="w-full" 
              placeholder="e.g., 128A" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Color Variation</Label>
            <ColorSelector 
              selectedColor={color} 
              onColorChange={(newColor) => setColor(Array.isArray(newColor) ? newColor[0] : newColor)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="printers" className="text-sm font-medium">Supported Printers</Label>
            <Textarea 
              id="printers" 
              value={printers} 
              onChange={(e) => setPrinters(e.target.value)}
              placeholder="e.g., HP LaserJet Pro M404n, Canon PIXMA G3260"
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500">
              Tip: Use exact model names separated by commas. New printers will be automatically added to the database.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
            className="w-full sm:w-auto order-last sm:order-first"
          >
            Delete Product
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditProductModal;
