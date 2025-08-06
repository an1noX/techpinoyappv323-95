import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit } from 'lucide-react';

// Define the legacy department interface for editing individual locations
interface LegacyDepartment {
  id: string;
  name: string;
  description?: string;
  floor?: string;
  location?: string;
  contact_person?: string;
  abbreviation?: string;
  client_id: string;
  printer_count: number;
  printers: any[];
  created_at: string;
}

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: LegacyDepartment | null;
  onDepartmentUpdated: () => void;
}

// Utility to check if a string is a valid UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  onDepartmentUpdated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [floor, setFloor] = useState('');
  const [location, setLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // For grouped departments, store original locations
  const [groupLocations, setGroupLocations] = useState<any[]>([]);

  useEffect(() => {
    if (department) {
      setName(department.name);
      setDescription(department.description || '');
      setFloor(department.floor || '');
      setLocation(department.location || '');
      setContactPerson(department.contact_person || '');
      setAbbreviation(department.abbreviation || '');
      if (!isUUID(department.id) && (department as any).locations) {
        setGroupLocations((department as any).locations || []);
      } else {
        setGroupLocations([]);
      }
    }
  }, [department]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Department name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      if (!isUUID(department.id)) {
        // Batch update all real department/location rows in the group
        // Fetch all real department rows for this group
        const { data: realDepts, error: fetchDeptsError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('client_id', department.client_id)
          .in('id', groupLocations.map((loc: any) => loc.id));
        if (fetchDeptsError) throw fetchDeptsError;
        // For each, update the name to the new base name + location suffix
        for (const realDept of realDepts) {
          const suffix = realDept.name.replace(department.name, '').trim();
          const newFullName = suffix ? `${name.trim()} ${suffix}` : name.trim();
          const { error: updateError } = await supabase
            .from('departments')
            .update({ name: newFullName })
            .eq('id', realDept.id);
          if (updateError) throw updateError;
        }
        toast({
          title: "Success",
          description: "Department base name updated for all locations.",
        });
        onDepartmentUpdated();
        handleClose();
        return;
      }
      // Normal single department update
      const { error } = await supabase
        .from('departments')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          floor: floor.trim() || null,
          location: location.trim() || null,
          contact_person: contactPerson.trim() || null,
          abbreviation: abbreviation.trim() || null
        })
        .eq('id', department.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Department has been updated successfully.",
      });
      onDepartmentUpdated();
      handleClose();
    } catch (error) {
      console.error('Failed to update department:', error);
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Edit className="h-5 w-5 text-white" />
            </div>
            <span>Edit Department</span>
          </DialogTitle>
        </DialogHeader>

        {!department ? (
          <div className="p-4 text-center text-red-600">
            No department selected.
          </div>
        ) : !isUUID(department.id) ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Base Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter department base name"
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="text-xs text-gray-500">
              This will update the base name for all locations under this department group.
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Department'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter department name"
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abbreviation
              </label>
              <Input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="HR, IT, ACC, etc."
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <Input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="2nd Floor, Ground Floor, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building A, West Wing, Room 201, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Department head or contact person"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the department..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Department'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditDepartmentModal;
