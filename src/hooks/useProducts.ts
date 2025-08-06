
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/sales';
import { useToast } from '@/hooks/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          printers:product_printers(
            id,
            is_recommended,
            printer:printers(
              id,
              name,
              manufacturer,
              model
            )
          ),
          clients:product_clients(
            id,
            quoted_price,
            client:clients(
              id,
              name
            )
          )
        `)
        .order('name');
      if (!error && data) {
        setProducts(data || []);
        return;
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('search_products_with_alias', { search_term: searchTerm });
      if (!error && data) {
        return data || [];
      }
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    searchProducts,
    refetch: fetchProducts
  };
};
