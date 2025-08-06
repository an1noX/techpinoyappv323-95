import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedPrinterData } from './useOptimizedPrinterData';

// Legacy hooks for backward compatibility and specific use cases
export const useAssignedPrinters = (enabled: boolean) => {
  return useOptimizedPrinterData('assigned', enabled);
};

export const useAllPrinters = (enabled: boolean) => {
  return useOptimizedPrinterData('inventory', enabled);
};

export const useCatalogPrinters = (enabled: boolean) => {
  return useOptimizedPrinterData('catalog', enabled);
};

export const useAvailablePrinters = (enabled: boolean) => {
  return useOptimizedPrinterData('available', enabled);
};

// Keep original implementations as fallback for specific cases that need raw data
export const useAssignedPrintersRaw = (enabled: boolean) => {
  return useQuery({
    queryKey: ['assigned-assignments-raw'],
    queryFn: async () => {
      const { data, error } = await supabase
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
          printer:printers(
            id,
            name,
            manufacturer,
            model,
            series,
            color,
            image_url,
            rental_eligible,
            is_available,
            status
          ),
          clients(id, name),
          departments_location(
            id,
            name,
            department:departments(id, name)
          )
        `)
        .eq('is_unassigned', false)
        .in('status', ['active', 'inactive'])
        .not('client_id', 'is', null)
        .order('printer(name)');

      if (error) throw error;
      return data || [];
    },
    select: (data) => {
      // Transform data to unique printers and prevent duplicates
      return data.reduce((acc, assignment) => {
        const printerId = assignment.printer.id;
        // Only add if we haven't seen this printer before
        if (!acc.some(item => item.id === printerId)) {
          acc.push({
            ...assignment.printer,
            printer_assignments: [assignment]
          });
        }
        return acc;
      }, []);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
