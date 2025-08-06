
import { useState, useEffect } from 'react';
import { MaintenanceHistory, assetService } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';

export const useMaintenanceHistory = (printerId?: string) => {
  const [history, setHistory] = useState<MaintenanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadHistory = async () => {
    if (!printerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await assetService.getMaintenanceHistory(printerId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load maintenance history:', error);
      toast({
        title: "Error",
        description: "Failed to load maintenance history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHistoryEntry = async (entry: Omit<MaintenanceHistory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await assetService.addMaintenanceHistoryEntry(entry);
      await loadHistory();
      toast({
        title: "Success",
        description: "Maintenance history entry added successfully.",
      });
    } catch (error) {
      console.error('Failed to add maintenance history entry:', error);
      toast({
        title: "Error",
        description: "Failed to add maintenance history entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateHistoryEntry = async (id: string, updates: Partial<MaintenanceHistory>) => {
    try {
      await assetService.updateMaintenanceHistoryEntry(id, updates);
      await loadHistory();
      toast({
        title: "Success",
        description: "Maintenance history entry updated successfully.",
      });
    } catch (error) {
      console.error('Failed to update maintenance history entry:', error);
      toast({
        title: "Error",
        description: "Failed to update maintenance history entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (printerId) {
      loadHistory();
    }
  }, [printerId]);

  return {
    history,
    loading,
    loadHistory,
    addHistoryEntry,
    updateHistoryEntry,
  };
};
