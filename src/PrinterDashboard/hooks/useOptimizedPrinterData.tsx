import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { memoryManager } from '@/utils/memoryManager';

export const useOptimizedPrinterData = (
  printerFilter: 'assigned' | 'available' | 'catalog' | 'inventory',
  enabled: boolean
) => {
  // Preload data for predicted tab switches
  useEffect(() => {
    if (enabled) {
      dataService.preloadTabData(printerFilter);
    }
  }, [printerFilter, enabled]);

  return useQuery({
    queryKey: ['optimized-printer-data', printerFilter],
    queryFn: async () => {
      // Try to get from cache first, but only if we're not in a high memory state
      if (!memoryManager.isHighMemoryUsage()) {
        const cached = dataService.getCachedNormalizedData();
        const denormalizedData = cached ? dataService.denormalizePrinterData(printerFilter) : [];
        
        // Only use cache if we have valid data
        if (cached && denormalizedData.length > 0) {
          return denormalizedData;
        }
      }
      
      // Fetch fresh data based on filter
      if (printerFilter === 'catalog') {
        const { data, error } = await supabase
          .from('printers')
          .select(`
            id,
            name,
            manufacturer,
            model,
            series,
            color,
            image_url,
            rental_eligible,
            status,
            created_at
          `)
          .neq('status', 'deleted')
          .order('created_at', { ascending: false }); // Changed from .order('name') to sort by newest first

        if (error) throw error;
        return data || [];
      } else {
        // For assignment-based filters
        let query = supabase
          .from('printer_assignments')
          .select(`
            id,
            printer_id,
            serial_number,
            usage_type,
            status,
            client_id,
            department_location_id,
            assignment_effective_date,
            condition,
            reason_for_change,
            notes,
            created_at,
            updated_at,
            is_client_owned,
            printer:printers!inner(
              id,
              name,
              manufacturer,
              model,
              series,
              color,
              image_url,
              rental_eligible,
              status
            ),
            clients(id, name),
            departments_location(
              id,
              name,
              department:departments(id, name)
            )
          `);

        // Apply filter-specific conditions
        switch (printerFilter) {
          case 'assigned':
            query = query
              .in('status', ['active', 'inactive', 'undeployed'])
              .not('client_id', 'is', null);
            break;
          case 'available':
            query = query.is('client_id', null);
            break;
          case 'inventory':
            // No additional filters for 'inventory'
            break;
        }

        query = query.order('printer(name)');

        const { data, error } = await query;
        if (error) throw error;

        // Normalize and cache the data
        const normalized = dataService.normalizeAssignmentData(data || []);
        dataService.cacheNormalizedData(normalized);

        // Return denormalized data for the specific filter
        return dataService.denormalizePrinterData(printerFilter);
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useBackgroundDataSync = () => {
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startSync = () => {
      // Only start sync if memory usage is normal
      if (!memoryManager.isMemoryPressure()) {
        interval = setInterval(async () => {
          try {
            // Check memory before each sync
            if (!memoryManager.isMemoryPressure()) {
              await dataService.prefetchTabData('inventory');
            }
          } catch (error) {
            console.warn('Background sync failed:', error);
          }
        }, 10 * 60 * 1000); // 10 minutes
      }
    };

    // Start initial sync
    startSync();

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
};
