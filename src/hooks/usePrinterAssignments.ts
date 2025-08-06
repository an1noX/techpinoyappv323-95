
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePrinterAssignments = (printerId: string) => {
  return useQuery({
    queryKey: ['printer-assignments', printerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_assignments')
        .select(`
          id,
          printer_id,
          client_id,
          department_location_id,
          serial_number,
          status,
          deployment_date,
          usage_type,
          monthly_price,
          clients(name),
          departments_location(
            id,
            name,
            department:departments(
              id, 
              name,
              client:clients(name)
            )
          )
        `)
        .eq('printer_id', printerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!printerId
  });
};
