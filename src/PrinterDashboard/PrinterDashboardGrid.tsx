import React, { useState, useEffect } from 'react';
import { CompatibleProducts } from './components/CompatibleProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Eye, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AssignedPrinterCard from '@/PrinterDashboard/PrinterDashboardCard';
import AvailablePrinterCard from '@/PrinterDashboard/PrinterDashboardAvailable';

import { ADMIN_DASHBOARD_TABS } from '@/constants/adminDashboard';
import { Printer as PrinterType, Product } from '@/types/database';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const colorClasses: { [key: string]: string } = {
  black: 'bg-black',
  cyan: 'bg-cyan-500',
  magenta: 'bg-pink-500',
  yellow: 'bg-yellow-400',
};

const ColorDot = ({ color }: { color: string }) => {
  const colorClass = colorClasses[color?.toLowerCase()] || 'bg-gray-400';
  return <div className={`w-3 h-3 rounded-full ${colorClass}`} />;
};

type TabType = typeof ADMIN_DASHBOARD_TABS[keyof typeof ADMIN_DASHBOARD_TABS];
interface AdminDataGridProps {
  data: any[];
  activeTab: TabType;
  onItemClick?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  printerFilter?: 'assigned' | 'catalog' | 'available' | 'inventory';
}

const AllPrinterCard = ({
  printer,
  onEdit,
  onDelete,
  onItemClick
}: {
  printer: PrinterType;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onItemClick?: (item: any) => void;
}) => {
  const isAvailable = printer.is_available ?? true;
  const assignmentStatus = (printer as any).printer_assignments?.filter((a: any) => a.status === 'active') || [];

  const getAssignmentStatusInfo = () => {
    if (assignmentStatus.length === 0) {
      return {
        status: 'available',
        label: 'Available',
        color: 'bg-green-100 text-green-700'
      };
    } else {
      return {
        status: 'assigned',
        label: 'Currently Assigned',
        color: 'bg-blue-100 text-blue-700'
      };
    }
  };

  const statusInfo = getAssignmentStatusInfo();

  return (
    <div className="flex items-center justify-between">
      {/* Thumbnail */}
      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded border overflow-hidden mr-3">
        {printer.image_url ? (
          <img src={printer.image_url} alt={printer.name} className="object-contain w-full h-full" />
        ) : (
          <Printer className="h-8 w-8 text-gray-400" />
        )}
      </div>
      
      <div className="flex-1 cursor-pointer" onClick={() => onItemClick?.(printer)}>
        <div className="flex items-center space-x-2 mb-1">
          <h4 className="font-medium text-sm">
            {[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
          </h4>
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
            {printer.rental_eligible && (
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                Rental Eligible
              </Badge>
            )}
            {printer.color && (
              <Badge variant="outline" className="text-xs">
                {printer.color}
              </Badge>
            )}
          </div>
          {/* Compatible Products Section */}
          <CompatibleProducts 
            printerId={printer.id} 
            className="mt-2" 
          />
        </div>
      </div>
    </div>
  );
};

const AdminDataGrid: React.FC<AdminDataGridProps> = ({
  data,
  activeTab,
  onItemClick,
  onEdit,
  onDelete,
  printerFilter
}) => {
  const isMobile = useIsMobile();
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType | null>(null);
  // Add local state for printers for real-time update
  const [localPrinters, setLocalPrinters] = useState<any[]>(data);

  useEffect(() => {
    setLocalPrinters(data);
  }, [data]);

  if (!localPrinters || localPrinters.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No items found.</p>
      </div>
    );
  }

  const isPrinterTab = activeTab === ADMIN_DASHBOARD_TABS.PRINTERS;

  const handleEditVisibility = (printer: PrinterType) => {
    setSelectedPrinter(printer);
    setShowVisibilityModal(true);
  };

  const handleVisibilityUpdated = () => {
    window.location.reload();
  };

  // Real-time delete handler for assigned printers
  const handleDeletePrinter = async (printerToDelete: any) => {
    if (onDelete) {
      await onDelete(printerToDelete);
    }
    setLocalPrinters(prev => prev.filter(p => p.id !== printerToDelete.id));
  };

  return (
    <>
      <div className={cn(
        "gap-4 w-full",
        isMobile ? "grid grid-cols-1" : "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
      )}>
        {localPrinters.map((item: any, index: number) => {
          return (
            <Card key={item.id || index} className={cn(
              "border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative",
              !isMobile && "bg-white/60 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] animate-fade-in"
            )}>
              <CardContent className={cn(
                isMobile ? "p-3" : "p-6"
              )}>
                {isPrinterTab && printerFilter === 'assigned' ? (
                  <AssignedPrinterCard printer={item} onEdit={onEdit} onDelete={handleDeletePrinter} onTransfer={() => {}} />
                ) : isPrinterTab && printerFilter === 'available' ? (
                  <AvailablePrinterCard 
                    printer={item} 
                    onEditVisibility={handleEditVisibility}
                    onDelete={onDelete} 
                  />
                ) : isPrinterTab && printerFilter === 'catalog' ? (
                  <AllPrinterCard printer={item} onEdit={onEdit} onDelete={onDelete} onItemClick={onItemClick} />
                ) : (
                  <div className={cn(
                    "flex items-center justify-between cursor-pointer",
                    isMobile ? "p-4" : "p-0"
                  )} onClick={() => onItemClick?.(item)}>
                    <h3 className={cn(
                      "font-semibold text-gray-800",
                      !isMobile && "text-xl"
                    )}>{item.name}</h3>
                  </div>
                )}
              </CardContent>
            
            {/* Dropdown Menu - Only show for non-available printer cards */}
            {/* Only show dropdown for non-assigned printer cards if needed */}
            {isPrinterTab && printerFilter !== 'assigned' && printerFilter !== 'available' && (
              <div className={cn(
                "absolute",
                isMobile ? "top-2 right-2" : "top-4 right-4"
              )}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn(
                      isMobile ? "h-8 w-8" : "h-10 w-10"
                    )}>
                      <Edit className={cn(
                        isMobile ? "h-4 w-4" : "h-5 w-5"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    {onEdit && (
                      <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        onEdit(item);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    
                    {onDelete && (
                      <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        onDelete(item);
                      }} className="text-red-600 hover:text-red-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </Card>
        );
      })}
      </div>


    </>
  );
};

export default AdminDataGrid; 