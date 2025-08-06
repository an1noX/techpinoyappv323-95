
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DepartmentLocation {
  id: string;
  name: string;
  office_name?: string;
  description?: string;
  floor?: string;
  contact_person?: string;
  contact_number?: string;
  abbreviation?: string;
}

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: DepartmentLocation | null;
  locations?: DepartmentLocation[];
  departmentBaseName: string;
  onLocationUpdated: () => void;
}

const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  location,
  locations = [],
  departmentBaseName,
  onLocationUpdated
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(location?.id || (locations[0]?.id ?? null));
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

  // Compute the selected location for the form
  const selectedLocation = (locations.length > 0)
    ? locations.find(l => l.id === selectedLocationId) || locations[0]
    : location;

  // If no selectedLocationId but locations exist, default to first
  useEffect(() => {
    if ((!selectedLocationId || !locations.find(l => l.id === selectedLocationId)) && locations && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  useEffect(() => {
    if (selectedLocation) {
      setFormData({
        locationName: selectedLocation.name || '',
        officeName: selectedLocation.office_name || '',
        description: selectedLocation.description || '',
        floor: selectedLocation.floor || '',
        contactPerson: selectedLocation.contact_person || '',
        contactNumber: selectedLocation.contact_number || '',
        abbreviation: selectedLocation.abbreviation || ''
      });
    } else {
      setFormData({
        locationName: '',
        officeName: '',
        description: '',
        floor: '',
        contactPerson: '',
        contactNumber: '',
        abbreviation: ''
      });
    }
  }, [selectedLocation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loc = selectedLocation;
    if (!loc || !validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('departments_location')
        .update({
          name: formData.locationName.trim(),
          office_name: formData.officeName.trim() || null,
          description: formData.description.trim() || null,
          floor: formData.floor.trim() || null,
          contact_person: formData.contactPerson.trim() || null,
          contact_number: formData.contactNumber.trim() || null,
          abbreviation: formData.abbreviation.trim() || null
        })
        .eq('id', loc.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Location has been updated successfully.",
      });
      onLocationUpdated();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
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
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span>Edit Location</span>
          </DialogTitle>
        </DialogHeader>

        {locations.length > 1 && (
          <div className="mb-4">
            <Label className="block text-sm font-medium text-gray-700 mb-1">Select Location</Label>
            <Select value={selectedLocationId || ''} onValueChange={val => setSelectedLocationId(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a location to edit" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </Label>
            <Input
              value={formData.locationName}
              onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
              placeholder="Main, Extension, 4F, etc."
              className={errors.locationName ? 'border-red-300' : ''}
            />
            {errors.locationName && <p className="text-red-600 text-sm mt-1">{errors.locationName}</p>}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Office Name
            </Label>
            <Input
              value={formData.officeName}
              onChange={(e) => setFormData(prev => ({ ...prev, officeName: e.target.value }))}
              placeholder="e.g. Admin Office, HR Office, etc."
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Floor
            </Label>
            <Input
              value={formData.floor}
              onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
              placeholder="2nd Floor, Ground Floor, etc."
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </Label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              placeholder="Location head or contact person"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </Label>
            <Input
              value={formData.contactNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
              placeholder="e.g. +63 912 345 6789"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Abbreviation
            </Label>
            <Input
              value={formData.abbreviation}
              onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
              placeholder="EXT, MN, 4F, etc."
              maxLength={10}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this location..."
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
              {isLoading ? 'Updating...' : 'Update Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLocationModal;
