import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useUnassignPrinter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const unassignPrinter = async (
    assignmentId: string,
    unassignLevel: 'location' | 'department'
  ) => {
    setIsLoading(true);
    try {
      if (unassignLevel === 'location') {
        // Remove from location only, keep department assignment
        const { error } = await supabase
          .from('printer_assignments')
          .update({
            department_location_id: null,
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignmentId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Printer removed from location. It remains assigned to the department.',
        });
      } else {
        // Remove from department entirely
        const { error } = await supabase
          .from('printer_assignments')
          .update({
            department_location_id: null,
            status: 'available',
            is_unassigned: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', assignmentId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Printer undeployed from department and is now available.',
        });
      }
    } catch (error) {
      console.error('Error unassigning printer:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign printer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    unassignPrinter,
    isLoading
  };
};
