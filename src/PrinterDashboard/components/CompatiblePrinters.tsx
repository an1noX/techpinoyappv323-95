import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PrinterSelect } from './PrinterSelect';

interface CompatiblePrintersProps {
  productId: string;
  className?: string;
}

export const CompatiblePrinters: React.FC<CompatiblePrintersProps> = ({
  productId,
  className = ""
}) => {
  const { userProfile } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: printers, isLoading, refetch } = useQuery({
    queryKey: ['compatible-printers', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_printers')
        .select(`
          printer_id,
          printer:printers(
            id,
            name,
            model,
            manufacturer,
            series
          )
        `)
        .eq('product_id', productId);

      if (error) {
        console.error('Error fetching compatible printers:', error);
        return [];
      }

      return data?.map(pp => pp.printer).filter(Boolean) || [];
    },
    enabled: !!productId
  });

  // Set up real-time subscription for product_printers changes
  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`compatible-printers-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_printers',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          refetch();
        }
      )
      .subscribe();

    const handleRefreshEvent = (event: CustomEvent) => {
      if (event.detail?.productId === productId) {
        refetch();
      }
    };
    window.addEventListener('refresh-compatible-printers', handleRefreshEvent as EventListener);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('refresh-compatible-printers', handleRefreshEvent as EventListener);
    };
  }, [productId, refetch]);

  if (isLoading) {
    return <div className={`text-xs text-gray-500 ${className}`}>Loading printers...</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Printer listings first */}
        {!printers || printers.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No compatible printers found.</p>
        ) : (
          printers.map((printer, index) => (
            <Badge 
              key={printer.id} 
              variant="secondary" 
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              {[printer.manufacturer, printer.series, printer.model || printer.name]
                .filter(Boolean)
                .join(' ')}
            </Badge>
          ))
        )}
        {/* Plus icon wrapped with role check */}
        {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
          <Button
            variant="ghost"
            size="icon"
            className="p-1"
            title="Add supported printer"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </Button>
        )}
      </div>
      <PrinterSelect
        productId={productId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        compatiblePrinters={printers || []}
      />
    </div>
  );
};