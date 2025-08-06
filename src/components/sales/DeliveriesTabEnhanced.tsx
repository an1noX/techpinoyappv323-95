import { useState, Suspense, lazy } from "react";
import { Plus, Truck, Calendar, Package, CheckCircle, Clock, Eye, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDeliveries } from "@/hooks/useDeliveries";
import { usePurchaseOrdersEnhanced } from "@/hooks/usePurchaseOrdersEnhanced";
import { useSearchState } from "@/hooks/useSearch";
import { supabase } from "@/integrations/supabase/client";
import { formatPHP } from "@/utils/currency";
import { useQuery } from '@tanstack/react-query';
import { Delivery } from "@/services/deliveryService";
import { CreateDeliveryModal } from "./CreateDeliveryModal";
import { DeliveryDetailModal } from "./DeliveryDetailModal";
import { SearchAndFilterHeader } from "./SearchAndFilterHeader";

const PurchaseDeliveryPreview = lazy(() => import('./PurchaseDeliveryPreview').then(module => ({ default: module.PurchaseDeliveryPreview })));
import { transactionService } from '@/services/transactionService';
import { deliveryService } from '@/services/deliveryService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export const DeliveriesTabEnhanced = () => {
  // Search and filter state
  const { searchQuery, setSearchQuery } = useSearchState();
  const [statusFilter, setStatusFilter] = useState('all');
  const [poStatusFilter, setPoStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ delivery_receipt_number: string; delivery_date: string }>({ delivery_receipt_number: '', delivery_date: '' });

  const handleEditClick = (delivery: any) => {
    setEditingDeliveryId(delivery.id);
    setEditForm({
      delivery_receipt_number: delivery.delivery_receipt_number || '',
      delivery_date: delivery.delivery_date || '',
    });
  };

  const handleEditCancel = () => {
    setEditingDeliveryId(null);
    setEditForm({ delivery_receipt_number: '', delivery_date: '' });
  };

  const handleEditSave = async (deliveryId: string) => {
    try {
      await deliveryService.updateDelivery(deliveryId, {
        delivery_receipt_number: editForm.delivery_receipt_number,
        delivery_date: editForm.delivery_date,
      });
      toast.success('Delivery updated');
      setEditingDeliveryId(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update delivery');
    }
  };

  const { deliveries, loading, deleteDelivery, refetch } = useDeliveries();
  const { purchaseOrders } = usePurchaseOrdersEnhanced();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [populateLoading, setPopulateLoading] = useState(false);
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [groupedDRs, setGroupedDRs] = useState<any[]>([]);
  const [selectedDRs, setSelectedDRs] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<'numberAsc' | 'numberDesc' | 'dateAsc' | 'dateDesc'>('numberAsc');
  const [previewDelivery, setPreviewDelivery] = useState<any | null>(null);

  // Filter and search logic
  const filteredAndSearchedDeliveries = deliveries.filter(delivery => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchableFields = [
        delivery.delivery_receipt_number,
        delivery.notes,
        delivery.client?.name,
        delivery.purchase_order?.supplier_name,
        delivery.purchase_order?.client_po
      ].filter(Boolean);
      
      const matchesSearch = searchableFields.some(field => 
        field?.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }

    // Status filter (based on delivery date)
    if (statusFilter !== 'all') {
      const today = new Date();
      const deliveryDate = new Date(delivery.delivery_date);
      
      if (statusFilter === 'delivered' && deliveryDate >= today) return false;
      if (statusFilter === 'scheduled' && deliveryDate < today) return false;
      if (statusFilter === 'today' && deliveryDate.toDateString() !== today.toDateString()) return false;
    }

    // PO Status filter
    if (poStatusFilter !== 'all') {
      if (poStatusFilter === 'linked' && !delivery.purchase_order_id) return false;
      if (poStatusFilter === 'unlinked' && delivery.purchase_order_id) return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const deliveryDate = new Date(delivery.delivery_date);
      const daysDiff = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'last7' && daysDiff > 7) return false;
      if (dateFilter === 'last30' && daysDiff > 30) return false;
      if (dateFilter === 'thisMonth' && deliveryDate.getMonth() !== today.getMonth()) return false;
    }

    return true;
  });

  const calculateDeliveryMetrics = () => {
    const today = new Date();
    
    const unlinkedDeliveries = deliveries.filter(d => !d.purchase_order_id).length;
    
    const advanceDeliveries = deliveries.filter(d => {
      const deliveryDate = new Date(d.delivery_date);
      return deliveryDate < today;
    }).length;
    
    const completedDeliveries = deliveries.filter(d => {
      const deliveryDate = new Date(d.delivery_date);
      return deliveryDate <= today && d.purchase_order_id;
    }).length;
    
    const scheduledDeliveries = deliveries.filter(d => {
      const deliveryDate = new Date(d.delivery_date);
      return deliveryDate > today;
    }).length;

    return {
      total: deliveries.length,
      unlinked: unlinkedDeliveries,
      advance: advanceDeliveries,
      completed: completedDeliveries,
      scheduled: scheduledDeliveries
    };
  };

  const getStatusColor = (deliveryDate: string) => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    
    if (delivery.toDateString() === today.toDateString()) {
      return 'bg-blue-100 text-blue-800';
    } else if (delivery < today) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (deliveryDate: string) => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    
    if (delivery.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (delivery < today) {
      return 'Delivered';
    } else {
      return 'Scheduled';
    }
  };

  const getPurchaseOrderInfo = (poId: string) => {
    return purchaseOrders.find(po => po.id === poId);
  };

  // Function to calculate individual delivery total
  const calculateDeliveryTotal = async (delivery: any) => {
    let totalAmount = 0;
    let totalItems = 0;

    if (delivery.delivery_items && delivery.delivery_items.length > 0) {
      for (const item of delivery.delivery_items) {
        totalItems += item.quantity_delivered;
        let price = 0;
        
        // Try to get price from PO first
        if (delivery.purchase_order_id && item.product_id) {
          const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select('unit_price')
            .eq('purchase_order_id', delivery.purchase_order_id)
            .eq('product_id', item.product_id)
            .single();
          
          if (poItems?.unit_price) {
            price = poItems.unit_price;
          }
        }

        // Fallback to product_clients pricing
        if (price === 0 && item.product_id) {
          const clientId = delivery.client?.id || delivery.purchase_order?.supplier_client_id;
          if (clientId) {
            const { data: productClient } = await supabase
              .from('product_clients')
              .select('quoted_price')
              .eq('client_id', clientId)
              .eq('product_id', item.product_id)
              .single();
            
            if (productClient?.quoted_price) {
              price = productClient.quoted_price;
            }
          }
        }

        totalAmount += price * item.quantity_delivered;
      }
    }

    return { totalAmount, totalItems };
  };

  // Hook to get delivery totals for individual deliveries
  const useDeliveryTotal = (delivery: any) => {
    return useQuery({
      queryKey: ['delivery-total', delivery.id],
      queryFn: () => calculateDeliveryTotal(delivery),
      enabled: delivery.delivery_items && delivery.delivery_items.length > 0
    });
  };

  const handleViewDetails = (deliveryId: string) => {
    setSelectedDeliveryId(deliveryId);
    setShowDetailModal(true);
  };

  const handleDelete = async (deliveryId: string) => {
    if (confirm('Are you sure you want to delete this delivery record?')) {
      await deleteDelivery(deliveryId);
    }
  };

  const handlePreviewDelivery = async (delivery: any) => {
    try {
      setPreviewDelivery(delivery);
    } catch (error) {
      console.error('Error setting delivery for preview:', error);
      toast.error('Failed to load delivery for preview');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPoStatusFilter('all');
    setDateFilter('all');
  };

  const activeFiltersCount = [statusFilter, poStatusFilter, dateFilter].filter(f => f !== 'all').length + (searchQuery ? 1 : 0);

  const handlePopulateDeliveries = async () => {
    setPopulateLoading(true);
    try {
      const transactions = await transactionService.getAllTransactions();
      const deliveryTransactions = transactions.filter(t => t.delivery_receipt_number && t.delivery_receipt_number.trim() !== '');
      if (deliveryTransactions.length === 0) {
        toast.info('No transactions with delivery receipt numbers found');
        setPopulateLoading(false);
        return;
      }
      const grouped = deliveryTransactions.reduce((acc, t) => {
        const dr = t.delivery_receipt_number!;
        if (!acc[dr]) acc[dr] = [];
        acc[dr].push(t);
        return acc;
      }, {} as Record<string, typeof deliveryTransactions>);
      const existingDRs = deliveries.map(d => d.delivery_receipt_number).filter(Boolean);
      const drList = Object.entries(grouped)
        .filter(([drNumber]) => !existingDRs.includes(drNumber))
        .map(([drNumber, group]) => {
          const poNumber = group[0].purchase_order_number;
          const po = purchaseOrders.find(po => po.client_po === poNumber || po.supplier_name === group[0].customer);
          return {
            drNumber,
            group,
            po,
            poNumber,
            delivery_date: group.map(t => t.date).sort()[0],
            customer: group[0].customer,
            items: group.filter(t => t.product_id && t.quantity > 0).map(t => ({
              product_id: t.product_id,
              model: t.model,
              quantity: t.quantity
            })),
            hasMatchingPO: !!po
          };
        });
      setGroupedDRs(drList);
      setSelectedDRs(new Set());
      setShowPopulateModal(true);
    } catch (err) {
      console.error('Error populating deliveries:', err);
      toast.error('Failed to fetch delivery groups');
    } finally {
      setPopulateLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedDRs.size === groupedDRs.length) {
      setSelectedDRs(new Set());
    } else {
      setSelectedDRs(new Set(groupedDRs.map(dr => dr.drNumber)));
    }
  };

  const handleSelectDR = (drNumber: string) => {
    const newSelected = new Set(selectedDRs);
    if (newSelected.has(drNumber)) {
      newSelected.delete(drNumber);
    } else {
      newSelected.add(drNumber);
    }
    setSelectedDRs(newSelected);
  };

  const handleImportSelected = async () => {
    setPopulateLoading(true);
    const results = {
      success: [] as string[],
      failed: [] as { dr: string; reason: string }[]
    };
    
    for (const dr of groupedDRs) {
      if (!selectedDRs.has(dr.drNumber)) continue;
      if (!dr.items.length) {
        results.failed.push({ dr: dr.drNumber, reason: 'No valid items found' });
        continue;
      }
      
      try {
        const deliveryData = {
          purchase_order_id: dr.po?.id || null,
          delivery_date: dr.delivery_date,
          delivery_receipt_number: dr.drNumber,
          notes: `Delivery Receipt ${dr.drNumber}${!dr.po ? ' - No matching PO found' : ''}`,
          items: dr.items.map(item => ({ product_id: item.product_id, quantity_delivered: item.quantity }))
        };
        
        await deliveryService.createDelivery(deliveryData);
        results.success.push(dr.drNumber);
      } catch (err) {
        console.error('Failed to create delivery for', dr.drNumber, err);
        results.failed.push({ dr: dr.drNumber, reason: 'Database error' });
      }
    }
    
    if (results.success.length > 0) {
      toast.success(`Successfully imported ${results.success.length} delivery record(s)`);
      refetch();
    }
    if (results.failed.length > 0) {
      const failedList = results.failed.map(f => `${f.dr} (${f.reason})`).join(', ');
      toast.error(`Failed to import: ${failedList}`);
    }
    if (results.success.length === 0 && results.failed.length === 0) {
      toast.info('No deliveries were imported');
    }
    
    setShowPopulateModal(false);
    setPopulateLoading(false);
  };

  const sortedDeliveries = filteredAndSearchedDeliveries.slice().sort((a, b) => {
    const getNum = (val: string | undefined) => {
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    if (sortOption === 'numberAsc' || sortOption === 'numberDesc') {
      if (a.delivery_receipt_number && b.delivery_receipt_number) {
        const numA = getNum(a.delivery_receipt_number);
        const numB = getNum(b.delivery_receipt_number);
        if (numA !== null && numB !== null) {
          return sortOption === 'numberAsc' ? numA - numB : numB - numA;
        }
        return sortOption === 'numberAsc'
          ? a.delivery_receipt_number.localeCompare(b.delivery_receipt_number)
          : b.delivery_receipt_number.localeCompare(a.delivery_receipt_number);
      }
      if (a.delivery_receipt_number) return sortOption === 'numberAsc' ? -1 : 1;
      if (b.delivery_receipt_number) return sortOption === 'numberAsc' ? 1 : -1;
      return sortOption === 'numberAsc'
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id);
    } else {
      const dateA = new Date(a.delivery_date).getTime();
      const dateB = new Date(b.delivery_date).getTime();
      return sortOption === 'dateAsc' ? dateA - dateB : dateB - dateA;
    }
  });

  // Hook to calculate delivery totals with pricing
  const { data: deliveryTotals, isLoading: totalsLoading } = useQuery({
    queryKey: ['delivery-totals', deliveries],
    queryFn: async () => {
      let totalItems = 0;
      let totalAmount = 0;

      for (const delivery of deliveries) {
        if (delivery.delivery_items && delivery.delivery_items.length > 0) {
          for (const item of delivery.delivery_items) {
            totalItems += item.quantity_delivered;

            // Try to get price from PO first, then fallback to product_clients
            let price = 0;
            
            if (delivery.purchase_order && item.product_id) {
              // Get price from purchase order items if available
              const { data: poItems } = await supabase
                .from('purchase_order_items')
                .select('unit_price')
                .eq('purchase_order_id', delivery.purchase_order_id)
                .eq('product_id', item.product_id)
                .single();
              
              if (poItems?.unit_price) {
                price = poItems.unit_price;
              }
            }

            // Fallback to product_clients pricing
            if (price === 0 && item.product_id) {
              const clientId = delivery.client?.id || delivery.purchase_order?.supplier_client_id;
              if (clientId) {
                const { data: productClient } = await supabase
                  .from('product_clients')
                  .select('quoted_price')
                  .eq('client_id', clientId)
                  .eq('product_id', item.product_id)
                  .single();
                
                if (productClient?.quoted_price) {
                  price = productClient.quoted_price;
                }
              }
            }

            totalAmount += price * item.quantity_delivered;
          }
        }
      }

      return { totalItems, totalAmount };
    },
    enabled: deliveries.length > 0
  });

  const metrics = calculateDeliveryMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading deliveries...</div>;
  }

  // Filter options for the search header
  const statusOptions = [
    { value: 'delivered', label: 'Delivered', count: metrics.completed },
    { value: 'scheduled', label: 'Scheduled', count: metrics.scheduled },
    { value: 'today', label: 'Today', count: deliveries.filter(d => new Date(d.delivery_date).toDateString() === new Date().toDateString()).length }
  ];

  const poStatusOptions = [
    { value: 'linked', label: 'Linked to PO', count: deliveries.filter(d => d.purchase_order_id).length },
    { value: 'unlinked', label: 'Unlinked', count: metrics.unlinked }
  ];

  const dateOptions = [
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last30', label: 'Last 30 days' },
    { value: 'thisMonth', label: 'This month' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Delivery Management</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} className="mr-1" />
            Record Delivery
          </Button>
        </div>
      </div>

      {/* Search and Filter Header */}
      <SearchAndFilterHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: 'Status',
            key: 'status',
            options: statusOptions,
            value: statusFilter,
            onChange: setStatusFilter
          },
          {
            label: 'PO Status',
            key: 'poStatus',
            options: poStatusOptions,
            value: poStatusFilter,
            onChange: setPoStatusFilter
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
        placeholder="Search deliveries, suppliers, DR numbers..."
      />

      {/* Delivery Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total Deliveries</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.unlinked}</div>
            <div className="text-sm text-gray-500 mt-1">Unlinked Deliveries</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
            <div className="text-sm text-gray-500 mt-1">Completed Deliveries</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{metrics.scheduled}</div>
            <div className="text-sm text-gray-500 mt-1">Scheduled Deliveries</div>
          </CardContent>
        </Card>
      </div>


      {/* Results count */}
      {(searchQuery || activeFiltersCount > 0) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {sortedDeliveries.length} of {deliveries.length} deliveries
        </div>
      )}

      {sortedDeliveries.length === 0 ? (
        <div className="text-center py-8">
          <Truck size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {searchQuery || activeFiltersCount > 0 ? 'No deliveries match your search criteria' : 'No deliveries recorded yet'}
          </p>
          {!searchQuery && activeFiltersCount === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              Record Your First Delivery
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDeliveries.map((delivery) => {
            const poInfo = delivery.purchase_order_id ? getPurchaseOrderInfo(delivery.purchase_order_id) : null;
            const typedDelivery = delivery as Delivery;
            
            // Component to display individual delivery pricing
            const DeliveryPricing = ({ delivery }: { delivery: any }) => {
              const { data: deliveryTotal, isLoading } = useDeliveryTotal(delivery);
              
              if (!delivery.delivery_items || delivery.delivery_items.length === 0) {
                return null;
              }
              
              return (
                <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                  {isLoading ? (
                    <span className="text-gray-500">Calculating price...</span>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">
                        {deliveryTotal?.totalItems || 0} items
                      </span>
                      <span className="text-blue-700 font-bold">
                        {formatPHP(deliveryTotal?.totalAmount || 0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            };
            
            return (
              <Card 
                key={delivery.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePreviewDelivery(delivery)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {editingDeliveryId === delivery.id ? (
                          <>
                            <input
                              type="text"
                              value={editForm.delivery_receipt_number}
                              onChange={e => setEditForm(f => ({ ...f, delivery_receipt_number: e.target.value }))}
                              className="border rounded px-2 py-1 w-32"
                              placeholder="Delivery Number"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              type="date"
                              value={editForm.delivery_date}
                              onChange={e => setEditForm(f => ({ ...f, delivery_date: e.target.value }))}
                              className="border rounded px-2 py-1 w-36"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSave(delivery.id);
                              }} 
                              className="ml-2"
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCancel();
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <h4 className="font-medium">
                              {delivery.delivery_receipt_number || `Delivery #${delivery.id.slice(0, 8)}`}
                            </h4>
                            <Badge className={getStatusColor(delivery.delivery_date)}>
                              {getStatusText(delivery.delivery_date)}
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {typedDelivery.client?.name && (
                          <span>Client: {typedDelivery.client.name}</span>
                        )}
                        {poInfo && (
                          <span className={typedDelivery.client?.name ? "ml-3" : ""}>
                            PO: {poInfo.supplier_name || 'Unknown Supplier'}
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              {poInfo.status}
                            </span>
                          </span>
                        )}
                        {!typedDelivery.client?.name && !poInfo && (
                          <span className="text-gray-400">No client/supplier information</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar size={12} className="mr-1" />
                        {new Date(delivery.delivery_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {delivery.notes && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {delivery.notes}
                    </div>
                  )}

                  {/* Display pricing information for this delivery */}
                  <DeliveryPricing delivery={delivery} />

                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Package size={12} className="mr-1" />
                        Delivery Record
                      </div>
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(delivery.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Click to preview delivery
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateDeliveryModal onClose={() => setShowCreateModal(false)} />
      )}

      {showDetailModal && selectedDeliveryId && (
        <DeliveryDetailModal 
          deliveryId={selectedDeliveryId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDeliveryId(null);
          }}
        />
      )}

      <Suspense fallback={null}>
        {previewDelivery && (
          <PurchaseDeliveryPreview
            isOpen={!!previewDelivery}
            onClose={() => setPreviewDelivery(null)}
            delivery={previewDelivery}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
          />
        )}
      </Suspense>

      {showPopulateModal && (
        <Dialog open={showPopulateModal} onOpenChange={setShowPopulateModal}>
          <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Deliveries from Transaction Records</DialogTitle>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Available: {groupedDRs.length}</span>
                <span>Selected: {selectedDRs.size}</span>
              </div>
            </DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={selectedDRs.size === groupedDRs.length && groupedDRs.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={groupedDRs.length === 0}
              />
              <span className="text-sm font-medium">Select All</span>
              <Button
                onClick={handleImportSelected}
                disabled={selectedDRs.size === 0 || populateLoading}
                className="ml-auto"
              >
                {populateLoading ? 'Importing...' : `Import Selected (${selectedDRs.size})`}
              </Button>
            </div>
            <div className="space-y-2">
              {groupedDRs.map(dr => (
                <div key={dr.drNumber} className="border rounded-lg p-3 flex gap-3 items-start">
                  <Checkbox
                    checked={selectedDRs.has(dr.drNumber)}
                    onCheckedChange={() => handleSelectDR(dr.drNumber)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">DR: {dr.drNumber}</span>
                      <span className="text-xs text-muted-foreground">{dr.customer}</span>
                      <span className="text-xs text-muted-foreground">{dr.delivery_date}</span>
                      {!dr.hasMatchingPO && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          No PO
                        </span>
                      )}
                    </div>
                    {dr.poNumber && (
                      <div className="text-xs text-muted-foreground">
                        PO Number: {dr.poNumber}
                      </div>
                    )}
                    {dr.po && (
                      <div className="text-xs text-muted-foreground">
                        PO: {dr.po.supplier_name || dr.po.client_po}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Items:</div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {dr.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.model}</span>
                          <span>{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
