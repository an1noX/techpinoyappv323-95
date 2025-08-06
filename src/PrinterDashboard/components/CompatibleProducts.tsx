import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CompatSelect } from './CompatSelect';
import { useAuth } from '@/hooks/useAuth';

interface CompatibleProductsProps {
  printerId: string;
  className?: string;
}

export const CompatibleProducts: React.FC<CompatibleProductsProps> = ({ printerId, className = "" }) => {
  const { userProfile } = useAuth();
  const [compatibleProducts, setCompatibleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCompatibleProducts = async () => {
    if (!printerId) return;
    setLoading(true);
    try {
      const products = await productService.getProductsByPrinter(printerId);
      setCompatibleProducts(products);
    } catch (error) {
      console.error('Failed to fetch compatible products:', error);
      setCompatibleProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompatibleProducts();
  }, [printerId]);

  // Set up real-time subscription for product_printers changes
  useEffect(() => {
    if (!printerId) return;

    const channel = supabase
      .channel(`compatible-products-${printerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_printers',
          filter: `printer_id=eq.${printerId}`
        },
        (payload) => {
          fetchCompatibleProducts();
        }
      )
      .subscribe();

    const handleRefreshEvent = (event: CustomEvent) => {
      if (event.detail?.printerId === printerId) {
        fetchCompatibleProducts();
      }
    };
    window.addEventListener('refresh-compatible-products', handleRefreshEvent as EventListener);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('refresh-compatible-products', handleRefreshEvent as EventListener);
    };
  }, [printerId]);

  // Group products by name and SKU
  const grouped = compatibleProducts.reduce((acc, product) => {
    const key = `${product.name}-${product.sku}`;
    if (!acc[key]) {
      acc[key] = {
        name: product.name,
        sku: product.sku,
        colors: [],
        allProducts: []
      };
    }
    if (product.color && !acc[key].colors.includes(product.color)) {
      acc[key].colors.push(product.color);
    }
    acc[key].allProducts.push(product);
    return acc;
  }, {});

  return (
    <div className={className}>
      {loading ? (
        <p className="text-xs text-gray-500 italic">Loading...</p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Product listings first */}
          {compatibleProducts.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No compatible products found.</p>
          ) : (
            Object.values(grouped).map((group: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1 mr-4">
                <span className="text-sm text-gray-800 font-medium truncate">{group.name}</span>
                {group.sku && (
                  <span className="text-xs text-gray-500">({group.sku})</span>
                )}
                {group.colors.map((color: string) => (
                  <span
                    key={color}
                    className="inline-block w-3 h-3 rounded-full border border-gray-300 ml-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            ))
          )}
          {/* Plus icon wrapped with role check */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
            <Button
              variant="ghost"
              size="icon"
              className="p-1"
              title="Add compatible product"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </Button>
          )}
        </div>
      )}
      <CompatSelect
        printerId={printerId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        compatibleProducts={compatibleProducts}
      />
    </div>
  );
};
