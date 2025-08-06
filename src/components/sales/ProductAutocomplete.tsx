import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: Product, unitPrice?: number) => void;
  supplierId?: string;
  clientId?: string;
  placeholder?: string;
}

export const ProductAutocomplete = ({
  value,
  onChange,
  onProductSelect,
  supplierId,
  clientId,
  placeholder = "Search for a product..."
}: ProductAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchProducts } = useProducts();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchForProducts = async () => {
      if (value.trim().length < 2) {
        setSearchResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const results = await searchProducts(value);
        setSearchResults(results);
        setIsOpen(true);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchForProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, searchProducts]);

  const fetchProductPrice = async (productId: string): Promise<number | undefined> => {
    try {
      if (clientId) {
        const { data, error } = await supabase
          .from('product_clients')
          .select('quoted_price')
          .eq('product_id', productId)
          .eq('client_id', clientId)
          .single();
        
        if (!error && data?.quoted_price) {
          return data.quoted_price;
        }
      }

      if (supplierId) {
        const { data, error } = await supabase
          .from('product_suppliers')
          .select('unit_price')
          .eq('product_id', productId)
          .eq('supplier_id', supplierId)
          .single();
        
        if (!error && (data as any)?.unit_price) {
          return (data as any).unit_price;
        }
      }
    } catch (error) {
      console.error('Error fetching product price:', error);
    }
    
    return undefined;
  };

  const handleProductClick = async (product: Product) => {
    const unitPrice = await fetchProductPrice(product.id);
    onChange(product.name);
    onProductSelect(product, unitPrice);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.trim().length >= 2 && setIsOpen(true)}
        className="w-full"
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto z-50"
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">No products found</div>
          ) : (
            searchResults.map((product) => (
              <div
                key={product.id}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleProductClick(product)}
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                {product.color && (
                  <div className="text-xs text-gray-400">Color: {product.color}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};