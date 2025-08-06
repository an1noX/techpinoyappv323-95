import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, TrendingUp, AlertCircle, Users, Warehouse } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal';
import { CreateInventoryPurchaseModal } from './CreateInventoryPurchaseModal';
import { MarkAsPaidModal } from './MarkAsPaidModal';
import { SearchAndFilterHeader } from './SearchAndFilterHeader';
import { Suspense, lazy } from 'react';
import { usePurchaseOrdersEnhanced } from '@/hooks/usePurchaseOrdersEnhanced';
import { useSearchState } from '@/hooks/useSearch';
import { transactionService } from '@/services/transactionService';
import { inventoryPurchaseService } from '@/services/inventoryPurchaseService';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const PurchaseOrderImportModal = lazy(() => import('./PurchaseOrderImportModal').then(module => ({ default: module.PurchaseOrderImportModal })));
const PurchaseOrderDetailModal = lazy(() => import('./PurchaseOrderDetailModal').then(module => ({ default: module.PurchaseOrderDetailModal })));
const PurchaseInvoicePreview = lazy(() => import('./PurchaseInvoicePreview').then(module => ({ default: module.PurchaseInvoicePreview })));
const PurchaseInventoryPreview = lazy(() => import('./PurchaseInventoryPreview').then(module => ({ default: module.PurchaseInventoryPreview })));

interface GroupedTransaction {
  poNumber: string;
  transactions: any[];
  totalAmount: number;
  itemCount: number;
  isImported: boolean;
  supplierName: string;
  clientPO?: string;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'partial':
      return 'secondary';
    case 'incomplete':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPaymentStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'default';
    case 'partial':
      return 'secondary';
    case 'unpaid':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const PurchaseOrdersTabEnhanced: React.FC = () => {
  const { 
    purchaseOrders, 
    loading, 
    error, 
    createPurchaseOrder, 
    getPurchaseOrderWithDetails,
    markPurchaseOrderAsPaid,
    deletePurchaseOrder,
    refetch 
  } = usePurchaseOrdersEnhanced();

  // Fetch inventory purchases separately
  const { 
    data: inventoryPurchases = [], 
    isLoading: inventoryLoading, 
    error: inventoryError,
    refetch: refetchInventory 
  } = useQuery({
    queryKey: ['inventoryPurchases'],
    queryFn: () => inventoryPurchaseService.getAllInventoryPurchases(),
  });

  // Search and filter state
  const { searchQuery, setSearchQuery } = useSearchState();
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [previewPO, setPreviewPO] = useState<any | null>(null);
  const [previewInventory, setPreviewInventory] = useState<any | null>(null);
  const [populateLoading, setPopulateLoading] = useState(false);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([]);
  const [markAsPaidModal, setMarkAsPaidModal] = useState<{ isOpen: boolean; purchaseOrder: any | null }>({
    isOpen: false,
    purchaseOrder: null
  });
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  // Filter purchase orders by type - all purchase orders are client orders
  const clientPurchaseOrders = purchaseOrders; // All purchase orders in this table are client orders
  
  // Transform inventory purchases to match the display format
  const transformedInventoryPurchases = inventoryPurchases.map(purchase => ({
    id: purchase.id,
    supplier_name: purchase.supplier_name,
    client_po: purchase.reference_number,
    status: purchase.status || 'pending',
    payment_status: 'unpaid', // Default for inventory purchases
    notes: purchase.notes,
    created_at: purchase.created_at,
    total_amount: purchase.total_amount || 0
  }));

  // Filter and search logic for client POs
  const filteredAndSearchedClientPOs = clientPurchaseOrders.filter(po => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchableFields = [
        po.supplier_name,
        po.client_po,
        po.notes
      ].filter(Boolean);
      
      const matchesSearch = searchableFields.some(field => 
        field?.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;

    // Payment filter
    if (paymentFilter !== 'all' && po.payment_status !== paymentFilter) return false;

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const poDate = new Date(po.created_at);
      const daysDiff = Math.floor((today.getTime() - poDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'last7' && daysDiff > 7) return false;
      if (dateFilter === 'last30' && daysDiff > 30) return false;
      if (dateFilter === 'thisMonth' && poDate.getMonth() !== today.getMonth()) return false;
    }

    return true;
  });

  // Filter and search logic for inventory POs
  const filteredAndSearchedInventoryPOs = transformedInventoryPurchases.filter(po => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchableFields = [
        po.supplier_name,
        po.client_po,
        po.notes
      ].filter(Boolean);
      
      const matchesSearch = searchableFields.some(field => 
        field?.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;

    // Payment filter
    if (paymentFilter !== 'all' && po.payment_status !== paymentFilter) return false;

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const poDate = new Date(po.created_at);
      const daysDiff = Math.floor((today.getTime() - poDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'last7' && daysDiff > 7) return false;
      if (dateFilter === 'last30' && daysDiff > 30) return false;
      if (dateFilter === 'thisMonth' && poDate.getMonth() !== today.getMonth()) return false;
    }

    return true;
  });

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
  };

