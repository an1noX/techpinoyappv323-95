import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, PlusCircle } from 'lucide-react';

interface AddLocationToDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: any[]; // Changed from Department[] to any[] as Department type is removed
  clientId: string;
  onLocationAdded: () => void;
  onAddNewDepartment: () => void;
}

const AddLocationToDepartmentModal: React.FC<AddLocationToDepartmentModalProps> = ({
  isOpen,
  onClose,
  departments,
  clientId,
  onLocationAdded,
  onAddNewDepartment
}) => {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    locationName: '',
    officeName: '',
    description: '',
    floor: '',
    contactPerson: '',
    contactNumber: '',
    abbreviation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedDepartmentId) {
      newErrors.departmentId = 'You must select a department';
    }
    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDepartmentChange = (value: string) => {
    if (value === 'add_new_department') {
      onAddNewDepartment();
    } else {
      setSelectedDepartmentId(value);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('departments_location')
        .insert({
          department_id: selectedDepartmentId,
          client_id: clientId,
          name: formData.locationName.trim(),
          office_name: formData.officeName.trim() || null,
          description: formData.description.trim() || null,
          floor: formData.floor.trim() || null,
          contact_person: formData.contactPerson.trim() || null,
          contact_number: formData.contactNumber.trim() || null,
          abbreviation: formData.abbreviation.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Location "${formData.locationName}" has been added.`,
      });
      
      onLocationAdded();
      handleClose();
    } catch (error) {
      console.error('Failed to add location:', error);
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ locationName: '', officeName: '', description: '', floor: '', contactPerson: '', contactNumber: '', abbreviation: '' });
    setSelectedDepartmentId(null);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span>Add New Location</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Select Department *
            </Label>
            <Select onValueChange={handleDepartmentChange} value={selectedDepartmentId || ""}>
              <SelectTrigger className={errors.departmentId ? 'border-red-300' : ''}>
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
                <SelectItem value="add_new_department" className="text-blue-600">
                  <div className="flex items-center space-x-2">
                    <PlusCircle className="h-4 w-4" />
                    <span>Add New Department</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.departmentId && <p className="text-red-600 text-sm mt-1">{errors.departmentId}</p>}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </Label>
            <Input value={formData.locationName} onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))} placeholder="Main, Extension, 4F, etc." className={errors.locationName ? 'border-red-300' : ''} />
            {errors.locationName && <p className="text-red-600 text-sm mt-1">{errors.locationName}</p>}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Office Name
            </Label>
            <Input value={formData.officeName} onChange={(e) => setFormData(prev => ({ ...prev, officeName: e.target.value }))} placeholder="e.g. Admin Office, HR Office, etc." />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </Label>
            <Input value={formData.floor} onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))} placeholder="2nd Floor, Ground Floor, etc." />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLocationToDepartmentModal; 