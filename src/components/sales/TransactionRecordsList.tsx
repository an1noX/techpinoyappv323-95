import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, Search, FileText, TrendingUp, TrendingDown, X, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { TransactionItemsModal } from './TransactionItemsModal';
import { ExpandedPurchaseOrderView } from './ExpandedPurchaseOrderView';
import { ExpandedDeliveryView } from './ExpandedDeliveryView';
import { TransactionImportModal } from './TransactionImportModal';
import { transactionService, TransactionRecord } from '@/services/transactionService';
import { useTransactionRecords } from '@/hooks/useTransactionRecords';
import { useClients } from '@/hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'delivered':
    case 'confirmed':
      return 'default';
    case 'pending':
    case 'processing':
      return 'secondary';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'secondary';
  }
};

// Format PO numbers for display
export const formatPONumber = (poNumber?: string | null): string => {
  if (!poNumber) return '-';
  
  // If it's a raw ID format (client_po_ prefix or very long), truncate it
  if (poNumber.startsWith('client_po_') || poNumber.length > 36) {
    return poNumber.substring(0, 8) + '...';
  }
  
  return poNumber;
};

interface TransactionTableProps {
  transactions: TransactionRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  title: string;
  icon: React.ReactNode;
  emptyMessage: string;
  isPurchaseOrdersTable?: boolean;
  isDeliveriesTable?: boolean;
  getClientName?: (transaction: TransactionRecord) => string;
  onClearAllSearches?: () => void;
  onTransactionClick?: (transaction: TransactionRecord) => void;
}

// Helper functions for Purchase Order aggregation
const groupTransactionsByPO = (transactions: TransactionRecord[]) => {
  const grouped: { [key: string]: TransactionRecord[] } = {};
  
  transactions.forEach(transaction => {
    // For purchase orders, prioritize client_po (from purchase_order_number) over raw IDs
    let poKey = transaction.purchase_order_number || transaction.purchase_order_id || 'No PO';
    
    // If it's a raw ID format (client_po_ prefix or very long), try to extract a better value
    if (poKey.startsWith('client_po_') || poKey.length > 36) {
      // For raw IDs, prefer just using the ID itself as is instead of truncating
      // This ensures consistent grouping while still having meaningful keys
      poKey = transaction.purchase_order_id || poKey;
    }
    
    if (!grouped[poKey]) {
      grouped[poKey] = [];
    }
    grouped[poKey].push(transaction);
  });
  
  return grouped;
};

const getAggregatedPOData = (transactions: TransactionRecord[]) => {
  if (transactions.length === 0) return null;
  
  const firstTransaction = transactions[0];
  const uniqueProducts = new Set(transactions.map(t => t.model)).size;
  const totalQuantity = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalAmount = transactions.reduce((sum, t) => sum + (t.total_price || 0), 0);
  
  // Get unique DR and SI numbers from actual delivery data
  const drNumbers = [...new Set(transactions.map(t => t.delivery_receipt_number).filter(Boolean))];
  const siNumbers = [...new Set(transactions.map(t => t.sales_invoice_number).filter(Boolean))];
  
  // Determine payment status
  const hasSI = siNumbers.length > 0;
  const totalSITransactions = transactions.filter(t => t.sales_invoice_number).length;
  const paymentStatus = !hasSI ? 'UNPAID' : 
                       totalSITransactions === transactions.length ? 'PAID' : 'PARTIAL';
  
  return {
    ...firstTransaction,
    aggregatedData: {
      uniqueProductCount: uniqueProducts,
      totalQuantity,
      totalAmount,
      drNumbers,
      siNumbers,
      paymentStatus,
      itemCount: transactions.length
    }
  };
};

// Helper functions for Delivery Receipt aggregation
const groupTransactionsByDR = (transactions: TransactionRecord[]) => {
  const grouped: { [key: string]: TransactionRecord[] } = {};
  
  transactions.forEach(transaction => {
    // Group by delivery_id first, then fallback to delivery_receipt_number
    const drKey = transaction.delivery_id || transaction.delivery_receipt_number || 'No DR';
    if (!grouped[drKey]) {
      grouped[drKey] = [];
    }
    grouped[drKey].push(transaction);
  });
  
  return grouped;
};