  const activeFiltersCount = [statusFilter, paymentFilter, dateFilter].filter(f => f !== 'all').length + (searchQuery ? 1 : 0);

  const handleViewDetails = (id: string) => {
    setSelectedPOId(id);
    setLastSearchQuery(searchQuery);
  };

  const handlePopulatePurchaseOrders = async () => {
    setPopulateLoading(true);
    try {
      const transactions = await transactionService.getAllTransactions();
      const purchaseTransactions = transactions.filter(t => 
        t.purchase_order_number && 
        t.purchase_order_number.trim() !== ''
      );

      if (purchaseTransactions.length === 0) {
        toast.info('No purchase transactions with PO numbers found');
        setPopulateLoading(false);
        return;
      }

      const grouped = purchaseTransactions.reduce((acc, transaction) => {
        const poNumber = transaction.purchase_order_number!;
        if (!acc[poNumber]) {
          acc[poNumber] = [];
        }
        acc[poNumber].push(transaction);
        return acc;
      }, {} as Record<string, typeof purchaseTransactions>);

      const existingClientPOs = purchaseOrders.map(po => po.client_po).filter(Boolean);
      
      const groupedForModal = Object.entries(grouped).map(([poNumber, transactions]) => {
        const totalAmount = transactions.reduce((sum, t) => sum + (t.total_price || 0), 0);
        const supplierName = transactions[0].customer || poNumber;
        const clientPO = poNumber;
        const isImported = existingClientPOs.includes(clientPO);
        return {
          poNumber,
          transactions,
          totalAmount,
          itemCount: transactions.length,
          isImported,
          supplierName,
          clientPO
        };
      });

      setGroupedTransactions(groupedForModal);
      setShowImportModal(true);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      toast.error('Failed to fetch transaction data');
    } finally {
      setPopulateLoading(false);
    }
  };

  const handleImportPurchaseOrders = async (selectedPONumbers: string[]) => {
    try {
      let createdCount = 0;
      
      for (const poNumber of selectedPONumbers) {
        const group = groupedTransactions.find(g => g.poNumber === poNumber);
        if (!group || group.isImported) continue;

        const items = group.transactions
          .filter(t => t.model && t.quantity > 0 && t.unit_price > 0)
          .map(t => ({
            product_id: t.product_id || null,
            model: t.model,
            quantity: parseInt(t.quantity.toString()) || 1,
            unit_price: parseFloat(t.unit_price.toString()) || 0
          }));

        console.log(`Creating PO for ${poNumber} with items:`, items);

        if (items.length === 0) {
          console.warn(`Skipping PO ${poNumber} - no valid items found`);
          toast.warning(`Skipped PO ${poNumber} - no valid items found`);
          continue;
        }

        try {
          await createPurchaseOrder({
            supplier_name: group.supplierName,
            status: 'pending', // Changed from 'completed' to 'pending'
            payment_status: 'unpaid',
            notes: `Imported from transaction records (PO: ${group.clientPO})`,
            client_po: group.clientPO,
            items
          });
          createdCount++;
        } catch (error) {
          console.error(`Failed to create PO for ${poNumber}:`, error);
          toast.error(`Failed to import PO: ${poNumber}`);
        }
      }

      if (createdCount > 0) {
        toast.success(`Successfully imported ${createdCount} purchase order(s)`);
        refetch();
        setShowImportModal(false);
      }
    } catch (error) {
      console.error('Error importing purchase orders:', error);
      toast.error('Failed to import purchase orders');
    }
  };

