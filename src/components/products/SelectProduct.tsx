import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/types/sales';
import { useProducts } from '@/hooks/useProducts';
import { productService } from '@/services/productService';

interface SelectProductProps {
  onSelect: (product: Product, quantity: number) => void;
  onClose: () => void;
  clientId?: string;
  title?: string;
}

export function SelectProduct({ 
  onSelect, 
  onClose, 
  clientId,
  title = "Add Item"
}: SelectProductProps) {
  const { searchProducts: hookSearchProducts } = useProducts();
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [qtyPromptOpen, setQtyPromptOpen] = useState(false);
  const [qtyPromptProduct, setQtyPromptProduct] = useState<(Product & { unit_price?: number }) | null>(null);
  const [qtyInput, setQtyInput] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus management - focus search input when modal opens
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Initial product search on mount
  useEffect(() => {
    searchProducts("");
  }, []);

  const searchProducts = async (query: string) => {
    setProductSearchLoading(true);
    try {
      const results = await hookSearchProducts(query.trim() ? query : "");
      setProductResults(results);
    } catch (err) {
      setProductResults([]);
      console.error('Error searching products:', err);
    } finally {
      setProductSearchLoading(false);
    }
  };

  const handleProductClick = async (product: Product) => {
    try {
      if (clientId) {
        const productWithClients = await productService.getProductWithClients(product.id);
        const clientPrice = productWithClients?.clients?.find(
          (c: any) => c.client_id === clientId
        )?.quoted_price || 0;

        setQtyPromptProduct({
          ...product,
          unit_price: clientPrice
        });
      } else {
        setQtyPromptProduct(product);
      }
      
      setQtyInput(1);
      setQtyPromptOpen(true);
      setTimeout(() => { qtyInputRef.current?.focus(); }, 100);
    } catch (error) {
      console.error('Error fetching client pricing:', error);
    }
  };

  const handleConfirmQty = () => {
    if (qtyPromptProduct && qtyInput > 0) {
      onSelect(qtyPromptProduct, qtyInput);
    }
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[85vh] flex flex-col safe-area-inset-bottom">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {title}
          </h3>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search products to add..."
            value={productQuery}
            onChange={e => {
              setProductQuery(e.target.value);
              searchProducts(e.target.value);
            }}
            className="mb-3 h-11 text-sm"
            autoFocus
          />
          
          <div className="bg-background border border-border rounded-lg shadow-sm max-h-64 overflow-y-auto">
            {productSearchLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
            ) : productResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No products found</div>
            ) : (
              productResults.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted transition cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="flex items-center gap-3 w-full min-w-0">
                    {product.color && (
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: product.color }}
                        title={product.color}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm truncate">
                        {product.name}
                      </div>
                      {product.sku && (
                        <div className="text-xs text-muted-foreground truncate">
                          ({product.sku})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <button
            className="w-full h-11 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>

      {/* Quantity Prompt Modal */}
      {qtyPromptOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-xs">
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2 text-foreground">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Enter Quantity
              </h3>
              <input
                ref={qtyInputRef}
                type="number"
                min={1}
                value={qtyInput}
                onChange={e => setQtyInput(Number(e.target.value))}
                className="w-full border border-border rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-11"
              />
            </div>
            <div className="flex gap-2 p-4 pt-0">
              <button
                className="flex-1 h-11 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors"
                onClick={() => {
                  setQtyPromptOpen(false);
                  setQtyPromptProduct(null);
                  setQtyInput(1);
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-11 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors disabled:opacity-50"
                onClick={handleConfirmQty}
                disabled={qtyInput < 1}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}