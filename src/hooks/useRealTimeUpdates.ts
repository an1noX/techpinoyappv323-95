
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRealTimeUpdates = (options: {
  queryKeys?: string[];
  showNotifications?: boolean;
}) => {
  const { queryKeys = [], showNotifications = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateQueries = useCallback((message?: string) => {
    // Invalidate specific query keys
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    
    // Invalidate common printer-related queries
    queryClient.invalidateQueries({ queryKey: ['printers'] });
    queryClient.invalidateQueries({ queryKey: ['printer-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['available-printers'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-printers'] });
    queryClient.invalidateQueries({ queryKey: ['compatible-products'] });
    
    if (showNotifications && message) {
      toast({
        title: "Data Updated",
        description: message,
        duration: 3000,
      });
    }
  }, [queryClient, queryKeys, showNotifications, toast]);

  useEffect(() => {
    // Set up real-time subscription for printer assignments
    const assignmentChannel = supabase
      .channel('printer-assignments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'printer_assignments'
        },
        (payload) => {
          console.log('Printer assignment change detected:', payload);
          invalidateQueries('Printer assignments updated');
        }
      )
      .subscribe();

    // Set up real-time subscription for printers
    const printerChannel = supabase
      .channel('printers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'printers'
        },
        (payload) => {
          console.log('Printer change detected:', payload);
          invalidateQueries('Printer data updated');
        }
      )
      .subscribe();

    // Set up real-time subscription for product_printers
    const productPrinterChannel = supabase
      .channel('product-printers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_printers'
        },
        (payload) => {
          console.log('Product-printer relationship change detected:', payload);
          invalidateQueries('Compatible products updated');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentChannel);
      supabase.removeChannel(printerChannel);
      supabase.removeChannel(productPrinterChannel);
    };
  }, [invalidateQueries]);

  return {
    refreshData: () => invalidateQueries('Data refreshed manually')
  };
};