  const handlePreviewInvoice = async (id: string) => {
    try {
      const poDetails = await getPurchaseOrderWithDetails(id);
      if (poDetails) {
        setPreviewPO(poDetails);
      } else {
        toast.error('Purchase order not found');
      }
    } catch (error) {
      console.error('Error fetching PO details for preview:', error);
      toast.error('Failed to load purchase order details');
    }
  };

  const handlePreviewInventory = async (id: string) => {
    try {
      const inventoryPurchase = await inventoryPurchaseService.getInventoryPurchaseById(id);
      if (inventoryPurchase) {
        setPreviewInventory(inventoryPurchase);
      } else {
        toast.error('Inventory purchase not found');
      }
    } catch (error) {
      console.error('Error fetching inventory purchase details for preview:', error);
      toast.error('Failed to load inventory purchase details');
    }
  };

  const handleMarkAsPaid = (purchaseOrder: any) => {
    console.log('Mark as Paid clicked with purchase order:', purchaseOrder);
    setMarkAsPaidModal({ 
      isOpen: true, 
      purchaseOrder: {
        ...purchaseOrder,
        total_amount: Number(purchaseOrder.total_amount) || 0
      } 
    });
  };


  const handleConfirmMarkAsPaid = async (saleInvoiceNumber: string) => {
    if (!markAsPaidModal.purchaseOrder) return;
    
    await markPurchaseOrderAsPaid(
      markAsPaidModal.purchaseOrder.id, 
      saleInvoiceNumber,
      markAsPaidModal.purchaseOrder.total_amount
    );
    setMarkAsPaidModal({ isOpen: false, purchaseOrder: null });
  };

  const handleDeletePurchaseOrder = async (id: string, supplierName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the purchase order for ${supplierName}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deletePurchaseOrder(id);
      toast.success('Purchase order deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error('Failed to delete purchase order');
    }
  };

  if (loading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (error || inventoryError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Error loading purchase orders: {error || (inventoryError instanceof Error ? inventoryError.message : inventoryError)}</p>
        </div>
      </div>
    );
  }


  // Filter options for the search header
  const clientStatusOptions = [
    { value: 'pending', label: 'Pending', count: clientPurchaseOrders.filter(po => po.status === 'pending').length },
    { value: 'partial', label: 'Partial (≤70%)', count: clientPurchaseOrders.filter(po => po.status === 'partial').length },
    { value: 'incomplete', label: 'Incomplete (71-80%)', count: clientPurchaseOrders.filter(po => po.status === 'incomplete').length },
    { value: 'completed', label: 'Completed', count: clientPurchaseOrders.filter(po => po.status === 'completed').length }
  ];

  const clientPaymentOptions = [
    { value: 'paid', label: 'Paid', count: clientPurchaseOrders.filter(po => po.payment_status === 'paid').length },
    { value: 'unpaid', label: 'Unpaid', count: clientPurchaseOrders.filter(po => po.payment_status === 'unpaid').length },
    { value: 'partial', label: 'Partial', count: clientPurchaseOrders.filter(po => po.payment_status === 'partial').length }
  ];

  const inventoryStatusOptions = [
    { value: 'pending', label: 'Pending', count: transformedInventoryPurchases.filter(po => po.status === 'pending').length },
    { value: 'partial', label: 'Partial (≤70%)', count: transformedInventoryPurchases.filter(po => po.status === 'partial').length },
    { value: 'incomplete', label: 'Incomplete (71-80%)', count: transformedInventoryPurchases.filter(po => po.status === 'incomplete').length },
    { value: 'completed', label: 'Completed', count: transformedInventoryPurchases.filter(po => po.status === 'completed').length }
  ];

