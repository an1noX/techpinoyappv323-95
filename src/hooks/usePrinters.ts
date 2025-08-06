
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Printer } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const usePrinters = (assignedOnly: boolean = false) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPrinters = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (assignedOnly) {
        // Get assigned printers (where assignments exist with is_unassigned = false and status = active)
        const { data: assigned, error: assignedError } = await supabase
          .from('printers')
          .select(`
            *,
            printer_assignments!inner(
              id, 
              client_id, 
              status, 
              serial_number,
              is_unassigned,
              department_location_id,
              assignment_effective_date,
              condition,
              usage_type,
              reason_for_change,
              notes,
              created_at,
              updated_at,
              maintenance_status,
              last_maintenance_date,
              clients(id, name),
              departments_location(
                id,
                name,
                department:departments(id, name)
              )
            )
          `)
          .eq('status', 'active')
          .eq('printer_assignments.is_unassigned', false)
          .eq('printer_assignments.status', 'active')
          .order('name');
        if (assignedError) throw assignedError;
        data = assigned || [];
      } else {
        // Fetch all printers with assignment data
        const { data: all, error: allError } = await supabase
          .from('printers')
          .select(`
            *,
            printer_assignments(
              id, 
              client_id, 
              status, 
              serial_number,
              is_unassigned,
              department_location_id,
              assignment_effective_date,
              condition,
              usage_type,
              reason_for_change,
              notes,
              created_at,
              updated_at,
              clients(id, name),
              departments_location(
                id,
                name,
                department:departments(id, name)
              )
            )
          `)
          .eq('status', 'active')
          .order('name');
        
        if (allError) {
          setError('Failed to fetch printers');
          toast({
            title: 'Error',
            description: 'Failed to fetch printers',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
        
        data = all || [];
      }
      setPrinters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch printers');
      toast({
        title: 'Error',
        description: 'Failed to fetch printers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, [assignedOnly]);

  return {
    printers,
    loading,
    error,
    loadPrinters
  };
};
