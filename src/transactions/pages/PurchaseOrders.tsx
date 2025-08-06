import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus, Link, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrderForm } from "../components/PurchaseOrderForm";
import { AutoMatchFulfillmentDialog } from "../components/AutoMatchFulfillmentDialog";
import { DeliveryReceipt, PurchaseOrder, Fulfillment, LineItem } from "../types";

interface PurchaseOrderWithItems {
  id: string;
  purchase_order_number?: string;
  supplier_name?: string;
  status?: string;
  payment_status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  client_po?: string;
  sale_invoice_number?: string;
  expected_delivery_date?: string;
  due_date?: string;
  client_id?: string;
  purchase_order_items: Array<{
    id: string;
    quantity: number;
    products: {
      id: string;
      name: string;
    };
    client_product_pricing?: {
      quoted_price: number;
      margin_percentage: number;
    };
  }>;
}

interface DeliveryReceiptWithItems {
  id: string;
  dr_number: string;
  date: string;
  delivery_receipt_items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

export default function PurchaseOrders() {
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithItems[]>([]);
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceiptWithItems[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderWithItems | null>(null);
  const [showAutoMatchDialog, setShowAutoMatchDialog] = useState(false);
  const [drNumbers, setDrNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('PurchaseOrders useEffect running...');
    console.log('About to call loadDRNumbers...');
    loadDRNumbers();
    console.log('About to call other load functions...');
    loadPurchaseOrders();
    loadDeliveryReceipts();
    loadFulfillments();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            id,
            quantity,
            product_id,
            products (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get pricing data separately for each purchase order
      const ordersWithPricing = await Promise.all((data || []).map(async (order) => {
        const itemsWithPricing = await Promise.all(order.purchase_order_items?.map(async (item: any) => {
          // Get pricing for this product and client
          const { data: pricingData } = await supabase
            .from('product_clients')
            .select('quoted_price, margin_percentage')
            .eq('product_id', item.product_id)
            .eq('client_id', order.supplier_client_id)
            .single();
          
          return {
            ...item,
            client_product_pricing: pricingData
          };
        }) || []);
        
        return {
          ...order,
          purchase_order_items: itemsWithPricing
        };
      }));
      
      setPurchaseOrders(ordersWithPricing as any);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error loading purchase orders",
        description: "Failed to load purchase orders",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadDeliveryReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          delivery_receipt_number,
          delivery_date,
          delivery_items (
            id,
            quantity_delivered,
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to include item names directly
      const transformedDRs: DeliveryReceiptWithItems[] = (data || []).map(dr => ({
        id: dr.id,
        dr_number: dr.delivery_receipt_number || '',
        date: dr.delivery_date,
        delivery_receipt_items: (dr.delivery_items as any || []).map((item: any) => ({
          id: item.id,
          name: item.products?.name || 'Unknown',
          quantity: item.quantity_delivered || 0
        }))
      }));
      
      setDeliveryReceipts(transformedDRs);
    } catch (error) {
      console.error('Error loading delivery receipts:', error);
    }
  };

  const loadFulfillments = async () => {
    try {
      console.log('Loading fulfillments...');
      const { data, error } = await supabase
        .from('fulfillments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading fulfillments:', error);
        throw error;
      }
      
      console.log('Fulfillments data:', data);
      setFulfillments(data || []);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
      setFulfillments([]);
    }
  };

  const loadDRNumbers = async () => {
    try {
      console.log('=== loadDRNumbers function called ===');
      const { data, error } = await supabase
        .from('deliveries')
        .select('id, delivery_receipt_number');

      console.log('DR query result:', { data, error });
      if (error) throw error;
      
      const drNumberMap: Record<string, string> = {};
      (data || []).forEach(dr => {
        drNumberMap[dr.id] = dr.delivery_receipt_number;
      });
      
      console.log('Setting drNumbers to:', drNumberMap);
      setDrNumbers(drNumberMap);
    } catch (error) {
      console.error('Error loading DR numbers:', error);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    loadPurchaseOrders();
  };

  // Get fulfillment data for selected PO
  const getPOFulfillmentData = (po: PurchaseOrderWithItems) => {
    console.log('Getting PO fulfillment data for PO:', po.id);
    console.log('Available fulfillments:', fulfillments);
    
    return po.purchase_order_items.map(poItem => {
      const itemFulfillments = fulfillments.filter(f => f.po_item_id === poItem.id);
      console.log(`PO Item ${poItem.id} fulfillments:`, itemFulfillments);
      
      // Deduplicate fulfillments by dr_id to avoid double counting
      const uniqueFulfillments = itemFulfillments.reduce((acc, current) => {
        const existing = acc.find(item => item.dr_id === current.dr_id);
        if (!existing) {
          acc.push(current);
        } else {
          // If there are duplicates, keep the one with higher fulfilled_quantity
          if (current.fulfilled_quantity > existing.fulfilled_quantity) {
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
        }
        return acc;
      }, [] as typeof itemFulfillments);
      
      const totalFulfilled = uniqueFulfillments.reduce((sum, f) => sum + f.fulfilled_quantity, 0);
      const remaining = Math.max(0, poItem.quantity - totalFulfilled);
      const status = totalFulfilled === 0 ? 'unfulfilled' : 
                   remaining === 0 ? 'fulfilled' : 'partial';

      console.log(`PO Item ${poItem.id}: ordered=${poItem.quantity}, fulfilled=${totalFulfilled}, remaining=${remaining}, status=${status}`);

      return {
        ...poItem,
        totalFulfilled,
        remaining,
        status,
        fulfillments: uniqueFulfillments
      };
    });
  };

  const handleCreateFulfillments = async (fulfillments: Array<{
    dr_id: string;
    dr_item_id: string;
    po_id: string;
    po_item_id: string;
    fulfilled_quantity: number;
    date: string;
  }>) => {
    try {
      const { error } = await supabase
        .from('fulfillments')
        .insert(fulfillments.map(f => ({
          dr_id: f.dr_id,
          dr_item_id: f.dr_item_id,
          po_id: f.po_id,
          po_item_id: f.po_item_id,
          fulfilled_quantity: f.fulfilled_quantity,
          date: f.date
        })));

      if (error) throw error;

      toast({
        title: "Fulfillments created successfully",
        description: `Created ${fulfillments.length} fulfillment records`,
      });

      // Reload data to refresh the UI
      loadPurchaseOrders();
      loadFulfillments();
      loadDRNumbers();
    } catch (error) {
      toast({
        title: "Error creating fulfillments",
        description: "Failed to create fulfillment records",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (poId: string, poNumber: string) => {
    try {
      // Skip fulfillment check for now since table doesn't exist in types
      // TODO: Add fulfillment check once types are updated

      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId);

      if (error) throw error;

      toast({
        title: "Purchase order deleted",
        description: `${poNumber} has been deleted successfully`,
      });

      loadPurchaseOrders();
    } catch (error) {
      toast({
        title: "Error deleting purchase order",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    }
  };

  if (showForm) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="flex justify-center">
          <PurchaseOrderForm 
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  if (selectedPO) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Button 
                onClick={() => setSelectedPO(null)}
                variant="outline"
              >
                ← Back to List
              </Button>
               <Button 
                onClick={() => setShowAutoMatchDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Link className="w-4 h-4 mr-2" />
                Link to DR
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                 <div>
                   <CardTitle className="text-2xl text-primary">
                     Purchase Order {selectedPO.client_po || `PO-${selectedPO.id.slice(0, 8)}`}
                   </CardTitle>
                   <p className="text-muted-foreground mt-1">
                     Date: {selectedPO.created_at ? new Date(selectedPO.created_at).toLocaleDateString() : 'N/A'}
                   </p>
                   {selectedPO.supplier_name && (
                     <p className="text-muted-foreground">
                       Supplier: {selectedPO.supplier_name}
                     </p>
                   )}
                   <p className="text-muted-foreground">
                     Status: <Badge variant="outline">{selectedPO.status}</Badge>
                   </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Items & Fulfillment Status</h3>
                <Table>
                   <TableHeader>
                     <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Ordered Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fulfilled Qty</TableHead>
                        <TableHead>Remaining Qty</TableHead>
                         <TableHead>Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                      {getPOFulfillmentData(selectedPO).map((item) => {
                        const unitPrice = item.client_product_pricing?.quoted_price || 0;
                        const total = unitPrice * item.quantity;
                        
                        return (
                          <TableRow key={item.id}>
                             <TableCell>
                               <div>
                                  <div className="font-medium">{item.products.name}</div>
                                  {item.fulfillments.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Fulfilled by DR: {Array.from(new Set(item.fulfillments.map(f => {
                                        console.log(`Mapping dr_id: ${f.dr_id} to: ${drNumbers[f.dr_id]} (drNumbers:`, drNumbers, ')');
                                        return drNumbers[f.dr_id] || f.dr_id;
                                      }))).filter(Boolean).join(', ')}
                                    </div>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₱{unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">₱{total.toLocaleString()}</TableCell>
                            <TableCell className="text-primary font-medium">
                              {item.totalFulfilled}
                            </TableCell>
                            <TableCell className={item.remaining > 0 ? "text-orange-600 font-medium" : ""}>
                              {item.remaining}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.status === 'fulfilled' ? 'default' : 
                                  item.status === 'partial' ? 'secondary' : 'outline'
                                }
                                 className={
                                   item.status === 'fulfilled' ? 'bg-primary' :
                                  item.status === 'partial' ? 'bg-yellow-500' : ''
                                }
                              >
                                {item.status}
                               </Badge>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                   </TableBody>
                 </Table>
              </div>
              
              {selectedPO.purchase_order_items.some(item => 
                getPOFulfillmentData(selectedPO).find(fd => fd.id === item.id)?.remaining > 0
              ) && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Fulfillment Summary</h4>
                  <p className="text-sm text-orange-700">
                    This purchase order has items that are not fully fulfilled. 
                    Click "Link to DR" to fulfill remaining quantities.
                  </p>
                </div>
              )}
               
                 <div className="flex justify-end pt-4 border-t">
                   <div className="space-y-2 text-right">
                     <div className="text-lg">
                       Items: {selectedPO.purchase_order_items.length}
                     </div>
                     <div className="text-xl font-bold">
                       Total: ₱{selectedPO.purchase_order_items
                         .reduce((sum, item) => {
                           const unitPrice = item.client_product_pricing?.quoted_price || 0;
                           return sum + (unitPrice * item.quantity);
                         }, 0)
                         .toLocaleString()}
                     </div>
                   </div>
                 </div>
            </CardContent>
          </Card>
        </div>
        
        {selectedPO && (
          <AutoMatchFulfillmentDialog
            open={showAutoMatchDialog}
            onOpenChange={setShowAutoMatchDialog}
            selectedPO={selectedPO as any}
            onCreateFulfillments={handleCreateFulfillments}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-primary">Purchase Orders</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New PO
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading purchase orders...</p>
        </div>
      ) : purchaseOrders.length === 0 ? (
        <Card className="shadow-sm border-border/40">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No purchase orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-0 overflow-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                 <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items Count</TableHead>
                    <TableHead>Fulfilled QTY</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {purchaseOrders.map((po) => {
                   const poFulfillmentData = getPOFulfillmentData(po);
                   const totalOrdered = poFulfillmentData.reduce((sum, item) => sum + item.quantity, 0);
                   const totalFulfilled = poFulfillmentData.reduce((sum, item) => sum + item.totalFulfilled, 0);
                   
                   // Calculate fulfillment status based on actual fulfillment data
                   const calculateFulfillmentStatus = () => {
                     if (totalFulfilled === 0) {
                       return 'Pending';
                     } else if (totalFulfilled >= totalOrdered) {
                       return 'Delivered';
                     } else {
                       return 'Partial';
                     }
                   };
                   
                   const fulfillmentStatus = calculateFulfillmentStatus();
                   
                   return (
                     <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.client_po || `PO-${po.id.slice(0, 8)}`}</TableCell>
                        <TableCell>{po.created_at ? new Date(po.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{po.supplier_name || 'N/A'}</TableCell>
                        <TableCell>{po.purchase_order_items.length}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-primary font-medium">{totalFulfilled}</span>
                            <span className="text-xs text-muted-foreground">of {totalOrdered}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              fulfillmentStatus === 'Delivered' ? 'default' : 
                              fulfillmentStatus === 'Partial' ? 'secondary' : 'outline'
                            }
                            className={
                              fulfillmentStatus === 'Delivered' ? 'bg-primary text-white' :
                              fulfillmentStatus === 'Partial' ? 'bg-secondary text-secondary-foreground' : 
                              'bg-muted text-muted-foreground'
                            }
                          >
                            {fulfillmentStatus}
                          </Badge>
                        </TableCell>
                     <TableCell>
                       <div className="flex space-x-2">
                         <Button
                           onClick={() => setSelectedPO(po)}
                           variant="outline"
                           size="sm"
                         >
                           <Eye className="w-4 h-4 mr-2" />
                           View
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
                               <AlertDialogDescription>
                                  Are you sure you want to delete "{po.client_po || `PO-${po.id.slice(0, 8)}`}"? This action cannot be undone.
                                </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => handleDelete(po.id, po.client_po || `PO-${po.id.slice(0, 8)}`)}
                                 className="bg-red-600 hover:bg-red-700"
                               >
                                 Delete
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                        </div>
                        </TableCell>
                     </TableRow>
                   );
                 })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}