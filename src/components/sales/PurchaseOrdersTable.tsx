import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, ChevronUp, CalendarIcon, Edit, Save, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SearchAndFilterHeader } from './SearchAndFilterHeader';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useToast } from "@/hooks/use-toast";
import { MarkAsPaidModal } from "./MarkAsPaidModal";
import { PaymentDetailsModal } from "./PaymentDetailsModal";
import { paymentService } from "@/services/paymentService";
import { DRDetailModal } from "@/transactions/components/DRDetailModal";
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { usePurchaseOrderData } from '@/hooks/usePurchaseOrderData';
import { usePOSuggestions } from '@/hooks/usePOSuggestions';
import { useEffect } from 'react';
import { useTableColumns } from '@/hooks/useTableColumns';
import { useTableResize } from '@/hooks/useTableResize';
import { useTableDrag } from '@/hooks/useTableDrag';
import { Checkbox } from '@/components/ui/checkbox';

interface PurchaseOrdersTableProps {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  filteredPOs: { [key: string]: any[] };
  calculateUnifiedStatus: (po: any, fulfillmentStatus: string) => string;
  calculatePOFulfillmentStatus: (po: any, fulfillments: any[]) => string;
  fulfillments: any[];
  handlePOClick: (poNumber: string, e?: React.MouseEvent) => void;
  filters: any;
  setFilters: (filters: any) => void;
  getUniqueStatuses: () => string[];
  getUniquePONumbers: () => string[];
  getUniqueSuppliers: () => string[];
  getUniqueDRNumbers: () => string[];
  getUniqueSINumbers: () => string[];
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
  purchaseOrders: any[];
  onDataChange: () => void;
  onPendingChanges?: (changes: any[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortConfig: { column: string; direction: 'asc' | 'desc' } | null;
  onSort: (column: string) => void;
}

interface EditingCell {
  poNumber: string;
  field: 'date' | 'client' | 'po_number';
}

interface EditingRow {
  poNumber: string;
  client_po?: string;
  po_date?: string;
  supplier_name?: string;
  supplier_client_id?: string;
}

// Define the column configuration for the purchase orders table
const COLUMN_CONFIG = [
  { key: 'index', title: '#', defaultWidth: 60, minWidth: 50, isFixed: true },
  { key: 'status', title: 'Status', defaultWidth: 100, minWidth: 80 },
  { key: 'date', title: 'Date', defaultWidth: 120, minWidth: 100 },
  { key: 'client', title: 'Client', defaultWidth: 150, minWidth: 120 },
  { key: 'dr', title: 'DR#', defaultWidth: 120, minWidth: 100 },
  { key: 'po', title: 'PO#', defaultWidth: 120, minWidth: 100 },
  { key: 'si', title: 'SI#', defaultWidth: 120, minWidth: 100 },
  { key: 'qty', title: 'QTY', defaultWidth: 100, minWidth: 80 },
  { key: 'amount', title: 'Total Amount', defaultWidth: 140, minWidth: 120 }
];

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  isEditMode,
  setIsEditMode,
  filteredPOs,
  calculateUnifiedStatus,
  calculatePOFulfillmentStatus,
  fulfillments,
  handlePOClick,
  filters,
  setFilters,
  getUniqueStatuses,
  getUniquePONumbers,
  getUniqueSuppliers,
  getUniqueDRNumbers,
  getUniqueSINumbers,
  clearFilters,
  hasActiveFilters,
  purchaseOrders,
  onDataChange,
  onPendingChanges,
  searchQuery,
  onSearchChange,
  sortConfig,
  onSort
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, EditingRow>>(new Map());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [markAsPaidModal, setMarkAsPaidModal] = useState<{ isOpen: boolean; purchaseOrder: any | null }>({
    isOpen: false,
    purchaseOrder: null
  });
  const [paymentDetailsModal, setPaymentDetailsModal] = useState<{ isOpen: boolean; purchaseOrder: any | null }>({
    isOpen: false,
    purchaseOrder: null
  });
  const [drDetailOpen, setDrDetailOpen] = useState(false);
  const [selectedDrNumber, setSelectedDrNumber] = useState<string>('');
  
  // Column visibility state - all columns visible by default
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_CONFIG.map(col => col.key)
  );
  
  // DR column expansion state - tracks which PO rows have expanded DR# display
  const [expandedDRRows, setExpandedDRRows] = useState<Set<string>>(new Set());
  
