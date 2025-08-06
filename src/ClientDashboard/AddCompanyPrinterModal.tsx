import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { printerService } from '@/services/printerService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

interface AddCompanyPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterAdded: () => void;
  clientId: string;
}

const AddCompanyPrinterModal: React.FC<AddCompanyPrinterModalProps> = ({ isOpen, onClose, onPrinterAdded, clientId }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [printerName, setPrinterName] = useState('');
  const [printerSuggestions, setPrinterSuggestions] = useState<string[]>([]);
  const [serialNumber, setSerialNumber] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isCompanyOwned, setIsCompanyOwned] = useState(true);

  // Set default toggle state based on user role when modal opens
  useEffect(() => {
    if (isOpen) {
      if (userProfile?.role === 'admin') {
        setIsCompanyOwned(false); // Default to Service Unit for admin
      } else {
        setIsCompanyOwned(true); // Default to Company Owned for others
      }
    }
  }, [isOpen, userProfile?.role]);

  // Fetch departments and their locations for the current client on open
  useEffect(() => {
    if (isOpen && clientId) {
      supabase
        .from('departments')
        .select('id, name, departments_location(id, name)')
        .eq('client_id', clientId)
        .then(({ data }) => setDepartments(data || []));
      setPrinterName('');
      setPrinterSuggestions([]);
      setSerialNumber('');
      setSelectedDepartment('');
      setSelectedLocation('');
    }
  }, [isOpen, clientId]);

  // Fetch locations when department changes
  useEffect(() => {
    if (selectedDepartment) {
      supabase
        .from('departments_location')
        .select('id, name')
        .eq('department_id', selectedDepartment)
        .then(({ data }) => setLocations(data || []));
    } else {
      setLocations([]);
      setSelectedLocation('');
    }
  }, [selectedDepartment]);

  // Autocomplete for printer name
  useEffect(() => {
    if (printerName.length < 2) {
      setPrinterSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    printerService.searchPrinters(printerName).then((results) => {
      if (!cancelled) {
        setPrinterSuggestions(results.map(p => p.name));
        setSearching(false);
      }
    });
    return () => { cancelled = true; };
  }, [printerName]);

  // Single dropdown for department/location
  const handleDeptLocChange = (value: string) => {
    if (!value) {
      setSelectedDepartment('');
      setSelectedLocation('');
      return;
    }
    // Value format: 'loc-<id>'
    const locId = value.replace('loc-', '');
    // Find department for this location
    const dept = departments.find(d => d.departments_location.some(l => l.id === locId));
    setSelectedDepartment(dept ? dept.id : '');
    setSelectedLocation(locId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerName.trim() || !serialNumber.trim()) {
      toast({ title: 'Error', description: 'Printer name and serial number are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Find or create printer in catalog
      const printer = await printerService.findOrCreatePrinter(printerName.trim());
      // Prepare assignment data
      const assignmentData: any = {
        printer_id: printer.id,
        serial_number: serialNumber.trim(),
        usage_type: isCompanyOwned ? 'client_owned' : 'service_unit',
        status: (!selectedDepartment && !selectedLocation) ? 'undeployed' : 'active',
        is_client_owned: isCompanyOwned,
        client_id: clientId, // Always set client_id regardless of toggle
      };
      if (selectedLocation) assignmentData.department_location_id = selectedLocation;
      // Insert assignment
      const { error } = await supabase.from('printer_assignments').insert(assignmentData);
      if (error) throw error;
      toast({ title: 'Success', description: 'Company printer added successfully.' });
      onPrinterAdded();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add company printer.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Company Printer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="printerName">Printer Name *</Label>
            <Input
              id="printerName"
              value={printerName}
              onChange={e => setPrinterName(e.target.value)}
              autoComplete="off"
              placeholder="Type or select printer name"
              list="printer-catalog-list"
              required
            />
            <datalist id="printer-catalog-list">
              {printerSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {searching && <div className="text-xs text-gray-400 mt-1">Searching...</div>}
          </div>
          <div>
            <Label htmlFor="serialNumber">Serial Number *</Label>
            <Input
              id="serialNumber"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              required
              placeholder="Enter serial number"
            />
          </div>
          {/* Replace the switch section with a flex row layout */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className={`font-semibold ${!isCompanyOwned ? 'text-green-600' : 'text-gray-400'}`}>Service Unit</span>
            <Switch
              id="company_owned_toggle"
              checked={isCompanyOwned}
              onCheckedChange={setIsCompanyOwned}
              aria-label="Toggle Company Owned"
            />
            <span className={`font-semibold ${isCompanyOwned ? 'text-green-600' : 'text-gray-400'}`}>Company Owned</span>
          </div>
          <div>
            <Label htmlFor="deptLoc">Department / Location</Label>
            <Select value={selectedLocation ? `loc-${selectedLocation}` : ''} onValueChange={handleDeptLocChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select department or location (optional)" />
              </SelectTrigger>
              <SelectContent>
                {departments.flatMap((dept) =>
                  (dept.departments_location || []).map((loc: any) => (
                    <SelectItem key={`loc-${loc.id}`} value={`loc-${loc.id}`}>{dept.name} / {loc.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add Printer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyPrinterModal; 