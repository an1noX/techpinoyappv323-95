import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dataService } from '@/services/dataService';

export const useRealtimeSubscription = ({ 
  printerFilter, 
  onRefresh 
}: { 
  printerFilter: string;
  onRefresh: () => void;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for', printerFilter);
    
    // Subscribe to printer table changes
    const printerSubscription = supabase
      .channel('printer-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'printers' 
        }, 
        (payload) => {
          console.log('📡 Printer table change detected:', payload);
          
          // If a new printer is inserted and we're viewing catalog
          if (payload.eventType === 'INSERT' && printerFilter === 'catalog') {
            console.log('🆕 New printer added to catalog, refreshing...');
            
            // Clear data service cache
            dataService.clearCache();
            
            // Immediately invalidate catalog cache
            queryClient.invalidateQueries({ 
              queryKey: ['optimized-printer-data', 'catalog'] 
            });
            
            // Trigger refresh
            onRefresh();
          }
          
          // For other changes, refresh based on current view
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            console.log(`🔄 Printer ${payload.eventType.toLowerCase()}, refreshing ${printerFilter}...`);
            
            // Clear cache for affected filter
            dataService.clearCache();
            queryClient.invalidateQueries({ 
              queryKey: ['optimized-printer-data', printerFilter] 
            });
            
            onRefresh();
          }
        }
      )
      .subscribe();

    // Subscribe to printer assignment changes for inventory/assigned/available tabs
    const assignmentSubscription = supabase
      .channel('assignment-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'printer_assignments' 
        }, 
        (payload) => {
          console.log('📡 Assignment change detected:', payload);
          
          // Clear cache and refresh for assignment-based filters
          if (['assigned', 'available', 'inventory'].includes(printerFilter)) {
            dataService.clearCache();
            queryClient.invalidateQueries({ 
              queryKey: ['optimized-printer-data', printerFilter] 
            });
            onRefresh();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions');
      supabase.removeChannel(printerSubscription);
      supabase.removeChannel(assignmentSubscription);
    };
  }, [printerFilter, onRefresh, queryClient]);
};