  const { clients } = useClients();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Initialize table columns hook
  const {
    columns,
    sortedColumns,
    updateColumnWidth,
    reorderColumns
  } = useTableColumns({
    initialColumns: COLUMN_CONFIG,
    visibleColumnKeys: visibleColumns
  });

  // Initialize table resize hook
  const { isResizing, startResize } = useTableResize({
    onColumnResize: updateColumnWidth
  });

  // Initialize table drag hook
  const { isDragging, startDrag } = useTableDrag({
    columns: sortedColumns,
    onColumnReorder: reorderColumns
  });
  
  // Use optimized hooks
  const {
    deliveryReceiptsByPO,
    salesInvoicesByPO,
    calculateTaxAdjustedTotal,
    isLoading,
    refreshData
  } = usePurchaseOrderData(filteredPOs, purchaseOrders);
  
  const { poSuggestions, getPOSuggestions, clearSuggestions } = usePOSuggestions();

  // Get visible and ordered columns
  const displayColumns = useMemo(() => {
    return sortedColumns.filter(col => visibleColumns.includes(col.key));
  }, [sortedColumns, visibleColumns]);

  // Memoize filter options
  const filterOptions = useMemo(() => ({
    status: getUniqueStatuses().map(status => ({ value: status, label: status })),
    client: getUniqueSuppliers().map(supplier => ({ value: supplier, label: supplier })),
    poNumber: getUniquePONumbers().map(po => ({ value: po, label: po })),
    drNumber: getUniqueDRNumbers().map(dr => ({ value: dr, label: dr })),
    siNumber: getUniqueSINumbers().map(si => ({ value: si, label: si }))
  }), [getUniqueStatuses, getUniqueSuppliers, getUniquePONumbers, getUniqueDRNumbers, getUniqueSINumbers]);

