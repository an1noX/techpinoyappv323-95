
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SelectWithAddNew from './SelectWithAddNew';

interface AssignPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
  printerName: string;
  onAssignmentComplete: () => void;
  assignmentId?: string;
}

interface Client {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

const AssignPrinterModal: React.FC<AssignPrinterModalProps> = ({
  isOpen,
  onClose,
  printerId,
  printerName,
  onAssignmentComplete,
  assignmentId
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Data arrays
  const [clients, setClients] = useState<Client[]>([]);
  const [departmentLocations, setDepartmentLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartmentLocationId, setSelectedDepartmentLocationId] = useState('');
  const [newDepartmentLocationName, setNewDepartmentLocationName] = useState('');
  const [showNewDepartmentLocationInput, setShowNewDepartmentLocationInput] = useState(false);

  // Selected values
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');

  // Show new item inputs
  const [showNewClientInput, setShowNewClientInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClientId && !showNewClientInput) {
      fetchDepartmentLocations(selectedClientId);
    } else {
      setDepartmentLocations([]);
      setSelectedDepartmentLocationId('');
    }
  }, [selectedClientId, showNewClientInput]);

  const fetchClients = async () => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive'
      });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchDepartmentLocations = async (clientId: string) => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments_location')
        .select('id, name, department:departments(name)')
        .eq('client_id', clientId)
        .order('name');
      if (error) throw error;
      const options = (data || []).map(dl => ({
        id: dl.id,
        name: `${dl.department?.name || ''} - ${dl.name}`.replace(/^ - /, '').trim()
      }));
      setDepartmentLocations(options);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load department/locations', variant: 'destructive' });
    } finally {
      setDataLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all form state
    setSelectedClientId('');
    setNewClientName('');
    setShowNewClientInput(false);
    setClients([]);
    setDepartmentLocations([]);
    setSelectedDepartmentLocationId('');
    setNewDepartmentLocationName('');
    setShowNewDepartmentLocationInput(false);
    onClose();
  };

  const createClientIfNotExists = async (name: string) => {
    if (!name.trim()) return null;

    // Check if client exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', name.trim())
      .single();

    if (existingClient) {
      return existingClient.id;
    }

    // Create new client
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({ name: name.trim() })
      .select('id')
      .single();

    if (error) throw error;
    return newClient.id;
  };

  const createDepartmentIfNotExists = async (clientId: string, name: string) => {
    if (!name.trim()) return null;

    // Check if department exists for this client
    const { data: existingDept } = await supabase
      .from('departments')
      .select('id')
      .eq('client_id', clientId)
      .ilike('name', name.trim())
      .single();

    if (existingDept) {
      return existingDept.id;
    }

    // Create new department
    const { data: newDept, error } = await supabase
      .from('departments')
      .insert({ client_id: clientId, name: name.trim() })
      .select('id')
      .single();

    if (error) throw error;
    return newDept.id;
  };

  const createLocationIfNotExists = async (departmentId: string, name: string) => {
    if (!name.trim()) return null;

    // Check if location exists for this department
    const { data: existingLocation } = await supabase
      .from('departments_location')
      .select('id')
      .eq('department_id', departmentId)
      .ilike('name', name.trim())
      .single();

    if (existingLocation) {
      return existingLocation.id;
    }

    // Create new location
    const { data: newLocation, error } = await supabase
      .from('departments_location')
      .insert({ 
        department_id: departmentId, 
        name: name.trim(),
        is_primary: false
      })
      .select('id')
      .single();

    if (error) throw error;
    return newLocation.id;
  };

  const handleAssign = async () => {
    // Determine what client to use
    const clientName = showNewClientInput ? newClientName : 
      clients.find(c => c.id === selectedClientId)?.name;

    if (!clientName?.trim()) {
      toast({
        title: 'Error',
        description: 'Please select or enter a client name',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Create or get client
      const clientId = showNewClientInput ? 
        await createClientIfNotExists(newClientName) : selectedClientId;
      
      if (!clientId) throw new Error('Failed to create/find client');

      let departmentLocationId = null;
      if (showNewDepartmentLocationInput && newDepartmentLocationName.trim()) {
        toast({ title: 'Error', description: 'Adding new department/location not implemented.', variant: 'destructive' });
        setLoading(false);
        return;
      } else {
        departmentLocationId = selectedDepartmentLocationId;
      }

      let error;
      if (assignmentId) {
        // Update the existing assignment row
        ({ error } = await supabase
          .from('printer_assignments')
          .update({
            client_id: clientId,
            department_location_id: departmentLocationId,
            status: 'active',
            condition: 'good',
            assignment_effective_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', assignmentId));
      } else {
        // Fallback: create new assignment (legacy flow)
        ({ error } = await supabase
          .from('printer_assignments')
          .insert({
            printer_id: printerId,
            client_id: clientId,
            department_location_id: departmentLocationId,
            status: 'active',
            condition: 'good',
            assignment_effective_date: new Date().toISOString().split('T')[0]
          }));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Printer assigned successfully to ${clientName}`,
      });

      onAssignmentComplete();
      handleClose();
    } catch (error) {
      console.error('Failed to assign printer:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign printer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canAssign = (showNewClientInput ? newClientName.trim() : selectedClientId) && selectedDepartmentLocationId;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <span>Assign Printer</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Assigning: <span className="font-medium">{printerName}</span>
          </div>

          <div className="space-y-3">
            <SelectWithAddNew
              label="Client"
              placeholder="Select a client"
              options={clients}
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              newItemValue={newClientName}
              onNewItemChange={setNewClientName}
              showNewItemInput={showNewClientInput}
              onShowNewItemInput={setShowNewClientInput}
              newItemPlaceholder="Enter new client name"
              disabled={loading || dataLoading}
            />

            <SelectWithAddNew
              label="Department/Location"
              placeholder="Select a department/location"
              options={departmentLocations}
              value={selectedDepartmentLocationId}
              onValueChange={setSelectedDepartmentLocationId}
              newItemValue={newDepartmentLocationName}
              onNewItemChange={setNewDepartmentLocationName}
              showNewItemInput={showNewDepartmentLocationInput}
              onShowNewItemInput={setShowNewDepartmentLocationInput}
              newItemPlaceholder="Enter new department/location"
              disabled={loading || dataLoading || (!selectedClientId && !showNewClientInput)}
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={loading || !canAssign}
              className="flex-1"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Assign Printer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPrinterModal;
