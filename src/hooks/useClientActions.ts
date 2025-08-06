
import { useState } from 'react';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/database';

export const useClientActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const deleteClient = async (clientId: string, clientName: string) => {
    setIsLoading(true);
    try {
      await clientService.deleteClient(clientId);
      toast({
        title: "Success",
        description: `${clientName} has been deleted successfully.`,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteClient,
    isLoading,
  };
};
