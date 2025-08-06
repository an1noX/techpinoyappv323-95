import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { salesInvoiceService } from '@/services/salesInvoiceService';
import { SalesInvoice } from '@/types/payment';

interface InvoiceEntry {
  invoiceNumber: string;
  amount: number | string;
  date: string;
}

interface ClientTaxInfo {
  tax: string;
  wht: string;
}

interface TaxCalculation {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  netOfVat: number;
  whtRate: number;
  withholdingTax: number;
  totalAmountDue: number;
}

interface MarkAsPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    invoices: Array<{ invoiceNumber: string; amount: number; date: string }>;
    totalAmount: number;
    notes: string;
  }) => Promise<void>;
  purchaseOrderId: string;
  supplierName?: string;
  totalAmount: number;
  isLoading?: boolean;
}

export const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  purchaseOrderId,
  supplierName,
  totalAmount,
  isLoading = false
}) => {
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([
    { invoiceNumber: '', amount: '', date: new Date().toISOString().split('T')[0] }
  ]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientTaxInfo, setClientTaxInfo] = useState<ClientTaxInfo | null>(null);
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [loadingTaxInfo, setLoadingTaxInfo] = useState(false);
  const [existingInvoices, setExistingInvoices] = useState<SalesInvoice[]>([]);
  const [loadingExistingInvoices, setLoadingExistingInvoices] = useState(false);
  
  // Load client tax information and existing invoices when modal opens
  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      loadClientTaxInfo();
      loadExistingInvoices();
    }
  }, [isOpen, purchaseOrderId]);

  // Recalculate taxes when client tax info or total amount changes
  useEffect(() => {
    if (clientTaxInfo && totalAmount > 0) {
      calculateTaxes();
    }
  }, [clientTaxInfo, totalAmount]);

  const loadClientTaxInfo = async () => {
    setLoadingTaxInfo(true);
    try {
      // Get purchase order to find the client
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .select('supplier_client_id')
        .eq('id', purchaseOrderId)
        .single();

      if (poError) {
        console.error('Error loading purchase order:', poError);
        setLoadingTaxInfo(false);
        return;
      }

      if (purchaseOrder?.supplier_client_id) {
        // Get client tax information - use SELECT * since we don't know exact column names
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', purchaseOrder.supplier_client_id)
          .single();

        if (clientError) {
          console.error('Error loading client tax info:', clientError);
        } else if (clientData) {
          setClientTaxInfo({
            tax: (clientData as any).tax || '',
            wht: (clientData as any).wht || ''
          });
        }
      }
    } catch (error) {
      console.error('Error in loadClientTaxInfo:', error);
    } finally {
      setLoadingTaxInfo(false);
    }
  };

  const loadExistingInvoices = async () => {
    setLoadingExistingInvoices(true);
    try {
      const invoices = await salesInvoiceService.getInvoicesForPurchaseOrder(purchaseOrderId);
      setExistingInvoices(invoices);
    } catch (error) {
      console.error('Error loading existing invoices:', error);
    } finally {
      setLoadingExistingInvoices(false);
    }
  };

  const calculateTaxes = () => {
    const subtotal = totalAmount;
    
    // Get VAT rate from client tax info or default to 12%
    const getVATRate = () => {
      if (clientTaxInfo?.tax) {
        const match = clientTaxInfo.tax.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          return parseFloat(match[1]) / 100;
        }
      }
      return 0.12; // Default VAT 12%
    };
    
    // Get WHT rate from client info or default to 0%
    const getWHTRate = () => {
      if (clientTaxInfo?.wht) {
        const whtValue = parseFloat(clientTaxInfo.wht);
        if (!isNaN(whtValue)) {
          return whtValue / 100;
        }
      }
      return 0; // Default no withholding tax
    };
    
    const vatRate = getVATRate();
    const whtRate = getWHTRate();
    
    // Calculate assuming totalAmount is VAT-inclusive
    const vatAmount = subtotal * (vatRate / (1 + vatRate));
    const netOfVat = subtotal - vatAmount;
    const withholdingTax = netOfVat * whtRate;
    const totalAmountDue = netOfVat + vatAmount - withholdingTax;
    
    setTaxCalculation({
      subtotal,
      vatRate,
      vatAmount,
      netOfVat,
      whtRate,
      withholdingTax,
      totalAmountDue
    });
  };

  const actualTotalAmount = taxCalculation?.totalAmountDue || totalAmount;
  
  const totalPaid = invoices.reduce((sum, inv) => {
    // Handle empty string case and ensure we're working with a number
    if (inv.amount === '') return sum;
    const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : Number(inv.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const remainingBalance = actualTotalAmount - totalPaid;
  const isFullyPaid = Math.abs(remainingBalance) <= 0.01; // Accounting for floating point precision
  const isOverpaid = remainingBalance < -0.01; // Only overpaid if significantly over

  const addInvoice = () => {
    setInvoices([...invoices, { invoiceNumber: '', amount: '', date: new Date().toISOString().split('T')[0] }]);
  };

  const removeInvoice = (index: number) => {
    if (invoices.length <= 1) return;
    const newInvoices = [...invoices];
    newInvoices.splice(index, 1);
    setInvoices(newInvoices);
  };

  const updateInvoice = (index: number, field: keyof InvoiceEntry, value: string | number) => {
    const newInvoices = [...invoices];
    newInvoices[index] = { ...newInvoices[index], [field]: value };
    setInvoices(newInvoices);
  };

  const validateInvoices = async (): Promise<boolean> => {
    // Check for empty invoice numbers
    const hasEmptyInvoiceNumbers = invoices.some(inv => !inv.invoiceNumber.trim());
    if (hasEmptyInvoiceNumbers) {
      setError('All invoices must have an invoice number');
      return false;
    }

    // Check for valid amounts
    for (const inv of invoices) {
      const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount;
      if (isNaN(amount) || amount <= 0) {
        setError('All invoices must have a valid amount greater than 0');
        return false;
      }
    }

    // Check for duplicate invoice numbers in the form
    const invoiceNumbers = invoices.map(inv => inv.invoiceNumber.trim().toLowerCase());
    if (new Set(invoiceNumbers).size !== invoiceNumbers.length) {
      setError('Invoice numbers must be unique');
      return false;
    }

    // Check for existing invoice numbers in the database
    for (const inv of invoices) {
      const exists = await salesInvoiceService.invoiceNumberExists(inv.invoiceNumber.trim());
      if (exists) {
        setError(`Invoice number "${inv.invoiceNumber}" already exists`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isValid = await validateInvoices();
    if (!isValid) return;
    
    if (isOverpaid) {
      setError('Total payment amount cannot exceed the order total');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get purchase order and client data
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .select('supplier_client_id')
        .eq('id', purchaseOrderId)
        .single();

      if (poError) throw poError;

      // Create sales invoices for each invoice entry
      for (const inv of invoices) {
        const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount;
        
        const salesInvoiceData = {
          invoice_number: inv.invoiceNumber.trim(),
          purchase_order_id: purchaseOrderId,
          client_id: purchaseOrder?.supplier_client_id || null,
          invoice_date: inv.date,
          subtotal: actualTotalAmount,
          vat_rate: taxCalculation?.vatRate || 0.12,
          vat_amount: taxCalculation?.vatAmount || 0,
          net_of_vat: taxCalculation?.netOfVat || actualTotalAmount,
          wht_rate: taxCalculation?.whtRate || 0,
          withholding_tax: taxCalculation?.withholdingTax || 0,
          total_amount: amount,
          notes: notes.trim() || undefined,
          client_tax_info: clientTaxInfo || {}
        };

        await salesInvoiceService.createSalesInvoice(salesInvoiceData);
      }

      // Reload existing invoices to show the newly created ones
      await loadExistingInvoices();
      
      // Call the original onConfirm for any additional logic (like updating PO status)
      const paymentData = {
        invoices: invoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber.trim(),
          amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
          date: inv.date
        })),
        totalAmount: totalPaid,
        notes: notes.trim()
      };

      await onConfirm(paymentData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setInvoices([{ invoiceNumber: '', amount: '', date: new Date().toISOString().split('T')[0] }]);
    setNotes('');
    setError('');
    setIsSubmitting(false);
    setClientTaxInfo(null);
    setTaxCalculation(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input
                value={supplierName || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Original Amount</Label>
              <Input
                value={formatCurrency(totalAmount)}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Tax Information Display */}
          {loadingTaxInfo ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading tax information...</span>
              </div>
            </div>
          ) : taxCalculation && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">Tax Calculation Breakdown</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (VAT Inclusive):</span>
                  <span>{formatCurrency(taxCalculation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT ({(taxCalculation.vatRate * 100).toFixed(1)}%):</span>
                  <span>{formatCurrency(taxCalculation.vatAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net of VAT:</span>
                  <span>{formatCurrency(taxCalculation.netOfVat)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Withholding Tax ({(taxCalculation.whtRate * 100).toFixed(1)}%):</span>
                  <span className="text-red-600">-{formatCurrency(taxCalculation.withholdingTax)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1 col-span-2">
                  <span>Total Amount Due:</span>
                  <span className="text-blue-700">{formatCurrency(taxCalculation.totalAmountDue)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Existing Invoices Display */}
          {existingInvoices.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-green-900">Existing Sales Invoices</h4>
              <div className="space-y-2">
                {existingInvoices.map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                    <div>
                      <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>New Invoices</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInvoice}
                disabled={isSubmitting || isLoading}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Invoice
              </Button>
            </div>

            <div className="space-y-3">
              {invoices.map((invoice, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label htmlFor={`invoice-${index}-number`} className="text-xs">
                      Sales Invoice No.
                    </Label>
                    <Input
                      id={`invoice-${index}-number`}
                      value={invoice.invoiceNumber}
                      onChange={(e) => updateInvoice(index, 'invoiceNumber', e.target.value)}
                      placeholder="INV-1234"
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label htmlFor={`invoice-${index}-date`} className="text-xs">
                      Date
                    </Label>
                    <Input
                      id={`invoice-${index}-date`}
                      type="date"
                      value={invoice.date}
                      onChange={(e) => updateInvoice(index, 'date', e.target.value)}
                      disabled={isSubmitting || isLoading}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label htmlFor={`invoice-${index}-amount`} className="text-xs">
                      Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                      <Input
                        id={`invoice-${index}-amount`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoice.amount}
                        onChange={(e) => updateInvoice(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        disabled={isSubmitting || isLoading}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    {invoices.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInvoice(index)}
                        disabled={isSubmitting || isLoading}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this payment"
              disabled={isSubmitting || isLoading}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Amount Due (After Tax)</p>
                <p className="text-lg font-medium text-green-700">{formatCurrency(actualTotalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="text-lg font-medium">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {isFullyPaid ? 'Fully Paid' : isOverpaid ? 'Overpaid' : 'Remaining Balance'}
                </p>
                <p className={`text-lg font-medium ${isFullyPaid ? 'text-green-600' : isOverpaid ? 'text-red-600' : ''}`}>
                  {isFullyPaid ? '✓ Paid in Full' : formatCurrency(Math.abs(remainingBalance))}
                  {isOverpaid && ' (Overpaid)'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Once recorded, this payment information cannot be edited.
              {!isFullyPaid && ' You can add more payments later if needed.'}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || totalPaid <= 0 || isOverpaid}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {isFullyPaid ? 'Mark as Paid in Full' : 'Record Payment'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};