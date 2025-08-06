import React, { useState, useEffect } from "react";
import { useDeliveries } from "@/hooks/useDeliveries";
import { format } from "date-fns";
import { PODetailModal } from "@/transactions/components/PODetailModal";
import { DRDetailModal } from "@/transactions/components/DRDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeliveriesPageProps {
  isEditMode?: boolean;
}

export default function DeliveriesPage({ isEditMode = false }: DeliveriesPageProps) {
  const { deliveries, refetch } = useDeliveries();
  const [selectedDRNumber, setSelectedDRNumber] = useState<string | null>(null);
  const [selectedPONumber, setSelectedPONumber] = useState<string | null>(null);
  const [drDetailOpen, setDRDetailOpen] = useState(false);
  const [poDetailOpen, setPODetailOpen] = useState(false);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<{ [key: string]: any[] }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<{ drNumber: string; description: string } | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    drNumber: 'all',
    client: 'all',
    dateRange: 'all',
    selectedMonth: null as {
      month: number;
      year: number;
    } | null
  });

  // Load fulfillments to get PO data like DRDetailModal does
  useEffect(() => {
    loadFulfillments();
  }, []);

  // Apply filters when deliveries or filters change
  useEffect(() => {
    applyFilters();
  }, [deliveries, filters, fulfillments]); // Added fulfillments dependency

  // Initialize filteredDeliveries when deliveries first load
  useEffect(() => {
    if (deliveries.length > 0 && Object.keys(filteredDeliveries).length === 0) {
      applyFilters();
    }
  }, [deliveries]);

  const loadFulfillments = async () => {
    try {
      const { data: fulfillmentData, error: fulfillmentError } = await supabase
        .from('fulfillments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fulfillmentError) throw fulfillmentError;

      // Get additional data for display (same logic as DRDetailModal)
      const enrichedFulfillments = await Promise.all(
        (fulfillmentData || []).map(async (fulfillment) => {
          // Get PO info
          const { data: poData } = await supabase
            .from('purchase_orders')
            .select('client_po')
            .eq('id', fulfillment.po_id)
            .single();

          return {
            ...fulfillment,
            client_po: poData?.client_po
          };
        })
      );

      setFulfillments(enrichedFulfillments);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
      setFulfillments([]);
    }
  };

  // Apply filters function
  const applyFilters = () => {
    const groupedDeliveries = groupDeliveriesByDRNumber(deliveries);
    let filtered: { [key: string]: any[] } = {};

    Object.keys(groupedDeliveries).forEach(drNumber => {
      const drDeliveries = groupedDeliveries[drNumber];
      const firstDelivery = drDeliveries[0];

      // Get purpose from delivery items (check first item's purpose as status)
      const purposeFromItems = drDeliveries
        .flatMap(delivery => delivery.delivery_items || [])
        .find(item => item.purpose && item.purpose.trim() !== '')?.purpose;
      
      // Calculate delivery status - check purpose first, then fallback to original logic
      let deliveryStatus = purposeFromItems;
      
      if (!deliveryStatus) {
        const deliveryFulfillments = fulfillments.filter(f => f.dr_id === firstDelivery.id);
        const hasRemainingQuantity = drDeliveries.some(delivery => 
          delivery.delivery_items?.some((item: any) => {
            const itemFulfillments = deliveryFulfillments.filter(f => 
              f.product_name === item.products?.name || 
              f.po_item_id === item.product_id
            );
            const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
            return item.quantity_delivered > totalFulfilled;
          })
        );
        deliveryStatus = hasRemainingQuantity ? "Advance Delivery" : "Completed";
      }

      // Get PO numbers (only needed for filtering)
      const deliveryFulfillments = fulfillments.filter(f => f.dr_id === firstDelivery.id);
      const poNumbers = new Set<string>();
      deliveryFulfillments.forEach(fulfillment => {
        if (fulfillment.client_po) {
          poNumbers.add(fulfillment.client_po);
        }
      });
      drDeliveries.forEach(delivery => {
        if (delivery.purchase_order?.client_po) {
          poNumbers.add(delivery.purchase_order.client_po);
        }
      });
      const displayPO = Array.from(poNumbers).join(', ') || '-';

      // Apply filters
      let shouldInclude = true;

      if (filters.status !== 'all') {
        shouldInclude = shouldInclude && deliveryStatus === filters.status;
      }

      if (filters.drNumber !== 'all') {
        shouldInclude = shouldInclude && drNumber.toLowerCase().includes(filters.drNumber.toLowerCase());
      }


      if (filters.client !== 'all') {
        shouldInclude = shouldInclude && firstDelivery.client?.name?.toLowerCase().includes(filters.client.toLowerCase());
      }

      if (filters.dateRange !== 'all') {
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
        
        const deliveryDate = new Date(firstDelivery.delivery_date || firstDelivery.created_at);
        shouldInclude = shouldInclude && deliveryDate >= startDate && deliveryDate <= endDate;
      }

      if (filters.selectedMonth) {
        const { month, year } = filters.selectedMonth;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);
        const deliveryDate = new Date(firstDelivery.delivery_date || firstDelivery.created_at);
        shouldInclude = shouldInclude && deliveryDate >= startDate && deliveryDate <= endDate;
      }

      if (shouldInclude) {
        filtered[drNumber] = drDeliveries;
      }
    });

    setFilteredDeliveries(filtered);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      drNumber: 'all',
      client: 'all',
      dateRange: 'all',
      selectedMonth: null
    });
  };

  // Check if filters are active
  const hasActiveFilters = () => {
    return filters.status !== 'all' ||
           filters.drNumber !== 'all' ||
           filters.client !== 'all' ||
           filters.dateRange !== 'all' ||
           filters.selectedMonth !== null;
  };

  // Get unique values for filters
  const getUniqueStatuses = () => {
    const groupedDeliveries = groupDeliveriesByDRNumber(deliveries);
    const statuses = new Set<string>();
    Object.keys(groupedDeliveries).forEach(drNumber => {
      const drDeliveries = groupedDeliveries[drNumber];
      const firstDelivery = drDeliveries[0];
      
      // Get purpose from delivery items (check first item's purpose as status)
      const purposeFromItems = drDeliveries
        .flatMap(delivery => delivery.delivery_items || [])
        .find(item => item.purpose && item.purpose.trim() !== '')?.purpose;
      
      // Calculate delivery status - check purpose first, then fallback to original logic
      let deliveryStatus = purposeFromItems;
      
      if (!deliveryStatus) {
        const deliveryFulfillments = fulfillments.filter(f => f.dr_id === firstDelivery.id);
        const hasRemainingQuantity = drDeliveries.some(delivery => 
          delivery.delivery_items?.some((item: any) => {
            const itemFulfillments = deliveryFulfillments.filter(f => 
              f.product_name === item.products?.name || 
              f.po_item_id === item.product_id
            );
            const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
            return item.quantity_delivered > totalFulfilled;
          })
        );
        deliveryStatus = hasRemainingQuantity ? "Advance Delivery" : "Completed";
      }
      
      statuses.add(deliveryStatus);
    });
    return Array.from(statuses);
  };

  const getUniqueClients = () => {
    const groupedDeliveries = groupDeliveriesByDRNumber(deliveries);
    const clients = new Set<string>();
    Object.keys(groupedDeliveries).forEach(drNumber => {
      const drDeliveries = groupedDeliveries[drNumber];
      const firstDelivery = drDeliveries[0];
      if (firstDelivery.client?.name) {
        clients.add(firstDelivery.client.name);
      }
    });
    return Array.from(clients);
  };

  const getUniqueDRNumbers = () => {
    const groupedDeliveries = groupDeliveriesByDRNumber(deliveries);
    return Object.keys(groupedDeliveries).filter(dr => dr !== 'No DR#');
  };

  const getUniquePONumbers = () => {
    const groupedDeliveries = groupDeliveriesByDRNumber(deliveries);
    const poNumbers = new Set<string>();
    Object.keys(groupedDeliveries).forEach(drNumber => {
      const drDeliveries = groupedDeliveries[drNumber];
      const firstDelivery = drDeliveries[0];
      const deliveryFulfillments = fulfillments.filter(f => f.dr_id === firstDelivery.id);
      
      deliveryFulfillments.forEach(fulfillment => {
        if (fulfillment.client_po) {
          poNumbers.add(fulfillment.client_po);
        }
      });
      drDeliveries.forEach(delivery => {
        if (delivery.purchase_order?.client_po) {
          poNumbers.add(delivery.purchase_order.client_po);
        }
      });
    });
    return Array.from(poNumbers).filter(po => po !== '-');
  };

  // Helper function to group deliveries by DR number (extracted from TransactionRecord)
  const groupDeliveriesByDRNumber = (deliveries: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    deliveries.forEach(delivery => {
      const drNumber = delivery.delivery_receipt_number || 'No DR#';
      if (!grouped[drNumber]) {
        grouped[drNumber] = [];
      }
      grouped[drNumber].push(delivery);
    });
    
    return grouped;
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

  const handleDeleteClick = (drNumber: string, drDeliveries: any[]) => {
    const firstDelivery = drDeliveries[0];
    const totalItems = drDeliveries.reduce((sum, delivery) => sum + (delivery.delivery_items?.length || 0), 0);
    const clientName = firstDelivery.client?.name || 'Unknown Client';
    const deliveryDate = firstDelivery.delivery_date ? format(new Date(firstDelivery.delivery_date), 'MM/dd/yyyy') : 'No Date';
    
    const description = `DR: ${drNumber} | Client: ${clientName} | Date: ${deliveryDate} | ${totalItems} Item${totalItems !== 1 ? 's' : ''}`;
    
    setDeliveryToDelete({ drNumber, description });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deliveryToDelete) return;
    
    try {
      // Get all deliveries for this DR number
      const drDeliveries = filteredDeliveries[deliveryToDelete.drNumber];
      
      // Delete all deliveries with this DR number
      for (const delivery of drDeliveries) {
        const { error } = await supabase
          .from('deliveries')
          .delete()
          .eq('id', delivery.id);
        
        if (error) throw error;
      }
      
      // Refetch deliveries to update the table in real-time
      await refetch();
      
    } catch (error) {
      console.error('Error deleting delivery:', error);
    } finally {
      setShowDeleteDialog(false);
      setDeliveryToDelete(null);
    }
  };

  // Debug logging
  console.log('All deliveries data:', deliveries);
  if (deliveries.length > 0) {
    console.log('Sample delivery structure:', deliveries[0]);
  }

  return (
    <div className="space-y-4">
      {/* Deliveries Tab Content - Exact copy from TransactionRecord */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                {/* Row Number */}
                <th className="px-3 py-2 text-center font-medium w-12 bg-muted/80 border-r border-border font-mono text-xs text-muted-foreground">#</th>
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
                      <DropdownMenuItem 
                        onClick={() => setFilters({...filters, status: 'all'})} 
                        className={filters.status === 'all' ? 'bg-accent' : ''}
                      >
                        All Statuses
                      </DropdownMenuItem>
                      {getUniqueStatuses().map(status => (
                        <DropdownMenuItem 
                          key={status} 
                          onClick={() => setFilters({...filters, status: status})} 
                          className={filters.status === status ? 'bg-accent' : ''}
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
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
                      <DropdownMenuItem onClick={() => setFilters({...filters, dateRange: 'all'})} className={filters.dateRange === 'all' ? 'bg-accent' : ''}>
                        All Dates
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilters({...filters, dateRange: 'current-month'})} className={filters.dateRange === 'current-month' ? 'bg-accent' : ''}>
                        Current Month
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilters({...filters, dateRange: 'last-month'})} className={filters.dateRange === 'last-month' ? 'bg-accent' : ''}>
                        Last Month
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilters({...filters, dateRange: 'last-3-months'})} className={filters.dateRange === 'last-3-months' ? 'bg-accent' : ''}>
                        Last 3 Months
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
                      <DropdownMenuItem onClick={() => setFilters({...filters, client: 'all'})} className={filters.client === 'all' ? 'bg-accent' : ''}>
                        All Clients
                      </DropdownMenuItem>
                      {getUniqueClients().map(client => (
                        <DropdownMenuItem key={client} onClick={() => setFilters({...filters, client: client})} className={filters.client === client ? 'bg-accent' : ''}>
                          {client}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>

                {/* Non-filterable columns */}
                <th className="px-3 py-2 text-left font-medium">Items</th>
                <th className="px-3 py-2 text-center font-medium">Quantity</th>

                {/* DR Filter */}
                <th className="px-3 py-2 text-left font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer hover:bg-muted/50 transition-colors p-1 rounded flex items-center justify-between">
                        DR
                        <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="start">
                      <DropdownMenuItem onClick={() => setFilters({...filters, drNumber: 'all'})} className={filters.drNumber === 'all' ? 'bg-accent' : ''}>
                        All DR Numbers
                      </DropdownMenuItem>
                      {getUniqueDRNumbers().map(dr => (
                        <DropdownMenuItem key={dr} onClick={() => setFilters({...filters, drNumber: dr})} className={filters.drNumber === dr ? 'bg-accent' : ''}>
                          {dr}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const drNumbers = Object.keys(filteredDeliveries);

                if (drNumbers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        {deliveries.length === 0 ? "No delivery records found." : "No deliveries match the current filters."}
                        {hasActiveFilters() && (
                          <div className="mt-2">
                            <Button onClick={clearFilters} variant="outline" size="sm">
                              Clear Filters
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }

                return drNumbers
                  .sort((a, b) => {
                    // Sort by date (newest first)
                    const dateA = new Date(filteredDeliveries[a][0].delivery_date || filteredDeliveries[a][0].created_at);
                    const dateB = new Date(filteredDeliveries[b][0].delivery_date || filteredDeliveries[b][0].created_at);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((drNumber, index) => {
                  const drDeliveries = filteredDeliveries[drNumber];
                  const firstDelivery = drDeliveries[0];
                  const totalQuantity = drDeliveries.reduce((sum, delivery) => {
                    return sum + (delivery.delivery_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity_delivered, 0) || 0);
                  }, 0);
                   const totalItems = drDeliveries.reduce((sum, delivery) => sum + (delivery.delivery_items?.length || 0), 0);

                   // Get PO numbers using fulfillments like DRDetailModal does
                   const poNumbers = new Set<string>();
                   
                   // Get fulfillments for this delivery receipt (same logic as DRDetailModal)
                   const deliveryFulfillments = fulfillments.filter(f => f.dr_id === firstDelivery.id);
                   
                   console.log('Checking delivery fulfillments for DR', drNumber, ':', {
                     delivery_id: firstDelivery.id,
                     fulfillments_found: deliveryFulfillments.length,
                     fulfillments: deliveryFulfillments
                   });
                   
                   // Add PO numbers from fulfillments
                   deliveryFulfillments.forEach(fulfillment => {
                     if (fulfillment.client_po) {
                       poNumbers.add(fulfillment.client_po);
                     }
                   });
                   
                   // Also check direct purchase_order relationship as fallback
                   drDeliveries.forEach(delivery => {
                     if (delivery.purchase_order?.client_po) {
                       poNumbers.add(delivery.purchase_order.client_po);
                     }
                   });
                   
                   // Convert to array and join multiple PO numbers if any
                   const poNumbersArray = Array.from(poNumbers);
                   const displayPO = poNumbersArray.length > 0 ? poNumbersArray.join(', ') : null;
                   
                   console.log('Final PO display for DR', drNumber, ':', { poNumbersArray, displayPO });

                   // Get purpose from delivery items (check first item's purpose as status)
                   const purposeFromItems = drDeliveries
                     .flatMap(delivery => delivery.delivery_items || [])
                     .find(item => item.purpose && item.purpose.trim() !== '')?.purpose;
                   
                   // Calculate delivery status - check purpose first, then fallback to original logic
                   let deliveryStatus = purposeFromItems;
                   
                   if (!deliveryStatus) {
                     const hasRemainingQuantity = drDeliveries.some(delivery => 
                       delivery.delivery_items?.some((item: any) => {
                         const itemFulfillments = deliveryFulfillments.filter(f => 
                           f.product_name === item.products?.name || 
                           f.po_item_id === item.product_id
                         );
                         const totalFulfilled = itemFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
                         return item.quantity_delivered > totalFulfilled;
                       })
                     );
                     deliveryStatus = hasRemainingQuantity ? "Advance Delivery" : "Completed";
                   }

                   return (
                     <tr key={drNumber} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                        {/* Row Number or Delete Button */}
                        <td className="px-3 py-3 text-center bg-muted/40 border-r border-border font-mono text-xs text-muted-foreground">
                          {isEditMode ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(drNumber, drDeliveries);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          ) : (
                            index + 1
                          )}
                        </td>
                       <td className="px-3 py-3 text-foreground">
                         <span className={`text-xs px-2 py-1 rounded ${
                           deliveryStatus === 'Completed' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-blue-100 text-blue-800'
                         }`}>
                           {deliveryStatus}
                         </span>
                       </td>
                       <td className="px-3 py-3 text-foreground">
                         {firstDelivery.delivery_date ? format(new Date(firstDelivery.delivery_date), 'MM/dd/yyyy') : '-'}
                       </td>
                       <td className="px-3 py-3 text-foreground">
                         <div className="truncate max-w-[120px]" title={firstDelivery.client?.name || '-'}>
                           {firstDelivery.client?.name || '-'}
                         </div>
                       </td>
                       <td className="px-3 py-3 text-foreground">
                         <span className="text-xs bg-secondary px-2 py-1 rounded">
                           {totalItems} Item{totalItems !== 1 ? 's' : ''}
                         </span>
                       </td>
                        <td className="px-3 py-3 text-center text-foreground font-medium">
                          {totalQuantity}
                        </td>
                        <td className="px-3 py-3 text-foreground">
                          <button 
                            onClick={(e) => {e.stopPropagation(); handleDRClick(drNumber);}}
                            className="text-xs bg-muted px-2 py-1 rounded hover:bg-accent transition-colors"
                          >
                            {drNumber}
                          </button>
                        </td>
                     </tr>
                   );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Components - Same as in TransactionRecord */}
      <PODetailModal 
        open={poDetailOpen} 
        onOpenChange={setPODetailOpen} 
        poNumber={selectedPONumber} 
      />

      <DRDetailModal 
        open={drDetailOpen} 
        onOpenChange={setDRDetailOpen} 
        drNumber={selectedDRNumber} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this delivery? This action cannot be undone.
              <br /><br />
              <strong>{deliveryToDelete?.description}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}