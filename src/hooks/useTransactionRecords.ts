
import { useState, useEffect } from 'react';
import { transactionService, TransactionRecord } from '@/services/transactionService';

export const useTransactionRecords = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transaction: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const newTransaction = await transactionService.createTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByPurchaseOrder = async (purchaseOrderId: string) => {
    try {
      return await transactionService.getTransactionsByPurchaseOrder(purchaseOrderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PO transactions');
      return [];
    }
  };

  const getTransactionsByDelivery = async (deliveryId: string) => {
    try {
      return await transactionService.getTransactionsByDelivery(deliveryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery transactions');
      return [];
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    getTransactionsByPurchaseOrder,
    getTransactionsByDelivery,
    refetch: fetchTransactions
  };
};
