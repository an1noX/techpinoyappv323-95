import { useState } from 'react';
import { useToast } from './use-toast';
import { printerService } from '@/services/printerService';
import { getErrorMessage } from '@/lib/utils';
import { Printer } from '@/types/database';

export const usePrinterActions = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPrinter = async (printerData: Omit<Printer, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await printerService.createPrinter(printerData);
      toast({
        title: 'Success',
        description: 'Printer created successfully!',
      });
      return true;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to create printer: ${errorMessage}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrinter = async (printerId: string, printerData: Partial<Printer>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await printerService.updatePrinter(printerId, printerData);
      toast({
        title: 'Success',
        description: 'Printer updated successfully!',
      });
      return true;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to update printer: ${errorMessage}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePrinter = async (printerId: string, printerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await printerService.deletePrinter(printerId);
      toast({
        title: 'Success',
        description: `Printer "${printerName}" deleted successfully!`,
      });
      return true;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to delete printer: ${errorMessage}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unassignPrinter = async (assignmentId: string, printerName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await printerService.unassignPrinter(assignmentId);
      if (success) {
        toast({
          title: 'Success',
          description: `Successfully unassigned printer ${printerName}.`,
        });
        return true;
      } else {
        throw new Error('Unassignment failed for an unknown reason.');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to unassign printer: ${errorMessage}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder for updating an assignment
  const updatePrinterAssignment = async (assignmentId: string, updates: any) => {
    console.log('Updating assignment', assignmentId, updates);
    // In a real implementation, you would call a service here.
    // For now, this is a placeholder.
    toast({
        title: 'In Progress',
        description: 'Update functionality for printer assignments is not yet implemented.',
    });
    return Promise.resolve(true);
  };

  return {
    createPrinter,
    updatePrinter,
    deletePrinter,
    unassignPrinter,
    updatePrinterAssignment,
    isLoading,
    error,
  };
}; 