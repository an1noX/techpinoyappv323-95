import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from './hooks/useDepartments';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, MapPin, Package, Edit, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DepartmentCard from './components/DepartmentCard';
import UnifiedDepartmentModal from './components/UnifiedDepartmentModal';
import EditPrinterAssignmentModal from './components/EditPrinterAssignmentModal';
import AssignPrinterToLocationModal from './components/AssignPrinterToLocationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/useAuth';
import ClientPrinterCard from './components/ClientPrinterCard';
import { useQuery } from '@tanstack/react-query';
import { assetService } from '@/services/assetService';
import { Badge } from '@/components/ui/badge';
import { CustomLoading } from "@/components/ui/CustomLoading";
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

// Define types locally to avoid import issues
interface Department {
  id: string;
  name: string;
  locations: any[];
  total_printer_count: number;
}

interface AdminDashboardClientDepartmentsProps {
  clientId: string;
  filteredPrinters?: any[];
  onDepartmentDetailsView?: (value: boolean) => void;
}

const AdminDashboardClientDepartments: React.FC<AdminDashboardClientDepartmentsProps> = ({ 
  clientId, 
  filteredPrinters, 
  onDepartmentDetailsView 
}) => {
  const { userProfile } = useAuth();
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedPrinterAssignment, setSelectedPrinterAssignment] = useState<any>(null);
  const [assignPrinterDepartment, setAssignPrinterDepartment] = useState<any>(null);
  const [assignPrinterLocation, setAssignPrinterLocation] = useState<any>(null);
  const [showAssignPrinterModal, setShowAssignPrinterModal] = useState(false);
  const [showDeleteDeptDialog, setShowDeleteDeptDialog] = useState(false);
  const [deleteDeptBlocked, setDeleteDeptBlocked] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<any>(null);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const { toast } = useToast();

  // Check if user is a client user (not admin/owner/sales_admin)
  const isClientUser = userProfile && !['admin', 'sales_admin', 'superadmin'].includes(userProfile.role || '');

  const { data: departments = [], isLoading, refetch } = useDepartments(clientId);

  // Fetch undeployed printers for this client
  const { data: undeployedPrinters = [], isLoading: isLoadingUndeployed, refetch: refetchUndeployed } = useQuery({
    queryKey: ['client-printer-pool', clientId],
    queryFn: () => assetService.getClientPrinterPool(clientId),
    enabled: !!clientId
  });

  // Fetch inactive printers for this client
  const { data: inactivePrinters = [], isLoading: isLoadingInactive, refetch: refetchInactive } = useQuery({
    queryKey: ['client-inactive-printers', clientId],
    queryFn: () => assetService.getClientInactiveAssignments(clientId),
    enabled: !!clientId
  });

  // Set up real-time updates to listen for assignment changes
  const { refreshData } = useRealTimeUpdates({
    queryKeys: ['departments', 'client-printer-pool', 'client-inactive-printers'],
    showNotifications: false
  });

  // Listen for custom events from AssignModal and other components
  useEffect(() => {
    const handleRefreshEvent = () => {
      console.log('🔄 AdminDashboardClientDepartments: Received refresh event, updating data...');
      handleRefresh();
    };
    
    // Listen for events dispatched by AssignModal
    window.addEventListener('refresh-printer-data', handleRefreshEvent);
    window.addEventListener('refresh-compatible-products', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('refresh-printer-data', handleRefreshEvent);
      window.removeEventListener('refresh-compatible-products', handleRefreshEvent);
    };
  }, []);

  // Group inactive printers by department/location using correct property access
  const inactiveByDeptLoc: Record<string, Record<string, any[]>> = {};
  const inactiveNoDept: any[] = [];
  inactivePrinters.forEach(assignment => {
    // Handle different possible structures for department_location_id
    let deptId = null;
    let locId = null;
    
    if (assignment.department_location_id && typeof assignment.department_location_id === 'object') {
      const deptLocObj = assignment.department_location_id as any;
      deptId = deptLocObj.department_id;
      locId = deptLocObj.id;
    }
    if (deptId && locId) {
      if (!inactiveByDeptLoc[deptId]) inactiveByDeptLoc[deptId] = {};
      if (!inactiveByDeptLoc[deptId][locId]) inactiveByDeptLoc[deptId][locId] = [];
      inactiveByDeptLoc[deptId][locId].push(assignment);
    } else {
      inactiveNoDept.push(assignment);
    }
  });

  const handleDepartmentSelect = (departmentId: string) => {
    const element = document.getElementById(`department-${departmentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setSelectedPrinterAssignment(assignment);
  };

  const handleEdit = (department: any) => {
    // Helper: find full printer object by id
    const findPrinterById = (printerId: any) => {
      // Try filteredPrinters, undeployedPrinters, inactivePrinters, or any other printer list you have
      const allPrinters = [
        ...(filteredPrinters || []),
        ...undeployedPrinters,
        ...inactivePrinters,
      ];
      return allPrinters.find(p => p.id === printerId || p.printer_id === printerId);
    };

    const transformedDepartment = {
      id: department.id,
      name: department.name,
      abbreviation: department.abbreviation || '',
      floor: department.floor || '',
      location: department.location || '',
      contactPerson: department.contact_person || '',
      description: department.description || '',
      locations: department.locations.map((loc: any) => {
        // Merge active and inactive printers for this location
        const activePrinters = loc.printers || [];
        const inactiveForLoc = (inactiveByDeptLoc[department.id] && inactiveByDeptLoc[department.id][loc.id]) || [];
        const mergedPrinters = [
          ...activePrinters,
          ...inactiveForLoc.filter(inactive =>
            !activePrinters.some(active => active.id === inactive.printer_id)
          )
        ];
        // Map each printer to a full object with a name property
        const mappedPrinters = mergedPrinters.map(printer => {
          if (printer && typeof printer === 'object' && printer.name) {
            return printer;
          }
          // If it's an assignment object (inactive), try to get printer details
          if (printer && typeof printer === 'object' && printer.printer) {
            return {
              ...printer,
              name: printer.printer.name || printer.printer.model || printer.printer.id || 'Unknown Printer',
            };
          }
          // If it's just an id, find the full printer object
          return findPrinterById(printer) || { id: printer, name: 'Unknown Printer' };
        });
        return {
          id: loc.id,
          name: loc.name,
          floor: loc.floor || '',
          officeName: loc.office_name || '',
          description: loc.description || '',
          contactPerson: loc.contact_person || '',
          contactNumber: loc.contact_number || '',
          abbreviation: loc.abbreviation || '',
          printers: mappedPrinters, // <-- Pass mapped printers here!
        };
      })
    };
    setSelectedDepartment(transformedDepartment);
    setShowUnifiedModal(true);
  };

  const handleDelete = (department: any) => {
    setDeptToDelete(department);
    if (department.locations && department.locations.length > 0) {
      setDeleteDeptBlocked(true);
    } else {
      setDeleteDeptBlocked(false);
    }
    setShowDeleteDeptDialog(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!deptToDelete) return;
    try {
      // Replace with your actual delete logic (API call, etc.)
      await assetService.deleteDepartment(deptToDelete.id);
      toast({
        title: 'Department Deleted',
        description: 'The department has been deleted successfully.',
      });
      setShowDeleteDeptDialog(false);
      setDeptToDelete(null);
      handleRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete department.',
        variant: 'destructive',
      });
      setShowDeleteDeptDialog(false);
      setDeptToDelete(null);
    }
  };

  const handleModalClose = () => {
    setSelectedDepartment(null);
    setShowUnifiedModal(false);
    setSelectedPrinterAssignment(null);
    setAssignPrinterDepartment(null);
    setAssignPrinterLocation(null);
    setShowAssignPrinterModal(false);
  };

  const handleRefresh = () => {
    console.log('🔄 AdminDashboardClientDepartments: Refreshing all data...');
    refetch();
    refetchUndeployed();
    refetchInactive();
    refreshData();
  };

  const handleAssignPrinter = (department: any) => {
    if (department.locations && department.locations.length > 0) {
      setAssignPrinterDepartment(department);
      setAssignPrinterLocation(department.locations[0]);
      setShowAssignPrinterModal(true);
    } else {
      toast({ title: 'No locations', description: 'Add a location to this department before assigning a printer.', variant: 'destructive' });
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      await assetService.makePrinterAvailable(assignmentId);
      handleRefresh();
    } catch (error) {
      // Optionally show a toast or error message
      console.error('Failed to unassign printer:', error);
    }
  };

  const totalLocations = useMemo(() => departments.reduce((acc, dept) => acc + dept.locations.length, 0), [departments]);
  const totalPrinters = useMemo(() => departments.reduce((acc, dept) => acc + dept.locations.reduce((locAcc, loc) => locAcc + (loc.printer_count || 0), 0), 0), [departments]);

  // If filteredPrinters is present and non-empty, display only those printers grouped by department/location
  if (filteredPrinters && filteredPrinters.length > 0) {
    // Group printers by department and location
    const grouped = {} as Record<string, { departmentName: string; locations: Record<string, { locationName: string; printers: any[] }> }>;
    filteredPrinters.forEach(printer => {
      const deptId = printer.department_id || 'unknown';
      const locId = printer.location_id || 'unknown';
      if (!grouped[deptId]) grouped[deptId] = { departmentName: printer.department_name || '', locations: {} };
      if (!grouped[deptId].locations[locId]) grouped[deptId].locations[locId] = { locationName: printer.location_name || '', printers: [] };
      grouped[deptId].locations[locId].printers.push(printer);
    });
    return (
      <div className="space-y-3">
        {Object.entries(grouped).map(([deptId, dept]) => (
          <div key={deptId} className="border rounded-lg p-3 bg-white shadow-sm">
            <h3 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              {dept.departmentName || 'Department'}
            </h3>
            {Object.entries(dept.locations).map(([locId, loc]) => (
              <div key={locId} className="space-y-2">
                {/* Active printers */}
                {loc.printers.map(printer => (
                  <ClientPrinterCard
                    key={printer.id}
                    printer={printer}
                    onManage={() => {}}
                    clientId={clientId}
                    departmentName={dept.departmentName}
                    locationName={loc.locationName}
                  />
                ))}
                {/* Inactive printers for this dept/location */}
                {(inactiveByDeptLoc[deptId] && inactiveByDeptLoc[deptId][locId]) &&
                  inactiveByDeptLoc[deptId][locId].map(assignment => (
                    <ClientPrinterCard
                      key={assignment.id}
                      printer={{
                        ...assignment,
                        id: assignment.printer_id,
                        name: assignment.printer?.name || 'Unknown Printer',
                        model: assignment.printer?.model,
                        status: assignment.status,
                        department_name: dept.departmentName,
                        location_name: loc.locationName,
                      }}
                      onManage={() => handleEditAssignment(assignment)}
                      clientId={clientId}
                      departmentName={dept.departmentName}
                      locationName={loc.locationName}
                    />
                  ))}
              </div>
            ))}
          </div>
        ))}
        {/* Inactive printers with no department/location */}
        {inactiveNoDept.length > 0 && (
          <div className="border rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-gray-400" />
              <h3 className="font-medium text-sm text-gray-900">Inactive (No Department)</h3>
              <Badge variant="secondary" className="text-xs">
                {inactiveNoDept.length} printer{inactiveNoDept.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-2">
              {inactiveNoDept.map(assignment => (
                <ClientPrinterCard
                  key={assignment.id}
                  printer={{
                    ...assignment,
                    id: assignment.printer_id,
                    name: assignment.printer?.name || 'Unknown Printer',
                    model: assignment.printer?.model,
                    status: assignment.status,
                    department_name: 'Inactive',
                    location_name: '',
                  }}
                  onManage={() => handleEditAssignment(assignment)}
                  clientId={clientId}
                  departmentName="Inactive"
                  locationName=""
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoading || isLoadingUndeployed || isLoadingInactive) {
    return <CustomLoading message="Loading departments" />;
  }

  return (
    <div className="space-y-3 pb-20"> {/* Add pb-20 or pb-safe */}
      {/* Mobile-first compact header with actions */}
      <div className="flex items-center justify-between gap-2">
        {departments.length > 1 && (
          <Select onValueChange={handleDepartmentSelect}>
            <SelectTrigger className="h-10 text-sm flex-1 max-w-[200px]">
              <SelectValue placeholder="Jump to department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id} className="text-sm">
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {/* Only show action buttons for non-client users */}
        {!isClientUser && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowUnifiedModal(true)} 
              size="sm" 
              variant="outline" 
              className="h-10 px-3 text-xs whitespace-nowrap touch-target"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Department
            </Button>
          </div>
        )}
      </div>

      {/* Department/Location rendering with merged inactive assignments */}
      {departments.map((dept) => (
        <div key={dept.id} className="border rounded-lg p-3 bg-white shadow-sm" id={`department-${dept.id}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              {dept.name}
            </h3>
            {/* Department actions for non-client users */}
            {!isClientUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleEdit(dept)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Department
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(dept)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Department
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {dept.locations.map((loc) => {
            // Merge active and inactive printers for this location
            const activePrinters = loc.printers || [];
            const inactiveForLoc = (inactiveByDeptLoc[dept.id] && inactiveByDeptLoc[dept.id][loc.id]) || [];
            const mergedPrinters = [
              ...activePrinters,
              ...inactiveForLoc.filter(inactive =>
                !activePrinters.some(active => active.id === inactive.printer_id)
              )
            ];
            return (
              <div key={loc.id} className="space-y-2">
                {/* Add this line to show location name above the printer cards */}
                <div className="font-semibold text-xs text-blue-700 mb-1">{loc.name}</div>
                {mergedPrinters.length > 0 ? (
                  mergedPrinters.map(printer => (
                    <ClientPrinterCard
                      key={printer.id}
                      printer={printer.status === 'inactive' ? {
                        ...printer,
                        id: printer.printer_id,
                        assignment_id: printer.id,
                        name: printer.printer?.name || 'Unknown Printer',
                        model: printer.printer?.model,
                        status: printer.status,
                        department_name: dept.name,
                        location_name: loc.name,
                      } : {
                        ...printer,
                        assignment_id: printer.id,
                      }}
                      onManage={() => {
                        setSelectedPrinterAssignment(printer);
                        setSelectedDepartmentName(dept.name);
                        setSelectedLocationName(loc.name);
                      }}
                      clientId={clientId}
                      departmentName={dept.name}
                      locationName={loc.name}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-1 text-center">
                    No printers assigned
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Undeployed Printers Section */}
      {undeployedPrinters.length > 0 && (
        <div className="border rounded-lg p-3 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-orange-500" />
            <h3 className="font-medium text-sm text-gray-900">Available for Deployment</h3>
            <Badge variant="secondary" className="text-xs">
              {undeployedPrinters.length} printer{undeployedPrinters.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="space-y-2">
            {undeployedPrinters.map((assignment) => (
              <ClientPrinterCard
                key={assignment.id}
                printer={{
                  ...assignment,
                  id: assignment.printer_id,
                  name: assignment.printer?.name || 'Unknown Printer',
                  model: assignment.printer?.model,
                  status: assignment.status,
                  department_name: 'Undeployed',
                  location_name: 'Available for Deployment',
                  assignment_id: assignment.id, // <-- ensure assignment_id is set for undeployed
                }}
                onManage={() => handleEditAssignment(assignment)}
                clientId={clientId}
                departmentName="Available for Deployment"
                locationName=""
                showUndeployedStatus={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive printers with no department/location */}
      {inactiveNoDept.length > 0 && (
        <div className="border rounded-lg p-3 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-400" />
            <h3 className="font-medium text-sm text-gray-900">Inactive (No Department)</h3>
            <Badge variant="secondary" className="text-xs">
              {inactiveNoDept.length} printer{inactiveNoDept.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="space-y-2">
            {inactiveNoDept.map(assignment => (
              <ClientPrinterCard
                key={assignment.id}
                printer={{
                  ...assignment,
                  id: assignment.printer_id,
                  name: assignment.printer?.name || 'Unknown Printer',
                  model: assignment.printer?.model,
                  status: assignment.status,
                  department_name: 'Inactive',
                  location_name: '',
                  assignment_id: assignment.id, // <-- ensure assignment_id is set for inactive
                }}
                onManage={() => handleEditAssignment(assignment)}
                clientId={clientId}
                departmentName="Inactive"
                locationName=""
              />
            ))}
          </div>
        </div>
      )}

      {/* Unified Department Modal */}
      <UnifiedDepartmentModal
        isOpen={showUnifiedModal}
        onClose={handleModalClose}
        clientId={clientId}
        department={selectedDepartment}
        onDepartmentSaved={handleRefresh}
      />

      {/* Existing modals for printer management */}
      {selectedPrinterAssignment && (
        <EditPrinterAssignmentModal
          isOpen={!!selectedPrinterAssignment}
          onClose={() => {
            setSelectedPrinterAssignment(null);
            setSelectedDepartmentName('');
            setSelectedLocationName('');
          }}
          assignment={selectedPrinterAssignment}
          departments={departments}
          currentDepartmentName={selectedDepartmentName}
          currentLocationName={selectedLocationName}
        />
      )}

      <AssignPrinterToLocationModal
        isOpen={showAssignPrinterModal}
        onClose={() => setShowAssignPrinterModal(false)}
        location={assignPrinterLocation}
        locations={assignPrinterDepartment?.locations || []}
        departmentBaseName={assignPrinterDepartment?.name || ''}
        clientId={clientId}
        onPrinterAssigned={() => {
          setShowAssignPrinterModal(false);
          setAssignPrinterDepartment(null);
          setAssignPrinterLocation(null);
          handleRefresh();
        }}
      />

      <AlertDialog open={showDeleteDeptDialog} onOpenChange={() => setShowDeleteDeptDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Department
            </AlertDialogTitle>
          </AlertDialogHeader>
          {deptToDelete && deptToDelete.locations && deptToDelete.locations.length > 0 ? (
            (() => {
              // Check if any location has printers assigned
              const locationsWithAssignments = deptToDelete.locations.filter(
                (loc: any) => Array.isArray(loc.printers) && loc.printers.length > 0
              );
              if (locationsWithAssignments.length > 0) {
                return (
                  <>
                    <div className="text-sm text-red-600 mb-2">
                      ⚠️ You cannot delete this department because some locations have printer assignments.
                    </div>
                    <div className="mb-2">
                      <div className="flex font-semibold text-xs text-gray-700 border-b pb-1 mb-1">
                        <div className="w-2/3">Location</div>
                        <div className="w-1/3">Printers</div>
                      </div>
                      {deptToDelete.locations.map((loc: any) => (
                        <div key={loc.id} className="flex text-xs py-1 border-b last:border-b-0">
                          <div className="w-2/3">{loc.name || <span className="italic text-gray-400">Unnamed</span>}</div>
                          <div className="w-1/3">{loc.printers ? loc.printers.length : 0}</div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              } else {
                // No assignments, show locations to be deleted
                return (
                  <>
                    <div className="text-sm text-yellow-700 mb-2">
                      These locations will also be deleted:
                    </div>
                    <div className="mb-2">
                      <div className="flex font-semibold text-xs text-gray-700 border-b pb-1 mb-1">
                        <div className="w-2/3">Location</div>
                        <div className="w-1/3">Printers</div>
                      </div>
                      {deptToDelete.locations.map((loc: any) => (
                        <div key={loc.id} className="flex text-xs py-1 border-b last:border-b-0">
                          <div className="w-2/3">{loc.name || <span className="italic text-gray-400">Unnamed</span>}</div>
                          <div className="w-1/3">{loc.printers ? loc.printers.length : 0}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      Are you sure you want to delete this department? This action cannot be undone.
                    </div>
                  </>
                );
              }
            })()
          ) : (
            <div className="text-sm text-gray-700 mb-2">
              Are you sure you want to delete this department? This action cannot be undone.
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDeptDialog(false)}>
              Cancel
            </AlertDialogCancel>
            {/* Only allow delete if no assignments */}
            {deptToDelete &&
              deptToDelete.locations &&
              deptToDelete.locations.length > 0 &&
              !deptToDelete.locations.some((loc: any) => Array.isArray(loc.printers) && loc.printers.length > 0) && (
                <AlertDialogAction
                  onClick={confirmDeleteDepartment}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Delete
                </AlertDialogAction>
              )}
            {/* If no locations, allow delete */}
            {deptToDelete &&
              (!deptToDelete.locations || deptToDelete.locations.length === 0) && (
                <AlertDialogAction
                  onClick={confirmDeleteDepartment}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Delete
                </AlertDialogAction>
              )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboardClientDepartments;
