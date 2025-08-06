import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { salesInvoiceService } from '@/services/salesInvoiceService';
import { calculatePOFulfillmentStatus } from '@/transactions/utils/poStatusCalculation';
import { calculateTaxes } from '@/utils/taxCalculation';
import { PODetailModal } from "@/transactions/components/PODetailModal";
import { useDeliveries } from "@/hooks/useDeliveries";
import { usePurchaseOrderDetails } from "@/hooks/usePurchaseOrderDetails";
import { PurchaseOrdersTable } from "@/components/sales/PurchaseOrdersTable";
interface PurchaseOrdersPageProps {
  isEditMode?: boolean;
  setIsEditMode?: (value: boolean) => void;
  onPendingChanges?: (changes: any[]) => void;
}

export default function PurchaseOrdersPage({ 
  isEditMode: externalEditMode, 
  setIsEditMode: externalSetIsEditMode,
  onPendingChanges
}: PurchaseOrdersPageProps = {}) {
  const [salesInvoicePaymentCache, setSalesInvoicePaymentCache] = useState<Record<string, string>>({});
  const [internalEditMode, setInternalEditMode] = useState(false);
  
  // Use external edit mode if provided, otherwise use internal
  const isEditMode = externalEditMode !== undefined ? externalEditMode : internalEditMode;
  const setIsEditMode = externalSetIsEditMode || setInternalEditMode;
  const {
    toast
  } = useToast();
  const {
    deliveries
  } = useDeliveries();
  const {
    data: purchaseOrders = [],
    isLoading: poLoading
  } = usePurchaseOrderDetails();
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredPOs, setFilteredPOs] = useState<{
    [key: string]: any[];
  }>({});

  // Filter state
  const [filters, setFilters] = useState({
    poNumber: 'all',
    supplier: 'all',
    status: 'all',
    dateRange: 'all',
    drNumber: 'all',
    siNumber: 'all',
    selectedMonth: null as {
      month: number;
      year: number;
    } | null
  });

  // Search and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  // Modal states - exactly as in TransactionRecord.tsx
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');
  const [poDetailOpen, setPODetailOpen] = useState(false);

  // Refresh function for table component - Use React Query for targeted updates
  const handleDataChange = () => {
    // This will trigger a refresh of the PurchaseOrdersTable component only
    window.dispatchEvent(new CustomEvent('invalidate-purchase-orders'));
  };

  // Helper function to group purchase orders by Client PO number
  const groupPurchaseOrdersByPONumber = (purchaseOrders: any[]) => {
    const grouped: { [key: string]: any[]; } = {};
    purchaseOrders.forEach(po => {
      const poNumber = po.client_po || 'No PO#';
      if (!grouped[poNumber]) {
        grouped[poNumber] = [];
      }
      grouped[poNumber].push(po);
    });
    return grouped;
  };

  // Calculate unified status based on fulfillment and payment status
  const calculateUnifiedStatus = (po: any, fulfillmentStatus: string) => {
    if (fulfillmentStatus === 'partial') {
      return 'partial';
    }
    if (fulfillmentStatus === 'pending') {
      return 'pending';
    }

    // All items fulfilled (completed) - use sales invoice payment status
    if (fulfillmentStatus === 'completed') {
      // Check if we have cached payment status from sales invoices
      const cachedStatus = salesInvoicePaymentCache[po.id];
      if (cachedStatus) {
        // Map overpaid to paid for display purposes in table
        return cachedStatus === 'overpaid' ? 'paid' : cachedStatus;
      }
      
      // Fallback to original payment_status field if not in cache
      const paymentStatus = po.payment_status || 'unpaid';
      return paymentStatus === 'paid' ? 'paid' : paymentStatus === 'partial' ? 'partial' : 'unpaid';
    }
    return 'pending';
  };

  // Apply filters function
  const applyFilters = useCallback(() => {
    const groupedPOs = groupPurchaseOrdersByPONumber(purchaseOrders);
    let filtered: { [key: string]: any[]; } = {};
    Object.keys(groupedPOs).forEach(poNumber => {
      const poGroup = groupedPOs[poNumber];
      const firstPO = poGroup[0];

      // Calculate fulfillment status
      const fulfillmentStatus = calculatePOFulfillmentStatus(firstPO, fulfillments);

      // Apply filters
      let shouldInclude = true;
      if (filters.poNumber !== 'all') {
        shouldInclude = shouldInclude && poNumber.toLowerCase().includes(filters.poNumber.toLowerCase());
      }
      if (filters.supplier !== 'all') {
        shouldInclude = shouldInclude && firstPO.supplier_name?.toLowerCase().includes(filters.supplier.toLowerCase());
      }
      if (filters.status !== 'all') {
        // Calculate unified status for filtering
        const unifiedStatus = calculateUnifiedStatus(firstPO, fulfillmentStatus);
        shouldInclude = shouldInclude && unifiedStatus.toLowerCase() === filters.status.toLowerCase();
      }
      if (filters.dateRange !== 'all') {
        let startDate: Date;
        let endDate: Date;
        const now = new Date();
        switch (filters.dateRange) {
          case 'current-month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
          case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            break;
          case 'last-3-months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
          default:
            startDate = new Date(0);
            endDate = new Date();
        }
        const poDate = new Date(firstPO.created_at);
        shouldInclude = shouldInclude && poDate >= startDate && poDate <= endDate;
      }
      if (filters.selectedMonth) {
        const { month, year } = filters.selectedMonth;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);
        const poDate = new Date(firstPO.created_at);
        shouldInclude = shouldInclude && poDate >= startDate && poDate <= endDate;
      }
      if (filters.drNumber !== 'all') {
        const drNumbers = deliveries.filter(d => d.purchase_order_id === firstPO.id)
          .map(d => d.delivery_receipt_number).filter(Boolean);
        shouldInclude = shouldInclude && drNumbers.includes(filters.drNumber);
      }
      if (filters.siNumber !== 'all') {
        // For now, skip SI filtering since it requires additional data
        shouldInclude = shouldInclude;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        shouldInclude = shouldInclude && (
          poNumber.toLowerCase().includes(query) ||
          firstPO.supplier_name?.toLowerCase().includes(query) ||
          firstPO.client_po?.toLowerCase().includes(query)
        );
      }
      if (shouldInclude) {
        filtered[poNumber] = poGroup;
      }
    });
    setFilteredPOs(filtered);
  }, [purchaseOrders, filters, fulfillments, calculateUnifiedStatus]);

  useEffect(() => {
    loadFulfillments();
  }, []);

  // Apply filters when purchase orders or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Initialize filteredPOs when data first loads
  useEffect(() => {
    if (purchaseOrders.length > 0 && Object.keys(filteredPOs).length === 0) {
      applyFilters();
    }
  }, [purchaseOrders, applyFilters, filteredPOs]);

  // Calculate payment status from sales invoices
  const calculatePaymentStatusFromSalesInvoices = async (purchaseOrderId: string, taxCalculatedTotal: number): Promise<string> => {
    // Check cache first
    if (salesInvoicePaymentCache[purchaseOrderId]) {
      return salesInvoicePaymentCache[purchaseOrderId];
    }

    try {
      const invoices = await salesInvoiceService.getInvoicesForPurchaseOrder(purchaseOrderId);
      const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
      
      let status = 'unpaid';
      if (totalPaid >= taxCalculatedTotal && taxCalculatedTotal > 0) {
        status = totalPaid > taxCalculatedTotal ? 'overpaid' : 'paid';
      } else if (totalPaid > 0 && totalPaid < taxCalculatedTotal) {
        status = 'partial';
      }
      
      // Update cache
      setSalesInvoicePaymentCache(prev => ({
        ...prev,
        [purchaseOrderId]: status
      }));
      
      return status;
    } catch (error) {
      console.error('Error calculating payment status from sales invoices:', error);
      return 'unpaid'; // Fallback
    }
  };

  // Calculate tax-adjusted total for a purchase order (same logic as PaymentDetailsModal)
  const calculateTaxAdjustedTotal = async (po: any): Promise<number> => {
    try {
      // Get purchase order items with pricing data to match PaymentDetailsModal logic
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
        .eq('id', po.id)
        .single();

      if (poError) throw poError;

      // Calculate original subtotal from items (same logic as PaymentDetailsModal)
      let originalSubtotal = 0;
      if (poData?.purchase_order_items) {
        // Get pricing data for each item (same logic as PaymentDetailsModal)
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

        // Calculate subtotal using the same logic as PaymentDetailsModal
        originalSubtotal = itemsWithPricing.reduce((sum: number, item: any) => {
          const unitPrice = item.unit_price || item.client_product_pricing?.quoted_price || 0;
          return sum + (unitPrice * item.quantity);
        }, 0);
      }

      // Get client tax information
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('tax, wht')
        .eq('id', po.supplier_client_id)
        .single();

      if (clientError || !clientData || originalSubtotal === 0) {
        return po.total_amount || 0; // Return original if no tax info or items
      }

      // Use the shared tax calculation utility (same as PaymentDetailsModal)
      const taxCalculation = calculateTaxes({
        subtotal: originalSubtotal,
        clientTaxInfo: {
          tax: clientData.tax || '12',
          wht: clientData.wht || '0'
        },
        discount: 0, // No discount information available in current data
        withholdingTaxEnabled: false,
        withholdingTaxRate: 0
      });
      
      return taxCalculation.totalAmountDue;
    } catch (error) {
      console.error('Error calculating tax-adjusted total:', error);
      return po.total_amount || 0;
    }
  };

  useEffect(() => {
    const loadPaymentStatuses = async () => {
      const groupedPOs = groupPurchaseOrdersByPONumber(purchaseOrders);
      const updates: Record<string, string> = {};
      
      for (const poNumber of Object.keys(groupedPOs)) {
        const poGroup = groupedPOs[poNumber];
        const firstPO = poGroup[0];
        
        if (firstPO && firstPO.id) {
          // Use after_tax field from database if available, otherwise calculate
          const taxAdjustedTotal = firstPO.after_tax || await calculateTaxAdjustedTotal(firstPO);
          const paymentStatus = await calculatePaymentStatusFromSalesInvoices(firstPO.id, taxAdjustedTotal);
          updates[firstPO.id] = paymentStatus;
        }
      }
      
      setSalesInvoicePaymentCache(prev => ({ ...prev, ...updates }));
    };

    if (purchaseOrders.length > 0) {
      loadPaymentStatuses();
    }
  }, [purchaseOrders]);

  // Load fulfillments data - extracted from TransactionRecord.tsx
  const loadFulfillments = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('fulfillments').select('*');
      if (error) throw error;
      setFulfillments(data || []);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
      toast({
        title: "Error loading fulfillments",
        description: "Failed to load fulfillment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  // Clear filters
  const clearFilters = () => {
    setFilters({
      poNumber: 'all',
      supplier: 'all',
      status: 'all',
      dateRange: 'all',
      drNumber: 'all',
      siNumber: 'all',
      selectedMonth: null
    });
    setSearchQuery('');
    setSortConfig(null);
  };

  // Check if filters are active
  const hasActiveFilters = () => {
    return filters.poNumber !== 'all' || filters.supplier !== 'all' || filters.status !== 'all' || 
           filters.dateRange !== 'all' || filters.drNumber !== 'all' || filters.siNumber !== 'all' ||
           filters.selectedMonth !== null || searchQuery.trim() !== '';
  };

  // Helper function to group purchase orders by Client PO number - exactly as in TransactionRecord.tsx
  const groupPurchaseOrdersByPONumberForUnique = (purchaseOrders: any[]) => {
    const grouped: {
      [key: string]: any[];
    } = {};
    purchaseOrders.forEach(po => {
      const poNumber = po.client_po || 'No PO#';
      if (!grouped[poNumber]) {
        grouped[poNumber] = [];
      }
      grouped[poNumber].push(po);
    });
    return grouped;
  };
  // Get unique values for filters
  const getUniqueSuppliers = () => {
    const suppliers = new Set<string>();
    purchaseOrders.forEach(po => {
      if (po.supplier_name) {
        suppliers.add(po.supplier_name);
      }
    });
    return Array.from(suppliers);
  };
  const getUniquePONumbers = () => {
    const groupedPOs = groupPurchaseOrdersByPONumberForUnique(purchaseOrders);
    return Object.keys(groupedPOs).filter(po => po !== 'No PO#');
  };
  const getUniqueStatuses = () => {
    const statuses = new Set<string>();
    const groupedPOs = groupPurchaseOrdersByPONumberForUnique(purchaseOrders);
    Object.keys(groupedPOs).forEach(poNumber => {
      const poGroup = groupedPOs[poNumber];
      const firstPO = poGroup[0];
      const fulfillmentStatus = calculatePOFulfillmentStatus(firstPO, fulfillments);
      const unifiedStatus = calculateUnifiedStatus(firstPO, fulfillmentStatus);
      statuses.add(unifiedStatus);
    });
    return Array.from(statuses);
  };

  // Get unique DR numbers
  const getUniqueDRNumbers = () => {
    const drNumbers = new Set<string>();
    deliveries.forEach(delivery => {
      if (delivery.delivery_receipt_number) {
        drNumbers.add(delivery.delivery_receipt_number);
      }
    });
    return Array.from(drNumbers);
  };

  // Get unique SI numbers from purchase order data
  const getUniqueSINumbers = () => {
    // For now, return empty array since this would require async data
    // Could be improved by managing SI numbers in state
    return [];
  };

  // Handle sorting
  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.column === column) {
        return prev.direction === 'asc' ? { column, direction: 'desc' } : null;
      }
      return { column, direction: 'asc' };
    });
  };

  // Apply sorting to the filtered POs
  const sortedPONumbers = useMemo(() => {
    let sorted = Object.keys(filteredPOs);
    
    if (sortConfig) {
      sorted.sort((a, b) => {
        const poA = filteredPOs[a][0];
        const poB = filteredPOs[b][0];
        let comparison = 0;
        
        switch (sortConfig.column) {
          case 'date':
            const dateA = new Date(poA.po_date || poA.created_at);
            const dateB = new Date(poB.po_date || poB.created_at);
            comparison = dateA.getTime() - dateB.getTime();
            break;
          case 'po':
            comparison = a.localeCompare(b);
            break;
          case 'amount':
            const amountA = poA.after_tax || calculateTaxAdjustedTotal(poA) || 0;
            const amountB = poB.after_tax || calculateTaxAdjustedTotal(poB) || 0;
            comparison = amountA - amountB;
            break;
          default:
            comparison = 0;
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sort by date (newest first)
      sorted.sort((a, b) => {
        const dateA = new Date(filteredPOs[a][0].created_at);
        const dateB = new Date(filteredPOs[b][0].created_at);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    return sorted;
  }, [filteredPOs, sortConfig]);


  // Handle PO click - exactly as in TransactionRecord.tsx
  const handlePOClick = (poNumber: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (poNumber) {
      setSelectedPONumber(poNumber);
      setPODetailOpen(true);
    }
  };

  // Loading state with exact styling from TransactionRecord.tsx
  if (loading || poLoading) {
    return <div className="space-y-4">
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading purchase orders...</p>
        </div>
      </div>;
  }
  return <div className="space-y-4">
      {/* Header with Add Client PO button */}
      

      {/* Purchase Orders Table */}
      <PurchaseOrdersTable 
        isEditMode={isEditMode} 
        setIsEditMode={setIsEditMode}
        filteredPOs={filteredPOs} 
        calculateUnifiedStatus={calculateUnifiedStatus} 
        calculatePOFulfillmentStatus={calculatePOFulfillmentStatus} 
        fulfillments={fulfillments} 
        handlePOClick={handlePOClick} 
        filters={filters} 
        setFilters={setFilters} 
        getUniqueStatuses={getUniqueStatuses} 
        getUniquePONumbers={getUniquePONumbers} 
        getUniqueSuppliers={getUniqueSuppliers} 
        getUniqueDRNumbers={getUniqueDRNumbers}
        getUniqueSINumbers={getUniqueSINumbers}
        clearFilters={clearFilters} 
        hasActiveFilters={hasActiveFilters} 
        purchaseOrders={purchaseOrders} 
        onDataChange={handleDataChange}
        onPendingChanges={onPendingChanges}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {/* PO Detail Modal */}
      <PODetailModal open={poDetailOpen} onOpenChange={setPODetailOpen} poNumber={selectedPONumber} />
    </div>;
}