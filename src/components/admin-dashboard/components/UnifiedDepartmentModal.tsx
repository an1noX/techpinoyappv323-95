import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface LocationDraft {
  id?: string; // present if editing
  name: string;
  floor: string;
  officeName: string;
  description: string;
  contactPerson: string;
  contactNumber: string;
  abbreviation: string;
  printers?: any[]; // <-- Added for linter error fix
}

interface DepartmentDraft {
  id?: string; // present if editing
  name: string;
  abbreviation: string;
  floor: string;
  location: string;
  contactPerson: string;
  description: string;
  locations: LocationDraft[];
}

interface UnifiedDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  department?: DepartmentDraft | null; // null for add, object for edit
  onDepartmentSaved: () => void;
}

const UnifiedDepartmentModal: React.FC<UnifiedDepartmentModalProps> = ({
  isOpen,
  onClose,
  clientId,
  department,
  onDepartmentSaved,
}) => {
  const { toast } = useToast();
  const isEdit = !!department?.id;

  // Department fields
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [description, setDescription] = useState('');
  const [locations, setLocations] = useState<LocationDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeLocationEditIdx, setActiveLocationEditIdx] = useState<number | null>(null);
  const [showDeleteConfirmIdx, setShowDeleteConfirmIdx] = useState<number | null>(null);
  const [deletedLocationIds, setDeletedLocationIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (department) {
        setName(department.name || '');
        setContactPerson(department.contactPerson || '');
        setDescription(department.description || '');
        setLocations(department.locations || []);
      } else {
        setName('');
        setContactPerson('');
        setDescription('');
        setLocations([]);
      }
      setErrors({});
    }
  }, [isOpen, department]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Department name is required';
    if (!clientId) newErrors.client = 'Client ID is required';
    if (locations.some(loc => !loc.name.trim())) newErrors.locations = 'All locations must have a name';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLocation = () => {
    setLocations([...locations, { name: '', floor: '', officeName: '', description: '', contactPerson: '', contactNumber: '', abbreviation: '' }]);
  };

  const handleRemoveLocation = (idx: number) => {
    const loc = locations[idx];
    if (loc.id) {
      setDeletedLocationIds(prev => [...prev, loc.id!]);
    }
    setLocations(locations.filter((_, i) => i !== idx));
  };

  const handleLocationChange = (idx: number, field: keyof LocationDraft, value: string) => {
    setLocations(locations.map((loc, i) => i === idx ? { ...loc, [field]: value } : loc));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      let deptId = department?.id;
      
      if (!isEdit) {
        // Create department first
        const { data: newDept, error: deptError } = await supabase
          .from('departments')
          .insert({
            name: name.trim(),
            contact_person: contactPerson.trim() || null,
            description: description.trim() || null,
            client_id: clientId,
          })
          .select('id')
          .single();

        if (deptError) {
          console.error('Department creation error:', deptError);
          throw new Error(`Failed to create department: ${deptError.message}`);
        }
        
        deptId = newDept.id;
      } else {
        // Update existing department
        const { error: updateError } = await supabase
          .from('departments')
          .update({
            name: name.trim(),
            contact_person: contactPerson.trim() || null,
            description: description.trim() || null,
          })
          .eq('id', deptId);

        if (updateError) {
          console.error('Department update error:', updateError);
          throw new Error(`Failed to update department: ${updateError.message}`);
        }
      }

      // Now handle locations - ensure we have a valid department_id
      if (!deptId) {
        throw new Error('Department ID is required for location operations');
      }

      // Process locations sequentially to avoid conflicts
      for (const loc of locations) {
        if (loc.id) {
          // Update existing location
          const { error: locUpdateError } = await supabase
            .from('departments_location')
            .update({
              name: loc.name.trim(),
              floor: loc.floor.trim() || null,
              office_name: loc.officeName.trim() || null,
              description: loc.description.trim() || null,
              contact_person: loc.contactPerson.trim() || null,
              contact_number: loc.contactNumber.trim() || null,
              abbreviation: loc.abbreviation.trim() || null,
            })
            .eq('id', loc.id);

          if (locUpdateError) {
            console.error('Location update error:', locUpdateError);
            throw new Error(`Failed to update location "${loc.name}": ${locUpdateError.message}`);
          }
        } else {
          // Insert new location with proper foreign key references
          const { error: locInsertError } = await supabase
            .from('departments_location')
            .insert({
              department_id: deptId,
              client_id: clientId,
              name: loc.name.trim(),
              floor: loc.floor.trim() || null,
              office_name: loc.officeName.trim() || null,
              description: loc.description.trim() || null,
              contact_person: loc.contactPerson.trim() || null,
              contact_number: loc.contactNumber.trim() || null,
              abbreviation: loc.abbreviation.trim() || null,
            });

          if (locInsertError) {
            console.error('Location insert error:', locInsertError);
            throw new Error(`Failed to create location "${loc.name}": ${locInsertError.message}`);
          }
        }
      }

      // Delete removed locations from Supabase
      for (const locId of deletedLocationIds) {
        await supabase
          .from('departments_location')
          .delete()
          .eq('id', locId);
      }

      toast({
        title: 'Success',
        description: isEdit ? 'Department updated successfully.' : 'Department created successfully.',
      });
      
      onDepartmentSaved();
      onClose();
      setDeletedLocationIds([]); // Reset after submit
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              {isEdit ? <Edit className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
            </div>
            <span>{isEdit ? 'Edit Department' : 'Add Department'}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Enter department name" 
              className={errors.name ? 'border-red-300' : ''} 
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <Input 
              value={contactPerson} 
              onChange={e => setContactPerson(e.target.value)} 
              placeholder="Department head or contact person" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Brief description of the department..." 
              className="min-h-[80px]" 
            />
          </div>
          
          {/* Locations Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800">Locations</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLocation}>
                <Plus className="h-4 w-4 mr-1" /> Add Location
              </Button>
            </div>
            
            {errors.locations && <p className="text-red-600 text-sm mb-2">{errors.locations}</p>}
            
            {locations.length === 0 && (
              <div className="text-xs text-gray-500">No locations added yet.</div>
            )}
            
            {locations.map((loc, idx) => {
              // Determine if this location should be editable
              const isLocationEditable =
                !isEdit || // Add Department mode: always editable
                !loc.name || // If location name is empty, always editable
                activeLocationEditIdx === idx; // Edit Department mode: editable only if edit icon clicked

              // Ensure printers is always an array for display
              const printersArray = Array.isArray(loc.printers) ? loc.printers : [];
              const hasPrinters = printersArray.length > 0;

              return (
                <div key={idx} className="border rounded-md p-3 mb-2 bg-white flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={loc.name} 
                      onChange={e => handleLocationChange(idx, 'name', e.target.value)} 
                      placeholder="Office Name / Floor *" 
                      className="text-sm flex-1" 
                      disabled={!isLocationEditable}
                    />
                    {isEdit && loc.name && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setActiveLocationEditIdx(idx)}
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowDeleteConfirmIdx(idx)}
                      title="Delete Location"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  {/* Confirmation dialog for delete - only in edit mode */}
                  {isEdit && showDeleteConfirmIdx === idx && (
                    <AlertDialog open={true} onOpenChange={() => setShowDeleteConfirmIdx(null)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unable to Delete Location</AlertDialogTitle>
                        </AlertDialogHeader>
                        {hasPrinters ? (
                          <>
                            <div className="text-sm text-red-600 mb-2">
                              There are still printers assigned to it.
                            </div>
                            <div className="mb-2">
                              <div className="flex font-semibold text-xs text-gray-700 border-b pb-1 mb-1">
                                <div className="w-full">Printer Names</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {printersArray.map((printer: any, i: number) => {
                                  // Ensure display name and serial number are present, even if printer is nested
                                  let printerDisplayName = printer.name || printer.printer_name || printer.model || printer.id;
                                  let serialNumber = printer.serial_number || (printer.printer && printer.printer.serial_number) || '';

                                  if (!printerDisplayName && printer.printer) {
                                    printerDisplayName = printer.printer.name || printer.printer.printer_name || printer.printer.model || printer.printer.id;
                                  }
                                  if (!serialNumber && printer.printer) {
                                    serialNumber = printer.printer.serial_number || '';
                                  }

                                  return (
                                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                      {printerDisplayName}
                                      {serialNumber ? ` (${serialNumber})` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="text-sm text-red-600 mb-2">
                              ⚠️ You can only delete locations that have no associated printers.
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setShowDeleteConfirmIdx(null)}>
                                Close
                              </AlertDialogCancel>
                            </AlertDialogFooter>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-700 mb-2">
                              Are you sure you want to delete this location? This action cannot be undone.
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setShowDeleteConfirmIdx(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  handleRemoveLocation(idx);
                                  setShowDeleteConfirmIdx(null);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Yes, Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </>
                        )}
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {/* Removed: Floor, Office Name, Abbreviation, Contact Person, Contact Number, Description */}
                </div>
              );
            })}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading} 
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Department')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedDepartmentModal;
