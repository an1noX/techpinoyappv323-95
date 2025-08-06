import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PrinterUnit } from '@/types/printer-unit';

interface AddUnitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newUnit: {
    printer_id: string;
    serial_number: string;
    asset_tag: string;
    condition: PrinterUnit['condition'];
    status: PrinterUnit['status'];
    location: string;
    purchase_date: string;
    purchase_price: string;
    warranty_expiry: string;
    notes: string;
  };
  onUnitChange: (unit: any) => void;
  onAddUnit: () => void;
}

export default function AddUnitDialog({
  isOpen,
  onOpenChange,
  newUnit,
  onUnitChange,
  onAddUnit
}: AddUnitDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Printer Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="serial_number">Serial Number *</Label>
            <Input
              id="serial_number"
              value={newUnit.serial_number}
              onChange={(e) => onUnitChange({ ...newUnit, serial_number: e.target.value })}
              placeholder="Enter serial number"
            />
          </div>
          <div>
            <Label htmlFor="asset_tag">Asset Tag</Label>
            <Input
              id="asset_tag"
              value={newUnit.asset_tag}
              onChange={(e) => onUnitChange({ ...newUnit, asset_tag: e.target.value })}
              placeholder="Enter asset tag"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={newUnit.location}
              onChange={(e) => onUnitChange({ ...newUnit, location: e.target.value })}
              placeholder="Enter location"
            />
          </div>
          <div>
            <Label htmlFor="purchase_price">Purchase Price</Label>
            <Input
              id="purchase_price"
              type="number"
              value={newUnit.purchase_price}
              onChange={(e) => onUnitChange({ ...newUnit, purchase_price: e.target.value })}
              placeholder="Enter purchase price"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newUnit.notes}
              onChange={(e) => onUnitChange({ ...newUnit, notes: e.target.value })}
              placeholder="Enter notes"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onAddUnit}>
              Add Unit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 