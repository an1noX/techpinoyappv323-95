import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { printerUnitService } from '@/services/printerUnitService';

interface VisibilityManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  unit: any;
  onUpdate: () => void;
}

export default function VisibilityManagementDialog({
  isOpen,
  onOpenChange,
  unit,
  onUpdate,
}: VisibilityManagementDialogProps) {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && unit) {
      loadClients();
      // Set currently visible clients
      const currentVisibility = unit.visibility?.map((v: any) => v.client_id) || [];
      setSelectedClientIds(currentVisibility);
    }
  }, [isOpen, unit]);

  const loadClients = async () => {
    try {
      const clientData = await printerUnitService.getClients();
      setClients(clientData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleClientToggle = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds(prev => [...prev, clientId]);
    } else {
      setSelectedClientIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSave = async () => {
    if (!unit?.printer?.id) return;
    
    setLoading(true);
    try {
      await printerUnitService.updatePrinterVisibility(unit.printer.id, selectedClientIds);
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Printer Visibility</DialogTitle>
          <DialogDescription>
            Select which clients can see this printer when it's available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-sm">
              {unit?.printer?.manufacturer} {unit?.printer?.name}
            </div>
            <div className="text-xs text-gray-600">
              SN: {unit?.serial_number}
            </div>
          </div>

          <div>
            <div className="font-medium text-sm mb-2">Visible to Clients:</div>
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedClientIds.length > 0 ? (
                selectedClientIds.map(clientId => {
                  const client = clients.find(c => c.id === clientId);
                  return client ? (
                    <Badge key={clientId} variant="secondary" className="text-xs">
                      {client.name}
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-xs text-gray-500">No clients selected</span>
              )}
            </div>
          </div>

          <ScrollArea className="h-48 border rounded p-3">
            <div className="space-y-2">
              {clients.map(client => (
                <div key={client.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={client.id}
                    checked={selectedClientIds.includes(client.id)}
                    onCheckedChange={(checked) => 
                      handleClientToggle(client.id, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={client.id} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {client.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 