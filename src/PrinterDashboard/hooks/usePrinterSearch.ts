
import { useState, useCallback, useRef } from "react";
import { supabase } from '@/integrations/supabase/client';
import { Printer } from '@/types/database';

// Debounce utility
function useDebounce(fn: (...args: any[]) => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export const usePrinterSearch = (onFilteredDataChange: (data: any[]) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add page parameter for pagination
  const performSearch = useCallback(async (searchQuery: string, page: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      // Single query: join printers with their compatible products
      const { data: printers, error: printersError } = await supabase
        .from('printers')
        .select(`
          id,
          name,
          manufacturer,
          model,
          created_at,
          updated_at,
          status,
          printer_assignments(
            id,
            client_id,
            status,
            serial_number,
            clients(id, name)
          ),
          product_printers:product_printers(
            product:products(id, name, sku, color)
          )
        `)
        .eq('status', 'active')
        .ilike('name', `%${searchQuery}%`)
        .range(page * 50, page * 50 + 49);
      if (!printersError && printers) {
        // Map the joined data to match the expected structure
        const printersWithProducts = printers.map((printer: any) => ({
          ...printer,
          compatibleProducts: (printer.product_printers || []).map((pp: any) => pp.product).filter(Boolean)
        }));
        onFilteredDataChange(printersWithProducts);
      } else {
        setError('Failed to fetch printers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch printers');
    } finally {
      setLoading(false);
    }
  }, [onFilteredDataChange]);

  // Debounced version for search input
  const debouncedPerformSearch = useDebounce(performSearch, 300);

  return {
    performSearch,
    debouncedPerformSearch,
    loading,
    error
  };
};
