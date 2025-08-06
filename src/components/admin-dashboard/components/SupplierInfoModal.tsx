import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, User, Mail, Phone, MapPin, FileText } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  description?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface SupplierInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

const SupplierInfoModal: React.FC<SupplierInfoModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Supplier Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Supplier Name */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-1">{supplier.name}</h2>
            <p className="text-blue-700 text-sm">Supplier ID: {supplier.id.slice(0, 8)}...</p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Contact Information</h3>
            
            {supplier.contact_person && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Contact Person</p>
                  <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                </div>
              </div>
            )}

            {supplier.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{supplier.phone}</p>
                </div>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{supplier.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {supplier.description && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Description</h3>
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">{supplier.description}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Record Information</h3>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(supplier.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-600">
                  {new Date(supplier.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierInfoModal;