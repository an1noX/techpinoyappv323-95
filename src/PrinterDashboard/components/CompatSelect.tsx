import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { productService } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';

interface CompatSelectProps {
  printerId: string;
  isOpen: boolean;
  onClose: () => void;
  compatibleProducts: any[];
}

export const CompatSelect: React.FC<CompatSelectProps> = ({
  printerId,
  isOpen,
  onClose,
  compatibleProducts,
}) => {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductLoading, setNewProductLoading] = useState(false);
  const [newProductError, setNewProductError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    color: '',
    alias: '',
    aliases: ''
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableProducts();
      setSearch('');
      setSelectedProductId(null);
      setSuggestions([]);
      setAddError(null);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, compatibleProducts]);

  const fetchAvailableProducts = async () => {
    setAddError(null);
    try {
      const products = await productService.getProducts();
      const linkedProductIds = compatibleProducts.map(p => p.id);
      const availableProducts = products.filter(p => !linkedProductIds.includes(p.id));
      setAllProducts(availableProducts);
      setSuggestions(availableProducts);
    } catch (error) {
      setAddError('Failed to fetch products.');
      setAllProducts([]);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (!search) {
      setSuggestions(allProducts);
      return;
    }
    const lower = search.toLowerCase();
    setSuggestions(
      allProducts.filter(
        p =>
          p.name.toLowerCase().includes(lower) ||
          (p.sku && p.sku.toLowerCase().includes(lower))
      )
    );
  }, [search, allProducts]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const prod = allProducts.find(p => p.id === productId);
    if (prod) setSearch(`${prod.name} (${prod.sku})`);
  };

  const handleConfirmAddProduct = async () => {
    if (!selectedProductId || !printerId) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const { error } = await supabase
        .from('product_printers')
        .insert({ printer_id: printerId, product_id: selectedProductId });
      if (error) throw error;
      handleClose();
      window.dispatchEvent(new CustomEvent('refresh-compatible-products', { detail: { printerId } }));
    } catch (err: any) {
      setAddError('Failed to link product.');
    }
    setAddLoading(false);
  };

  const handleNewProductSubmit = async () => {
    if (!newProduct.name.trim() || !newProduct.sku.trim()) {
      setNewProductError('Name and SKU are required.');
      return;
    }

    setNewProductLoading(true);
    setNewProductError(null);
    
    try {
      const productData = {
        name: newProduct.name.trim(),
        sku: newProduct.sku.trim(),
        category: newProduct.category.trim() || null,
        description: newProduct.description.trim() || null,
        color: newProduct.color.trim() || null,
        alias: newProduct.alias.trim() || null,
        aliases: newProduct.aliases.trim() || null,
      };

      console.log('Creating product with authenticated role:', productData);

      // Database trigger will automatically check for duplicates
      const { data: createdProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        
        // Handle trigger error specifically
        if (error.message.includes('already exists')) {
          throw new Error(error.message);
        }
        throw error;
      }

      console.log('Product created successfully:', createdProduct);

      // Link the new product to the printer
      const { error: linkError } = await supabase
        .from('product_printers')
        .insert({ 
          printer_id: printerId, 
          product_id: createdProduct.id 
        });

      if (linkError) {
        console.error('Link error:', linkError);
        
        if (linkError.code === '42501') {
          throw new Error('Permission denied for linking products.');
        } else if (linkError.code === '23505') {
          throw new Error('This product is already linked to this printer.');
        } else {
          throw new Error(`Failed to link product to printer: ${linkError.message}`);
        }
      }

      console.log('Product linked successfully to printer');

      handleCloseNewProductModal();
      handleClose();
      window.dispatchEvent(new CustomEvent('refresh-compatible-products', { detail: { printerId } }));
    } catch (err: any) {
      console.error('Product creation error:', err);
      setNewProductError(err.message || 'Failed to create product.');
    }
    
    setNewProductLoading(false);
  };

  const handleCloseNewProductModal = () => {
    setShowNewProductModal(false);
    setNewProduct({
      name: '',
      sku: '',
      category: '',
      description: '',
      color: '',
      alias: '',
      aliases: ''
    });
    setNewProductError(null);
  };

  const handleClose = () => {
    setSelectedProductId(null);
    setAddError(null);
    setSearch('');
    setSuggestions(allProducts);
    onClose();
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Compatible Product</DialogTitle>
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
            </button>
          </DialogHeader>

          {addError && (
            <div className="text-red-500 text-sm mb-4">{addError}</div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="product-search" className="block text-sm font-medium mb-1">
                Search Product
              </label>
              <input
                id="product-search"
                ref={inputRef}
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Type product name or SKU..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSelectedProductId(null);
                }}
                autoComplete="off"
              />
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && search !== '' && (
                <div className="border rounded-md shadow-sm mt-1 bg-white max-h-56 overflow-auto z-10 absolute w-full">
                  {suggestions.map(product => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        selectedProductId === product.id ? 'bg-gray-200' : ''
                      }`}
                      onClick={() => handleProductSelect(product.id)}
                    >
                      <span className="flex items-center">
                        {product.name}
                        {product.sku && (
                          <span className="text-xs text-gray-500 ml-1 flex items-center">
                            ({product.sku})
                            {product.color && (
                              <span
                                className="inline-block w-3 h-3 rounded-full ml-2"
                                style={{ backgroundColor: product.color }}
                                title={product.color_name || ''}
                              />
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* If no suggestions */}
              {suggestions.length === 0 && search !== '' && (
                <div className="text-sm text-gray-400 mt-2">No matching products found.</div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewProductModal(true)}
              >
                Add New Product
              </Button>
              <Button
                onClick={handleConfirmAddProduct}
                disabled={!selectedProductId || addLoading}
              >
                {addLoading ? 'Linking...' : 'Link Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Product Modal */}
      <Dialog open={showNewProductModal} onOpenChange={setShowNewProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>

          {newProductError && (
            <div className="text-red-500 text-sm mb-4">{newProductError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Name *
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter product name"
                value={newProduct.name}
                onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                SKU *
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter SKU"
                value={newProduct.sku}
                onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter category"
                value={newProduct.category}
                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter description"
                rows={3}
                value={newProduct.description}
                onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Color
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter color (e.g., #FF0000)"
                value={newProduct.color}
                onChange={e => setNewProduct(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Alias
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter alias"
                value={newProduct.alias}
                onChange={e => setNewProduct(prev => ({ ...prev, alias: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Aliases (comma-separated)
              </label>
              <input
                type="text"
                className="w-full border rounded-md shadow-sm p-2"
                placeholder="Enter aliases separated by commas"
                value={newProduct.aliases}
                onChange={e => setNewProduct(prev => ({ ...prev, aliases: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseNewProductModal}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNewProductSubmit}
                disabled={newProductLoading || !newProduct.name.trim() || !newProduct.sku.trim()}
              >
                {newProductLoading ? 'Creating...' : 'Create & Link Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