  const inventoryPaymentOptions = [
    { value: 'paid', label: 'Paid', count: transformedInventoryPurchases.filter(po => po.payment_status === 'paid').length },
    { value: 'unpaid', label: 'Unpaid', count: transformedInventoryPurchases.filter(po => po.payment_status === 'unpaid').length },
    { value: 'partial', label: 'Partial', count: transformedInventoryPurchases.filter(po => po.payment_status === 'partial').length }
  ];

  const dateOptions = [
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last30', label: 'Last 30 days' },
    { value: 'thisMonth', label: 'This month' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Client Orders</p>
                <p className="text-xl font-bold">{clientPurchaseOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Warehouse className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Inventory Orders</p>
                <p className="text-xl font-bold">{transformedInventoryPurchases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-green-600">{purchaseOrders.filter(po => po.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{purchaseOrders.filter(po => po.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Orders Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client Purchase Orders
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Inventory Purchase
              </TabsTrigger>
            </TabsList>

            {/* Client Purchase Orders Tab */}
            <TabsContent value="client" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Client Purchase Orders</h3>
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Client Purchase Order
                </Button>
              </div>

              {/* Search and Filter Header for Client POs */}
              <SearchAndFilterHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                  {
                    label: 'Status',
                    key: 'status',
                    options: clientStatusOptions,
                    value: statusFilter,
                    onChange: setStatusFilter
                  },
                  {
                    label: 'Payment',
                    key: 'payment',
                    options: clientPaymentOptions,
                    value: paymentFilter,
                    onChange: setPaymentFilter
                  },
                  {
                    label: 'Date',
                    key: 'date',
                    options: dateOptions,
                    value: dateFilter,
                    onChange: setDateFilter
                  }
                ]}
                activeFiltersCount={activeFiltersCount}
                onClearFilters={clearFilters}
                placeholder="Search suppliers, client PO, notes..."
              />

              {/* Results count for Client POs */}
              {(searchQuery || activeFiltersCount > 0) && (
                <div className="text-sm text-gray-600">
                  Showing {filteredAndSearchedClientPOs.length} of {clientPurchaseOrders.length} client purchase orders
                </div>
              )}

              <PurchaseOrderTable 
                orders={filteredAndSearchedClientPOs} 
                onViewDetails={handleViewDetails}
                onPreviewInvoice={handlePreviewInvoice}
                showEmptyState={filteredAndSearchedClientPOs.length === 0}
                isFiltered={Boolean(searchQuery) || activeFiltersCount > 0}
              />
            </TabsContent>

            {/* Inventory Purchase Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Inventory Purchase Orders</h3>
                <Button onClick={() => setShowCreateInventoryModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Inventory Purchase
                </Button>
              </div>

              {/* Search and Filter Header for Inventory POs */}
              <SearchAndFilterHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                  {
                    label: 'Status',
                    key: 'status',
                    options: inventoryStatusOptions,
                    value: statusFilter,
                    onChange: setStatusFilter
                  },
                  {
                    label: 'Payment',
                    key: 'payment',
                    options: inventoryPaymentOptions,
                    value: paymentFilter,
                    onChange: setPaymentFilter
                  },
                  {
                    label: 'Date',
                    key: 'date',
                    options: dateOptions,
                    value: dateFilter,
                    onChange: setDateFilter
                  }
                ]}
                activeFiltersCount={activeFiltersCount}
                onClearFilters={clearFilters}
                placeholder="Search suppliers, client PO, notes..."
              />

              {/* Results count for Inventory POs */}
              {(searchQuery || activeFiltersCount > 0) && (
                <div className="text-sm text-gray-600">
                  Showing {filteredAndSearchedInventoryPOs.length} of {transformedInventoryPurchases.length} inventory purchase orders
                </div>
              )}

