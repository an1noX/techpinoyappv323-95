import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { SalesInvoice } from '@/types/payment';

interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SalesInvoice[];
  supplierName?: string;
  purchaseOrderNumber?: string;
}

export const PaymentInfoModal: React.FC<PaymentInfoModalProps> = ({
  isOpen,
  onClose,
  invoices,
  supplierName,
  purchaseOrderNumber
}) => {
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const totalDue = totalInvoiceAmount - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{supplierName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PO Number</p>
              <p className="font-medium">{purchaseOrderNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoice Amount</p>
                <p className="text-lg font-medium">{formatCurrency(totalInvoiceAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-lg font-medium text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="text-lg font-medium">{formatCurrency(totalDue)}</p>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-2">
            <h4 className="font-medium">Sales Invoices</h4>
            {invoices.length === 0 ? (
              <p className="text-muted-foreground">No invoices found</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-medium">Invoice Number</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Date</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Amount</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Paid</th>
                      <th className="text-left px-4 py-2 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                        <td className="px-4 py-3">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{formatCurrency(invoice.total_amount)}</td>
                        <td className="px-4 py-3 text-green-600">{formatCurrency(invoice.amount_paid)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              invoice.payment_status === 'paid' ? 'default' :
                              invoice.payment_status === 'partial' ? 'secondary' :
                              'destructive'
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
            )}
          </div>

          {/* Payment History */}
          {invoices.some(inv => inv.payment_history?.length > 0) && (
            <div className="space-y-2">
              <h4 className="font-medium">Payment History</h4>
              <div className="space-y-2">
                {invoices.map((invoice) =>
                  invoice.payment_history?.map((payment, index) => (
                    <div key={`${invoice.id}-${index}`} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div>
                        <span className="font-medium">{invoice.invoice_number}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-green-600 font-medium">
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};