import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer } from '@/types/database';

interface PrinterFormData extends Omit<Printer, 'id' | 'created_at' | 'updated_at' | 'purchase_price' | 'rental_price_per_month'> {
  purchase_price: string;
  rental_price_per_month: string;
}

interface PrinterSpecificationsFormProps {
  formData: Partial<PrinterFormData>;
  onInputChange: (field: string, value: any) => void;
}

const PrinterSpecificationsForm: React.FC<PrinterSpecificationsFormProps> = ({
  formData,
  onInputChange,
}) => {
  // Common paper sizes - removed unwanted sizes
  const paperSizes = [
    'A4',
    'A3',
    'A5',
    'Letter',
    'Legal',
    'Executive',
    'Folio'
  ];

  // Parse selected paper sizes from string to array
  const selectedPaperSizes = formData.supported_paper_sizes 
    ? formData.supported_paper_sizes.split(',').map(size => size.trim()).filter(size => size)
    : [];

  // Handle paper size checkbox changes
  const handlePaperSizeChange = (paperSize: string, checked: boolean) => {
    let updatedSizes = [...selectedPaperSizes];
    
    if (checked) {
      // Add size if not already selected
      if (!updatedSizes.includes(paperSize)) {
        updatedSizes.push(paperSize);
      }
    } else {
      // Remove size
      updatedSizes = updatedSizes.filter(size => size !== paperSize);
    }
    
    // Convert back to comma-separated string
    const sizesString = updatedSizes.join(', ');
    onInputChange('supported_paper_sizes', sizesString);
  };

  return (
    <div className="space-y-6">
      {/* Paper Sizes - Checkbox Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Paper Specifications</h3>
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">
            Supported Paper Sizes
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
            {paperSizes.map((paperSize) => (
              <div key={paperSize} className="flex items-center space-x-2">
                <Checkbox
                  id={`paper-${paperSize}`}
                  checked={selectedPaperSizes.includes(paperSize)}
                  onCheckedChange={(checked) => handlePaperSizeChange(paperSize, checked as boolean)}
                />
                <Label 
                  htmlFor={`paper-${paperSize}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {paperSize}
                </Label>
              </div>
            ))}
          </div>
          
          {/* Display selected sizes */}
          {selectedPaperSizes.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-1">Selected Paper Sizes:</p>
              <p className="text-sm text-blue-700">{selectedPaperSizes.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Connectivity Options */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Connectivity Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="connectivity_usb">USB</Label>
            <Switch
              id="connectivity_usb"
              checked={formData.connectivity_usb || false}
              onCheckedChange={(checked) => onInputChange('connectivity_usb', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="connectivity_wifi">Wi-Fi</Label>
            <Switch
              id="connectivity_wifi"
              checked={formData.connectivity_wifi || false}
              onCheckedChange={(checked) => onInputChange('connectivity_wifi', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="connectivity_wifi_direct">Wi-Fi Direct</Label>
            <Switch
              id="connectivity_wifi_direct"
              checked={formData.connectivity_wifi_direct || false}
              onCheckedChange={(checked) => onInputChange('connectivity_wifi_direct', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="connectivity_ethernet">Ethernet</Label>
            <Switch
              id="connectivity_ethernet"
              checked={formData.connectivity_ethernet || false}
              onCheckedChange={(checked) => onInputChange('connectivity_ethernet', checked)}
            />
          </div>
          {/* Removed Bluetooth and NFC options */}
        </div>
      </div>
    </div>
  );
};

export default PrinterSpecificationsForm;