              <PurchaseOrderTable 
                orders={filteredAndSearchedInventoryPOs} 
                onViewDetails={handleViewDetails}
                onPreviewInvoice={handlePreviewInventory}
                showEmptyState={filteredAndSearchedInventoryPOs.length === 0}
                isFiltered={Boolean(searchQuery) || activeFiltersCount > 0}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <CreatePurchaseOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {showCreateInventoryModal && (
        <CreateInventoryPurchaseModal
          onClose={() => setShowCreateInventoryModal(false)}
          onSuccess={() => {
            setShowCreateInventoryModal(false);
            refetchInventory();
          }}
        />
      )}
      
      <Suspense fallback={null}>
        {showImportModal && (
          <PurchaseOrderImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            groupedTransactions={groupedTransactions}
            onImport={handleImportPurchaseOrders}
            isLoading={populateLoading}
          />
        )}
        {selectedPOId && (
          <PurchaseOrderDetailModal
            purchaseOrderId={selectedPOId}
            onClose={() => setSelectedPOId(null)}
            isNewSearch={searchQuery !== lastSearchQuery}
          />
        )}
        {previewInventory && (
          <PurchaseInventoryPreview
            isOpen={!!previewInventory}
            onClose={() => setPreviewInventory(null)}
            purchaseOrder={previewInventory}
          />
        )}
        {previewPO && (
          <PurchaseInvoicePreview
            isOpen={!!previewPO}
            onClose={() => setPreviewPO(null)}
            purchaseOrder={previewPO}
          />
        )}
      </Suspense>

      {/* Mark as Paid Modal */}
      <MarkAsPaidModal
        isOpen={markAsPaidModal.isOpen}
        onClose={() => setMarkAsPaidModal({ isOpen: false, purchaseOrder: null })}
        onConfirm={async (paymentData) => {
          try {
            await markPurchaseOrderAsPaid(
              markAsPaidModal.purchaseOrder?.id || '',
              paymentData.invoices[0]?.invoiceNumber || '',
              paymentData.totalAmount
            );
            refetch();
          } catch (error) {
            console.error('Error marking as paid:', error);
          }
        }}
        purchaseOrderId={markAsPaidModal.purchaseOrder?.id || ''}
        supplierName={markAsPaidModal.purchaseOrder?.supplier_name}
        totalAmount={markAsPaidModal.purchaseOrder?.total_amount || 0}
        isLoading={loading}
      />
    </div>
  );
};

interface PurchaseOrderTableProps {
  orders: any[];
  onViewDetails: (id: string) => void;
  onPreviewInvoice?: (id: string) => void;
  showEmptyState?: boolean;
  isFiltered?: boolean;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ 
  orders, 
  onViewDetails, 
  onPreviewInvoice,
  showEmptyState = false,
  isFiltered = false
}) => {
  const isMobile = useIsMobile();

  if (showEmptyState) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>
          {isFiltered 
            ? 'No purchase orders match your search criteria' 
            : 'No purchase orders found'
          }
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <Card 
            key={order.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPreviewInvoice && onPreviewInvoice(order.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-foreground">
                      {order.supplier_name || 'N/A'}
                    </h4>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Client PO: {order.client_po || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-muted-foreground text-sm mb-1">
                    <Package size={12} className="mr-1" />
                    {order.date ? new Date(order.date).toLocaleDateString() : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-')}
                  </div>
                  <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)}>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>

              {order.notes && (
                <div className="text-sm text-muted-foreground mb-3 p-2 bg-gray-50 rounded">
                  <span className="font-medium">Notes:</span> {order.notes}
                </div>
              )}

              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-3">
                <div className="flex items-center">
                  <Package size={12} className="mr-1" />
                  Purchase Order
                </div>
                <div className="flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'No date'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Click to preview purchase order
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Supplier</th>
              <th className="px-4 py-3 text-left font-medium">Client PO</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Payment</th>
              <th className="px-4 py-3 text-left font-medium">Notes</th>
              
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onPreviewInvoice && onPreviewInvoice(order.id)}>
                <td className="px-4 py-3">
                  {order.date ? new Date(order.date).toLocaleDateString() : (order.created_at ? new Date(order.created_at).toLocaleDateString() : '-')}
                </td>
                <td className="px-4 py-3 font-medium">
                  {order.supplier_name || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {order.client_po || '-'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {order.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
