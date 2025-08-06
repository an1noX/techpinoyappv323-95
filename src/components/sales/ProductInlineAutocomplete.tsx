import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';

interface ProductInlineAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onProductConfirmed: (product: Product, unitPrice?: number) => void;
  supplierId?: string;
  clientId?: string;
  placeholder?: string;
}

export const ProductInlineAutocomplete = ({
  value,
  onChange,
  onProductConfirmed,
  supplierId,
  clientId,
  placeholder = "Start typing product name..."
}: ProductInlineAutocompleteProps) => {
  const [suggestion, setSuggestion] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { searchProducts } = useProducts();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch products on mount for local matching
  useEffect(() => {
    const fetchInitialProducts = async () => {
      try {
        const results = await searchProducts('');
        setProducts(results);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchInitialProducts();
  }, [searchProducts]);

  // Find matching product and show inline suggestion
  useEffect(() => {
    if (!value.trim()) {
      setSuggestion('');
      setSelectedProduct(null);
      return;
    }

    const matchingProduct = products.find(product => 
      product.name.toLowerCase().startsWith(value.toLowerCase())
    );

    if (matchingProduct && value.toLowerCase() !== matchingProduct.name.toLowerCase()) {
      setSuggestion(matchingProduct.name.slice(value.length));
      setSelectedProduct(matchingProduct);
    } else {
      setSuggestion('');
      setSelectedProduct(null);
    }
  }, [value, products]);

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

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'ArrowRight') {
      if (suggestion && selectedProduct) {
        e.preventDefault();
        const fullProductName = value + suggestion;
        onChange(fullProductName);
        setSuggestion('');
        
        // Fetch and apply unit price
        const unitPrice = await fetchProductPrice(selectedProduct.id);
        onProductConfirmed(selectedProduct, unitPrice);
      }
    } else if (e.key === 'Enter') {
      if (suggestion && selectedProduct) {
        e.preventDefault();
        const fullProductName = value + suggestion;
        onChange(fullProductName);
        setSuggestion('');
        
        // Fetch and apply unit price
        const unitPrice = await fetchProductPrice(selectedProduct.id);
        onProductConfirmed(selectedProduct, unitPrice);
      }
    } else if (e.key === 'Escape') {
      setSuggestion('');
      setSelectedProduct(null);
    }
  };

  const handleBlur = async () => {
    // Check if current value exactly matches a product
    const exactMatch = products.find(product => 
      product.name.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      const unitPrice = await fetchProductPrice(exactMatch.id);
      onProductConfirmed(exactMatch, unitPrice);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full"
        autoComplete="off"
      />
      {suggestion && (
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center px-3"
          style={{ 
            color: '#9ca3af',
            fontFamily: 'inherit',
            fontSize: 'inherit'
          }}
        >
          <span style={{ visibility: 'hidden' }}>{value}</span>
          <span>{suggestion}</span>
        </div>
      )}
      {suggestion && (
        <div className="text-xs text-gray-500 mt-1">
          Press Tab or → to accept suggestion
        </div>
      )}
    </div>
  );
};