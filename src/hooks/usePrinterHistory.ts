
import { useState, useEffect } from 'react';
import { PrinterHistory, assetService } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';

export const usePrinterHistory = (printerId?: string) => {
  const [history, setHistory] = useState<PrinterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadHistory = async () => {
    if (!printerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await assetService.getPrinterHistory(printerId);
    setHistory(data);
    setLoading(false);
  };

  const addHistoryEntry = async (entry: Omit<PrinterHistory, 'id'>) => {
    await assetService.addPrinterHistoryEntry(entry);
    await loadHistory();
    toast({
      title: "Success",
      description: "History entry added successfully.",
    });
  };

  useEffect(() => {
    if (printerId) {
      loadHistory().catch((error) => {
        console.error('Failed to load printer history:', error);
        toast({
          title: "Error",
          description: "Failed to load printer history. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      });
    }
  }, [printerId]);

  return {
    history,
    loading,
    loadHistory,
    addHistoryEntry,
  };
};
