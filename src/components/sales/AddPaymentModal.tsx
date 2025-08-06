import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Receipt, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  supplierName?: string;
  taxCalculation?: TaxCalculation;
  onPaymentAdded?: () => void;
}


interface TaxCalculation {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  netOfVat: number;
  whtRate: number;
  withholdingTax: number;
  discount: number;
  totalAmountDue: number;
}

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  remarks: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required')
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId,
  supplierName,
  taxCalculation,
  onPaymentAdded
}) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      remarks: '',
      amount: 0,
      invoiceNumber: ''
    }
  });

  const watchedAmount = watch('amount');

  useEffect(() => {
    if (isOpen && taxCalculation) {
      reset({
        date: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        remarks: '',
        amount: Math.round(taxCalculation.totalAmountDue * 100) / 100,
        invoiceNumber: ''
      });
    }
  }, [isOpen, taxCalculation, reset]);


  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true);
    try {
      // Use salesInvoiceService to work with sales_invoice table
      const { salesInvoiceService } = await import('@/services/salesInvoiceService');
      
      // First check if invoice exists, if not create it
      let invoice = await salesInvoiceService.getInvoiceByNumber(data.invoiceNumber);
      
      if (!invoice) {
        // Create new sales invoice if it doesn't exist
        invoice = await salesInvoiceService.createSalesInvoice({
          invoice_number: data.invoiceNumber,
          purchase_order_id: purchaseOrderId,
          total_amount: taxCalculation?.totalAmountDue || data.amount,
          subtotal: taxCalculation?.subtotal || data.amount,
          vat_rate: taxCalculation?.vatRate || 0.12,
          vat_amount: taxCalculation?.vatAmount || 0,
          net_of_vat: taxCalculation?.netOfVat || data.amount,
          wht_rate: taxCalculation?.whtRate || 0,
          withholding_tax: taxCalculation?.withholdingTax || 0,
          invoice_date: data.date
        });
      }
      
      // Add payment to the sales invoice
      await salesInvoiceService.addPaymentToInvoice(invoice.id, {
        date: data.date,
        amount: data.amount,
        notes: `${data.paymentMethod}${data.remarks ? ` - ${data.remarks}` : ''}`
      });
      
      toast.success('Payment added successfully');
      onPaymentAdded?.();
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Add Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Purchase Order Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Supplier</label>
              <p className="text-base">{supplierName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Purchase Order ID</label>
              <p className="text-base font-mono">{purchaseOrderId}</p>
            </div>
          </div>

          {/* Payment Input Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  {...register('invoiceNumber')}
                  placeholder="Enter invoice number"
                />
                {errors.invoiceNumber && (
                  <p className="text-sm text-destructive">{errors.invoiceNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Payment Date *</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select onValueChange={(value) => setValue('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="paymaya">PayMaya</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && (
                  <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...register('remarks')}
                placeholder="Optional notes about this payment"
                rows={3}
              />
            </div>
          </div>

          {/* Tax Computation */}
          {taxCalculation && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">TAX COMPUTATION</h3>
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Subtotal (Inclusive):</span>
                    <span className="font-semibold">{formatCurrency(taxCalculation.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">VAT ({(taxCalculation.vatRate * 100).toFixed(1)}%):</span>
                    <span className="font-semibold">{formatCurrency(taxCalculation.vatAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net of VAT:</span>
                    <span className="font-semibold">{formatCurrency(taxCalculation.netOfVat)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Discount:</span>
                    <span className="font-semibold">{formatCurrency(taxCalculation.discount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Withholding Tax ({(taxCalculation.whtRate * 100).toFixed(1)}%):</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(taxCalculation.withholdingTax)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">TOTAL AMOUNT DUE:</span>
                      <span className="text-lg font-bold">{formatCurrency(taxCalculation.totalAmountDue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};