import React, { useEffect, useState, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowUp, ArrowDown, CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Edit3, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { calculatePOFulfillmentStatus } from '@/transactions/utils/poStatusCalculation';
import { cn } from "@/lib/utils";
import { PODetailModal } from "../components/PODetailModal";
import { DRDetailModal } from "../components/DRDetailModal";
import { UnaccountedItemsModal } from "../components/UnaccountedItemsModal";
import { useDeliveries } from "@/hooks/useDeliveries";
import { usePurchaseOrderDetails } from "@/hooks/usePurchaseOrderDetails";

// Interface definitions remain unchanged
interface TransactionRecord {
  id: string;
  productName: string;
  qty: number;
  price: number;
  total: number;
  drNumber?: string;
  poNumber?: string;
  siNumber?: string;
  client?: string;
  fulfillmentStatus: 'UNPAID' | 'PAID' | 'Advance Delivery' | 'Pending' | 'UNACCOUNTED';
  paymentStatus: 'PAID' | 'UNPAID';
  date: string;
  drDate?: string;
  poDate?: string;
  type: 'fulfillment' | 'advance_delivery' | 'pending_po';
}
interface TransactionRecordProps {
  editMode: boolean;
  toggleEditMode: () => void;
}

export default function TransactionRecord({ editMode, toggleEditMode }: TransactionRecordProps) {
  const { toast } = useToast();
  const { deliveries } = useDeliveries();
  const { data: purchaseOrders = [], isLoading: poLoading } = usePurchaseOrderDetails();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionRecord[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Removed expansion state - no longer needed for flat list

  // Filter states remain unchanged
  const [filters, setFilters] = useState({
    drNumber: 'all',
    poNumber: 'all',
    fulfillmentStatus: 'all',
    paymentStatus: 'all',
    client: 'all',
    productName: 'all',
    dateRange: 'all',
    selectedMonth: null as {
      month: number;
      year: number;
    } | null
  });

  // Sorting state for DR#
  const [drSortOrder, setDrSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [poSortOrder, setPoSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc' | null>(null);

  // All other state variables remain unchanged
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedPONumber, setSelectedPONumber] = useState<string>('');
  const [poDetailOpen, setPODetailOpen] = useState(false);
  const [selectedDRNumber, setSelectedDRNumber] = useState<string>('');
  const [drDetailOpen, setDRDetailOpen] = useState(false);
  const [unaccountedModalOpen, setUnaccountedModalOpen] = useState(false);
  const [selectedUnaccountedDRs, setSelectedUnaccountedDRs] = useState<string[]>([]);

  // All useEffects remain unchanged
  useEffect(() => {
    loadTransactionData();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  // All functions remain unchanged
  const sortByDR = (order: 'asc' | 'desc') => {
    setDrSortOrder(order);
    setFilteredTransactions(prev => {
      const sorted = [...prev].sort((a, b) => {
        const drA = a.drNumber || '';
        const drB = b.drNumber || '';
        
        if (order === 'asc') {
          return drA.localeCompare(drB);
        } else {
          return drB.localeCompare(drA);
        }
      });
      return sorted;
    });
  };

  const sortByPO = (order: 'asc' | 'desc') => {
    setPoSortOrder(order);
    setFilteredTransactions(prev => {
      const sorted = [...prev].sort((a, b) => {
        const poA = a.poNumber || '';
        const poB = b.poNumber || '';
        
        if (order === 'asc') {
          return poA.localeCompare(poB);
        } else {
          return poB.localeCompare(poA);
        }
      });
      return sorted;
    });
  };

  const sortByDate = (order: 'asc' | 'desc') => {
    setDateSortOrder(order);
    setFilteredTransactions(prev => {
      const sorted = [...prev].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (order === 'asc') {
          return dateA.getTime() - dateB.getTime();
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      });
      return sorted;
    });
  };

  const applyFilters = () => {
    // Original filter logic remains unchanged
    let filtered = [...transactions];
    if (filters.drNumber && filters.drNumber !== 'all') {
      filtered = filtered.filter(t => t.drNumber?.toLowerCase().includes(filters.drNumber.toLowerCase()));
    }
    if (filters.poNumber && filters.poNumber !== 'all') {
      filtered = filtered.filter(t => t.poNumber?.toLowerCase().includes(filters.poNumber.toLowerCase()));
    }
    if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') {
      filtered = filtered.filter(t => t.fulfillmentStatus === filters.fulfillmentStatus);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      filtered = filtered.filter(t => t.paymentStatus === filters.paymentStatus);
    }
    if (filters.client && filters.client !== 'all') {
      filtered = filtered.filter(t => t.client?.toLowerCase().includes(filters.client.toLowerCase()));
    }
    if (filters.productName && filters.productName !== 'all') {
      filtered = filtered.filter(t => t.productName?.toLowerCase().includes(filters.productName.toLowerCase()));
    }
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let startDate: Date;
      let endDate: Date;
      switch (filters.dateRange) {
        case 'current-month':
          startDate = new Date(currentYear, currentMonth, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
          break;
        case 'last-month':
          startDate = new Date(currentYear, currentMonth - 1, 1);
          endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
          break;
        case 'last-3-months':
          startDate = new Date(currentYear, currentMonth - 2, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    if (filters.selectedMonth) {
      const {
        month,
        year
      } = filters.selectedMonth;
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    setFilteredTransactions(filtered);
  };

  // All other helper functions remain unchanged
  const clearFilters = () => {
    setFilters({
      drNumber: 'all',
      poNumber: 'all',
      fulfillmentStatus: 'all',
      paymentStatus: 'all',
      client: 'all',
      productName: 'all',
      dateRange: 'all',
      selectedMonth: null
    });
    setSelectedMonth(null);
  };

  // Keep all other functions unchanged
  const getTransactionDate = (delivery: any, purchaseOrder: any, fulfillment?: any) => {
    if (delivery?.delivery_date) return delivery.delivery_date;
    if (purchaseOrder?.created_at) return purchaseOrder.created_at;
    if (fulfillment?.date) return fulfillment.date;
    if (delivery?.created_at) return delivery.created_at;
    return new Date().toISOString();
  };
  const hasActiveFilters = () => {
    return filters.drNumber && filters.drNumber !== 'all' || filters.poNumber && filters.poNumber !== 'all' || filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all' || filters.paymentStatus && filters.paymentStatus !== 'all' || filters.client && filters.client !== 'all' || filters.productName && filters.productName !== 'all' || filters.dateRange && filters.dateRange !== 'all' || filters.selectedMonth !== null;
  };
  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
  };
  const handleApplyMonthFilter = () => {
    if (selectedMonth !== null) {
      setFilters({
        ...filters,
        selectedMonth: {
          month: selectedMonth,
          year: selectedYear
        },
        dateRange: 'all'
      });
    }
    setMonthPickerOpen(false);
  };
  const handleClearMonthFilter = () => {
    setFilters({
      ...filters,
      selectedMonth: null
    });
    setSelectedMonth(null);
    setMonthPickerOpen(false);
  };
  const getMonthDisplayText = () => {
    if (!filters.selectedMonth) return "Select Month";
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[filters.selectedMonth.month]} ${filters.selectedMonth.year}`;
  };
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
  const handleDRClick = (drNumber: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (drNumber) {
      setSelectedDRNumber(drNumber);
      setDRDetailOpen(true);
    }
  };

  const handleUnaccountedDRClick = (drNumbers: string[], e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedUnaccountedDRs(drNumbers);
    setUnaccountedModalOpen(true);
  };

  // Edit mode functions - toggleEditMode is now passed as prop

  const startEditing = (rowId: string, field: string, currentValue: string) => {
    if (!editMode) return;
    setEditingCell({ rowId, field });
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell || savingChanges) return;
    
    setSavingChanges(true);
    try {
      const transaction = transactions.find(t => t.id === editingCell.rowId);
      if (!transaction) return;

      // Update the transaction in the database based on its type
      if (transaction.type === 'fulfillment') {
        // Update fulfillment record
        const fulfillmentId = transaction.id.replace('fulfillment-', '');
        await updateFulfillmentField(fulfillmentId, editingCell.field, editValue);
      } else if (transaction.type === 'advance_delivery') {
        // Update delivery record
        const deliveryItemId = transaction.id.replace('delivery-', '');
        await updateDeliveryField(deliveryItemId, editingCell.field, editValue);
      } else if (transaction.type === 'pending_po') {
        // Update purchase order record
        const poItemId = transaction.id.replace('po-item-', '');
        await updatePOField(poItemId, editingCell.field, editValue);
      }

      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === editingCell.rowId 
          ? { ...t, [editingCell.field]: editValue }
          : t
      ));

      toast({
        title: "Changes saved",
        description: "Transaction updated successfully",
      });

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving edit:', error);
      toast({
        title: "Error saving changes",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setSavingChanges(false);
    }
  };

  const updateFulfillmentField = async (fulfillmentId: string, field: string, value: string) => {
    // Update fulfillment-related fields
    if (field === 'qty') {
      await supabase
        .from('fulfillments')
        .update({ fulfilled_quantity: parseInt(value) })
        .eq('id', fulfillmentId);
    }
    // Add other fulfillment field updates as needed
  };

  const updateDeliveryField = async (deliveryItemId: string, field: string, value: string) => {
    // Update delivery-related fields
    if (field === 'qty') {
      await supabase
        .from('delivery_items')
        .update({ quantity_delivered: parseInt(value) })
        .eq('id', deliveryItemId);
    } else if (field === 'productName') {
      // This would require updating the product name, which is more complex
      // You might want to handle this differently
    }
    // Add other delivery field updates as needed
  };

  const updatePOField = async (poItemId: string, field: string, value: string) => {
    // Update purchase order item fields
    if (field === 'qty') {
      await supabase
        .from('purchase_order_items')
        .update({ quantity: parseInt(value) })
        .eq('id', poItemId);
    } else if (field === 'price') {
      await supabase
        .from('purchase_order_items')
        .update({ unit_price: parseFloat(value) })
        .eq('id', poItemId);
    }
    // Add other PO field updates as needed
  };

  // Removed grouping functions - no longer needed for flat list

  // Removed togglePOExpansion - no longer needed for flat list

  const formatPONumber = (poNumber?: string | null): string => {
    if (!poNumber) return '-';
    
    // If it's a raw ID format (client_po_ prefix or very long), truncate it
    if (poNumber.startsWith('client_po_') || poNumber.length > 36) {
      return poNumber.substring(0, 8) + '...';
    }
    
    return poNumber;
  };

  // Removed grouping helper functions - no longer needed for flat list

  // Update the badge styling functions to match TransactionRecordsList
  const getFulfillmentBadgeVariant = (status: TransactionRecord['fulfillmentStatus']) => {
    switch (status) {
      case 'PAID':
        return 'default';
      case 'UNPAID':
        return 'destructive';
      case 'Advance Delivery':
        return 'secondary';
      case 'UNACCOUNTED':
        return 'secondary';
      case 'Pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Update badge classes to match TransactionRecordsList
  const getFulfillmentBadgeClassName = (status: TransactionRecord['fulfillmentStatus']) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1';
      case 'UNPAID':
        return 'bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1';
      case 'Advance Delivery':
        return 'bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1';
      case 'UNACCOUNTED':
        return 'bg-purple-500 hover:bg-purple-600 text-white font-medium px-3 py-1';
      case 'Pending':
        return 'bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1';
      default:
        return '';
    }
  };

  // Color grouping function for Purchase Orders
  const getPOBackgroundColor = (poNumber?: string | null) => {
    if (!poNumber || poNumber === '-') return '';
    
    // Define subtle background colors that maintain readability (5% darker)
    const colors = [
      'bg-blue-100/60',
      'bg-green-100/60', 
      'bg-purple-100/60',
      'bg-orange-100/60',
      'bg-pink-100/60',
      'bg-indigo-100/60',
      'bg-teal-100/60',
      'bg-amber-100/60',
      'bg-cyan-100/60',
      'bg-rose-100/60',
      'bg-emerald-100/60',
      'bg-violet-100/60'
    ];
    
    // Get unique PO numbers from filtered transactions
    const uniquePOs = Array.from(new Set(
      filteredTransactions
        .map(t => t.poNumber)
        .filter(po => po && po !== '-')
    ));
    
    // Find index of current PO and map to color
    const poIndex = uniquePOs.indexOf(poNumber);
    return poIndex >= 0 ? colors[poIndex % colors.length] : '';
  };

  // Updated TableHead component to match TransactionRecordsList styling
  const ClickableHeader = forwardRef<HTMLTableCellElement, {
    children: React.ReactNode;
    hasFilter: boolean;
  }>(({
    children,
    hasFilter,
    ...props
  }, ref) => <TableHead ref={ref} className={cn("cursor-pointer hover:bg-muted/50 transition-colors font-semibold text-sm", hasFilter && "bg-primary/10")} {...props}>
      <div className="flex items-center justify-between">
        {children}
        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
      </div>
    </TableHead>);

  // Editable cell component
  const EditableCell = ({ 
    transaction, 
    field, 
    value, 
    isNumeric = false,
    isSelect = false,
    selectOptions = []
  }: {
    transaction: TransactionRecord;
    field: string;
    value: string | number;
    isNumeric?: boolean;
    isSelect?: boolean;
    selectOptions?: string[];
  }) => {
    const isEditing = editingCell?.rowId === transaction.id && editingCell?.field === field;
    
    if (isEditing) {
      if (isSelect) {
        return (
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={saveEdit} disabled={savingChanges}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEditing}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-xs"
            type={isNumeric ? "number" : "text"}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEditing();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={saveEdit} disabled={savingChanges}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEditing}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className={editMode ? "cursor-pointer hover:bg-muted/50 p-1 rounded" : ""}
        onClick={() => editMode && startEditing(transaction.id, field, String(value))}
      >
        {value}
      </div>
    );
  };

  // Load transaction data - unchanged
  const loadTransactionData = async () => {
    // Original data loading logic remains unchanged
    try {
      setLoading(true);

      // STEP 1: Load all required data including fulfillments and pricing
      const [deliveriesRes, purchaseOrdersRes, fulfillmentsRes] = await Promise.all([supabase.from('deliveries').select(`
          id,
          delivery_receipt_number,
          delivery_date,
          created_at,
          client_id,
          clients (
            id,
            name
          ),
          delivery_items (
            id,
            quantity_delivered,
            product_id,
            products (
              id,
              name
            )
          )
        `), supabase.from('purchase_orders').select(`
          id,
          client_po,
          sale_invoice_number,
          payment_status,
          created_at,
          supplier_client_id,
          clients (
            name
          ),
          purchase_order_items (
            id,
            quantity,
            product_id,
            products (
              id,
              name
            )
          )
        `), supabase.from('fulfillments').select('*')]);
      if (deliveriesRes.error) throw deliveriesRes.error;
      if (purchaseOrdersRes.error) throw purchaseOrdersRes.error;
      if (fulfillmentsRes.error) throw fulfillmentsRes.error;
      const deliveries = deliveriesRes.data || [];
      const purchaseOrders = purchaseOrdersRes.data || [];
      const fulfillments = fulfillmentsRes.data || [];
      setFulfillments(fulfillments); // Store fulfillments in state
      const transactionRecords: TransactionRecord[] = [];

      // STEP 2: Create sets to track processed items to avoid duplicates
      const processedDRItems = new Set<string>();
      const processedPOItems = new Set<string>();

      // STEP 3: Process fulfillments first - these become "Delivered" transactions
      for (const fulfillment of fulfillments) {
        const delivery = deliveries.find(d => d.id === fulfillment.dr_id);
        const purchaseOrder = purchaseOrders.find(po => po.id === fulfillment.po_id);
        if (!delivery || !purchaseOrder) continue;
        const drItem = delivery.delivery_items?.find(item => item.id === fulfillment.dr_item_id);
        const poItem = purchaseOrder.purchase_order_items?.find(item => item.id === fulfillment.po_item_id);
        if (!drItem || !poItem) continue;

        // Get pricing data for this product and client
        const {
          data: pricingData
        } = await supabase.from('product_clients').select('quoted_price, margin_percentage').eq('product_id', poItem.product_id).eq('client_id', purchaseOrder.supplier_client_id).single();
        const unitPrice = pricingData?.quoted_price || 1000; // fallback price

        // Determine payment status: Use the payment_status from purchase order, default to UNPAID
        const fulfillmentStatus = purchaseOrder.payment_status === 'paid' ? 'PAID' : 'UNPAID';
        transactionRecords.push({
          id: `fulfillment-${fulfillment.id}`,
          productName: drItem.products?.name || poItem.products?.name || 'Unknown Product',
          qty: fulfillment.fulfilled_quantity,
          price: unitPrice,
          total: unitPrice * fulfillment.fulfilled_quantity,
          drNumber: delivery.delivery_receipt_number,
          poNumber: purchaseOrder.client_po,
          siNumber: purchaseOrder.sale_invoice_number,
          client: (purchaseOrder as any).clients?.name || 'Unknown Client',
          fulfillmentStatus: fulfillmentStatus,
          paymentStatus: 'UNPAID',
          date: getTransactionDate(delivery, purchaseOrder, fulfillment),
          drDate: delivery.delivery_date || delivery.created_at,
          poDate: purchaseOrder.created_at,
          type: 'fulfillment'
        });

        // Mark these items as processed
        processedDRItems.add(drItem.id);
        processedPOItems.add(poItem.id);
      }

      // STEP 4: Process delivery items with fulfillment-aware logic
      for (const delivery of deliveries) {
        for (const item of delivery.delivery_items || []) {
          // Calculate how much of this DR item has been fulfilled
          const itemFulfillments = fulfillments.filter(f => f.dr_item_id === item.id);
          const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
          const remainingQuantity = Math.max(0, item.quantity_delivered - totalFulfilled);
          
          // Only show DR items that have remaining unfulfilled quantity
          if (remainingQuantity > 0) {
            const defaultPrice = 1000; // Placeholder when no pricing available
            
            // Get client name from delivery record's client relationship
            const clientName = (delivery as any).clients?.name || 'Unknown Client';

            transactionRecords.push({
              id: `delivery-${item.id}`,
              productName: item.products?.name || 'Unknown Product',
              qty: remainingQuantity, // Show only remaining quantity
              price: defaultPrice,
              total: defaultPrice * remainingQuantity,
              drNumber: delivery.delivery_receipt_number,
              poNumber: undefined,
              client: clientName,
              fulfillmentStatus: 'Advance Delivery',
              paymentStatus: 'UNPAID',
              date: getTransactionDate(delivery, null),
              drDate: delivery.delivery_date || delivery.created_at,
              poDate: undefined,
              type: 'advance_delivery'
            });
          }
        }
      }

      // STEP 5: Process unfulfilled PO items as "Pending"
      for (const po of purchaseOrders) {
        for (const item of po.purchase_order_items || []) {
          // Calculate how much of this PO item has been fulfilled
          const itemFulfillments = fulfillments.filter(f => f.po_item_id === item.id);
          const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
          const remaining = Math.max(0, item.quantity - totalFulfilled);

          // Only show pending if there's remaining quantity
          if (remaining > 0) {
            // Get pricing data for this product and client
            const {
              data: pricingData
            } = await supabase.from('product_clients').select('quoted_price, margin_percentage').eq('product_id', item.product_id).eq('client_id', po.supplier_client_id).single();
            const unitPrice = pricingData?.quoted_price || 1000; // fallback price

            transactionRecords.push({
              id: `po-${item.id}`,
              productName: item.products?.name || 'Unknown Product',
              qty: remaining,
              price: unitPrice,
              total: unitPrice * remaining,
              drNumber: undefined,
              poNumber: po.client_po,
              client: (po as any).clients?.name || 'Unknown Client',
              fulfillmentStatus: 'Pending',
              paymentStatus: 'UNPAID',
              date: getTransactionDate(null, po),
              drDate: undefined,
              poDate: po.created_at,
              type: 'pending_po'
            });
          }
        }
      }

      // Sort by date (newest first)
      transactionRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(transactionRecords);
    } catch (error) {
      console.error('Error loading transaction data:', error);
      toast({
        title: "Error loading transactions",
        description: "Failed to load transaction records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for dropdowns - unchanged
  const uniqueDRNumbers = [...new Set(transactions.map(t => t.drNumber).filter(Boolean))];
  const uniquePONumbers = [...new Set(transactions.map(t => t.poNumber).filter(Boolean))];
  const uniqueClients = [...new Set(transactions.map(t => t.client).filter(Boolean))];
  const uniqueProducts = [...new Set(transactions.map(t => t.productName).filter(Boolean))];
  const uniqueStatuses = ['UNPAID', 'PAID', 'Advance Delivery', 'Pending', 'UNACCOUNTED'];
  const dateRangeOptions = [{
    value: 'all',
    label: 'All Dates',
    showSortIcons: true
  }, {
    value: 'current-month',
    label: 'Current Month'
  }, {
    value: 'last-month',
    label: 'Last Month'
  }, {
    value: 'last-3-months',
    label: 'Last 3 Months'
  }];

  // Loading state with updated styling
  if (loading) {
    return <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading transaction records...</p>
        </div>
      </div>
  }



  // Simplified to show only transaction records (no tabs)
  return (
    <div className="space-y-4">

          {/* Main transaction table with spreadsheet styling */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {/* Add expand/collapse column */}
                <th className="px-3 py-2 text-left font-medium w-8"></th>
                {/* Status Filter */}
                <th className="px-3 py-2 text-left font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-between">
                        Status
                        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="start">
                      <DropdownMenuItem onClick={() => setFilters({
                      ...filters,
                      fulfillmentStatus: 'all'
                    })} className={filters.fulfillmentStatus === 'all' ? 'bg-accent' : ''}>
                        All Statuses
                      </DropdownMenuItem>
                      {uniqueStatuses.map(status => <DropdownMenuItem key={status} onClick={() => setFilters({
                      ...filters,
                      fulfillmentStatus: status
                    })} className={filters.fulfillmentStatus === status ? 'bg-accent' : ''}>
                          {status}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>

                {/* Date Filter */}
                <th className="px-3 py-2 text-left font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-between">
                        Date
                        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="start">
                      {dateRangeOptions.map(option => <DropdownMenuItem key={option.value} onClick={() => setFilters({
                      ...filters,
                      dateRange: option.value,
                      selectedMonth: null
                    })} className={`${filters.dateRange === option.value && !filters.selectedMonth ? 'bg-accent' : ''} ${option.showSortIcons ? 'flex items-center justify-between' : ''}`}>
                          <span>{option.label}</span>
                          {option.showSortIcons && (
                            <div className="flex items-center gap-1 ml-2">
                              <ArrowUp 
                                className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sortByDate('asc');
                                }}
                              />
                              <ArrowDown 
                                className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sortByDate('desc');
                                }}
                              />
                            </div>
                          )}
                        </DropdownMenuItem>)}
                      <DropdownMenuItem onClick={() => setMonthPickerOpen(true)} className={filters.selectedMonth ? 'bg-accent' : ''}>
                        {filters.selectedMonth ? getMonthDisplayText() : 'Select Month...'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>

                {/* Client Filter */}
                <th className="px-3 py-2 text-left font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-between">
                        Client
                        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="start">
                      <DropdownMenuItem onClick={() => setFilters({
                      ...filters,
                      client: 'all'
                    })} className={filters.client === 'all' ? 'bg-accent' : ''}>
                        All Clients
                      </DropdownMenuItem>
                      {uniqueClients.map(client => <DropdownMenuItem key={client} onClick={() => setFilters({
                      ...filters,
                      client: client
                    })} className={filters.client === client ? 'bg-accent' : ''}>
                          {client}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>

                {/* Product Filter */}
                <th className="px-3 py-2 text-left font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-between">
                        Product
                        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="start">
                      <DropdownMenuItem onClick={() => setFilters({
                      ...filters,
                      productName: 'all'
                    })} className={filters.productName === 'all' ? 'bg-accent' : ''}>
                        All Products
                      </DropdownMenuItem>
                      {uniqueProducts.map(product => <DropdownMenuItem key={product} onClick={() => setFilters({
                      ...filters,
                      productName: product
                    })} className={filters.productName === product ? 'bg-accent' : ''}>
                          {product}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>

                {/* Non-filterable columns */}
                <th className="px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-center font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-center font-medium">SI#</th>

                {/* DR Filter */}
                <th className="px-3 py-2 text-center font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-auto p-1 font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
                      >
                        DR#
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-[100]" align="start">
                      <DropdownMenuItem onClick={() => setFilters({
                      ...filters,
                      drNumber: 'all'
                    })} className={`${filters.drNumber === 'all' ? 'bg-accent' : ''} flex items-center justify-between`}>
                        <span>All DR Numbers</span>
                        <div className="flex items-center gap-1 ml-2">
                          <ArrowUp 
                            className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                            onClick={(e) => {
                              e.stopPropagation();
                              sortByDR('asc');
                            }}
                          />
                          <ArrowDown 
                            className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                            onClick={(e) => {
                              e.stopPropagation();
                              sortByDR('desc');
                            }}
                          />
                        </div>
                      </DropdownMenuItem>
                      {uniqueDRNumbers.map(dr => <DropdownMenuItem key={dr} onClick={() => setFilters({
                      ...filters,
                      drNumber: dr
                    })} className={filters.drNumber === dr ? 'bg-accent' : ''}>
                          {dr}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>

                {/* PO Filter */}
                <th className="px-3 py-2 text-center font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-between">
                        PO#
                        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="start">
                      <DropdownMenuItem onClick={() => setFilters({
                      ...filters,
                      poNumber: 'all'
                    })} className={`${filters.poNumber === 'all' ? 'bg-accent' : ''} flex items-center justify-between`}>
                        <span>All PO Numbers</span>
                        <div className="flex items-center gap-1 ml-2">
                          <ArrowUp 
                            className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                            onClick={(e) => {
                              e.stopPropagation();
                              sortByPO('asc');
                            }}
                          />
                          <ArrowDown 
                            className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" 
                            onClick={(e) => {
                              e.stopPropagation();
                              sortByPO('desc');
                            }}
                          />
                        </div>
                      </DropdownMenuItem>
                      {uniquePONumbers.map(po => <DropdownMenuItem key={po} onClick={() => setFilters({
                      ...filters,
                      poNumber: po
                    })} className={filters.poNumber === po ? 'bg-accent' : ''}>
                          {po}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    {transactions.length === 0 ? "No transaction records found." : "No transactions match the current filters."}
                    {hasActiveFilters() && (
                      <div className="mt-2">
                        <Button onClick={clearFilters} variant="outline" size="sm">
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className={`border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${getPOBackgroundColor(transaction.poNumber)}`}>
                    <td className="px-3 py-3 text-center">
                      {/* No expand/collapse icon for flat list */}
                    </td>
                    <td className="px-3 py-3">
                      {editMode ? (
                        <EditableCell
                          transaction={transaction}
                          field="fulfillmentStatus"
                          value={transaction.fulfillmentStatus}
                          isSelect={true}
                          selectOptions={['PAID', 'UNPAID', 'Advance Delivery', 'Pending', 'UNACCOUNTED']}
                        />
                      ) : (
                        <Badge variant={getFulfillmentBadgeVariant(transaction.fulfillmentStatus)} className="text-xs">
                          {transaction.fulfillmentStatus}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      {transaction.date ? format(new Date(transaction.date), 'MM/dd/yyyy') : '-'}
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      <div className="truncate max-w-[120px]" title={transaction.client || '-'}>
                        <EditableCell
                          transaction={transaction}
                          field="client"
                          value={transaction.client || '-'}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-foreground">
                      <div className="truncate max-w-[140px]" title={transaction.productName}>
                        <EditableCell
                          transaction={transaction}
                          field="productName"
                          value={transaction.productName}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      {editMode ? (
                        <EditableCell
                          transaction={transaction}
                          field="qty"
                          value={transaction.qty}
                          isNumeric={true}
                        />
                      ) : (
                        transaction.type === 'fulfillment' ? (
                          <span className="font-medium">
                            {transaction.qty}/{transaction.qty}
                          </span>
                        ) : transaction.type === 'pending_po' ? (
                          <span className="text-muted-foreground">
                            0/{transaction.qty}
                          </span>
                        ) : (
                          <span className="text-blue-600 font-medium">
                            {transaction.qty}
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      <EditableCell
                        transaction={transaction}
                        field="price"
                        value={transaction.price}
                        isNumeric={true}
                      />
                    </td>
                    <td className="px-3 py-3 text-right text-foreground font-medium">
                      ₱{transaction.total.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      <EditableCell
                        transaction={transaction}
                        field="siNumber"
                        value={transaction.siNumber || '-'}
                      />
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      {transaction.drNumber ? (
                        editMode ? (
                          <EditableCell
                            transaction={transaction}
                            field="drNumber"
                            value={transaction.drNumber}
                          />
                        ) : (
                          <button onClick={(e) => {e.stopPropagation(); handleDRClick(transaction.drNumber);}} className="text-xs bg-muted px-2 py-1 rounded hover:bg-accent transition-colors">
                            {transaction.drNumber}
                          </button>
                        )
                      ) : (
                        <span className="text-xs bg-muted px-2 py-1 rounded">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-foreground">
                      {transaction.poNumber ? (
                        editMode ? (
                          <EditableCell
                            transaction={transaction}
                            field="poNumber"
                            value={transaction.poNumber}
                          />
                        ) : (
                          <button onClick={(e) => {e.stopPropagation(); handlePOClick(transaction.poNumber);}} className="text-xs bg-muted px-2 py-1 rounded hover:bg-accent transition-colors">
                            {transaction.poNumber}
                          </button>
                        )
                      ) : (
                        <span className="text-xs bg-muted px-2 py-1 rounded">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Statistics - improved styling */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6">
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredTransactions.filter(t => t.fulfillmentStatus === 'PAID').length}
              </p>
              <p className="text-sm text-muted-foreground">PAID</p>
              {hasActiveFilters() && <p className="text-xs text-muted-foreground mt-1">
                  of {transactions.filter(t => t.fulfillmentStatus === 'PAID').length} total
                </p>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {filteredTransactions.filter(t => t.fulfillmentStatus === 'UNPAID').length}
              </p>
              <p className="text-sm text-muted-foreground">UNPAID</p>
              {hasActiveFilters() && <p className="text-xs text-muted-foreground mt-1">
                  of {transactions.filter(t => t.fulfillmentStatus === 'UNPAID').length} total
                </p>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {filteredTransactions.filter(t => t.fulfillmentStatus === 'Advance Delivery').length}
              </p>
              <p className="text-sm text-muted-foreground">Advance Delivery</p>
              {hasActiveFilters() && <p className="text-xs text-muted-foreground mt-1">
                  of {transactions.filter(t => t.fulfillmentStatus === 'Advance Delivery').length} total
                </p>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">
                {filteredTransactions.filter(t => t.fulfillmentStatus === 'Pending').length}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
              {hasActiveFilters() && <p className="text-xs text-muted-foreground mt-1">
                  of {transactions.filter(t => t.fulfillmentStatus === 'Pending').length} total
                </p>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {filteredTransactions.filter(t => t.fulfillmentStatus === 'UNACCOUNTED').length}
              </p>
              <p className="text-sm text-muted-foreground">UNACCOUNTED</p>
              {hasActiveFilters() && <p className="text-xs text-muted-foreground mt-1">
                  of {transactions.filter(t => t.fulfillmentStatus === 'UNACCOUNTED').length} total
                </p>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                ₱{filteredTransactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Value</p>
              {hasActiveFilters() && <p className="text-xs text-muted-foreground mt-1">
                  of ₱{transactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()} total
                </p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Picker Dialog */}
      <Dialog open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Select Month</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Year Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold w-24 text-center">
                {selectedYear}
              </span>
              <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({
              length: 12
            }, (_, i) => {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              return <Button key={i} variant={selectedMonth === i ? "default" : "outline"} size="sm" onClick={() => handleMonthSelect(i)} className="h-10">
                    {monthNames[i]}
                  </Button>;
            })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClearMonthFilter}>
                Clear
              </Button>
              <Button onClick={handleApplyMonthFilter} disabled={selectedMonth === null}>
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PO Detail Modal */}
      <PODetailModal open={poDetailOpen} onOpenChange={setPODetailOpen} poNumber={selectedPONumber} />

      {/* DR Detail Modal */}
      <DRDetailModal open={drDetailOpen} onOpenChange={setDRDetailOpen} drNumber={selectedDRNumber} />

      {/* Unaccounted Items Modal */}
      <UnaccountedItemsModal 
        open={unaccountedModalOpen} 
        onOpenChange={setUnaccountedModalOpen} 
        drNumbers={selectedUnaccountedDRs} 
      />
    </div>
  );
}