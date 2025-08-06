
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Download, FileText, Settings, Wifi, Printer as PrinterIcon } from 'lucide-react';
import { Printer } from '@/types/database';

interface ViewPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: Printer | null;
}

interface DetailRowProps {
  label: string;
  value: string | number | boolean | null | undefined;
  type?: 'text' | 'boolean' | 'link' | 'badge';
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, type = 'text', variant = 'default' }) => {
  if (!value && value !== false) return null;

  const renderValue = () => {
    switch (type) {
      case 'boolean':
        return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
      case 'link':
        return (
          <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1">
            View <ExternalLink className="h-3 w-3" />
          </a>
        );
      case 'badge':
        return <Badge variant={variant}>{value}</Badge>;
      default:
        return <span className="text-gray-900">{value}</span>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-xs sm:text-sm font-medium text-gray-600 min-w-0 sm:min-w-[120px]">{label}</div>
      <div className="min-w-0 flex-1">{renderValue()}</div>
    </div>
  );
};

export default function ViewPrinterModal({ isOpen, onClose, printer }: ViewPrinterModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!printer) return null;

  const getStatusVariant = (available?: boolean) => {
    return available ? 'default' : 'secondary';
  };

  const getTypeVariant = (type?: string) => {
    if (!type) return 'outline';
    if (type.toLowerCase().includes('laser')) return 'default';
    if (type.toLowerCase().includes('inkjet')) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full sm:max-w-2xl p-0 max-h-[95vh] flex flex-col" aria-describedby="printer-details-description">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <PrinterIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {printer.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {printer.manufacturer && (
                  <span className="text-sm text-gray-600">{printer.manufacturer}</span>
                )}
                {printer.model && (
                  <Badge variant="outline" className="text-xs">{printer.model}</Badge>
                )}
                {printer.series && (
                  <Badge variant="outline" className="text-xs">{printer.series}</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {/* Hidden description for accessibility */}
        <div id="printer-details-description" className="sr-only">
          Detailed information about {printer.name} printer including specifications, connectivity, and support resources.
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 mx-4 sm:mx-6 mt-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="specs" className="text-xs sm:text-sm py-2">Specs</TabsTrigger>
            <TabsTrigger value="connectivity" className="text-xs sm:text-sm py-2">Network</TabsTrigger>
            <TabsTrigger value="support" className="text-xs sm:text-sm py-2">Support</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="mt-0">
              <Card className="mx-4 sm:mx-6 mt-4 mb-4">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <DetailRow label="Status" value={printer.is_available ? 'Available' : 'In Use'} type="badge" variant={getStatusVariant(printer.is_available)} />
                    <DetailRow label="Type" value={printer.printer_type} type="badge" variant={getTypeVariant(printer.printer_type)} />
                    <DetailRow label="Color Capability" value={printer.color} />
                    <DetailRow label="Release Year" value={printer.release_year} />
                    <DetailRow label="Functions" value={printer.functions} />
                    <DetailRow label="Description" value={printer.description} />
                    <DetailRow label="Aliases" value={printer.aliases} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-0">
              <Card className="mx-4 sm:mx-6 mt-4 mb-4">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <DetailRow label="Print Resolution" value={printer.resolution} />
                    <DetailRow label="Print Speed" value={printer.print_speed} />
                    <DetailRow label="Processor" value={printer.processor} />
                    <DetailRow label="RAM" value={printer.ram} />
                    <DetailRow label="Dimensions" value={printer.dimensions} />
                    <DetailRow label="Weight" value={printer.weight} />
                    <DetailRow label="Duplex Printing" value={printer.duplex_printing} type="boolean" />
                    <DetailRow label="ADF" value={printer.adf} type="boolean" />
                    <DetailRow label="Paper Sizes" value={printer.paper_sizes} />
                    <DetailRow label="Paper Types" value={printer.paper_types} />
                    <DetailRow label="Input Capacity" value={printer.input_capacity} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connectivity" className="mt-0">
              <Card className="mx-4 sm:mx-6 mt-4 mb-4">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <DetailRow label="Wired Connectivity" value={printer.connectivity_wired} />
                    <DetailRow label="Wireless Options" value={printer.connectivity_wireless} />
                    <DetailRow label="Network Printing" value={printer.network_printing} type="boolean" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="mt-0">
              <Card className="mx-4 sm:mx-6 mt-4 mb-4">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <DetailRow label="Compatible Cartridges" value={printer.compatible_cartridges} />
                    <DetailRow label="Page Yield" value={printer.page_yield} />
                    <DetailRow label="Drivers" value={printer.drivers_url} type="link" />
                    <DetailRow label="User Manual" value={printer.manual_url} type="link" />
                    <DetailRow label="Setup Guide" value={printer.setup_guide_url} type="link" />
                    <DetailRow label="Troubleshooting" value={printer.troubleshooting_url} type="link" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 sm:px-6 py-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto sm:ml-auto sm:block"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
