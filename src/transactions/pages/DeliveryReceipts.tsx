import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "../components/StatusBadge";
import { DeliveryReceiptForm } from "../components/DeliveryReceiptForm";

interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity_delivered: number;
  created_at: string;
  purpose?: 'warranty' | 'replacement' | 'demo' | null;
  products?: {
    id: string;
    name: string;
  };
  client_product_pricing?: {
    quoted_price: number;
    margin_percentage: number;
  };
}

interface DeliveryReceipt {
  id: string;
  supplier_client_id: string;
  supplier_name: string;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_order_number: string | null;
  client_po: string | null;
  sale_invoice_number: string | null;
  expected_delivery_date: string | null;
  due_date: string | null;
  delivery_receipt_number: string | null;
  delivery_items?: DeliveryItem[];
  clients?: {
    id: string;
    name: string;
  };
}

export default function DeliveryReceipts() {
  const { toast } = useToast();
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceipt[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeliveryReceipt, setSelectedDeliveryReceipt] = useState<DeliveryReceipt | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingItems, setEditingItems] = useState<DeliveryItem[]>([]);

  useEffect(() => {
    loadDeliveryReceipts();
    loadFulfillments();
  }, []);

  const loadDeliveryReceipts = async () => {
    try {
      console.log('Loading deliveries...');
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          delivery_items (
            id,
            delivery_id,
            product_id,
            quantity_delivered,
            purpose,
            created_at,
            products (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading deliveries:', error);
        throw error;
      }
      
      console.log('Deliveries data:', data);
      setDeliveryReceipts(data as any || []);
    } catch (error) {
      console.error('Error in loadDeliveryReceipts:', error);
      toast({
        title: "Error loading deliveries",
        description: "Failed to load deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFulfillments = async () => {
    try {
      console.log('Loading fulfillments for delivery receipts...');
      const { data, error } = await supabase
        .from('fulfillments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading fulfillments:', error);
        throw error;
      }
      
      console.log('Delivery receipts fulfillments data:', data);
      setFulfillments(data || []);
    } catch (error) {
      console.error('Error loading fulfillments:', error);
      setFulfillments([]);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    loadDeliveryReceipts();
  };

  const handleDelete = async (deliveryId: string, drNumber: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: "Delivery deleted",
        description: `${drNumber} has been deleted successfully`,
      });

      loadDeliveryReceipts();
    } catch (error) {
      toast({
        title: "Error deleting delivery",
        description: "Failed to delete delivery",
        variant: "destructive",
      });
    }
  };

  const handleEditMode = () => {
    if (selectedDeliveryReceipt?.delivery_items) {
      setEditingItems([...selectedDeliveryReceipt.delivery_items]);
    }
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingItems([]);
  };

  const handleItemPurposeChange = (itemIndex: number, purpose: string | null) => {
    const updatedItems = [...editingItems];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      purpose: purpose as any
    };
    setEditingItems(updatedItems);
  };

  const handleSaveChanges = async () => {
    if (!selectedDeliveryReceipt || !editingItems.length) return;

    try {
      // Update each item that has changes
      for (const item of editingItems) {
        const { error } = await supabase
          .from('delivery_items')
          .update({ purpose: item.purpose } as any)
          .eq('id', item.id);

        if (error) throw error;
      }

      toast({
        title: "Changes saved",
        description: "Item purposes have been updated successfully",
      });

      // Update the selected delivery receipt with new data
      setSelectedDeliveryReceipt({
        ...selectedDeliveryReceipt,
        delivery_items: editingItems
      });

      setEditMode(false);
      setEditingItems([]);
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: "Failed to update item purposes",
        variant: "destructive",
      });
    }
  };

  if (showForm) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="flex justify-center">
          <DeliveryReceiptForm 
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  if (selectedDeliveryReceipt) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button 
                onClick={() => setSelectedDeliveryReceipt(null)}
                variant="outline"
              >
                ← Back to List
              </Button>
              <div className="flex space-x-2">
                {!editMode ? (
                  <Button onClick={handleEditMode} variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Items
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleCancelEdit} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-primary">
                      Delivery Receipt: {selectedDeliveryReceipt.delivery_receipt_number || `DR-${selectedDeliveryReceipt.id.slice(0, 8)}`}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Supplier: {selectedDeliveryReceipt.supplier_name}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Created: {new Date(selectedDeliveryReceipt.created_at).toLocaleDateString()}
                    </p>
                    {selectedDeliveryReceipt.notes && (
                      <p className="text-muted-foreground mt-1">
                        Notes: {selectedDeliveryReceipt.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{selectedDeliveryReceipt.status || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier Client ID</label>
                  <p className="text-sm">{selectedDeliveryReceipt.supplier_client_id || 'N/A'}</p>
                </div>
              </div>

              {(editMode ? editingItems : selectedDeliveryReceipt.delivery_items) && (editMode ? editingItems : selectedDeliveryReceipt.delivery_items).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Delivery Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity Delivered</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Product ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editMode ? editingItems : selectedDeliveryReceipt.delivery_items).map((item, index) => {
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.products?.name || `Product ID: ${item.product_id}`}
                            </TableCell>
                            <TableCell>{item.quantity_delivered}</TableCell>
                            <TableCell>
                              {editMode ? (
                                <Select
                                  value={item.purpose || "none"}
                                  onValueChange={(value) => handleItemPurposeChange(index, value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select purpose" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="warranty">Warranty</SelectItem>
                                    <SelectItem value="replacement">Replacement</SelectItem>
                                    <SelectItem value="demo">Demo</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="secondary">
                                  {item.purpose || 'None'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.product_id}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

               {/* Show fulfillment information */}
               {(() => {
                 const deliveryFulfillments = fulfillments.filter(f => f.dr_id === selectedDeliveryReceipt.id);
                 return deliveryFulfillments.length > 0 && (
                   <div className="mt-8">
                     <h4 className="text-lg font-semibold mb-4">Purchase Order Fulfillments</h4>
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-primary font-medium mb-3">
                         This delivery fulfills items from the following purchase orders:
                       </p>
                       <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead>PO ID</TableHead>
                             <TableHead>PO Item ID</TableHead>
                             <TableHead>Fulfilled Qty</TableHead>
                             <TableHead>Fulfillment Date</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                            {deliveryFulfillments.map((fulfillment) => (
                              <TableRow key={fulfillment.id}>
                                <TableCell className="font-medium">
                                  {fulfillment.po_id || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {fulfillment.po_item_id || 'N/A'}
                                </TableCell>
                                <TableCell className="text-primary font-medium">
                                  {fulfillment.fulfilled_quantity}
                                </TableCell>
                                <TableCell>
                                  {fulfillment.date ? new Date(fulfillment.date).toLocaleDateString() : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                         </TableBody>
                       </Table>
                     </div>
                   </div>
                 );
               })()}
             </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-primary">Delivery Receipts</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New DR
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading delivery receipts...</p>
        </div>
      ) : deliveryReceipts.length === 0 ? (
        <Card className="shadow-sm border-border/40">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No delivery receipts found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/40">
          <CardContent className="p-0 overflow-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>DR/PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {deliveryReceipts.map((deliveryReceipt) => (
                   <TableRow key={deliveryReceipt.id}>
                      <TableCell className="font-medium">
                        {deliveryReceipt.delivery_receipt_number || `DR-${deliveryReceipt.id.slice(0, 8)}`}
                      </TableCell>
                     <TableCell>{deliveryReceipt.supplier_name}</TableCell>
                     <TableCell>{new Date(deliveryReceipt.created_at).toLocaleDateString()}</TableCell>
                     <TableCell>
                       <Badge variant="outline">{deliveryReceipt.status}</Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant="secondary">
                         {deliveryReceipt.delivery_items?.length || 0} items
                       </Badge>
                     </TableCell>
                     <TableCell>{deliveryReceipt.notes || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setSelectedDeliveryReceipt(deliveryReceipt)}
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
                                <AlertDialogTitle>Delete Delivery Receipt</AlertDialogTitle>
                                <AlertDialogDescription>
                                   Are you sure you want to delete delivery receipt "{deliveryReceipt.delivery_receipt_number || `DR-${deliveryReceipt.id.slice(0, 8)}`}" from {deliveryReceipt.supplier_name}? This action cannot be undone.
                                 </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleDelete(deliveryReceipt.id, deliveryReceipt.delivery_receipt_number || `DR-${deliveryReceipt.id.slice(0, 8)}`)}
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
                 ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}