import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AddToInventoryModal = ({ isOpen, onClose, printer, onAdded }) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('available');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // For inventory, client_id is null and usage_type is 'service_unit'
    const { error } = await supabase.from('printer_assignments').insert({
      printer_id: printer.id,
      client_id: null, // Not assigned to a client
      serial_number: serialNumber,
      usage_type: 'service_unit',
      status: status,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      onAdded();
      toast({ title: 'Success', description: 'Printer added to inventory.' });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Printer to Inventory</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Serial Number</label>
            <input
              type="text"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>Add to Inventory</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToInventoryModal; 