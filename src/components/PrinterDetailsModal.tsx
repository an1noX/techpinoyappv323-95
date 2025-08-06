
import React from 'react';
import { X, Printer, Tag, Info, Hash, Palette, Calendar, CheckCircle, FileText, User, DollarSign, ClipboardList, Layers, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Printer as PrinterType, PrinterAssignment } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';

interface PrinterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: PrinterType | null;
  assignment?: PrinterAssignment | null;
  inventoryRecords?: PrinterAssignment[];
}

const DetailItem = ({ icon: Icon, label, value, isBadge = false, badgeVariant = 'outline' }: { 
  icon: React.ElementType, 
  label: string, 
  value: any, 
  isBadge?: boolean, 
  badgeVariant?: "outline" | "default" | "secondary" | "destructive" 
}) => (
  <div className="flex items-start space-x-4 py-2">
    <Icon className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      {isBadge ? (
        <Badge variant={badgeVariant} className="capitalize">{value}</Badge>
      ) : (
        <p className="text-base text-gray-800 font-medium">{value || <span className="text-gray-400 italic">Not provided</span>}</p>
      )}
    </div>
  </div>
);

const PrinterDetailsModal: React.FC<PrinterDetailsModalProps> = ({
  isOpen,
  onClose,
  printer,
  assignment,
  inventoryRecords = [],
}) => {
  const isMobile = useIsMobile();
  
  if (!isOpen || !printer) return null;

  const getStatusBadge = (status?: string): "outline" | "default" | "secondary" | "destructive" => {
    if (status === 'active') return 'default';
    if (status === 'inactive') return 'secondary';
    if (status === 'returned') return 'destructive';
    return 'outline';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Printer className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{printer.name}</h2>
              <p className="text-sm text-gray-600">{printer.manufacturer} {printer.model}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="general" className="h-full flex flex-col">
            <TabsList className="flex justify-center mt-2">
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              {assignment && <TabsTrigger value="assignment">Assignment</TabsTrigger>}
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="general">
                <DetailItem icon={Tag} label="Model" value={printer.model} />
                <DetailItem icon={Info} label="Series" value={printer.series} />
                <DetailItem icon={Palette} label="Color" value={printer.color} />
                <DetailItem icon={Layers} label="Type" value={printer.printer_type} />
                <DetailItem icon={FileText} label="Description" value={printer.description} />
                <DetailItem icon={CheckCircle} label="Available for Assignment" value={printer.is_available ? 'Yes' : 'No'} isBadge badgeVariant={printer.is_available ? 'default' : 'secondary'} />
                <DetailItem icon={ClipboardList} label="Functions" value={printer.functions} />
                <DetailItem icon={DollarSign} label="Purchase Price" value={printer.purchase_price ? `$${printer.purchase_price}` : null} />
                <DetailItem icon={DollarSign} label="Monthly Rental Price" value={printer.rental_price_per_month ? `$${printer.rental_price_per_month}` : null} />
                <DetailItem icon={Calendar} label="Created At" value={printer.created_at ? new Date(printer.created_at).toLocaleDateString() : undefined} />
              </TabsContent>
              
              <TabsContent value="specifications">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Specifications</h3>
                  <DetailItem icon={Info} label="Print Resolution" value={printer.print_resolution} />
                  <DetailItem icon={Info} label="Print Speed (B&W)" value={printer.print_speed_bw} />
                  <DetailItem icon={Info} label="Print Speed (Color)" value={printer.print_speed_color} />
                  <DetailItem icon={Info} label="First Page Out Time" value={printer.first_page_out_time} />
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Paper Handling</h3>
                  <DetailItem icon={Info} label="Input Tray Capacity" value={printer.input_tray_capacity} />
                  <DetailItem icon={Info} label="Output Tray Capacity" value={printer.output_tray_capacity} />
                  <DetailItem icon={Info} label="Supported Paper Sizes" value={printer.supported_paper_sizes} />
                  <DetailItem icon={Info} label="Supported Paper Types" value={printer.supported_paper_types} />
                  <DetailItem icon={CheckCircle} label="Automatic Duplex" value={printer.automatic_duplex ? 'Yes' : 'No'} isBadge badgeVariant={printer.automatic_duplex ? 'default' : 'secondary'} />
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Connectivity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={CheckCircle} label="USB" value={printer.connectivity_usb ? 'Yes' : 'No'} isBadge badgeVariant={printer.connectivity_usb ? 'default' : 'secondary'} />
                    <DetailItem icon={CheckCircle} label="Wi-Fi" value={printer.connectivity_wifi ? 'Yes' : 'No'} isBadge badgeVariant={printer.connectivity_wifi ? 'default' : 'secondary'} />
                    <DetailItem icon={CheckCircle} label="Wi-Fi Direct" value={printer.connectivity_wifi_direct ? 'Yes' : 'No'} isBadge badgeVariant={printer.connectivity_wifi_direct ? 'default' : 'secondary'} />
                    <DetailItem icon={CheckCircle} label="Ethernet" value={printer.connectivity_ethernet ? 'Yes' : 'No'} isBadge badgeVariant={printer.connectivity_ethernet ? 'default' : 'secondary'} />
                    <DetailItem icon={CheckCircle} label="Bluetooth" value={printer.connectivity_bluetooth ? 'Yes' : 'No'} isBadge badgeVariant={printer.connectivity_bluetooth ? 'default' : 'secondary'} />
                    <DetailItem icon={CheckCircle} label="NFC" value={printer.connectivity_nfc ? 'Yes' : 'No'} isBadge badgeVariant={printer.connectivity_nfc ? 'default' : 'secondary'} />
                  </div>
                  <DetailItem icon={Info} label="Cloud Printing Support" value={printer.cloud_printing_support} />
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Software & Support</h3>
                  <DetailItem icon={Info} label="Supported OS" value={printer.supported_os} />
                  <DetailItem icon={FileText} label="Driver Download" value={printer.driver_download_url} />
                  <DetailItem icon={FileText} label="Software Download" value={printer.software_download_url} />
                  <DetailItem icon={FileText} label="User Manual" value={printer.user_manual_url} />
                </div>
              </TabsContent>
              
              <TabsContent value="inventory">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Inventory Records</h3>
                    <Badge variant="outline">{inventoryRecords.length} units</Badge>
                  </div>
                  
                  {inventoryRecords.length > 0 ? (
                    <div className="space-y-3">
                      {inventoryRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">S/N: {record.serial_number || 'Not provided'}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Badge variant={getStatusBadge(record.status)}>{record.status}</Badge>
                              <Badge variant="outline">{record.usage_type}</Badge>
                            </div>
                          </div>
                          {record.deployment_date && (
                            <p className="text-sm text-gray-600">
                              Deployed: {new Date(record.deployment_date).toLocaleDateString()}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No inventory records found for this printer model.</p>
                      <p className="text-sm text-gray-500 mt-1">Add units to inventory to track physical printers.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {assignment && (
                <TabsContent value="assignment">
                  <DetailItem icon={User} label="Client ID" value={assignment.client_id} />
                  <DetailItem icon={MapPin} label="Department" value={assignment.department} />
                  <DetailItem icon={Calendar} label="Deployment Date" value={assignment.deployment_date ? new Date(assignment.deployment_date).toLocaleDateString() : undefined} />
                  <DetailItem icon={ClipboardList} label="Usage Type" value={assignment.usage_type} />
                  <DetailItem icon={DollarSign} label="Monthly Price" value={assignment.monthly_price ? `$${assignment.monthly_price}` : null} />
                  <DetailItem icon={CheckCircle} label="Assignment Status" value={assignment.status} isBadge badgeVariant={getStatusBadge(assignment.status)} />
                  <DetailItem icon={ClipboardList} label="Security Deposit" value={assignment.has_security_deposit ? 'Yes' : 'No'} />
                  <DetailItem icon={DollarSign} label="Security Deposit Amount" value={assignment.security_deposit_amount ? `$${assignment.security_deposit_amount}` : null} />
                  <DetailItem icon={FileText} label="Notes" value={assignment.notes} />
                  <DetailItem icon={Calendar} label="Created At" value={assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : undefined} />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
        
        <div className="flex space-x-3 p-6 bg-gray-50 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default PrinterDetailsModal;
