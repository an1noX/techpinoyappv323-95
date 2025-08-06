import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { clientService } from '@/services/clientService';

interface ClientDepartmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClientId?: string;
  currentDepartmentId?: string;
  onSave: (clientId: string, departmentId: string) => void;
}

const ClientDepartmentSelectionModal: React.FC<ClientDepartmentSelectionModalProps> = ({
  isOpen,
  onClose,
  currentClientId,
  currentDepartmentId,
  onSave,
}) => {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(currentClientId || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(currentDepartmentId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId(currentClientId || '');
      setSelectedDepartmentId(currentDepartmentId || '');
      setDepartments([]);
      setLoading(true);
      clientService.getClients().then(clients => {
        setClients(clients.map(c => ({ id: c.id, name: c.name })));
        setLoading(false);
      });
    }
  }, [isOpen, currentClientId, currentDepartmentId]);

  useEffect(() => {
    if (selectedClientId) {
      setLoading(true);
      clientService.getDepartmentsByClient(selectedClientId).then(depts => {
        setDepartments(depts.map(d => ({ id: d.id, name: d.name })));
        setLoading(false);
      });
    } else {
      setDepartments([]);
      setSelectedDepartmentId('');
    }
  }, [selectedClientId]);

  const handleSave = () => {
    if (selectedClientId && selectedDepartmentId) {
      onSave(selectedClientId, selectedDepartmentId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Client & Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          {selectedClientId && (
            <div>
              <label className="block text-sm font-medium mb-1">Department/Location</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={selectedDepartmentId}
                onChange={e => setSelectedDepartmentId(e.target.value)}
                disabled={loading || departments.length === 0}
              >
                <option value="">Select Department/Location</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedClientId || !selectedDepartmentId} className="flex-1">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDepartmentSelectionModal; 