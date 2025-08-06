import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Loader2 } from "lucide-react";
import { useSalesInvoicesForIncome } from "@/hooks/useSalesInvoicesForIncome";
import { useAddIncome } from "@/hooks/useIncomeExpenseData";
import { formatPHP } from "@/utils/currency";
import { toast } from "sonner";

interface SalesInvoicePanelProps {
  className?: string;
}

export const SalesInvoicePanel = ({ className }: SalesInvoicePanelProps) => {
  const { data: salesInvoices = [], isLoading, error } = useSalesInvoicesForIncome();
  const addIncomeMutation = useAddIncome();

  const handleAddInvoiceAsIncome = async (invoice: any) => {
    try {
      await addIncomeMutation.mutateAsync({
        amount: invoice.total_amount,
        source: `Sales Invoice: ${invoice.invoice_number}`,
        destination: 'Bank' as const, // Default to Bank, user can change later
        description: `Income from sales invoice ${invoice.invoice_number}${invoice.notes ? ` - ${invoice.notes}` : ''}`,
        salesInvoiceId: invoice.id,
        salesInvoiceNumber: invoice.invoice_number,
        entryDate: new Date(invoice.invoice_date)
      });
      
      toast.success(`Added ${formatPHP(invoice.total_amount)} from invoice ${invoice.invoice_number} as income`);
    } catch (error) {
      console.error('Error adding invoice as income:', error);
      toast.error('Failed to add invoice as income');
    }
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
                    onClick={() => handleAddInvoiceAsIncome(invoice)}
                    disabled={addIncomeMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {addIncomeMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Add as Income
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};