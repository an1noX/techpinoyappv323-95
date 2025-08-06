import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DeliveryReceiptWithItems {
  id: string;
  supplier_client_id: string;
  supplier_name: string;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_order_number: string | null;
  client_po: string | null;
  sale_invoice_number: string | null;
  expected_delivery_date: string | null;
  due_date: string | null;
  delivery_receipt_number: string | null;
  delivery_date: string;
  client_id: string;
}

interface EditableDRHeaderProps {
  deliveryReceipt: DeliveryReceiptWithItems;
  isEditing: boolean;
  onDeliveryReceiptChange: (field: string, value: string) => void;
}

export const EditableDRHeader: React.FC<EditableDRHeaderProps> = ({
  deliveryReceipt,
  isEditing,
  onDeliveryReceiptChange
}) => {
  if (!deliveryReceipt) {
    return (
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">DELIVERY RECEIPT</h1>
        <div className="text-sm">Loading...</div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">DELIVERY RECEIPT</h1>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="text-left">
            <p><strong>DR Number:</strong> {deliveryReceipt.delivery_receipt_number || `DR-${deliveryReceipt.id.slice(0, 8)}`}</p>
            <p><strong>Date:</strong> {new Date(deliveryReceipt.delivery_date).toLocaleDateString()}</p>
            <p><strong>PO Number:</strong> {deliveryReceipt.purchase_order_number || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p><strong>Status:</strong> {deliveryReceipt.status}</p>
            <p><strong>Created:</strong> {new Date(deliveryReceipt.created_at).toLocaleDateString()}</p>
            <p><strong>Client PO:</strong> {deliveryReceipt.client_po || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b pb-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">DELIVERY RECEIPT</h1>
        <div className="text-sm text-gray-600">ID: {deliveryReceipt.id.slice(0, 8)}</div>
      </div>

      {/* Editable Fields */}
      <div className="grid grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="delivery-receipt-number" className="text-sm font-medium text-gray-700">
            DR Number
          </Label>
          <Input
            id="delivery-receipt-number"
            type="text"
            placeholder="Enter DR Number"
            value={deliveryReceipt.delivery_receipt_number || ''}
            onChange={(e) => onDeliveryReceiptChange('delivery_receipt_number', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery-date" className="text-sm font-medium text-gray-700">
            Delivery Date
          </Label>
          <Input
            id="delivery-date"
            type="date"
            value={deliveryReceipt.delivery_date || ''}
            onChange={(e) => onDeliveryReceiptChange('delivery_date', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="po-reference" className="text-sm font-medium text-gray-700">
            PO Reference
          </Label>
          <Input
            id="po-reference"
            type="text"
            placeholder="Enter PO Number or Client PO"
            value={deliveryReceipt.purchase_order_number || deliveryReceipt.client_po || ''}
            onChange={(e) => {
              // Update both fields with the same value to maintain compatibility
              onDeliveryReceiptChange('purchase_order_number', e.target.value);
              onDeliveryReceiptChange('client_po', e.target.value);
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          {/* Placeholder div to maintain grid layout */}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Additional notes"
            value={deliveryReceipt.notes || ''}
            onChange={(e) => onDeliveryReceiptChange('notes', e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};