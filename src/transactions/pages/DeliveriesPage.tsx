import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package } from "lucide-react";
import { ExpandCollapseButton } from "@/components/ui/expand-collapse-button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { format } from "date-fns";
interface DeliveryItem {
  id: string;
  product_id: string;
  quantity_delivered: number;
  products: {
    id: string;
    name: string;
  };
}
interface DeliveryRecord {
  id: string;
  delivery_receipt_number: string;
  delivery_date: string;
  created_at: string;
  client_id: string;
  clients: {
    id: string;
    name: string;
  };
  delivery_items: DeliveryItem[];
}
interface GroupedDeliveryItem {
  id: string;
  productName: string;
  qty: number;
  drNumber: string;
  client: string;
  date: string;
}
interface DeliveriesPageProps {
  searchQuery?: string;
}
export default function DeliveriesPage({
  searchQuery = ""
}: DeliveriesPageProps) {
  const {
    toast
  } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDRs, setExpandedDRs] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    loadDeliveryData();
    
    // Set up real-time subscription for deliveries
    const subscription = supabase
      .channel('deliveries_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'deliveries' 
        }, 
        () => {
          // Refresh data when deliveries table changes
          loadDeliveryData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'delivery_items' 
        }, 
        () => {
          // Refresh data when delivery_items table changes
          loadDeliveryData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const loadDeliveryData = async () => {
    try {
      setLoading(true);
      const {
        data: deliveriesData,
        error
      } = await supabase.from('deliveries').select(`
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
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setDeliveries(deliveriesData || []);
    } catch (error) {
      console.error('Error loading delivery data:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const groupDeliveriesByDR = () => {
    const grouped: {
      [key: string]: GroupedDeliveryItem[];
    } = {};
    deliveries.forEach(delivery => {
      const drNumber = delivery.delivery_receipt_number;
      delivery.delivery_items.forEach(item => {
        const deliveryItem: GroupedDeliveryItem = {
          id: `${delivery.id}-${item.id}`,
          productName: item.products.name,
          qty: item.quantity_delivered,
          drNumber: drNumber,
          client: delivery.clients.name,
          date: delivery.delivery_date || delivery.created_at
        };
        if (!grouped[drNumber]) {
          grouped[drNumber] = [];
        }
        grouped[drNumber].push(deliveryItem);
      });
    });
    return grouped;
  };
  const getAggregatedDRData = (items: GroupedDeliveryItem[]) => {
    if (items.length === 0) return null;
    const firstItem = items[0];
    const uniqueProducts = new Set(items.map(item => item.productName)).size;
    const totalQuantity = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    return {
      ...firstItem,
      aggregatedData: {
        uniqueProductCount: uniqueProducts,
        totalQuantity,
        itemCount: items.length
      }
    };
  };
  const toggleDRExpansion = (drNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newExpanded = new Set(expandedDRs);
    if (newExpanded.has(drNumber)) {
      newExpanded.delete(drNumber);
    } else {
      newExpanded.add(drNumber);
    }
    setExpandedDRs(newExpanded);
  };
  if (loading) {
    return <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading deliveries...</p>
        </div>
      </div>;
  }
  const groupedDeliveries = groupDeliveriesByDR();

  // Filter deliveries based on search query
  const filteredDRNumbers = Object.keys(groupedDeliveries).filter(drNumber => {
    if (!searchQuery.trim()) return true;
    const drItems = groupedDeliveries[drNumber];
    const searchLower = searchQuery.toLowerCase().trim();
    return drItems.some(item => item.drNumber.toLowerCase().includes(searchLower) || item.client.toLowerCase().includes(searchLower) || item.productName.toLowerCase().includes(searchLower));
  });
  const drNumbers = filteredDRNumbers;
  return <div className="space-y-6 p-4">
      

      <Card>
        <CardHeader>
          <CardTitle>Delivery Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 bg-muted/80 border-r border-border text-center font-mono text-xs text-muted-foreground">#</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product/SKU</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">DR#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drNumbers.length === 0 ? <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No delivery records found.
                    </TableCell>
                  </TableRow> : drNumbers.sort((a, b) => {
                // Sort by date (newest first) 
                const dateA = new Date(groupedDeliveries[a][0].date);
                const dateB = new Date(groupedDeliveries[b][0].date);
                return dateB.getTime() - dateA.getTime();
              }).map((drNumber, index) => {
                const drItems = groupedDeliveries[drNumber];
                const aggregatedData = getAggregatedDRData(drItems);
                const isExpanded = expandedDRs.has(drNumber);
                if (!aggregatedData) return null;

                // If only one item, render as a regular row (no expand/collapse)
                if (drItems.length === 1) {
                  const item = drItems[0];
                  return <TableRow key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                          <TableCell className="px-3 py-3 text-center bg-muted/40 border-r border-border font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center">
                            {/* No expand/collapse icon for single items */}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-foreground">
                            {item.date ? format(new Date(item.date), 'MM/dd/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-foreground">
                            <div className="truncate max-w-[120px]" title={item.client || '-'}>
                              {item.client || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-foreground">
                            <div className="truncate max-w-[140px]" title={item.productName}>
                              {item.productName}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center text-foreground font-medium">
                            {item.qty}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center text-foreground">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {item.drNumber}
                            </span>
                          </TableCell>
                        </TableRow>;
                }
                return <React.Fragment key={drNumber}>
                        {/* Collapsed/Summary Row */}
                        <TableRow className="border-b border-border hover:bg-muted/50 transition-colors">
                          <TableCell className="px-3 py-3 text-center bg-muted/40 border-r border-border font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center">
                            <ExpandCollapseButton isExpanded={isExpanded} onClick={e => toggleDRExpansion(drNumber, e)} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-foreground">
                            {aggregatedData.date ? format(new Date(aggregatedData.date), 'MM/dd/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-foreground">
                            <div className="truncate max-w-[120px]" title={aggregatedData.client || '-'}>
                              {aggregatedData.client || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-foreground">
                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                              {aggregatedData.aggregatedData.uniqueProductCount} SKU
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center text-foreground font-medium">
                            <span className="text-sm">
                              {aggregatedData.aggregatedData.totalQuantity}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-center text-foreground">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {drNumber}
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Expanded/Detail Rows */}
                        {isExpanded && drItems.map(item => <TableRow key={`expanded-${item.id}`} className="border-b border-border last:border-b-0 bg-muted/20 hover:bg-muted/30 transition-colors">
                            <TableCell className="px-3 py-3 text-center bg-muted/40 border-r border-border">
                              {/* Empty cell for expanded rows */}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-center">
                              <Package className="h-3 w-3 text-muted-foreground ml-4" />
                            </TableCell>
                            <TableCell className="px-3 py-3 text-foreground">
                              {item.date ? format(new Date(item.date), 'MM/dd/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-foreground">
                              <div className="truncate max-w-[120px]" title={item.client || '-'}>
                                {item.client || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 text-foreground">
                              <div className="truncate max-w-[140px]" title={item.productName}>
                                {item.productName}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 text-center text-foreground font-medium">
                              {item.qty}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-center text-foreground">
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {item.drNumber}
                              </span>
                            </TableCell>
                          </TableRow>)}
                      </React.Fragment>;
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>;
}