  // Get sort icon for column
  const getSortIcon = (column: string) => {
    if (!sortConfig || sortConfig.column !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-3 w-3" /> : 
      <ArrowDown className="h-3 w-3" />;
  };

  // Column visibility toggle handler
  const toggleColumnVisibility = (columnKey: string) => {
    if (columnKey === 'index') return; // Don't allow hiding the index column
    
    setVisibleColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  // Listen for refresh events and invalidate queries
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      refreshData(); // Also refresh our optimized data
    };

    window.addEventListener('invalidate-purchase-orders', handleRefresh);
    return () => {
      window.removeEventListener('invalidate-purchase-orders', handleRefresh);
    };
  }, [queryClient, refreshData]);

  // Listen for save/cancel events from TransactionPage
  useEffect(() => {
    const handleSave = async () => {
      await saveAllPendingChanges();
    };

    const handleCancel = () => {
      setPendingChanges(new Map());
      setEditingCell(null);
      setEditingRow(null);
      clearSuggestions();
    };

    window.addEventListener('save-pending-changes', handleSave);
    window.addEventListener('cancel-edit-mode', handleCancel);
    
    return () => {
      window.removeEventListener('save-pending-changes', handleSave);
      window.removeEventListener('cancel-edit-mode', handleCancel);
    };
  }, [pendingChanges]);

  // Update parent with pending changes
  useEffect(() => {
    if (onPendingChanges) {
      onPendingChanges(Array.from(pendingChanges.values()));
    }
  }, [pendingChanges, onPendingChanges]);

  const startEditing = (poNumber: string, field: 'date' | 'client' | 'po_number', po: any) => {
    const editingData = {
      poNumber,
      client_po: po.client_po,
      po_date: po.po_date || po.created_at,
      supplier_name: po.supplier_name,
      supplier_client_id: po.supplier_client_id
    };
    
    setEditingCell({ poNumber, field });
    setEditingRow(editingData);
    // Add to pending changes immediately (soft-save)
    setPendingChanges(prev => new Map(prev.set(poNumber, editingData)));
  };

  const updateEditingRow = (poNumber: string, updates: Partial<EditingRow>) => {
    if (editingRow && editingRow.poNumber === poNumber) {
      const updatedRow = { ...editingRow, ...updates };
      setEditingRow(updatedRow);
      // Soft-save changes
      setPendingChanges(prev => new Map(prev.set(poNumber, updatedRow)));
    }
  };

  const isCellEditing = (poNumber: string, field: 'date' | 'client' | 'po_number') => {
    return editingCell?.poNumber === poNumber && editingCell?.field === field;
  };

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditingRow(null);
    clearSuggestions();
  }, [clearSuggestions]);

  const saveAllPendingChanges = async () => {
    if (pendingChanges.size === 0) return;

    try {
      // Save all pending changes
      for (const [poNumber, changes] of pendingChanges) {
        const poGroup = filteredPOs[poNumber];
        if (!poGroup || poGroup.length === 0) continue;

        const firstPO = poGroup[0];
        
        await purchaseOrderService.updatePurchaseOrder(firstPO.id, {
          client_po: changes.client_po,
          po_date: changes.po_date,
          supplier_name: changes.supplier_name,
          supplier_client_id: changes.supplier_client_id,
        } as any);
      }

      toast({
        title: "Success",
        description: `${pendingChanges.size} purchase order(s) updated successfully`,
      });

      setPendingChanges(new Map());
      setEditingCell(null);
      setEditingRow(null);
      clearSuggestions();
      onDataChange(); // Refresh the data
    } catch (error) {
      console.error('Error updating purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase orders",
        variant: "destructive",
      });
    }
  };

  const deletePurchaseOrder = async (poNumber: string) => {
    try {
      // Find all PO records for this PO number
      const poGroup = filteredPOs[poNumber];
      if (!poGroup || poGroup.length === 0) return;

      // Delete all records with this PO number
      for (const po of poGroup) {
        await purchaseOrderService.deletePurchaseOrder(po.id);
      }

      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });

      // Cancel editing if we were editing this row
      if (editingRow?.poNumber === poNumber) {
        setEditingRow(null);
        clearSuggestions();
      }

      setDeleteConfirm(null);
      onDataChange(); // Refresh the data
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (poNumber: string) => {
    setDeleteConfirm(poNumber);
  };

  const handleMarkAsPaid = (purchaseOrder: any) => {
    setMarkAsPaidModal({ 
      isOpen: true, 
      purchaseOrder 
    });
  };

  const handleViewPaymentDetails = (purchaseOrder: any) => {
    setPaymentDetailsModal({
      isOpen: true,
      purchaseOrder
    });
  };

  const handleConfirmMarkAsPaid = async (paymentData: {
    invoices: Array<{ invoiceNumber: string; amount: number; date: string }>;
    totalAmount: number;
    notes: string;
  }) => {
    if (!markAsPaidModal.purchaseOrder) return;

    try {
      // Add all payments
      for (const invoice of paymentData.invoices) {
        await paymentService.addPayment(
          markAsPaidModal.purchaseOrder.id,
          invoice.invoiceNumber,
          invoice.amount,
          paymentData.notes
        );
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      setMarkAsPaidModal({ isOpen: false, purchaseOrder: null });
      onDataChange(); // Refresh only the table component
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handleDRClick = useCallback((drNumber: string) => {
    setSelectedDrNumber(drNumber);
    setDrDetailOpen(true);
  }, []);

  // Toggle DR row expansion
  const toggleDRExpansion = useCallback((poNumber: string) => {
    setExpandedDRRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poNumber)) {
        newSet.delete(poNumber);
      } else {
        newSet.add(poNumber);
      }
      return newSet;
    });
  }, []);

  // Get PO numbers in the order they are provided (already sorted by parent)
  const sortedPONumbers = useMemo(() => {
    return Object.keys(filteredPOs);
  }, [filteredPOs]);

  // Render column header with resize and drag functionality
  const renderColumnHeader = (column: typeof displayColumns[0], index: number) => {
    const columnKey = column.key;
    
    const handleMouseDown = (e: React.MouseEvent) => {
      // Only start drag if not clicking on dropdown content
      if ((e.target as HTMLElement).closest('.dropdown-trigger')) {
        return;
      }
      if (e.detail === 1) {
        // Single click - start drag
        const rect = e.currentTarget.getBoundingClientRect();
        startDrag(index, e.clientX, e.currentTarget as HTMLElement);
      }
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      startResize(index, e.clientX, rect.width);
    };

    let content;
    switch (columnKey) {
      case 'index':
        content = isEditMode ? "Del" : "#";
        break;
      case 'status':
        content = (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="dropdown-trigger cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between">
                <span>Status</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg z-[60]" align="start">
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, status: 'all'})} 
                className={cn("cursor-pointer", filters.status === 'all' && 'bg-accent font-medium')}
              >
                All Statuses
              </DropdownMenuItem>
              {filterOptions.status.map(option => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setFilters({...filters, status: option.value})} 
                  className={cn("cursor-pointer", filters.status === option.value && 'bg-accent font-medium')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
        break;
      case 'date':
        content = (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="dropdown-trigger cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between">
                <span className="hidden md:inline">Date</span>
                <span className="md:hidden text-xs">Date</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70 hidden md:inline" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-popover border border-border shadow-lg z-[60]" align="start">
              <DropdownMenuItem 
                onClick={() => onSort('date')} 
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Sort by Date</span>
                {getSortIcon('date')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, dateRange: 'all'})} 
                className={cn("cursor-pointer", filters.dateRange === 'all' && 'bg-accent font-medium')}
              >
                All Dates
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, dateRange: 'all'})} 
                className={cn("cursor-pointer", filters.dateRange === 'all' && 'bg-accent font-medium')}
              >
                All Dates
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, dateRange: 'current-month'})} 
                className={cn("cursor-pointer", filters.dateRange === 'current-month' && 'bg-accent font-medium')}
              >
                Current Month
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, dateRange: 'last-month'})} 
                className={cn("cursor-pointer", filters.dateRange === 'last-month' && 'bg-accent font-medium')}
              >
                Last Month
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, dateRange: 'last-3-months'})} 
                className={cn("cursor-pointer", filters.dateRange === 'last-3-months' && 'bg-accent font-medium')}
              >
                Last 3 Months
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Popover>
                <PopoverTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                    Select Specific Month
                  </DropdownMenuItem>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.selectedMonth ? new Date(filters.selectedMonth.year, filters.selectedMonth.month) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFilters({
                          ...filters,
                          selectedMonth: { month: date.getMonth(), year: date.getFullYear() },
                          dateRange: 'all'
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </DropdownMenuContent>
          </DropdownMenu>
        );
        break;
      case 'client':
        content = (
          <Popover>
            <PopoverTrigger asChild>
              <div className="dropdown-trigger cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between">
                <span className="hidden md:inline">Client</span>
                <span className="md:hidden text-xs">Client</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70 hidden md:inline" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search clients..." />
                <CommandList>
                  <CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem 
                      onSelect={() => setFilters({...filters, supplier: 'all'})} 
                      className={cn("cursor-pointer", filters.supplier === 'all' && 'bg-accent font-medium')}
                    >
                      All Clients
                    </CommandItem>
                    {filterOptions.client.map(option => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => setFilters({...filters, supplier: option.value})}
                        className={cn("cursor-pointer", filters.supplier === option.value && 'bg-accent font-medium')}
                      >
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
        break;
      case 'po':
        content = (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="dropdown-trigger cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between">
                <span className="hidden md:inline">PO#</span>
                <span className="md:hidden text-xs">PO</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70 hidden md:inline" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg z-[60]" align="start">
              <DropdownMenuItem 
                onClick={() => onSort('po')} 
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Sort by PO#</span>
                {getSortIcon('po')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, poNumber: 'all'})} 
                className={cn("cursor-pointer", filters.poNumber === 'all' && 'bg-accent font-medium')}
              >
                All PO Numbers
              </DropdownMenuItem>
              {filterOptions.poNumber.map(option => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setFilters({...filters, poNumber: option.value})} 
                  className={cn("cursor-pointer", filters.poNumber === option.value && 'bg-accent font-medium')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
        break;
      
      case 'dr':
        content = (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="dropdown-trigger cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between">
                <span className="hidden md:inline">DR#</span>
                <span className="md:hidden text-xs">DR</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70 hidden md:inline" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg z-[60]" align="start">
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, drNumber: 'all'})} 
                className={cn("cursor-pointer", filters.drNumber === 'all' && 'bg-accent font-medium')}
              >
                All DR Numbers
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onSort('dr')} 
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Sort by DR#</span>
                {getSortIcon('dr')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, drNumber: 'all'})} 
                className={cn("cursor-pointer", filters.drNumber === 'all' && 'bg-accent font-medium')}
              >
                All DR Numbers
              </DropdownMenuItem>
              {filterOptions.drNumber.map(option => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setFilters({...filters, drNumber: option.value})} 
                  className={cn("cursor-pointer", filters.drNumber === option.value && 'bg-accent font-medium')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
        break;

      case 'si':
        content = (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="dropdown-trigger cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between">
                <span className="hidden md:inline">SI#</span>
                <span className="md:hidden text-xs">SI</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70 hidden md:inline" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg z-[60]" align="start">
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, siNumber: 'all'})} 
                className={cn("cursor-pointer", filters.siNumber === 'all' && 'bg-accent font-medium')}
              >
                All SI Numbers
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onSort('si')} 
                className="cursor-pointer flex items-center justify-between"
              >
                <span>Sort by SI#</span>
                {getSortIcon('si')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setFilters({...filters, siNumber: 'all'})} 
                className={cn("cursor-pointer", filters.siNumber === 'all' && 'bg-accent font-medium')}
              >
                All SI Numbers
              </DropdownMenuItem>
              {filterOptions.siNumber.map(option => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setFilters({...filters, siNumber: option.value})} 
                  className={cn("cursor-pointer", filters.siNumber === option.value && 'bg-accent font-medium')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
        break;

      case 'amount':
        content = (
          <div 
            className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-center md:justify-between"
            onClick={() => onSort('amount')}
          >
            <span className="hidden md:inline">Total Amount</span>
            <span className="md:hidden text-xs">Amount</span>
            {getSortIcon('amount')}
          </div>
        );
        break;
      default:
        content = column.title;
    }

    return (
      <th
        key={columnKey}
        data-column-key={columnKey}
        className={cn(
          "px-2 md:px-3 py-2 text-left font-medium relative group cursor-move",
          columnKey === 'index' && "w-8 md:w-12 bg-muted/80 border-r border-border font-mono text-xs text-muted-foreground text-center",
          columnKey === 'status' && "hidden md:table-cell text-center",
          columnKey === 'amount' && "text-right",
          columnKey === 'dr' && "hidden md:table-cell",
          columnKey === 'si' && "hidden md:table-cell text-center",
          columnKey === 'qty' && "hidden md:table-cell text-center",
          isDragging && "select-none"
        )}
        style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
        onMouseDown={handleMouseDown}
      >
        {content}
        {!column.isFixed && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-500 group-hover:bg-gray-300 transition-colors"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="w-full h-full" />
          </div>
        )}
      </th>
    );
  };

  // Render table cell content based on column type
  const renderCellContent = (columnKey: string, poNumber: string, poGroup: any[], index: number) => {
    const firstPO = poGroup[0];
    const totalQuantity = firstPO.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const totalItems = firstPO.items?.length || 0;
    const fulfillmentStatus = calculatePOFulfillmentStatus(firstPO, fulfillments);
    const unifiedStatus = calculateUnifiedStatus(firstPO, fulfillmentStatus);
    const isEditing = editingRow?.poNumber === poNumber;
    const hasPendingChanges = pendingChanges.has(poNumber);
    const currentData = pendingChanges.get(poNumber) || firstPO;

    switch (columnKey) {
      case 'index':
        return (
          <td className={`px-2 md:px-3 py-2 md:py-3 text-center border-r border-border font-mono text-xs ${
            unifiedStatus === 'paid' ? 'bg-green-100 text-green-800' :
            unifiedStatus === 'unpaid' ? 'bg-red-100 text-red-800' :
            unifiedStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
            'bg-muted/40 text-muted-foreground'
          }`}>
            {isEditMode ? (
              deleteConfirm === poNumber ? (
                <div className="flex gap-1 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePurchaseOrder(poNumber)}
                    className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-red-500 hover:text-white border-red-300 text-red-600"
                    title="Confirm Delete"
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                    className="h-5 w-5 md:h-6 md:w-6 p-0"
                    title="Cancel Delete"
                  >
                    <X className="h-2 w-2 md:h-3 md:w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteClick(poNumber)}
                  className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-red-500 hover:text-white border-red-300 text-red-600"
                  title="Delete Purchase Order"
                >
                  <X className="h-2 w-2 md:h-3 md:w-3" />
                </Button>
              )
            ) : (
              <span className="text-xs font-medium">{index + 1}</span>
            )}
          </td>
        );

      case 'status':
        return (
          <td className="hidden md:table-cell px-2 md:px-3 py-2 md:py-3 text-center">
            <Badge 
              variant={
                unifiedStatus === 'paid' ? 'default' :
                unifiedStatus === 'partial' ? 'secondary' : 'outline'
              }
              className={`text-xs cursor-pointer hover:opacity-80 transition-opacity px-1 py-0.5 md:px-2 md:py-1 ${
                unifiedStatus === 'paid' ? 'bg-green-600' :
                unifiedStatus === 'partial' ? 'bg-yellow-500' : ''
              }`}
              onClick={() => {
                handleViewPaymentDetails(firstPO);
              }}
              title={unifiedStatus === 'paid' ? 'Click to view payment details' : 'Click to mark as paid'}
            >
              <span className="hidden md:inline">{unifiedStatus}</span>
              <span className="md:hidden">{unifiedStatus.substring(0, 3)}</span>
            </Badge>
          </td>
        );

      case 'date':
        return (
          <td className="px-2 md:px-3 py-2 md:py-3 text-foreground">
            {isEditMode ? (
              <div 
                onClick={() => {
                  if (!isCellEditing(poNumber, 'date')) {
                    startEditing(poNumber, 'date', firstPO);
                  }
                }}
                className={`cursor-pointer ${isCellEditing(poNumber, 'date') ? 'bg-yellow-50 border border-yellow-200 rounded' : 'hover:bg-muted/30 rounded p-1'}`}
              >
                {isCellEditing(poNumber, 'date') ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8",
                          !editingRow?.po_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingRow?.po_date ? format(new Date(editingRow.po_date), 'MM/dd/yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingRow?.po_date ? new Date(editingRow.po_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateEditingRow(poNumber, { po_date: date.toISOString() });
                            setEditingCell(null);
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="text-xs md:text-sm">
                    {(currentData.po_date || currentData.created_at) ? 
                      format(new Date(currentData.po_date || currentData.created_at), 'MM/dd') : '-'}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs md:text-sm">
                {(firstPO.po_date || firstPO.created_at) ? 
                  format(new Date(firstPO.po_date || firstPO.created_at), 'MM/dd') : '-'}
              </span>
            )}
          </td>
        );

      case 'client':
        return (
          <td className="px-2 md:px-3 py-2 md:py-3 text-foreground">
            {isEditMode ? (
              <div 
                onClick={() => {
                  if (!isCellEditing(poNumber, 'client')) {
                    startEditing(poNumber, 'client', firstPO);
                  }
                }}
                className={`cursor-pointer ${isCellEditing(poNumber, 'client') ? 'bg-yellow-50 border border-yellow-200 rounded' : 'hover:bg-muted/30 rounded p-1'}`}
              >
                {isCellEditing(poNumber, 'client') ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-8"
                      >
                        {editingRow?.supplier_name || "Select client..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                onSelect={() => {
                                  updateEditingRow(poNumber, {
                                    supplier_name: client.name,
                                    supplier_client_id: client.id
                                  });
                                  setEditingCell(null);
                                }}
                              >
                                {client.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="truncate max-w-[60px] md:max-w-[120px] text-xs md:text-sm" title={currentData.supplier_name || '-'}>
                    {currentData.supplier_name || '-'}
                  </div>
                )}
              </div>
            ) : (
              <div className="truncate max-w-[60px] md:max-w-[120px] text-xs md:text-sm" title={firstPO.supplier_name || '-'}>
                {firstPO.supplier_name || '-'}
              </div>
            )}
          </td>
        );

      case 'dr':
        const drNumbers = deliveryReceiptsByPO[poNumber] || [];
        const isExpanded = expandedDRRows.has(poNumber);
        
        return (
          <td className="hidden md:table-cell px-3 py-3 text-foreground">
            {drNumbers.length > 0 ? (
              <div className="flex flex-col gap-1">
                {(() => {
                  if (drNumbers.length <= 4 || isExpanded) {
                    // Show all DR numbers when count <= 4 or when expanded
                    const rows: JSX.Element[] = [];
                    for (let i = 0; i < drNumbers.length; i += 2) {
                      const rowItems = drNumbers.slice(i, i + 2);
                      rows.push(
                        <div key={i} className="flex flex-wrap gap-1">
                          {rowItems.map((drNumber, index) => (
                            <span key={index}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDRClick(drNumber);
                                }}
                                className="text-xs bg-muted px-2 py-1 rounded hover:bg-accent transition-colors text-blue-600 hover:text-blue-800"
                              >
                                {drNumber}
                              </button>
                              {index < rowItems.length - 1 && <span className="text-muted-foreground">, </span>}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return rows;
                  } else {
                    // Show first 3 DR numbers + "+ more" when count > 4 and not expanded
                    const visibleDRs = drNumbers.slice(0, 3);
                    const rows: JSX.Element[] = [];
                    
                    // First row: first 2 DRs
                    rows.push(
                      <div key="row1" className="flex flex-wrap gap-1">
                        {visibleDRs.slice(0, 2).map((drNumber, index) => (
                          <span key={index}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDRClick(drNumber);
                              }}
                              className="text-xs bg-muted px-2 py-1 rounded hover:bg-accent transition-colors text-blue-600 hover:text-blue-800"
                            >
                              {drNumber}
                            </button>
                            {index < 1 && <span className="text-muted-foreground">, </span>}
                          </span>
                        ))}
                      </div>
                    );
                    
                    // Second row: 3rd DR + "+ more" button
                    rows.push(
                      <div key="row2" className="flex flex-wrap gap-1">
                        {visibleDRs.length > 2 && (
                          <span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDRClick(visibleDRs[2]);
                              }}
                              className="text-xs bg-muted px-2 py-1 rounded hover:bg-accent transition-colors text-blue-600 hover:text-blue-800"
                            >
                              {visibleDRs[2]}
                            </button>
                            <span className="text-muted-foreground">, </span>
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDRExpansion(poNumber);
                          }}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors font-medium"
                          title={`Show ${drNumbers.length - 3} more DR numbers`}
                        >
                          + {drNumbers.length - 3} more
                        </button>
                      </div>
                    );
                    
                    return rows;
                  }
                })()}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </td>
        );

      case 'po':
        return (
          <td className="px-2 md:px-3 py-2 md:py-3 text-foreground">
            {isEditMode ? (
              <div 
                onClick={() => {
                  if (!isCellEditing(poNumber, 'po_number')) {
                    startEditing(poNumber, 'po_number', firstPO);
                  }
                }}
                className={`cursor-pointer ${isCellEditing(poNumber, 'po_number') ? 'bg-yellow-50 border border-yellow-200 rounded' : 'hover:bg-muted/30 rounded p-1'}`}
              >
                 {isCellEditing(poNumber, 'po_number') ? (
                   <div className="relative">
                     <Input
                       value={editingRow?.client_po || ''}
                       onChange={(e) => {
                         const value = e.target.value;
                         updateEditingRow(poNumber, { client_po: value });
                         
                          if (editingRow?.supplier_client_id && value) {
                            getPOSuggestions(editingRow.supplier_client_id, value);
                          }
                       }}
                       onBlur={() => setEditingCell(null)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           setEditingCell(null);
                         }
                       }}
                       autoFocus
                       className="h-8"
                       placeholder="Enter PO#"
                     />
                     {poSuggestions.length > 0 && (
                       <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
                         <Command>
                           <CommandList>
                             <CommandGroup>
                               {poSuggestions.map((suggestion, idx) => (
                                 <CommandItem
                                   key={idx}
                                   onSelect={() => {
                                     updateEditingRow(poNumber, { client_po: suggestion });
                                     clearSuggestions();
                                     setEditingCell(null);
                                   }}
                                 >
                                   {suggestion}
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                           </CommandList>
                         </Command>
                       </div>
                     )}
                   </div>
                ) : (
                  <span className="text-xs bg-muted px-1 py-1 md:px-2 rounded transition-colors truncate max-w-[50px] md:max-w-none" title={currentData.client_po || poNumber}>
                    {currentData.client_po ? (currentData.client_po.length > 8 ? `${currentData.client_po.substring(0, 8)}...` : currentData.client_po) : (poNumber.length > 8 ? `${poNumber.substring(0, 8)}...` : poNumber)}
                  </span>
                )}
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  handlePOClick(poNumber);
                }}
                className="text-xs bg-muted px-1 py-1 md:px-2 rounded hover:bg-accent transition-colors truncate max-w-[50px] md:max-w-none"
                title={poNumber}
              >
                {poNumber.length > 8 ? `${poNumber.substring(0, 8)}...` : poNumber}
              </button>
            )}
          </td>
        );

      case 'si':
        return (
          <td className="hidden md:table-cell px-3 py-3 text-center text-foreground">
            {salesInvoicesByPO[poNumber]?.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center">
                {salesInvoicesByPO[poNumber].map((invoiceNumber, index) => (
                  <span key={index}>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {invoiceNumber}
                    </span>
                    {index < salesInvoicesByPO[poNumber].length - 1 && <span className="text-muted-foreground">, </span>}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </td>
        );

      case 'qty':
        return (
          <td className="hidden md:table-cell px-3 py-3 text-center text-foreground">
            <div className="flex flex-col items-center">
              <span className="font-medium text-sm">{totalQuantity}</span>
              <span className="text-xs text-muted-foreground">
                {totalItems} Item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>
          </td>
        );

      case 'amount':
        return (
          <td className="px-2 md:px-3 py-2 md:py-3 text-right text-foreground font-medium">
            <span className="text-xs md:text-sm">
              ₱{(firstPO.after_tax || calculateTaxAdjustedTotal(firstPO)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </td>
        );

      default:
        return <td className="px-2 md:px-3 py-2 md:py-3">-</td>;
    }
  };

  if (sortedPONumbers.length === 0) {
  // Prepare filter configuration for SearchAndFilterHeader
  const searchFilters = [
    {
      label: 'Status',
      key: 'status',
      options: filterOptions.status,
      value: filters.status,
      onChange: (value: string) => setFilters({...filters, status: value})
    },
    {
      label: 'Date Range',
      key: 'dateRange',
      options: [
        { value: 'current-month', label: 'Current Month' },
        { value: 'last-month', label: 'Last Month' },
        { value: 'last-3-months', label: 'Last 3 Months' }
      ],
      value: filters.dateRange,
      onChange: (value: string) => setFilters({...filters, dateRange: value})
    },
    {
      label: 'Client',
      key: 'client',
      options: filterOptions.client,
      value: filters.supplier,
      onChange: (value: string) => setFilters({...filters, supplier: value})
    },
    {
      label: 'PO#',
      key: 'poNumber',
      options: filterOptions.poNumber,
      value: filters.poNumber,
      onChange: (value: string) => setFilters({...filters, poNumber: value})
    },
    {
      label: 'DR#',
      key: 'drNumber',
      options: filterOptions.drNumber,
      value: filters.drNumber,
      onChange: (value: string) => setFilters({...filters, drNumber: value})
    },
    {
      label: 'SI#',
      key: 'siNumber',
      options: filterOptions.siNumber,
      value: filters.siNumber,
      onChange: (value: string) => setFilters({...filters, siNumber: value})
    }
  ];

  const activeFiltersCount = searchFilters.filter(f => f.value !== 'all').length + 
    (searchQuery.trim() ? 1 : 0) + 
    (filters.selectedMonth ? 1 : 0);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Enhanced Search and Filter Header */}
      <div className="p-4 border-b border-border">
        <SearchAndFilterHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filters={searchFilters}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={clearFilters}
          placeholder="Search purchase orders..."
        />
      </div>

      {/* Column Visibility Controls */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-medium mb-3">Column Visibility</h3>
        <div className="flex flex-wrap gap-3">
          {COLUMN_CONFIG.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={`column-${column.key}`}
                checked={visibleColumns.includes(column.key)}
                onCheckedChange={() => toggleColumnVisibility(column.key)}
                disabled={column.key === 'index'}
              />
              <label 
                htmlFor={`column-${column.key}`} 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.title}
              </label>
            </div>
          ))}
        </div>
      </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {displayColumns.map((column, index) => renderColumnHeader(column, index))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={displayColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {purchaseOrders.length === 0 ? "No purchase order records found." : "No purchase orders match the current filters."}
                  {hasActiveFilters() && (
                    <div className="mt-2">
                      <Button onClick={clearFilters} variant="outline" size="sm">
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Column Visibility Controls */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-medium mb-3">Column Visibility</h3>
        <div className="flex flex-wrap gap-3">
          {COLUMN_CONFIG.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={`column-${column.key}`}
                checked={visibleColumns.includes(column.key)}
                onCheckedChange={() => toggleColumnVisibility(column.key)}
                disabled={column.key === 'index'}
              />
              <label 
                htmlFor={`column-${column.key}`} 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.title}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto resizable-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              {displayColumns.map((column, index) => renderColumnHeader(column, index))}
            </tr>
          </thead>
          <tbody>
            {sortedPONumbers.map((poNumber, index) => {
              const poGroup = filteredPOs[poNumber];
              
              return (
                <tr key={poNumber} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  {displayColumns.map((column) => renderCellContent(column.key, poNumber, poGroup, index))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mark as Paid Modal */}
      <MarkAsPaidModal
        isOpen={markAsPaidModal.isOpen}
        onClose={() => setMarkAsPaidModal({ isOpen: false, purchaseOrder: null })}
        onConfirm={handleConfirmMarkAsPaid}
        purchaseOrderId={markAsPaidModal.purchaseOrder?.id || ''}
        supplierName={markAsPaidModal.purchaseOrder?.supplier_name}
        totalAmount={markAsPaidModal.purchaseOrder?.items?.reduce((sum: number, item: any) => 
          sum + (item.quantity * item.unit_price), 0) || markAsPaidModal.purchaseOrder?.total_amount || 0}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={paymentDetailsModal.isOpen}
        onClose={() => {
          setPaymentDetailsModal({ isOpen: false, purchaseOrder: null });
          onDataChange();
        }}
        purchaseOrderId={paymentDetailsModal.purchaseOrder?.id || ''}
        supplierName={paymentDetailsModal.purchaseOrder?.supplier_name}
      />

      {/* DR Detail Modal */}
      <DRDetailModal
        open={drDetailOpen}
        onOpenChange={setDrDetailOpen}
        drNumber={selectedDrNumber}
      />
    </div>
  );
};