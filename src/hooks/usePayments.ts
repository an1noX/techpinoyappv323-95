import { useState, useEffect } from 'react';
import { paymentService, PaymentSummary, PaymentInfo } from '@/services/paymentService';
import { toast } from 'sonner';

export const usePayments = (purchaseOrderId?: string) => {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!purchaseOrderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const summaryData = await paymentService.getPaymentSummary(purchaseOrderId);
      setPaymentSummary(summaryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (invoiceNumber: string, amount: number, notes?: string, paymentMethod?: string) => {
    if (!purchaseOrderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.addPayment(purchaseOrderId, invoiceNumber, amount, notes, paymentMethod);
      await fetchPayments(); // Refresh summary
      
      toast.success('Payment recorded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async (index: number, amount: number, notes?: string) => {
    if (!purchaseOrderId || !paymentSummary?.payments[index]) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const payment = paymentSummary.payments[index];
      // Remove the old payment
      await paymentService.removePayment(purchaseOrderId, payment.invoiceNumber);
      // Add the updated payment
      await paymentService.addPayment(purchaseOrderId, payment.invoiceNumber, amount, notes || payment.notes);
      await fetchPayments(); // Refresh summary
      
      toast.success('Payment updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (index: number) => {
    if (!purchaseOrderId || !paymentSummary?.payments[index]) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const payment = paymentSummary.payments[index];
      await paymentService.removePayment(purchaseOrderId, payment.invoiceNumber);
      await fetchPayments(); // Refresh summary
      
      toast.success('Payment deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePayment = async (invoiceNumber: string) => {
    if (!purchaseOrderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.removePayment(purchaseOrderId, invoiceNumber);
      await fetchPayments(); // Refresh summary
      
      toast.success('Payment removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (invoiceNumber: string, amount?: number) => {
    if (!purchaseOrderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.markAsPaid(purchaseOrderId, invoiceNumber, amount);
      await fetchPayments(); // Refresh summary
      
      toast.success('Purchase order marked as paid successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark as paid';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseOrderId) {
      fetchPayments();
    }
  }, [purchaseOrderId]);

  return {
    paymentSummary,
    loading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    removePayment,
    markAsPaid,
    refetch: fetchPayments
  };
};