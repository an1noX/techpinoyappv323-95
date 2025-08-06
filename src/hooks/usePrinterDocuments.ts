
import { useState, useEffect } from 'react';
import { PrinterDocument, assetService } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';

export const usePrinterDocuments = (printerId?: string) => {
  const [documents, setDocuments] = useState<PrinterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDocuments = async () => {
    if (!printerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await assetService.getPrinterDocuments(printerId);
    setDocuments(data);
    setLoading(false);
  };

  const uploadDocument = async (document: Omit<PrinterDocument, 'id' | 'uploaded_at'>) => {
    await assetService.uploadPrinterDocument(document);
    await loadDocuments();
    toast({
      title: "Success",
      description: "Document uploaded successfully.",
    });
  };

  const deleteDocument = async (id: string) => {
    await assetService.deletePrinterDocument(id);
    await loadDocuments();
    toast({
      title: "Success",
      description: "Document deleted successfully.",
    });
  };

  useEffect(() => {
    if (printerId) {
      loadDocuments().catch((error) => {
        console.error('Failed to load printer documents:', error);
        toast({
          title: "Error",
          description: "Failed to load printer documents. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      });
    }
  }, [printerId]);

  return {
    documents,
    loading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
  };
};
