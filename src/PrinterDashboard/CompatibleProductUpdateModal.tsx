import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku?: string;
  alias?: string;
  category?: string;
  description?: string;
}

interface CompatibleProductUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: any;
  onUpdated?: () => void;
}

const CompatibleProductUpdateModal: React.FC<CompatibleProductUpdateModalProps> = ({
  isOpen,
  onClose,
  printer,
  onUpdated
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load products and current compatible products
  useEffect(() => {
    if (isOpen && printer?.id) {
      loadProducts();
      loadCurrentCompatibleProducts();
    }
  }, [isOpen, printer?.id]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, alias, category, description')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentCompatibleProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_printers')
        .select('product_id')
        .eq('printer_id', printer.id);

      if (error) throw error;
      
      const currentProductIds = new Set(data?.map(item => item.product_id) || []);
      setSelectedProducts(currentProductIds);
    } catch (error) {
      console.error('Error loading compatible products:', error);
    }
  };

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, remove all existing compatible products for this printer
      const { error: deleteError } = await supabase
        .from('product_printers')
        .delete()
        .eq('printer_id', printer.id);

      if (deleteError) throw deleteError;

      // Then, insert the new selections
      if (selectedProducts.size > 0) {
        const insertData = Array.from(selectedProducts).map(productId => ({
          printer_id: printer.id,
          product_id: productId
        }));

        const { error: insertError } = await supabase
          .from('product_printers')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: `Compatible products updated for ${printer.name}`,
      });

      // Emit custom event for real-time updates
      const refreshEvent = new CustomEvent('refresh-compatible-products', {
        detail: { printerId: printer.id }
      });
      window.dispatchEvent(refreshEvent);

      // Also emit the general refresh event for other components
      const generalRefreshEvent = new CustomEvent('refresh-printer-data');
      window.dispatchEvent(generalRefreshEvent);

      if (onUpdated) {
        onUpdated();
      }
      onClose();
    } catch (error) {
      console.error('Error updating compatible products:', error);
      toast({
        title: "Error",
        description: "Failed to update compatible products",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.alias && product.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Update Compatible Products for {printer?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or alias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Product List */}
          <div className="space-y-2">
            <Label>Select Compatible Products ({selectedProducts.size} selected)</Label>
            <ScrollArea className="h-80 border rounded-md p-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No products found matching your search' : 'No products available'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`product-${product.id}`}
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {product.name}
                        </label>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {product.sku && (
                            <div>SKU: {product.sku}</div>
                          )}
                          {product.alias && (
                            <div>Alias: {product.alias}</div>
                          )}
                          {(product.category || product.description) && (
                            <div>
                              {[product.category, product.description].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompatibleProductUpdateModal;
