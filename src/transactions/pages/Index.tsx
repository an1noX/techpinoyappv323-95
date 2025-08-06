import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ShoppingCart, Link2, Eye, List, Package, Receipt } from "lucide-react";
import { DeliveryReceiptForm } from "../components/DeliveryReceiptForm";
import { PurchaseOrderForm } from "../components/PurchaseOrderForm";
import { FulfillmentDialog } from "../components/FulfillmentDialog";
import { StatusBadge } from "../components/StatusBadge";
import { useFulfillmentData } from "../hooks/useFulfillmentData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DeliveryReceipt, PurchaseOrder, Fulfillment } from "../types";

const Index = () => {
  const { toast } = useToast();
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDRForm, setShowDRForm] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [showFulfillmentDialog, setShowFulfillmentDialog] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'fulfillment'>('overview');

  const { updatedDeliveryReceipts, getFulfillmentForItem, getPOItem } = useFulfillmentData(
    deliveryReceipts, 
    purchaseOrders, 
    fulfillments
  );

  useEffect(() => {
    loadAllData();
    
    // Set up real-time subscriptions
    const drChannel = supabase
      .channel('delivery_receipts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_receipts' }, () => {
        loadDeliveryReceipts();
      })
      .subscribe();

    const poChannel = supabase
      .channel('purchase_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => {
        loadPurchaseOrders();
      })
      .subscribe();

    const fulfillmentChannel = supabase
      .channel('fulfillments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fulfillments' }, () => {
        loadFulfillments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(drChannel);
      supabase.removeChannel(poChannel);
      supabase.removeChannel(fulfillmentChannel);
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDeliveryReceipts(),
        loadPurchaseOrders(),
        loadFulfillments()
      ]);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load application data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_receipts')
        .select(`
          *,
          delivery_receipt_items (
            id,
            quantity,
            unit_price,
            total,
            product_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match expected format
      const transformedDRs: DeliveryReceipt[] = (data || []).map(dr => ({
        id: dr.id,
        drNumber: dr.dr_number,
        date: dr.date,
        totalAmount: (dr as any).total_amount,
        status: dr.status as 'unfulfilled' | 'partial' | 'fulfilled',
        items: (dr as any).delivery_receipt_items.map((item: any) => ({
          id: item.id,
          name: `Product ${item.product_id}`,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total
        }))
      }));

      setDeliveryReceipts(transformedDRs);
    } catch (error) {
      console.error('Error loading delivery receipts:', error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            id,
            quantity,
            unit_price,
            total,
            product_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match expected format
      const transformedPOs: PurchaseOrder[] = (data || []).map(po => ({
        id: po.id,
        poNumber: (po as any).po_number,
        date: (po as any).date,
        vendor: (po as any).vendor,
        totalAmount: (po as any).total_amount,
        items: (po as any).purchase_order_items.map((item: any) => ({
          id: item.id,
          name: `Product ${item.product_id}`,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total
        }))
      }));

      setPurchaseOrders(transformedPOs);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const loadFulfillments = async () => {
    try {
      const { data, error } = await supabase
        .from('fulfillments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to match expected format
      const transformedFulfillments: Fulfillment[] = (data || []).map(fulfillment => ({
        id: fulfillment.id,
        drId: fulfillment.dr_id,
        drItemId: fulfillment.dr_item_id,
        poId: fulfillment.po_id,
        poItemId: fulfillment.po_item_id,
        fulfilledQuantity: fulfillment.fulfilled_quantity,
        date: fulfillment.date || fulfillment.created_at || new Date().toISOString()
      }));

      setFulfillments(transformedFulfillments);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
    }
  };

  const handleSaveDR = (dr: DeliveryReceipt) => {
    setDeliveryReceipts(prev => [...prev, dr]);
    setShowDRForm(false);
  };

  const handleSavePO = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, po]);
    setShowPOForm(false);
  };

  const handleCreateFulfillment = async (fulfillment: Fulfillment) => {
    try {
      const { data, error } = await supabase
        .from('fulfillments')
        .insert({
          dr_id: fulfillment.drId,
          dr_item_id: fulfillment.drItemId,
          po_id: fulfillment.poId,
          po_item_id: fulfillment.poItemId,
          fulfilled_quantity: fulfillment.fulfilledQuantity,
          date: fulfillment.date
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Fulfillment created",
        description: "Fulfillment record has been created successfully",
      });

      // Reload all data to refresh the UI
      loadAllData();
    } catch (error) {
      toast({
        title: "Error creating fulfillment",
        description: "Failed to create fulfillment record",
        variant: "destructive",
      });
    }
  };

  const getOverviewStats = () => {
    const totalDRs = deliveryReceipts.length;
    const totalPOs = purchaseOrders.length;
    const totalFulfillments = fulfillments.length;
    const fulfilledDRs = updatedDeliveryReceipts.filter(dr => dr.status === 'fulfilled').length;
    
    // Calculate remaining DR items (not linked to any PO)
    const totalDRItems = deliveryReceipts.reduce((sum, dr) => sum + dr.items.length, 0);
    const fulfilledDRItems = fulfillments.reduce((sum, f) => sum + f.fulfilledQuantity, 0);
    const remainingDRItems = totalDRItems - fulfilledDRItems;
    
    // Calculate unfulfilled PO items (not used to fulfill any DR)
    const totalPOItems = purchaseOrders.reduce((sum, po) => sum + po.items.length, 0);
    const usedPOItems = fulfillments.length; // Each fulfillment represents a PO item being used
    const unfulfilledPOItems = totalPOItems - usedPOItems;
    
    return { totalDRs, totalPOs, totalFulfillments, fulfilledDRs, remainingDRItems, unfulfilledPOItems };
  };

  const stats = getOverviewStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">DR & PO Management</h1>
            <p className="text-muted-foreground">Manage delivery receipts and purchase orders with fulfillment tracking</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => setSelectedView('overview')}
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              className={selectedView === 'overview' ? 'bg-primary hover:bg-primary-hover' : ''}
            >
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              onClick={() => setSelectedView('fulfillment')}
              variant={selectedView === 'fulfillment' ? 'default' : 'outline'}
              className={selectedView === 'fulfillment' ? 'bg-primary hover:bg-primary-hover' : ''}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Fulfillment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total DRs</p>
                  <p className="text-2xl font-bold text-business-blue">{stats.totalDRs}</p>
                </div>
                <FileText className="w-8 h-8 text-business-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total POs</p>
                  <p className="text-2xl font-bold text-business-green">{stats.totalPOs}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-business-green" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fulfillments</p>
                  <p className="text-2xl font-bold text-business-amber">{stats.totalFulfillments}</p>
                </div>
                <Link2 className="w-8 h-8 text-business-amber" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fulfilled DRs</p>
                  <p className="text-2xl font-bold text-primary">{stats.fulfilledDRs}</p>
                </div>
                <Badge className="bg-business-green text-white">
                  {stats.totalDRs > 0 ? Math.round((stats.fulfilledDRs / stats.totalDRs) * 100) : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link to="/delivery-receipts">
            <Button className="bg-business-blue hover:bg-business-blue/90">
              <List className="w-4 h-4 mr-2" />
              View All DRs
            </Button>
          </Link>

          <Link to="/purchase-orders">
            <Button className="bg-business-green hover:bg-business-green/90">
              <List className="w-4 h-4 mr-2" />
              View All POs
            </Button>
          </Link>

          <Link to="/products">
            <Button className="bg-business-amber hover:bg-business-amber/90">
              <Package className="w-4 h-4 mr-2" />
              Manage Products
            </Button>
          </Link>

          <Link to="/transaction-record">
            <Button className="bg-primary hover:bg-primary/90">
              <Receipt className="w-4 h-4 mr-2" />
              Transaction Record
            </Button>
          </Link>

          <Dialog open={showDRForm} onOpenChange={setShowDRForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-business-blue text-business-blue hover:bg-business-blue hover:text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create DR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DeliveryReceiptForm onSave={handleSaveDR} onCancel={() => setShowDRForm(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={showPOForm} onOpenChange={setShowPOForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-business-green text-business-green hover:bg-business-green hover:text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <PurchaseOrderForm onSave={handleSavePO} onCancel={() => setShowPOForm(false)} />
            </DialogContent>
          </Dialog>

          <Button 
            onClick={() => setShowFulfillmentDialog(true)}
            disabled={deliveryReceipts.length === 0 || purchaseOrders.length === 0}
            className="bg-business-amber hover:bg-business-amber/90"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Create Fulfillment
          </Button>
        </div>

        {/* Content based on selected view */}
        {selectedView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Receipts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-business-blue">Delivery Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                {updatedDeliveryReceipts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No delivery receipts created yet</p>
                ) : (
                  <div className="space-y-4">
                    {updatedDeliveryReceipts.map((dr) => (
                      <div key={dr.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{dr.drNumber}</h4>
                            <p className="text-sm text-muted-foreground">{dr.date}</p>
                          </div>
                          <StatusBadge status={dr.status} />
                        </div>
                        <div className="text-sm">
                          <p>Items: {dr.items.length}</p>
                          <p className="font-semibold">Total: ${dr.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-business-blue">Remaining Items</span>
                        <Badge variant="secondary" className="bg-business-blue/10 text-business-blue">
                          {stats.remainingDRItems}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Items not yet linked to any PO</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-business-green">Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {purchaseOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No purchase orders created yet</p>
                ) : (
                  <div className="space-y-4">
                    {purchaseOrders.map((po) => (
                      <div key={po.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{po.poNumber}</h4>
                            <p className="text-sm text-muted-foreground">{po.date}</p>
                            {po.vendor && <p className="text-sm text-muted-foreground">Vendor: {po.vendor}</p>}
                          </div>
                        </div>
                        <div className="text-sm">
                          <p>Items: {po.items.length}</p>
                          <p className="font-semibold">Total: ${po.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-business-green">Unfulfilled Items</span>
                        <Badge variant="secondary" className="bg-business-green/10 text-business-green">
                          {stats.unfulfilledPOItems}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Items not yet used to fulfill any DR</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedView === 'fulfillment' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Fulfillment Details</CardTitle>
            </CardHeader>
            <CardContent>
              {updatedDeliveryReceipts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Create delivery receipts to view fulfillment details</p>
              ) : (
                <div className="space-y-6">
                  {updatedDeliveryReceipts.map((dr) => (
                    <div key={dr.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{dr.drNumber}</h3>
                        <StatusBadge status={dr.status} />
                      </div>
                      
                      <div className="space-y-4">
                        {dr.items.map((item) => {
                          const fulfillmentSummary = getFulfillmentForItem(item.id);
                          return (
                            <div key={item.id} className="bg-muted/50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{item.name}</h4>
                                <StatusBadge status={fulfillmentSummary?.status || 'unfulfilled'} />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Required</p>
                                  <p className="font-semibold">{item.quantity}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Fulfilled</p>
                                  <p className="font-semibold">{fulfillmentSummary?.fulfilledQuantity || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Remaining</p>
                                  <p className="font-semibold">{item.quantity - (fulfillmentSummary?.fulfilledQuantity || 0)}</p>
                                </div>
                              </div>
                              
                              {fulfillmentSummary?.fulfillments && fulfillmentSummary.fulfillments.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-2">Fulfillments:</p>
                                  <div className="space-y-2">
                                    {fulfillmentSummary.fulfillments.map((fulfillment) => {
                                      const poItem = getPOItem(fulfillment.poId, fulfillment.poItemId);
                                      const po = purchaseOrders.find(p => p.id === fulfillment.poId);
                                      return (
                                        <div key={fulfillment.id} className="text-xs bg-card border rounded p-2">
                                          <div className="flex justify-between">
                                            <span>PO: {po?.poNumber}</span>
                                            <span>Qty: {fulfillment.fulfilledQuantity}</span>
                                          </div>
                                          <div className="text-muted-foreground">
                                            Item: {poItem?.name}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <FulfillmentDialog
          open={showFulfillmentDialog}
          onOpenChange={setShowFulfillmentDialog}
          deliveryReceipts={deliveryReceipts}
          purchaseOrders={purchaseOrders}
          onCreateFulfillment={handleCreateFulfillment}
        />
      </div>
    </div>
  );
};

export default Index;