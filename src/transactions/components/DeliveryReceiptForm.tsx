import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Package } from "lucide-react";
import { DeliveryReceipt, LineItem } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryReceiptFormProps {
  onSave: (dr: DeliveryReceipt) => void;
  onCancel: () => void;
}

interface Item {
  id: string;
  name: string;
  unit_price: number;
  unit: string;
}

interface NewProductData {
  name: string;
  description: string;
  unit: string;
  unit_price: number;
}

export const DeliveryReceiptForm = ({ onSave, onCancel }: DeliveryReceiptFormProps) => {
  const { toast } = useToast();
  const [drNumber, setDrNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<LineItem[]>([
    { id: "", name: "", quantity: 0, price: 0, total: 0, purpose: null }
  ]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductData>({
    name: '',
    description: '',
    unit: 'pcs',
    unit_price: 0
  });

  useEffect(() => {
    loadItems();
    generateDrNumber();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setAvailableItems((data || []).map(product => ({
        id: product.id,
        name: product.name,
        unit_price: 0, // Will be set when selected
        unit: 'pcs' // Default unit
      })));
    } catch (error) {
      toast({
        title: "Error loading products",
        description: "Failed to load available products",
        variant: "destructive",
      });
    }
  };

  const generateDrNumber = async () => {
    try {
      // Generate DR number manually since RPC doesn't exist
      const drNumber = `DR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      setDrNumber(drNumber);
    } catch (error) {
      toast({
        title: "Error generating DR number",
        description: "Failed to generate DR number",
        variant: "destructive",
      });
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    
    setItems(newItems);
  };

  const selectItem = (index: number, itemId: string) => {
    const selectedItem = availableItems.find(item => item.id === itemId);
    if (selectedItem) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.unit_price,
        total: newItems[index].quantity * selectedItem.unit_price,
        purpose: newItems[index].purpose
      };
      setItems(newItems);
    }
  };

  const addItem = () => {
    setItems([...items, { id: "", name: "", quantity: 0, price: 0, total: 0, purpose: null }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const openNewProductDialog = (itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setNewProduct({
      name: '',
      description: '',
      unit: 'pcs',
      unit_price: 0
    });
    setShowNewProductDialog(true);
  };

  const handleCreateNewProduct = async () => {
    if (!newProduct.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the new product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: newProduct.name.trim(),
          description: newProduct.description.trim() || null,
          unit: newProduct.unit,
          default_price: newProduct.unit_price
        } as any)
        .select()
        .single();

      if (productError) throw productError;

      // Update the items list with the new product
      const newItems = [...items];
      if (currentItemIndex !== null) {
      newItems[currentItemIndex] = {
        ...newItems[currentItemIndex],
        id: productData.id,
        name: productData.name,
        price: newProduct.unit_price,
        total: newItems[currentItemIndex].quantity * newProduct.unit_price,
        purpose: newItems[currentItemIndex].purpose
      };
        setItems(newItems);
      }

      // Refresh available items
      await loadItems();

      toast({
        title: "Product created",
        description: `${productData.name} has been added to your products`,
      });

      setShowNewProductDialog(false);
      setCurrentItemIndex(null);
    } catch (error) {
      toast({
        title: "Error creating product",
        description: "Failed to create new product",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!drNumber || items.every(item => !item.name)) {
      toast({
        title: "Validation Error",
        description: "Please enter DR number and at least one item",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create delivery receipt
      const { data: drData, error: drError } = await supabase
        .from('delivery_receipts')
        .insert({
          dr_number: drNumber,
          date,
          total_amount: calculateTotal()
        })
        .select()
        .single();

      if (drError) throw drError;

      // Create delivery receipt items
      const validItems = items.filter(item => item.name.trim() !== "");
      const drItems = validItems.map(item => ({
        delivery_receipt_id: drData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.total,
        purpose: item.purpose
      }));

      const { error: itemsError } = await supabase
        .from('delivery_receipt_items')
        .insert(drItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Delivery Receipt created successfully",
      });

      onSave({
        id: drData.id,
        drNumber: drData.dr_number,
        date: drData.date,
        items: validItems,
        totalAmount: (drData as any).total_amount,
        status: drData.status as 'unfulfilled' | 'partial' | 'fulfilled'
      });
    } catch (error) {
      toast({
        title: "Error saving DR",
        description: "Failed to save delivery receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-business-blue">Create Delivery Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="drNumber">DR Number</Label>
            <Input
              id="drNumber"
              value={drNumber}
              onChange={(e) => setDrNumber(e.target.value)}
              placeholder="DR-2024-001"
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-semibold">Items</Label>
            <Button onClick={addItem} size="sm" className="bg-business-green hover:bg-business-green/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                <div className="col-span-3">
                  <Label>Item</Label>
                  <div className="flex space-x-2">
                    <Select 
                      value={item.id}
                      onValueChange={(value) => selectItem(index, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map((availableItem) => (
                          <SelectItem key={availableItem.id} value={availableItem.id}>
                            {availableItem.name} - ${availableItem.unit_price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => openNewProductDialog(index)}
                      variant="outline"
                      size="sm"
                      className="px-3"
                      title="Add new product"
                    >
                      <Package className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-1">
                  <Label>Total</Label>
                  <Input
                    value={item.total.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Purpose</Label>
                  <Select
                    value={item.purpose || "none"}
                    onValueChange={(value) => updateItem(index, 'purpose', value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="warranty">Warranty</SelectItem>
                      <SelectItem value="replacement">Replacement</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Button
                    onClick={() => removeItem(index)}
                    variant="outline"
                    size="sm"
                    disabled={items.length === 1}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xl font-bold">
            Total: ${calculateTotal().toFixed(2)}
          </div>
          <div className="space-x-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || !drNumber.trim() || items.every(item => !item.name.trim())}
              className="bg-primary hover:bg-primary-hover"
            >
              {loading ? "Saving..." : "Save DR"}
            </Button>
          </div>
        </div>

        {/* New Product Dialog */}
        <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newProductName">Product Name *</Label>
                <Input
                  id="newProductName"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="newProductDescription">Description</Label>
                <Textarea
                  id="newProductDescription"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="newProductUnit">Unit *</Label>
                <Input
                  id="newProductUnit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., pcs, kg, liter"
                />
              </div>

              <div>
                <Label htmlFor="newProductPrice">Unit Price *</Label>
                <Input
                  id="newProductPrice"
                  type="number"
                  step="0.01"
                  value={newProduct.unit_price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewProductDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleCreateNewProduct}
                  className="flex-1 bg-business-green hover:bg-business-green/90"
                  disabled={!newProduct.name.trim() || !newProduct.unit.trim() || newProduct.unit_price <= 0}
                >
                  Add Product
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};