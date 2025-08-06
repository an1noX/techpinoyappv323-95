
import { useState, useEffect, useCallback } from 'react';
import { DocumentData } from '@/types/dms/document';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDocumentStorage = (type: string) => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents.",
          variant: "destructive",
        });
        return;
      }

      const formattedDocs: DocumentData[] = data.map(doc => ({
        id: doc.id,
        type: doc.type,
        clientName: doc.client_name,
        clientAddress: doc.client_address || '',
        clientPhone: doc.client_phone || '',
        clientEmail: doc.client_email || '',
        date: doc.date,
        items: doc.items as DocumentData['items'],
        notes: doc.notes || '',
        total: Number(doc.total),
        createdAt: doc.created_at,
      }));

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [type, toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const saveDocument = useCallback(async (document: DocumentData) => {
    setIsLoading(true);
    try {
      const total = document.items.reduce((sum, item) => sum + item.total, 0);
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          type: document.type,
          client_name: document.clientName,
          client_address: document.clientAddress,
          client_phone: document.clientPhone,
          client_email: document.clientEmail,
          date: document.date,
          items: document.items,
          notes: document.notes,
          total: total,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving document:', error);
        toast({
          title: "Error",
          description: "Failed to save document.",
          variant: "destructive",
        });
        return document;
      }

      const savedDoc: DocumentData = {
        id: data.id,
        type: data.type,
        clientName: data.client_name,
        clientAddress: data.client_address || '',
        clientPhone: data.client_phone || '',
        clientEmail: data.client_email || '',
        date: data.date,
        items: data.items as DocumentData['items'],
        notes: data.notes || '',
        total: Number(data.total),
        createdAt: data.created_at,
      };

      // Refresh the documents list
      await loadDocuments();
      
      return savedDoc;
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Error",
        description: "Failed to save document.",
        variant: "destructive",
      });
      return document;
    } finally {
      setIsLoading(false);
    }
  }, [loadDocuments, toast]);

  return {
    documents,
    saveDocument,
    loadDocuments,
    isLoading,
  };
};
