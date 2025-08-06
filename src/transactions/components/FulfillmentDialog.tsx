import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryReceipt, PurchaseOrder, Fulfillment, LineItem } from "../types";
import { generateId } from "../lib/utils";

interface FulfillmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryReceipts: DeliveryReceipt[];
  purchaseOrders: PurchaseOrder[];
  onCreateFulfillment: (fulfillment: Fulfillment) => void;
}

export const FulfillmentDialog = ({ 
  open, 
  onOpenChange, 
  deliveryReceipts, 
  purchaseOrders, 
  onCreateFulfillment 
}: FulfillmentDialogProps) => {
  const [selectedDR, setSelectedDR] = useState<string>("");
  const [selectedDRItem, setSelectedDRItem] = useState<string>("");
  const [selectedPO, setSelectedPO] = useState<string>("");
  const [selectedPOItem, setSelectedPOItem] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  const selectedDRRecord = deliveryReceipts.find(dr => dr.id === selectedDR);
  const selectedPORecord = purchaseOrders.find(po => po.id === selectedPO);
  const selectedDRItemRecord = selectedDRRecord?.items.find(item => item.id === selectedDRItem);
  const selectedPOItemRecord = selectedPORecord?.items.find(item => item.id === selectedPOItem);

  const handleSubmit = () => {
    if (selectedDR && selectedDRItem && selectedPO && selectedPOItem && quantity > 0) {
      const fulfillment: Fulfillment = {
        id: generateId(),
        drId: selectedDR,
        drItemId: selectedDRItem,
        poId: selectedPO,
        poItemId: selectedPOItem,
        fulfilledQuantity: quantity,
        date: new Date().toISOString()
      };
      
      onCreateFulfillment(fulfillment);
      
      // Reset form
      setSelectedDR("");
      setSelectedDRItem("");
      setSelectedPO("");
      setSelectedPOItem("");
      setQuantity(0);
      onOpenChange(false);
    }
  };

  const getMaxQuantity = () => {
    if (!selectedDRItemRecord || !selectedPOItemRecord) return 0;
    return Math.min(selectedDRItemRecord.quantity, selectedPOItemRecord.quantity);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-business-blue">Create Fulfillment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-business-blue">Delivery Receipt Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select DR</Label>
                  <Select value={selectedDR} onValueChange={setSelectedDR}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose DR" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryReceipts.map((dr) => (
                        <SelectItem key={dr.id} value={dr.id}>
                          {dr.drNumber} - ${dr.totalAmount.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedDR && (
                  <div>
                    <Label>Select Item</Label>
                    <Select value={selectedDRItem} onValueChange={setSelectedDRItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose item" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDRRecord?.items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} (Qty: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedDRItemRecord && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm"><strong>Item:</strong> {selectedDRItemRecord.name}</p>
                    <p className="text-sm"><strong>Required:</strong> {selectedDRItemRecord.quantity}</p>
                    <p className="text-sm"><strong>Price:</strong> ${selectedDRItemRecord.price.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-business-green">Purchase Order Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select PO</Label>
                  <Select value={selectedPO} onValueChange={setSelectedPO}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose PO" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.poNumber} - ${po.totalAmount.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPO && (
                  <div>
                    <Label>Select Item</Label>
                    <Select value={selectedPOItem} onValueChange={setSelectedPOItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose item" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPORecord?.items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} (Qty: {item.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedPOItemRecord && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm"><strong>Item:</strong> {selectedPOItemRecord.name}</p>
                    <p className="text-sm"><strong>Available:</strong> {selectedPOItemRecord.quantity}</p>
                    <p className="text-sm"><strong>Price:</strong> ${selectedPOItemRecord.price.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedDRItemRecord && selectedPOItemRecord && (
            <div>
              <Label>Fulfillment Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min="0"
                max={getMaxQuantity()}
                step="0.01"
                placeholder={`Max: ${getMaxQuantity()}`}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum quantity: {getMaxQuantity()}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedDR || !selectedDRItem || !selectedPO || !selectedPOItem || quantity <= 0}
              className="bg-primary hover:bg-primary-hover"
            >
              Create Fulfillment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};