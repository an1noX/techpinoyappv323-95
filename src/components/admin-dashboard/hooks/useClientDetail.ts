import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';
import { Client } from '@/types/database';

interface UseClientDetailOptions {
  clientId: string;
}

interface UseClientDetailReturn {
  client: Client | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDepartmentDetailsView: boolean;
  setIsDepartmentDetailsView: (value: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (value: boolean) => void;
  handleClientUpdated: (updatedClient: Client) => void;
}

export const useClientDetail = ({ clientId }: UseClientDetailOptions): UseClientDetailReturn => {
  const [activeTab, setActiveTab] = useState('departments');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDepartmentDetailsView, setIsDepartmentDetailsView] = useState(false);

  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID required');
      const foundClient = await clientService.getClientById(clientId);
      if (!foundClient) throw new Error('Client not found');
      return foundClient;
    },
    enabled: !!clientId,
  });

  const handleClientUpdated = useCallback((updatedClient: Client) => {
    refetch();
    setShowEditModal(false);
  }, [refetch]);

  return {
    client,
    isLoading,
    error: error as Error | null,
    refetch,
    activeTab,
    setActiveTab,
    isDepartmentDetailsView,
    setIsDepartmentDetailsView,
    showEditModal,
    setShowEditModal,
    handleClientUpdated,
  };
}; 