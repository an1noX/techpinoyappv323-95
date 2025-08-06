
import { useState } from 'react';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/database';

interface TransformedClient {
  id: string;
  name: string;
  quotedPrice: number;
  lastUpdated: Date;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  priceHistory: any[];
  priceStatus: 'lowest' | 'highest' | 'middle';
  percentageDiff: number;
}

export const useProductClientActions = (
  productId: string,
  onProductUpdate?: () => void,
  loadClientData?: () => void
) => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState<TransformedClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddClient = async (clientData: {
    name: string;
    contactEmail?: string;
    phone?: string;
    notes?: string;
    quotedPrice: number;
    marginPercentage?: number;
  }) => {
    setIsLoading(true);
    try {
      await clientService.addClientToProduct(
        productId,
        {
          name: clientData.name,
          contact_email: clientData.contactEmail,
          phone: clientData.phone,
          notes: clientData.notes,
        },
        clientData.quotedPrice,
        clientData.marginPercentage
      );
      
      toast({
        title: "Success",
        description: "Client has been added successfully.",
      });
      
      if (loadClientData) loadClientData();
      if (onProductUpdate) onProductUpdate();
      
      return true;
    } catch (error) {
      console.error('Failed to add client:', error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (clientData: {
    id: string;
    name: string;
    contactEmail?: string;
    phone?: string;
    notes?: string;
    quotedPrice: number;
    marginPercentage?: number;
  }) => {
    setIsLoading(true);
    try {
      // Update the client info
      await clientService.updateClient(clientData.id, {
        name: clientData.name,
        contact_email: clientData.contactEmail,
        phone: clientData.phone,
        notes: clientData.notes,
      });

      // Update the quote price - we need to find the product_client relationship
      const productClients = await clientService.getProductClients(productId);
      const productClient = productClients.find(pc => pc.client.id === clientData.id);
      
      if (productClient) {
        await clientService.updateClientQuote(
          productClient.id,
          clientData.quotedPrice,
          clientData.marginPercentage
        );
      }
      
      toast({
        title: "Success",
        description: "Client has been updated successfully.",
      });
      
      if (loadClientData) loadClientData();
      if (onProductUpdate) onProductUpdate();
      
      return true;
    } catch (error) {
      console.error('Failed to update client:', error);
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (productClientId: string) => {
    setIsLoading(true);
    try {
      await clientService.removeClientFromProduct(productClientId);
      toast({
        title: "Success",
        description: "Client has been removed from this product.",
      });
      
      if (loadClientData) loadClientData();
      if (onProductUpdate) onProductUpdate();
      
      return true;
    } catch (error) {
      console.error('Failed to remove client:', error);
      toast({
        title: "Error",
        description: "Failed to remove client. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showAddClient,
    setShowAddClient,
    editingClient,
    setEditingClient,
    handleAddClient,
    handleUpdateClient,
    handleDeleteClient,
    isLoading,
  };
};
