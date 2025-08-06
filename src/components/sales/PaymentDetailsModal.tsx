import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Receipt, AlertTriangle, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePayments } from '@/hooks/usePayments';
import { salesInvoiceService } from '@/services/salesInvoiceService';
import { SalesInvoice } from '@/types/payment';
import { PaymentRecordsTable } from './PaymentRecordsTable';
import { AddPaymentModal } from './AddPaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { calculateTaxes, TaxCalculationResult } from '@/utils/taxCalculation';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  supplierName?: string;
}

interface ClientTaxInfo {
  tax: string;
  wht: string;
}

// Using shared TaxCalculationResult type
type TaxCalculation = TaxCalculationResult;

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId,
  supplierName
}) => {
  const { paymentSummary, loading, updatePayment, deletePayment, refetch } = usePayments(purchaseOrderId);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [clientTaxInfo, setClientTaxInfo] = useState<ClientTaxInfo | null>(null);
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [loadingTaxInfo, setLoadingTaxInfo] = useState(false);
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [originalSubtotal, setOriginalSubtotal] = useState<number>(0);
  const [salesInvoiceTotalPaid, setSalesInvoiceTotalPaid] = useState<number>(0);

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      loadSalesInvoices();
      loadClientTaxInfo();
      loadOriginalSubtotal();
    }
  }, [isOpen, purchaseOrderId]);

  useEffect(() => {
    if (originalSubtotal && clientTaxInfo) {
      calculateTaxesFromOriginalSubtotal();
    }
  }, [originalSubtotal, clientTaxInfo]);

  const loadClientTaxInfo = async () => {
    setLoadingTaxInfo(true);
    try {
      // Get purchase order to find the client
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('supplier_client_id')
        .eq('id', purchaseOrderId)
        .single();

      if (poError) throw poError;

      if (poData?.supplier_client_id) {
        // Get client tax information
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', poData.supplier_client_id)
          .single();

        if (clientError) throw clientError;

        if (clientData) {
          setClientTaxInfo({
            tax: (clientData as any).tax || '',
            wht: (clientData as any).wht || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading client tax info:', error);
      // Set default values
      setClientTaxInfo({
        tax: '12',
        wht: '0'
      });
    } finally {
      setLoadingTaxInfo(false);
    }
  };

  const loadOriginalSubtotal = async () => {
    try {
      // Get purchase order items with pricing data to match PODetailModal logic
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          supplier_client_id,
          purchase_order_items (
            id,
            quantity,
            unit_price,
            product_id,
            products (
              id,
              name,
              sku,
              color
            )
          )
        `)
        .eq('id', purchaseOrderId)
        .single();

      if (poError) throw poError;

      if (poData?.purchase_order_items) {
        // Get pricing data for each item (same logic as PODetailModal)
        const itemsWithPricing = await Promise.all(poData.purchase_order_items?.map(async (item: any) => {
          const { data: pricingData } = await supabase
            .from('product_clients')
            .select('quoted_price, margin_percentage')
            .eq('product_id', item.product_id)
            .eq('client_id', poData.supplier_client_id)
            .single();
          
          return {
            ...item,
            client_product_pricing: pricingData
          };
        }) || []);

        // Calculate subtotal using the same logic as PODetailModal
        const subtotal = itemsWithPricing.reduce((sum: number, item: any) => {
          const unitPrice = item.unit_price || item.client_product_pricing?.quoted_price || 0;
          return sum + (unitPrice * item.quantity);
        }, 0);
        
        setOriginalSubtotal(subtotal);
      }
    } catch (error) {
      console.error('Error loading original subtotal:', error);
      setOriginalSubtotal(0);
    }
  };

  const calculateTaxesFromOriginalSubtotal = () => {
    if (!originalSubtotal || !clientTaxInfo) return;
    
    // Use the shared tax calculation utility to ensure consistency with PODetailModal
    const result = calculateTaxes({
      subtotal: originalSubtotal,
      clientTaxInfo,
      discount: 0, // No discount information available in current data
      withholdingTaxEnabled: false,
      withholdingTaxRate: 0
    });
    
    setTaxCalculation(result);
  };

  const loadSalesInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const invoices = await salesInvoiceService.getInvoicesForPurchaseOrder(purchaseOrderId);
      setSalesInvoices(invoices);
      
      // Calculate total paid from sales invoices
      const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
      setSalesInvoiceTotalPaid(totalPaid);
    } catch (error) {
      console.error('Error loading sales invoices:', error);
      setSalesInvoiceTotalPaid(0); // Fallback to 0 if no sales invoices
    } finally {
      setLoadingInvoices(false);
    }
  };

  if (loading || loadingInvoices) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading payment details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Payment Summary */}
          {paymentSummary && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Summary</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="text-sm font-medium text-green-700">Total Paid</label>
                  <p className="text-lg font-semibold text-green-900">{formatCurrency(salesInvoiceTotalPaid)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <label className="text-sm font-medium text-blue-700">Total Due</label>
                  <p className="text-lg font-semibold text-blue-900">
                    {taxCalculation ? formatCurrency(taxCalculation.totalAmountDue) : formatCurrency(paymentSummary.total_due)}
                  </p>
                </div>
                 <div className="p-3 bg-orange-50 rounded-lg">
                   <label className="text-sm font-medium text-orange-700">Remaining</label>
                    <p className="text-lg font-semibold text-orange-900">
                      {taxCalculation 
                        ? formatCurrency(Math.max(0, taxCalculation.totalAmountDue - salesInvoiceTotalPaid))
                        : formatCurrency(paymentSummary.remaining_balance)
                      }
                    </p>
                 </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {(() => {
                      const totalDue = taxCalculation ? taxCalculation.totalAmountDue : (paymentSummary?.total_due || 0);
                      const isPaid = salesInvoiceTotalPaid >= totalDue && totalDue > 0;
                      const isOverpaid = salesInvoiceTotalPaid > totalDue && totalDue > 0;
                      const isPartial = salesInvoiceTotalPaid > 0 && salesInvoiceTotalPaid < totalDue;
                      
                      if (isOverpaid) {
                        return (
                          <Badge variant="secondary" className="bg-purple-600 text-white">
                            OVERPAYMENT
                          </Badge>
                        );
                      } else if (isPaid) {
                        return (
                          <Badge variant="default" className="bg-green-600">
                            PAID
                          </Badge>
                        );
                      } else if (isPartial) {
                        return (
                          <Badge variant="secondary" className="bg-yellow-500">
                            PARTIAL
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge variant="outline">
                            UNPAID
                          </Badge>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tax Computation */}
          {taxCalculation && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tax Computation</h3>
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Subtotal (Before Tax):</span>
                    <span className="font-semibold">{formatCurrency(originalSubtotal)}</span>
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

          {/* Payment Records */}
          {paymentSummary?.payments && paymentSummary.payments.length > 0 && (
            <PaymentRecordsTable
              payments={paymentSummary.payments}
              onUpdatePayment={updatePayment}
              onDeletePayment={deletePayment}
            />
          )}

          {/* Sales Invoices */}
          {salesInvoices.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sales Invoices</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Invoice Number</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Net of VAT</th>
                      <th className="px-4 py-3 text-right font-medium">VAT</th>
                      <th className="px-4 py-3 text-right font-medium">WHT</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salesInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono">{invoice.invoice_number}</td>
                        <td className="px-4 py-3">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(invoice.net_of_vat)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(invoice.vat_amount)}</td>
                        <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(invoice.withholding_tax)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(invoice.total_amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge 
                            variant={
                              invoice.payment_status === 'paid' ? 'default' : 
                              invoice.payment_status === 'partial' ? 'secondary' : 'outline'
                            }
                            className={
                              invoice.payment_status === 'paid' ? 'bg-green-600' : 
                              invoice.payment_status === 'partial' ? 'bg-yellow-500' : ''
                            }
                          >
                            {invoice.payment_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Payment Data Warning */}
          {(!paymentSummary?.payments || paymentSummary.payments.length === 0) && salesInvoices.length === 0 && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">No payment records or sales invoices found for this purchase order.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {/* Add Payment Button - Only show if total paid < total due */}
          {taxCalculation && salesInvoiceTotalPaid < taxCalculation.totalAmountDue && (
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              onClick={() => setAddPaymentModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          )}
          
          {/* Close Button - Always visible */}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={addPaymentModalOpen}
        onClose={() => setAddPaymentModalOpen(false)}
        purchaseOrderId={purchaseOrderId}
        supplierName={supplierName}
        taxCalculation={taxCalculation}
        onPaymentAdded={() => {
          refetch(); // Refresh the payment data
          loadSalesInvoices(); // Refresh sales invoice data to get updated amount_paid
          setAddPaymentModalOpen(false);
        }}
      />
    </Dialog>
  );
};