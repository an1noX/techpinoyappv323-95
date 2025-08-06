import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Delivery } from '@/types/purchaseOrder';

interface EditableDeliveryHeaderProps {
  delivery: Delivery;
  purchaseOrder: any;
  isEditing: boolean;
  onDeliveryChange: (field: string, value: string) => void;
  onPurchaseOrderChange: (field: string, value: string) => void;
}

export const EditableDeliveryHeader: React.FC<EditableDeliveryHeaderProps> = ({
  delivery,
  purchaseOrder,
  isEditing,
  onDeliveryChange,
  onPurchaseOrderChange
}) => {
  // Add null checks to prevent errors during initial render
  if (!delivery) {
    return (
      <div className="border-b pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">TechPinoy</h1>
            <p className="text-sm text-gray-600 mt-1">Your Trusted Tech Partner</p>
            <div className="text-xs text-gray-500 mt-2">
              <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
              <p>Makati, Metro Manila, Philippines</p>
              <p>Phone: +63 2 1234 5678 | Email: info@techpinoy.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">DELIVERY RECEIPT</h2>
            <div className="text-sm space-y-1">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">TechPinoy</h1>
          <p className="text-sm text-gray-600 mt-1">Your Trusted Tech Partner</p>
          <div className="text-xs text-gray-500 mt-2">
            <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
            <p>Makati, Metro Manila, Philippines</p>
            <p>Phone: +63 2 1234 5678 | Email: info@techpinoy.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">DELIVERY RECEIPT</h2>
          <div className="text-sm space-y-1">
            <p><strong>DR #:</strong> {delivery.delivery_receipt_number || `DR-${delivery.id?.slice(0, 8) || 'UNKNOWN'}`}</p>
            <p><strong>Delivery ID:</strong> {delivery.id?.slice(0, 8) || 'UNKNOWN'}</p>
            {purchaseOrder && (
              <>
                <p><strong>PO #:</strong> {purchaseOrder.id?.slice(0, 8) || 'UNKNOWN'}</p>
                <p><strong>Client PO #:</strong> {purchaseOrder.client_po || 'N/A'}</p>
              </>
            )}
            <p><strong>Delivery Date:</strong> {delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Created:</strong> {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b pb-6 space-y-6">
      {/* Company Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">TechPinoy</h1>
          <p className="text-sm text-gray-600 mt-1">Your Trusted Tech Partner</p>
          <div className="text-xs text-gray-500 mt-2">
            <p>Unit 2A, 2nd Floor, 1010 Metropolitan Ave</p>
            <p>Makati, Metro Manila, Philippines</p>
            <p>Phone: +63 2 1234 5678 | Email: info@techpinoy.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">DELIVERY RECEIPT</h2>
          <div className="text-sm space-y-1">
            <p><strong>DR #:</strong> {delivery.delivery_receipt_number || `DR-${delivery.id?.slice(0, 8) || 'UNKNOWN'}`}</p>
            <p><strong>Delivery ID:</strong> {delivery.id?.slice(0, 8) || 'UNKNOWN'}</p>
            {purchaseOrder && (
              <>
                <p><strong>PO #:</strong> {purchaseOrder.id?.slice(0, 8) || 'UNKNOWN'}</p>
              </>
            )}
            <p><strong>Created:</strong> {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="grid grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="delivery-date" className="text-sm font-medium text-gray-700">
            Delivery Date
          </Label>
          <Input
            id="delivery-date"
            type="date"
            value={delivery.delivery_date || ''}
            onChange={(e) => onDeliveryChange('delivery_date', e.target.value)}
            className="w-full"
          />
        </div>
        
        {purchaseOrder && (
          <div className="space-y-2">
            <Label htmlFor="client-po" className="text-sm font-medium text-gray-700">
              Client PO #
            </Label>
            <Input
              id="client-po"
              type="text"
              placeholder="Enter Client PO Number"
              value={purchaseOrder.client_po || ''}
              onChange={(e) => onPurchaseOrderChange('client_po', e.target.value)}
              className="w-full"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="delivery-receipt-number" className="text-sm font-medium text-gray-700">
            Delivery Receipt Number
          </Label>
          <Input
            id="delivery-receipt-number"
            type="text"
            placeholder="Enter DR Number"
            value={delivery.delivery_receipt_number || ''}
            onChange={(e) => onDeliveryChange('delivery_receipt_number', e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes
          </Label>
          <Input
            id="notes"
            type="text"
            placeholder="Additional notes"
            value={delivery.notes || ''}
            onChange={(e) => onDeliveryChange('notes', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};