const getAggregatedDRData = (transactions: TransactionRecord[]) => {
  if (transactions.length === 0) return null;
  
  const firstTransaction = transactions[0];
  const uniqueProducts = new Set(transactions.map(t => t.model)).size;
  const totalQuantity = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
  
  // Get unique PO and SI numbers from actual delivery data
  const poNumbers = [...new Set(transactions.map(t => t.purchase_order_number).filter(Boolean))];
  const siNumbers = [...new Set(transactions.map(t => t.sales_invoice_number).filter(Boolean))];
  
  // Determine delivery status based on PO linkage - all delivery items are delivered
  const hasPO = poNumbers.length > 0;
  const deliveryStatus = hasPO ? 'Delivered' : 'Direct Delivery';
  
  return {
    ...firstTransaction,
    aggregatedData: {
      uniqueProductCount: uniqueProducts,
      totalQuantity,
      poNumbers,
      siNumbers,
      deliveryStatus,
      itemCount: transactions.length
    }
  };
};

// Mobile-optimized summary modals
function PurchaseOrderSummaryModal({ open, onClose, poNumber }: { open: boolean, onClose: () => void, poNumber: string | null }) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    if (!poNumber || !open) return;
    setLoading(true);
    transactionService.getTransactionsByPurchaseOrder(poNumber)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [poNumber, open]);
  
  if (!open || !poNumber) return null;
  
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[90vh] flex flex-col safe-area-inset-bottom">
        <div className="sticky top-0 z-10 bg-card rounded-t-2xl p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">PO #{poNumber} Summary</h3>
          <button
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="px-3 py-2 text-center font-medium">DR</th>
                      <th className="px-3 py-2 text-center font-medium">SI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No records found</td></tr>
                    ) : transactions.map((t: any) => (
                      <tr key={t.id} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2 text-foreground">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-foreground">{t.status}</td>
                        <td className="px-3 py-2 text-foreground">{t.model}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.quantity}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.delivery_receipt_number || '-'}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.sales_invoice_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button
            className="h-11 w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SalesInvoiceSummaryModal({ open, onClose, siNumber }: { open: boolean, onClose: () => void, siNumber: string | null }) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    if (!siNumber || !open) return;
    setLoading(true);
    transactionService.getAllTransactions()
      .then(all => setTransactions(all.filter(t => t.sales_invoice_number === siNumber)))
      .finally(() => setLoading(false));
  }, [siNumber, open]);
  
  if (!open || !siNumber) return null;
  
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[90vh] flex flex-col safe-area-inset-bottom">
        <div className="sticky top-0 z-10 bg-card rounded-t-2xl p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">SI #{siNumber} Summary</h3>
          <button
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="px-3 py-2 text-center font-medium">PO</th>
                      <th className="px-3 py-2 text-center font-medium">DR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No records found</td></tr>
                    ) : transactions.map((t: any) => (
                      <tr key={t.id} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2 text-foreground">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-foreground">{t.status}</td>
                        <td className="px-3 py-2 text-foreground">{t.model}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.quantity}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.purchase_order_number || '-'}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.delivery_receipt_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button
            className="h-11 w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeliveryReceiptSummaryModal({ open, onClose, drNumber }: { open: boolean, onClose: () => void, drNumber: string | null }) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    if (!drNumber || !open) return;
    setLoading(true);
    transactionService.getAllTransactions()
      .then(all => setTransactions(all.filter(t => t.delivery_receipt_number === drNumber)))
      .finally(() => setLoading(false));
  }, [drNumber, open]);
  
  if (!open || !drNumber) return null;
  
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[90vh] flex flex-col safe-area-inset-bottom">
        <div className="sticky top-0 z-10 bg-card rounded-t-2xl p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">DR #{drNumber} Summary</h3>
          <button
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="px-3 py-2 text-center font-medium">PO</th>
                      <th className="px-3 py-2 text-center font-medium">SI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No records found</td></tr>
                    ) : transactions.map((t: any) => (
                      <tr key={t.id} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2 text-foreground">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-foreground">{t.status}</td>
                        <td className="px-3 py-2 text-foreground">{t.model}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.quantity}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.purchase_order_number || '-'}</td>
                        <td className="px-3 py-2 text-center text-foreground">{t.sales_invoice_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button
            className="h-11 w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionSummaryModal({ open, onClose, transaction }: { open: boolean, onClose: () => void, transaction: TransactionRecord | null }) {
  const [showPOSummary, setShowPOSummary] = useState(false);
  const [showSISummary, setShowSISummary] = useState(false);
  const [showDRSummary, setShowDRSummary] = useState(false);
  
  if (!open || !transaction) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-card rounded-t-2xl shadow-2xl w-full max-h-[80vh] flex flex-col safe-area-inset-bottom">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-bold text-center text-foreground">Transaction Summary</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-background rounded-lg border border-border overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-center font-medium">QTY</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 text-foreground">{transaction.model || '-'}</td>
                      <td className="px-3 py-2 text-center text-foreground">{transaction.quantity}</td>
                      <td className="px-3 py-2 text-right text-foreground font-medium">
                        ₱{transaction.total_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-medium text-foreground">PO:</span>
                <button 
                  className="text-primary underline hover:text-primary/80" 
                  onClick={() => setShowPOSummary(true)}
                >
                  {transaction.purchase_order_number || '-'}
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-medium text-foreground">SI:</span>
                <button 
                  className="text-primary underline hover:text-primary/80" 
                  onClick={() => setShowSISummary(true)}
                >
                  {transaction.sales_invoice_number || '-'}
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-medium text-foreground">DR:</span>
                <button 
                  className="text-primary underline hover:text-primary/80" 
                  onClick={() => setShowDRSummary(true)}
                >
                  {transaction.delivery_receipt_number || '-'}
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <button
              className="h-11 w-full rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <PurchaseOrderSummaryModal open={showPOSummary} onClose={() => setShowPOSummary(false)} poNumber={transaction.purchase_order_number} />
      <SalesInvoiceSummaryModal open={showSISummary} onClose={() => setShowSISummary(false)} siNumber={transaction.sales_invoice_number} />
      <DeliveryReceiptSummaryModal open={showDRSummary} onClose={() => setShowDRSummary(false)} drNumber={transaction.delivery_receipt_number} />
    </>
  );
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transactions, 
  searchTerm, 
  onSearchChange, 
  title, 
  icon, 
  emptyMessage, 
  isPurchaseOrdersTable = false,
  isDeliveriesTable = false,
  getClientName,
  onClearAllSearches,
  onTransactionClick 
}) => {
  const isMobile = useIsMobile();
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());
  const [expandedDRs, setExpandedDRs] = useState<Set<string>>(new Set());
  
  const filteredTransactions = transactions.filter(t => 
    t.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.purchase_order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (transaction: TransactionRecord) => {
    setSelectedTransaction(transaction);
    setShowSummary(true);
    // Clear all search results and queries
    if (onClearAllSearches) {
      onClearAllSearches();
    } else {
      onSearchChange('');
    }
  };

  const togglePOExpansion = (poNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedPOs);
    if (newExpanded.has(poNumber)) {
      newExpanded.delete(poNumber);
    } else {
      newExpanded.add(poNumber);
    }
    setExpandedPOs(newExpanded);
  };

  const toggleDRExpansion = (drNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedDRs);
    if (newExpanded.has(drNumber)) {
      newExpanded.delete(drNumber);
    } else {
      newExpanded.add(drNumber);
    }
    setExpandedDRs(newExpanded);
  };

  // For Purchase Orders, group transactions by PO number
  const renderPurchaseOrderTable = () => {
    const groupedTransactions = groupTransactionsByPO(filteredTransactions);
    const poNumbers = Object.keys(groupedTransactions);

    if (isMobile) {
      return (
        <div className="space-y-3">
          {poNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            poNumbers.map((poNumber) => {
              const poTransactions = groupedTransactions[poNumber];
              const aggregatedData = getAggregatedPOData(poTransactions);
              const isExpanded = expandedPOs.has(poNumber);

              if (!aggregatedData) return null;

              return (
                <div key={poNumber} className="bg-card rounded-lg border border-border">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={(e) => togglePOExpansion(poNumber, e)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground">
                          PO: {poNumber !== 'No PO' ? formatPONumber(poNumber) : 'No PO'}
                        </span>
                      </div>
                      <Badge 
                        variant={
                          aggregatedData.aggregatedData.paymentStatus === 'PAID' ? 'default' :
                          aggregatedData.aggregatedData.paymentStatus === 'PARTIAL' ? 'secondary' : 'outline'
                        } 
                        className="text-xs"
                      >
                        {aggregatedData.aggregatedData.paymentStatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Date: {new Date(aggregatedData.date).toLocaleDateString()}</div>
                      <div>Qty: {aggregatedData.aggregatedData.totalQuantity}</div>
                      <div className="truncate">Client: {aggregatedData.customer || 'N/A'}</div>
                      <div className="text-right font-medium text-foreground">
                        ₱{aggregatedData.aggregatedData.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-border">
                      <ExpandedPurchaseOrderView
                        poNumber={poNumber}
                        poTransactions={poTransactions}
                        onRowClick={handleRowClick}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      );
    }

    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-medium w-8"></th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Client</th>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-center font-medium">PO#</th>
                <th className="px-3 py-2 text-center font-medium">DR#</th>
                <th className="px-3 py-2 text-center font-medium">SI#</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {poNumbers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                poNumbers.map((poNumber) => {
                  const poTransactions = groupedTransactions[poNumber];
                  const aggregatedData = getAggregatedPOData(poTransactions);
                  const isExpanded = expandedPOs.has(poNumber);

                  if (!aggregatedData) return null;

                  // If only one transaction, render as a regular row (no expand/collapse)
                  if (poTransactions.length === 1) {
                    const transaction = poTransactions[0];
                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer active:bg-muted transition-colors"
                        onClick={() => handleRowClick(transaction)}
                      >
                        <td className="px-3 py-3 text-center">
                          {/* No expand/collapse icon */}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <div className="truncate max-w-[120px]" title={transaction.customer || 'N/A'}>
                            {transaction.customer || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <div className="truncate max-w-[140px]" title={transaction.model || 'N/A'}>
                            {transaction.model || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          {transaction.quantity}
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.purchase_order_number || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.delivery_receipt_number || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.sales_invoice_number || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                            {transaction.status || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground text-right">
                          ₱{transaction.total_price?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <React.Fragment key={poNumber}>
                      {/* Collapsed/Summary Row */}
                      <tr
                        className="border-b border-border hover:bg-muted/50 cursor-pointer active:bg-muted transition-colors"
                        onClick={(e) => togglePOExpansion(poNumber, e)}
                      >
                        <td className="px-3 py-3 text-center">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          {new Date(aggregatedData.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <div className="truncate max-w-[120px]" title={aggregatedData.customer || 'N/A'}>
                            {aggregatedData.customer || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {aggregatedData.aggregatedData.uniqueProductCount} SKU
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground font-medium">
                          {aggregatedData.aggregatedData.totalQuantity}
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {poNumber !== 'No PO' ? formatPONumber(poNumber) : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <div className="space-y-1">
                            {aggregatedData.aggregatedData.drNumbers.length > 0 ? (
                              aggregatedData.aggregatedData.drNumbers.map((dr, idx) => (
                                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded block">
                                  {dr}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs bg-muted px-2 py-1 rounded">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <div className="space-y-1">
                            {aggregatedData.aggregatedData.siNumbers.length > 0 ? (
                              aggregatedData.aggregatedData.siNumbers.map((si, idx) => (
                                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded block">
                                  {si}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs bg-muted px-2 py-1 rounded">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge 
                            variant={
                              aggregatedData.aggregatedData.paymentStatus === 'PAID' ? 'default' :
                              aggregatedData.aggregatedData.paymentStatus === 'PARTIAL' ? 'secondary' : 'outline'
                            } 
                            className="text-xs"
                          >
                            {aggregatedData.aggregatedData.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground text-right">
                          ₱{aggregatedData.aggregatedData.totalAmount.toFixed(2)}
                        </td>
                      </tr>

                      {/* Expanded/Detail Rows - Show enhanced PO items with delivery breakdown */}
                      {isExpanded && (
                        <ExpandedPurchaseOrderView
                          poNumber={poNumber}
                          poTransactions={poTransactions}
                          onRowClick={handleRowClick}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // For Deliveries, group transactions by DR number
  const renderDeliveryTable = () => {
    const groupedTransactions = groupTransactionsByDR(filteredTransactions);
    const drNumbers = Object.keys(groupedTransactions);

    if (isMobile) {
      return (
        <div className="space-y-3">
          {drNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            drNumbers.map((drNumber) => {
              const drTransactions = groupedTransactions[drNumber];
              const aggregatedData = getAggregatedDRData(drTransactions);
              const isExpanded = expandedDRs.has(drNumber);

              if (!aggregatedData) return null;

              if (drTransactions.length === 1) {
                const transaction = drTransactions[0];
                return (
                  <div 
                    key={transaction.id} 
                    className="bg-card rounded-lg border border-border p-4 cursor-pointer"
                    onClick={() => handleRowClick(transaction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        DR: {transaction.delivery_receipt_number || 'No DR'}
                      </span>
                      <Badge variant={getStatusBadgeVariant(transaction.purchase_order_number ? 'Delivered' : 'Adv Delivery')} className="text-xs">
                        {transaction.purchase_order_number ? 'Delivered' : 'Adv Delivery'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Date: {new Date(transaction.date).toLocaleDateString()}</div>
                      <div>Qty: {transaction.quantity}</div>
                      <div className="truncate">Client: {getClientName ? getClientName(transaction) : (transaction.customer || 'N/A')}</div>
                      <div className="text-right font-medium text-foreground">
                        ₱{transaction.total_price?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-2 truncate">
                      Product: {transaction.model || 'N/A'}
                    </div>
                  </div>
                );
              }

              return (
                <div key={drNumber} className="bg-card rounded-lg border border-border">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={(e) => toggleDRExpansion(drNumber, e)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground">
                          DR: {drNumber !== 'No DR' ? drNumber : 'No DR'}
                        </span>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(aggregatedData.aggregatedData.deliveryStatus)} 
                        className="text-xs"
                      >
                        {aggregatedData.aggregatedData.deliveryStatus}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Date: {new Date(aggregatedData.date).toLocaleDateString()}</div>
                      <div>Qty: {aggregatedData.aggregatedData.totalQuantity}</div>
                      <div className="truncate">Client: {aggregatedData.customer || 'N/A'}</div>
                      <div className="text-right font-medium text-foreground">
                        ₱{drTransactions.reduce((sum, t) => sum + (t.total_price || 0), 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-border">
                      {drTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-4 border-b border-border last:border-b-0 bg-muted/20 cursor-pointer"
                          onClick={() => handleRowClick(transaction)}
                        >
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Date: {new Date(transaction.date).toLocaleDateString()}</div>
                            <div>Qty: {transaction.quantity}</div>
                            <div className="truncate">Client: {transaction.customer || 'N/A'}</div>
                            <div className="text-right font-medium">
                              ₱{transaction.total_price?.toFixed(2) || '0.00'}
                            </div>
                            <div className="col-span-2 text-muted-foreground truncate">
                              Product: {transaction.model || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      );
    }

    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-medium w-8"></th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Client</th>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-center font-medium">PO#</th>
                <th className="px-3 py-2 text-center font-medium">DR#</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drNumbers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                drNumbers.map((drNumber) => {
                  const drTransactions = groupedTransactions[drNumber];
                  const aggregatedData = getAggregatedDRData(drTransactions);
                  const isExpanded = expandedDRs.has(drNumber);

                  if (!aggregatedData) return null;

                  // If only one transaction, render as a regular row (no expand/collapse)
                  if (drTransactions.length === 1) {
                    const transaction = drTransactions[0];
                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer active:bg-muted transition-colors"
                        onClick={() => handleRowClick(transaction)}
                      >
                        <td className="px-3 py-3 text-center">
                          {/* No expand/collapse icon */}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                         <td className="px-3 py-3 text-foreground">
                          <div className="truncate max-w-[120px]" title={getClientName ? getClientName(transaction) : (transaction.customer || 'N/A')}>
                            {getClientName ? getClientName(transaction) : (transaction.customer || 'N/A')}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <div className="truncate max-w-[140px]" title={transaction.model || 'N/A'}>
                            {transaction.model || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          {transaction.quantity}
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.purchase_order_number || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.delivery_receipt_number || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-foreground font-medium">
                          ₱{transaction.total_price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={getStatusBadgeVariant(transaction.purchase_order_number ? 'Delivered' : 'Adv Delivery')} className="text-xs">
                            {transaction.purchase_order_number ? 'Delivered' : 'Adv Delivery'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <React.Fragment key={drNumber}>
                      {/* Collapsed/Summary Row */}
                      <tr
                        className="border-b border-border hover:bg-muted/50 cursor-pointer active:bg-muted transition-colors"
                        onClick={(e) => toggleDRExpansion(drNumber, e)}
                      >
                        <td className="px-3 py-3 text-center">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          {new Date(aggregatedData.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <div className="truncate max-w-[120px]" title={aggregatedData.customer || 'N/A'}>
                            {aggregatedData.customer || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {aggregatedData.aggregatedData.uniqueProductCount} SKU
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground font-medium">
                          {aggregatedData.aggregatedData.totalQuantity}
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <div className="space-y-1">
                            {aggregatedData.aggregatedData.poNumbers.length > 0 ? (
                              aggregatedData.aggregatedData.poNumbers.map((po, idx) => (
                                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded block">
                                  {po}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs bg-muted px-2 py-1 rounded">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-foreground">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {drNumber !== 'No DR' ? drNumber : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-foreground font-medium">
                          ₱{drTransactions.reduce((sum, t) => sum + (t.total_price || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge 
                            variant={getStatusBadgeVariant(aggregatedData.aggregatedData.deliveryStatus)} 
                            className="text-xs"
                          >
                            {aggregatedData.aggregatedData.deliveryStatus}
                          </Badge>
                        </td>
                      </tr>

                      {/* Expanded/Detail Rows */}
                      {isExpanded && drTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-border bg-muted/20 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleRowClick(transaction)}
                        >
                          <td className="px-3 py-3 text-center">
                            <div className="w-4"></div>
                          </td>
                          <td className="px-3 py-3 text-foreground text-sm">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3 text-foreground text-sm">
                            <div className="truncate max-w-[120px]" title={transaction.customer || 'N/A'}>
                              {transaction.customer || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-foreground text-sm">
                            <div className="truncate max-w-[140px]" title={transaction.model || 'N/A'}>
                              {transaction.model || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-foreground text-sm">
                            {transaction.quantity}
                          </td>
                          <td className="px-3 py-3 text-center text-foreground">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {transaction.purchase_order_number || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-foreground">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {transaction.delivery_receipt_number || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-foreground font-medium text-sm">
                            ₱{transaction.total_price?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={getStatusBadgeVariant(transaction.purchase_order_number ? 'Delivered' : 'Adv Delivery')} className="text-xs">
                              {transaction.purchase_order_number ? 'Delivered' : 'Adv Delivery'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Regular table for other cases (no grouping)
  const renderRegularTable = () => {
    if (isMobile) {
      return (
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-card rounded-lg border border-border p-4 cursor-pointer"
                onClick={() => handleRowClick(transaction)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground truncate">
                    {transaction.customer || 'N/A'}
                  </span>
                  <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                    {transaction.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Date: {new Date(transaction.date).toLocaleDateString()}</div>
                  <div>Qty: {transaction.quantity}</div>
                  <div>PO: {formatPONumber(transaction.purchase_order_number)}</div>
                  <div>DR: {transaction.delivery_receipt_number || '-'}</div>
                  <div>SI: {transaction.sales_invoice_number || '-'}</div>
                  <div className="text-right font-medium text-foreground">
                    ₱{transaction.total_price?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mt-2 truncate">
                  Product: {transaction.model || 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Client</th>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-center font-medium">PO#</th>
                <th className="px-3 py-2 text-center font-medium">DR#</th>
                <th className="px-3 py-2 text-center font-medium">SI#</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer active:bg-muted transition-colors"
                    onClick={() => handleRowClick(transaction)}
                  >
                    <td className="px-3 py-3 text-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      <div className="truncate max-w-[120px]" title={transaction.customer || 'N/A'}>
                        {transaction.customer || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      <div className="truncate max-w-[140px]" title={transaction.model || 'N/A'}>
                        {transaction.model || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      {transaction.quantity}
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {transaction.purchase_order_number || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {transaction.delivery_receipt_number || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {transaction.sales_invoice_number || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground text-right">
                      ₱{transaction.total_price?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile-optimized header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-sm h-9"
          />
        </div>
      </div>

      {/* Conditional table rendering */}
      {isPurchaseOrdersTable ? renderPurchaseOrderTable() : 
       isDeliveriesTable ? renderDeliveryTable() : renderRegularTable()}
      
      <TransactionSummaryModal open={showSummary} onClose={() => setShowSummary(false)} transaction={selectedTransaction} />
    </div>
  );
};

export const TransactionRecordsList: React.FC = () => {
  const { transactions: purchaseOrderItems, loading: loadingPO, refetch } = useTransactionRecords();
  const { clients } = useClients();
  const { data: deliveryItems = [], isLoading: loadingDeliveries } = useQuery({
    queryKey: ['delivery-items'],
    queryFn: () => transactionService.getAllDeliveryItems(),
  });

  // Helper function to get client name - delivery items already have resolved client names
  const getClientName = (transaction: TransactionRecord) => {
    // For delivery items, the customer field already contains the resolved client name from the service
    return transaction.customer || 'Unknown Client';
  };
  
  const [purchaseOrderSearchTerm, setPurchaseOrderSearchTerm] = useState('');
  const [deliverySearchTerm, setDeliverySearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [showTransactionItemsModal, setShowTransactionItemsModal] = useState(false);

  const handleTransactionClick = (transaction: TransactionRecord) => {
    setSelectedTransaction(transaction);
    setShowTransactionItemsModal(true);
  };

  const clearAllSearches = () => {
    setPurchaseOrderSearchTerm('');
    setDeliverySearchTerm('');
    setInventorySearchTerm('');
  };

  // Purchase Orders tab shows all purchase_order_items
  const purchaseOrderTransactions = purchaseOrderItems;
  // Deliveries tab shows all delivery_items
  const deliveryTransactions = deliveryItems;
  // Inventory tab shows all transactions (combined view)
  const inventoryTransactions = [...purchaseOrderItems, ...deliveryItems];

  console.log('Total purchase order items loaded:', purchaseOrderItems.length);
  console.log('Total delivery items loaded:', deliveryItems.length);

  if (loadingPO || loadingDeliveries) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading transaction records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Transaction Records
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="purchase_orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="purchase_orders" className="flex items-center gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>Purchase Orders ({purchaseOrderTransactions.length})</span>
              </TabsTrigger>
              <TabsTrigger value="deliveries" className="flex items-center gap-2 text-xs sm:text-sm">
                <TrendingDown className="h-4 w-4" />
                <span>Deliveries ({deliveryTransactions.length})</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2 text-xs sm:text-sm">
                <Package className="h-4 w-4" />
                <span>Inventory ({inventoryTransactions.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchase_orders" className="mt-0">
              <TransactionTable
                transactions={purchaseOrderTransactions}
                searchTerm={purchaseOrderSearchTerm}
                onSearchChange={setPurchaseOrderSearchTerm}
                title="Purchase Orders"
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                emptyMessage="No purchase order items found"
                isPurchaseOrdersTable={true}
                getClientName={getClientName}
                onClearAllSearches={clearAllSearches}
                onTransactionClick={handleTransactionClick}
              />
            </TabsContent>

            <TabsContent value="deliveries" className="mt-0">
              <TransactionTable
                transactions={deliveryTransactions}
                searchTerm={deliverySearchTerm}
                onSearchChange={setDeliverySearchTerm}
                title="Deliveries"
                icon={<TrendingDown className="h-5 w-5 text-blue-600" />}
                emptyMessage="No delivery items found"
                isDeliveriesTable={true}
                getClientName={getClientName}
                onClearAllSearches={clearAllSearches}
                onTransactionClick={handleTransactionClick}
              />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <TransactionTable
                transactions={inventoryTransactions}
                searchTerm={inventorySearchTerm}
                onSearchChange={setInventorySearchTerm}
                title="Inventory"
                icon={<Package className="h-5 w-5 text-purple-600" />}
                emptyMessage="No inventory items found"
                getClientName={getClientName}
                onClearAllSearches={clearAllSearches}
                onTransactionClick={handleTransactionClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TransactionImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={refetch}
      />

      {selectedTransaction && (
        <TransactionItemsModal
          isOpen={showTransactionItemsModal}
          onClose={() => setShowTransactionItemsModal(false)}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};
