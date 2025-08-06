import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Loader2, Building2, Wallet, Banknote, ArrowRight } from "lucide-react";
import { useSalesInvoicesForIncome } from "@/hooks/useSalesInvoicesForIncome";
import { useAddIncome } from "@/hooks/useIncomeExpenseData";
import { formatPHP } from "@/utils/currency";
import { FundSource, BankDestination } from "@/types/money-tracking";
import { toast } from "sonner";

interface EnhancedSalesInvoicePanelProps {
  className?: string;
}

export const EnhancedSalesInvoicePanel = ({ className }: EnhancedSalesInvoicePanelProps) => {
  const { data: salesInvoices = [], isLoading, error } = useSalesInvoicesForIncome();
  const addIncomeMutation = useAddIncome();
  
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [destination, setDestination] = useState<FundSource | ''>('');
  const [bankDestination, setBankDestination] = useState<BankDestination | ''>('');
  const [step, setStep] = useState<'destination' | 'bank'>('destination');

  const handleAddInvoiceAsIncome = async () => {
    if (!selectedInvoice || !destination) return;
    if (destination === 'Bank' && !bankDestination) return;

    try {
      await addIncomeMutation.mutateAsync({
        amount: selectedInvoice.total_amount,
        source: `Sales Invoice: ${selectedInvoice.invoice_number}`,
        destination: destination as FundSource,
        bankDestination: destination === 'Bank' ? bankDestination as BankDestination : undefined,
        description: `Income from sales invoice ${selectedInvoice.invoice_number}${selectedInvoice.notes ? ` - ${selectedInvoice.notes}` : ''}`,
        salesInvoiceId: selectedInvoice.id,
        salesInvoiceNumber: selectedInvoice.invoice_number,
        entryDate: new Date(selectedInvoice.invoice_date)
      });
      
      toast.success(`Added ${formatPHP(selectedInvoice.total_amount)} from invoice ${selectedInvoice.invoice_number} to ${destination === 'Bank' ? bankDestination : destination}`);
      resetDialog();
    } catch (error) {
      console.error('Error adding invoice as income:', error);
      toast.error('Failed to add invoice as income');
    }
  };

  const resetDialog = () => {
    setSelectedInvoice(null);
    setDestination('');
    setBankDestination('');
    setStep('destination');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDestinationIcon = (fundType: FundSource) => {
    switch (fundType) {
      case 'Bank': return <Building2 className="h-5 w-5" />;
      case 'GCash': return <Wallet className="h-5 w-5" />;
      case 'Cash on Hand': return <Banknote className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <FileText className="h-5 w-5" />
            Sales Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            Error loading sales invoices
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <FileText className="h-5 w-5" />
            Sales Invoices Available for Income
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add sales invoices as income entries to track your revenue
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading invoices...</span>
            </div>
          ) : salesInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No sales invoices available</p>
              <p className="text-sm">All invoices have been recorded as income</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {salesInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {invoice.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                    {invoice.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{invoice.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-blue-600">{formatPHP(invoice.total_amount)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add as Income
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destination Selection Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Add Invoice as Income
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              {selectedInvoice && (
                <p>Invoice: {selectedInvoice.invoice_number} - {formatPHP(selectedInvoice.total_amount)}</p>
              )}
            </div>
          </DialogHeader>

          {step === 'destination' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Where should this income go?</p>
                <div className="grid grid-cols-1 gap-3">
                  {(['Bank', 'GCash', 'Cash on Hand'] as FundSource[]).map((fund) => (
                    <button
                      key={fund}
                      onClick={() => setDestination(fund)}
                      className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                        destination === fund
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getDestinationIcon(fund)}
                        <span className="font-medium">{fund}</span>
                      </div>
                      {destination === fund && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                onClick={() => {
                  if (destination === 'Bank') {
                    setStep('bank');
                  } else {
                    handleAddInvoiceAsIncome();
                  }
                }}
                className="w-full"
                disabled={!destination || addIncomeMutation.isPending}
              >
                {addIncomeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : destination === 'Bank' ? (
                  <>Next: Choose Bank <ArrowRight className="h-4 w-4 ml-2" /></>
                ) : (
                  <>Add Income <Plus className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}

          {step === 'bank' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Which bank account?</p>
                <div className="grid grid-cols-1 gap-3">
                  {(['TECHPINOY', 'MYTCH'] as BankDestination[]).map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setBankDestination(bank)}
                      className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                        bankDestination === bank
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5" />
                        <span className="font-medium">{bank}</span>
                      </div>
                      {bankDestination === bank && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('destination')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleAddInvoiceAsIncome}
                  className="flex-1"
                  disabled={!bankDestination || addIncomeMutation.isPending}
                >
                  {addIncomeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <>Add Income <Plus className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};