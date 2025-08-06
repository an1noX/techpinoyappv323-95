import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrinterUnit } from '@/types/printer-unit';

interface EditUnitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUnit: PrinterUnit | null;
  onUnitChange: (unit: PrinterUnit) => void;
  onUpdateUnit: () => void;
}

export default function EditUnitDialog({
  isOpen,
  onOpenChange,
  selectedUnit,
  onUnitChange,
  onUpdateUnit
}: EditUnitDialogProps) {
  if (!selectedUnit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Printer Unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_status">Status</Label>
            <Select
              value={selectedUnit.status}
              onValueChange={(value) => onUnitChange({ ...selectedUnit, status: value as PrinterUnit['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit_condition">Condition</Label>
            <Select
              value={selectedUnit.condition}
              onValueChange={(value) => onUnitChange({ ...selectedUnit, condition: value as PrinterUnit['condition'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit_location">Location</Label>
            <Input
              id="edit_location"
              value={selectedUnit.location || ''}
              onChange={(e) => onUnitChange({ ...selectedUnit, location: e.target.value })}
              placeholder="Enter location"
            />
          </div>
          <div>
            <Label htmlFor="edit_notes">Notes</Label>
            <Textarea
              id="edit_notes"
              value={selectedUnit.notes || ''}
              onChange={(e) => onUnitChange({ ...selectedUnit, notes: e.target.value })}
              placeholder="Enter notes"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onUpdateUnit}>
              Update Unit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 