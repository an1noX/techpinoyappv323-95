
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Settings, MapPin, Printer, Plus, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ClientPrinterCard from './ClientPrinterCard';
import EditLocationModal from './EditLocationModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssignPrinterToLocationModal from './AssignPrinterToLocationModal';
import TransferPrinterModal from './TransferPrinterModal';
import { useAuth } from '@/hooks/useAuth';

// Define types locally
interface DepartmentLocation {
  id: string;
  name: string;
  printers?: any[];
  printer_count?: number;
}

interface Department {
  id: string;
  name: string;
  locations: DepartmentLocation[];
  total_printer_count: number;
}

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
  onRefresh: () => void;
  onEditAssignment: (assignment: any) => void;
  onAssignPrinter: (department: Department) => void;
  onUnassign?: (assignmentId: string) => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onEdit,
  onDelete,
  onRefresh,
  onEditAssignment,
  onAssignPrinter,
  onUnassign
}) => {
  const { userProfile } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<DepartmentLocation | null>(null);
  const [showAssignPrinterModal, setShowAssignPrinterModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAssignments, setTransferAssignments] = useState<any[]>([]);
  const [selectedPrinterAssignment, setSelectedPrinterAssignment] = useState<any>(null);

  // Check if user is a client user (not admin/owner/sales_admin)
  const isClientUser = userProfile && !['admin', 'sales_admin'].includes(userProfile.role || '');

  const handleManagePrinter = (printer: any) => {
    console.log('Managing printer:', printer);
  };

  return (
    <Card id={`department-${department.id}`} className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      <CardContent className="p-3 space-y-3">
        {/* Mobile-first compact department header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm text-gray-900 truncate">
                {department.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>{department.locations.length} Location{department.locations.length !== 1 ? 's' : ''}</span>
                <span>{department.total_printer_count} Printer{department.total_printer_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Only show settings dropdown for non-client users */}
          {!isClientUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 flex-shrink-0 touch-target">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(department)} className="text-sm">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit Department
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (department.locations && department.locations.length > 1) {
                    setShowLocationSelect(true);
                  } else if (department.locations && department.locations.length === 1) {
                    setLocationToEdit(department.locations[0]);
                  }
                }} className="text-sm">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit Location
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAssignPrinterModal(true)} className="text-sm">
                  <Printer className="mr-2 h-3 w-3" />
                  Assign Printer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Gather all printer assignments in the department
                  const assignments = department.locations.flatMap(loc =>
                    (loc.printers || []).map(printer => ({
                      id: printer.id,
                      printer_id: printer.printer_id,
                      department: `${department.name} ${loc.name}`,
                      serial_number: printer.serial_number || '',
                      status: printer.status,
                      printer: {
                        name: printer.printer?.name || '',
                        model: printer.printer?.model,
                        manufacturer: printer.printer?.manufacturer,
                      },
                    }))
                  );
                  if (assignments.length > 0) {
                    setTransferAssignments(assignments);
                    setSelectedPrinterAssignment(null);
                    setShowTransferModal(true);
                  }
                }} className="text-sm">
                  <Edit className="mr-2 h-3 w-3" />
                  Transfer Printer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile-optimized locations list */}
        <div className="space-y-2">
          {department.locations.length === 0 ? (
            <div className="text-xs text-gray-500 py-2 text-center bg-gray-50 rounded-lg">
              No locations in this department.
            </div>
          ) : (
            department.locations.map((location) => (
              <div key={location.id} className="bg-white rounded-lg border border-gray-100 p-2">
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {location.name}
                </div>
                <div className="space-y-1">
                  {location.printers && location.printers.length > 0 ? (
                    location.printers.map(printer => (
                      <ClientPrinterCard 
                        key={printer.id} 
                        printer={printer} 
                        onManage={() => onEditAssignment(printer)}
                        clientId={clientId}
                        departmentName={department.name}
                        locationName={location.name}
                        onUnassign={onUnassign}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic py-1 text-center">
                      No printers assigned
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile-optimized modals */}
        <EditLocationModal
          isOpen={showLocationSelect || !!locationToEdit}
          onClose={() => {
            setLocationToEdit(null);
            setShowLocationSelect(false);
          }}
          locations={department.locations}
          location={locationToEdit}
          departmentBaseName={department.name}
          onLocationUpdated={() => {
            setLocationToEdit(null);
            setShowLocationSelect(false);
            onRefresh();
          }}
        />
        
        <AssignPrinterToLocationModal
          isOpen={showAssignPrinterModal}
          onClose={() => setShowAssignPrinterModal(false)}
          location={null}
          locations={department.locations}
          departmentBaseName={department.name}
          clientId={clientId || ''}
          onPrinterAssigned={() => {
            setShowAssignPrinterModal(false);
            onRefresh();
          }}
        />
        
        {showTransferModal && (
          <TransferPrinterModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            assignment={selectedPrinterAssignment}
            assignments={transferAssignments}
            currentClientId={clientId || ''}
            onTransferCompleted={() => {
              setShowTransferModal(false);
              setSelectedPrinterAssignment(null);
              setTransferAssignments([]);
              onRefresh();
            }}
            onSelectAssignment={setSelectedPrinterAssignment}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentCard;
