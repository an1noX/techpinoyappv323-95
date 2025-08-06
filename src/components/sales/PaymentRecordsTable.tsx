import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Check, X, Edit3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PaymentInfo } from '@/types/payment';

interface PaymentRecordsTableProps {
  payments: PaymentInfo[];
  onUpdatePayment: (index: number, amount: number, notes?: string) => Promise<void>;
  onDeletePayment: (index: number) => Promise<void>;
}

export const PaymentRecordsTable: React.FC<PaymentRecordsTableProps> = ({
  payments,
  onUpdatePayment,
  onDeletePayment
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ amount: string; notes: string; paymentMethod: string }>({ amount: '', notes: '', paymentMethod: '' });
  const [loading, setLoading] = useState(false);

  // Format payment method for display
  const formatPaymentMethod = (method?: string) => {
    if (!method) return '-';
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const startEditing = (index: number, payment: PaymentInfo) => {
    setEditingIndex(index);
    setEditValues({
      amount: payment.amount.toString(),
      notes: payment.notes || '',
      paymentMethod: payment.paymentMethod || ''
    });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValues({ amount: '', notes: '', paymentMethod: '' });
  };

  const saveEdit = async (index: number) => {
    setLoading(true);
    try {
      const amount = parseFloat(editValues.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      await onUpdatePayment(index, amount, editValues.notes);
      setEditingIndex(null);
      setEditValues({ amount: '', notes: '', paymentMethod: '' });
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (index: number) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      setLoading(true);
      try {
        await onDeletePayment(index);
      } catch (error) {
        console.error('Error deleting payment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (editingIndex !== null) {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Records</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleEditMode}
          className="flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          {isEditing ? 'Done Editing' : 'Edit'}
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Invoice Number</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Payment Method</th>
              <th className="px-4 py-3 text-left font-medium">Notes</th>
              {isEditing && <th className="px-4 py-3 text-center font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment, index) => (
              <tr key={index} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-mono">{payment.invoiceNumber}</td>
                <td className="px-4 py-3">{new Date(payment.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {editingIndex === index ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.amount}
                      onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-32 text-right"
                      disabled={loading}
                    />
                  ) : (
                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground">{formatPaymentMethod(payment.paymentMethod)}</span>
                </td>
                <td className="px-4 py-3">
                  {editingIndex === index ? (
                    <Textarea
                      value={editValues.notes}
                      onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                      className="min-h-8 resize-none"
                      placeholder="Add notes..."
                      disabled={loading}
                    />
                  ) : (
                    <span className="text-muted-foreground">{payment.notes || '-'}</span>
                  )}
                </td>
                {isEditing && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      {editingIndex === index ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveEdit(index)}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(index, payment)}
                            disabled={loading || editingIndex !== null}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePayment(index)}
                            disabled={loading || editingIndex !== null}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};