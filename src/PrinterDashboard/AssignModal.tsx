import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CompatibleProducts } from './components/CompatibleProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Printer, ArrowLeft, ArrowRight, Package, Settings, Check, Users, Building, Calendar, DollarSign, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { clientService } from '@/services/clientService';
import { CustomLoading } from "@/components/ui/CustomLoading";
import { dataService } from '@/services/dataService';
import { useAuth } from '@/hooks/useAuth';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
  preSelectedClientId?: string;
}

interface PrinterAssignment {
  id: string;
  printer_id: string;
  serial_number: string;
  usage_type: string;
  status: string;
  client_id?: string;
  department_location_id?: string;
  printer: {
    id: string;
    name: string;
    manufacturer?: string;
    model?: string;
    series?: string;
    color?: string;
    image_url?: string;
  };
  client?: {
    id: string;
    name: string;
  };
  department_location?: {
    id: string;
    name: string;
    department: {
      name: string;
    };
  };
}

interface Client {
  id: string;
  name: string;
}

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  onClose,
  onAssigned,
  preSelectedClientId
}) => {
  const location = useLocation();
  const isClientPage = location.pathname.includes('/clients/');
  const currentClientId = preSelectedClientId || (isClientPage ? location.pathname.split('/clients/')[1] : null);
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAssignment, setSelectedAssignment] = useState<PrinterAssignment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [departmentLocationOptions, setDepartmentLocationOptions] = useState<{ id: string; name: string; location?: string }[]>([]);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [showOtherClients, setShowOtherClients] = useState(false);
  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    departmentLocationId: '',
    deploymentDate: '',
    assignToPool: false,
    usageType: 'service_unit',
    monthlyPrice: '',
    hasSecurityDeposit: false,
    securityDepositAmount: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Fetch printer assignments based on mode and context
  const { data: printerAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['printer-assignments', isTransferMode, showOtherClients, currentClientId, isClientPage],
    queryFn: async () => {
      let query = supabase
        .from('printer_assignments')
        .select(`
          id,
          printer_id,
          serial_number,
          usage_type,
          status,
          client_id,
          department_location_id,
          printer:printers(
            id,
            name,
            manufacturer,
            model,
            series,
            color,
            image_url
          ),
          client:clients(
            id,
            name
          ),
          department_location:departments_location(
            id,
            name,
            department:departments(
              name
            )
          )
        `);

      if (!isTransferMode) {
        // Assign Mode: Only show truly unassigned printers (exclude pooled)
        query = query.eq('status', 'available');
      } else {
        // Transfer Mode: Include pooled printers appropriately
        if (isClientPage && currentClientId && !showOtherClients) {
          // Show this client's assigned, inactive, and pooled printers
          query = query.eq('client_id', currentClientId).in('status', ['active', 'inactive', 'undeployed']);
        } else if (isClientPage && currentClientId && showOtherClients) {
          // Show other clients' assigned and pooled printers
          query = query.neq('client_id', currentClientId).in('status', ['active', 'undeployed']);
        } else {
          // Printer dashboard - show all assigned and pooled printers
          query = query.in('status', ['active', 'undeployed']);
        }
      }

      const { data, error } = await query.order('printer(name)');
      if (error) throw error;
      return data as PrinterAssignment[];
    },
    enabled: isOpen && step === 1
  });

  // Fetch clients
  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const clients = await clientService.getClients();
      setClients(clients);
      return clients;
    },
    enabled: isOpen && step === 2
  });

  // Fetch department locations for selected client
  React.useEffect(() => {
    const fetchDeptLocs = async () => {
      if (!formData.clientId || formData.assignToPool) {
        setDepartmentLocationOptions([]);
        return;
      }
      setDeptsLoading(true);
      try {
        const options = await clientService.getDepartmentsByClient(formData.clientId);
        setDepartmentLocationOptions(options);
      } catch (e) {
        setDepartmentLocationOptions([]);
      }
      setDeptsLoading(false);
    };
    fetchDeptLocs();
  }, [formData.clientId, formData.assignToPool]);

  // Set initial deployment date
  React.useEffect(() => {
    if (isOpen && step === 2) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ 
        ...prev, 
        deploymentDate: today,
        clientId: preSelectedClientId || ''
      }));
    }
  }, [isOpen, step, preSelectedClientId]);

  const filteredAssignments = printerAssignments.filter(assignment =>
    assignment.printer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assignment.printer.model && assignment.printer.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (assignment.printer.manufacturer && assignment.printer.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
    assignment.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assignment.client?.name && assignment.client.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group printers by client
  const groupedAssignments = React.useMemo(() => {
    const groups: { [key: string]: PrinterAssignment[] } = {};
    
    filteredAssignments.forEach(assignment => {
      const clientKey = assignment.client?.name || 'Unassigned';
      if (!groups[clientKey]) {
        groups[clientKey] = [];
      }
      groups[clientKey].push(assignment);
    });

    return groups;
  }, [filteredAssignments]);

  const handleAssignmentSelect = (assignment: PrinterAssignment) => {
    setSelectedAssignment(assignment);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !formData.clientId || !formData.deploymentDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    // If not assigning to pool, require department/location
    if (!formData.assignToPool && !formData.departmentLocationId) {
      toast({
        title: 'Error',
        description: 'Please select a department/location or choose to assign to client pool.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        client_id: formData.clientId,
        deployment_date: formData.deploymentDate,
        usage_type: formData.usageType,
        monthly_price: formData.usageType === 'rental' && formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : null,
        has_security_deposit: formData.hasSecurityDeposit,
        security_deposit_amount: formData.hasSecurityDeposit && formData.securityDepositAmount ? parseFloat(formData.securityDepositAmount) : null,
        notes: formData.notes || null,
      };

      // Set status and department_location_id based on assignment type
      if (formData.assignToPool) {
        updateData.status = 'undeployed';
        updateData.department_location_id = null;
      } else {
        updateData.status = 'active';
        updateData.department_location_id = formData.departmentLocationId;
      }

      const { error } = await supabase
        .from('printer_assignments')
        .update(updateData)
        .eq('id', selectedAssignment.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: formData.assignToPool 
          ? 'Printer assigned to client pool successfully!' 
          : isTransferMode 
            ? 'Printer transferred successfully!'
            : 'Printer assigned to client successfully!',
      });

      // Clear dataService cache
      dataService.clearCache();
      
      // Invalidate React Query cache for all printer-related queries
      await queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['available-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['assigned-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['optimized-printer-data'] });
      await queryClient.invalidateQueries({ queryKey: ['printer-assignments'] });
      
      // Invalidate client-specific queries if on client page
      if (isClientPage && currentClientId) {
        await queryClient.invalidateQueries({ queryKey: ['client-printer-assignments', currentClientId] });
        await queryClient.invalidateQueries({ queryKey: ['client-departments', currentClientId] });
      }
      
      // Dispatch custom event to refresh printer data (for real-time subscription)
      window.dispatchEvent(new CustomEvent('refresh-printer-data'));
      
      onAssigned();
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isTransferMode ? 'transfer' : 'assign'} printer.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedAssignment(null);
    setSearchQuery('');
    setIsTransferMode(false);
    setShowOtherClients(false);
    setFormData({
      clientId: preSelectedClientId || '',
      departmentLocationId: '',
      deploymentDate: '',
      assignToPool: false,
      usageType: 'service_unit',
      monthlyPrice: '',
      hasSecurityDeposit: false,
      securityDepositAmount: '',
      notes: '',
    });
    onClose();
  };

  const handleBack = () => {
    setStep(1);
    setSelectedAssignment(null);
  };

  const getStatusBadge = (assignment: PrinterAssignment) => {
    const status = assignment.status;
    const hasLocation = assignment.department_location_id;
    
    if (status === 'available') {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Available</Badge>;
    } else if (status === 'undeployed') {
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Pooled</Badge>;
    } else if (status === 'active' && hasLocation) {
      return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Assigned</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  const getLocationInfo = (assignment: PrinterAssignment) => {
    if (assignment.department_location) {
      return `${assignment.department_location.department.name} - ${assignment.department_location.name}`;
    }
    return 'No specific location';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="relative flex flex-col h-screen w-screen sm:h-auto sm:w-full sm:max-w-lg sm:rounded-2xl sm:shadow-2xl bg-white animate-in fade-in-0 slide-in-from-bottom-8">
        
        {/* Mobile Header - Sticky */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 sm:rounded-t-2xl">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2.5 rounded-xl">
                {isTransferMode ? <RefreshCw className="h-5 w-5 text-blue-600" /> : <Printer className="h-5 w-5 text-blue-600" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {step === 1 ? 
                    (isTransferMode ? 'Transfer Printer' : 'Select Printer') : 
                    (isTransferMode ? 'Transfer to Client' : 'Assign to Client')
                  }
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {step === 1 ? 
                    (isTransferMode ? 'Choose a printer to transfer' : 'Choose an available printer') : 
                    'Configure assignment details'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            
            {step === 1 && (
              <>
                {/* Mode Selection */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-purple-600" />
                    Operation Mode
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="h-5 w-5 text-gray-600" />
                        <div>
                          <Label htmlFor="transferMode" className="text-sm font-semibold text-gray-700">
                            Transfer Mode
                          </Label>
                          <p className="text-xs text-gray-500">Move printers between clients</p>
                        </div>
                      </div>
                      <Switch
                        id="transferMode"
                        checked={isTransferMode}
                        onCheckedChange={setIsTransferMode}
                      />
                    </div>

                    {/* Other Clients Checkbox - Only show in Transfer Mode and on Client Page */}
                    {isTransferMode && isClientPage && userProfile?.role !== 'client' && (
                      <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-purple-200">
                         <Checkbox
                           id="otherClients"
                           checked={showOtherClients}
                           onCheckedChange={(checked) => setShowOtherClients(checked === true)}
                         />
                        <Label htmlFor="otherClients" className="text-sm font-semibold text-gray-700">
                          Show printers from other clients
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Search className="h-4 w-4 mr-2 text-blue-600" />
                    Search {isTransferMode ? 'Printers to Transfer' : 'Available Printers'}
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search by name, model, manufacturer, serial number, or client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>

                {/* Printer List Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-600" />
                    {isTransferMode ? 'Printers Available for Transfer' : 'Available Printers'}
                  </h3>
                  
                  {assignmentsLoading ? (
                    <CustomLoading />
                  ) : Object.keys(groupedAssignments).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Printer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        No {isTransferMode ? 'printers available for transfer' : 'available printers'} found
                      </p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedAssignments).map(([clientName, assignments]) => (
                        <div key={clientName} className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-600" />
                            <h4 className="font-medium text-gray-800">{clientName}</h4>
                            <Badge variant="outline" className="text-xs">{assignments.length}</Badge>
                          </div>
                          
                          <div className="space-y-3 pl-6">
                            {assignments.map((assignment) => (
                              <Card
                                key={assignment.id}
                                className="cursor-pointer border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                                onClick={() => handleAssignmentSelect(assignment)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex flex-col">
                                    {/* Printer Name */}
                                    <div className="font-bold text-base text-gray-900 mb-2 truncate">
                                      {[
                                        assignment.printer.manufacturer,
                                        assignment.printer.series,
                                        assignment.printer.model || assignment.printer.name
                                      ].filter(Boolean).join(' ')}
                                    </div>
                                    <div className="flex items-start gap-3">
                                      {/* Printer Image */}
                                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
                                        {assignment.printer.image_url ? (
                                          <img
                                            src={assignment.printer.image_url}
                                            alt={assignment.printer.name}
                                            className="object-contain w-full h-full"
                                          />
                                        ) : (
                                          <Printer className="h-8 w-8 text-gray-400" />
                                        )}
                                      </div>
                                      {/* Details */}
                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        {assignment.serial_number && (
                                          <div className="text-sm text-gray-600">Serial: {assignment.serial_number}</div>
                                        )}
                                        {assignment.client && (
                                          <div className="text-sm text-gray-600">Client: {assignment.client.name}</div>
                                        )}
                                        {assignment.department_location && (
                                          <div className="text-sm text-gray-600">Location: {getLocationInfo(assignment)}</div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Badges and Compatible Products */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {getStatusBadge(assignment)}
                                      {assignment.usage_type && (
                                        <Badge variant="outline" className="text-xs">
                                          {assignment.usage_type}
                                        </Badge>
                                      )}
                                      {assignment.printer.color && (
                                        <Badge variant="outline" className="text-xs">
                                          {assignment.printer.color}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="mt-2">
                                      <CompatibleProducts printerId={assignment.printer.id} className="" />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && selectedAssignment && (
              <>
                {/* Selected Printer Info Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Printer className="h-4 w-4 mr-2 text-blue-600" />
                    Selected Printer
                  </h3>
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
                      {selectedAssignment.printer.image_url ? (
                        <img
                          src={selectedAssignment.printer.image_url}
                          alt={selectedAssignment.printer.name}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Printer className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">
                        {[
                          selectedAssignment.printer.manufacturer,
                          selectedAssignment.printer.series,
                          selectedAssignment.printer.model || selectedAssignment.printer.name
                        ].filter(Boolean).join(' ')}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedAssignment.serial_number && (
                          <Badge variant="outline" className="text-xs">
                            {selectedAssignment.serial_number}
                          </Badge>
                        )}
                      </div>
                      {isTransferMode && selectedAssignment.client && (
                        <div className="text-sm text-gray-600">
                          <p><strong>Current Client:</strong> {selectedAssignment.client.name}</p>
                          {selectedAssignment.department_location && (
                            <p><strong>Current Location:</strong> {getLocationInfo(selectedAssignment)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Compatible Products Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-orange-600" />
                    Compatible Products
                  </h3>
                  <CompatibleProducts 
                    printerId={selectedAssignment.printer.id} 
                    className="" 
                  />
                </div>

                {/* Assignment Form Section */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Client Selection */}
                  {!preSelectedClientId && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-green-600" />
                        Client Selection
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="clientId" className="text-sm font-semibold text-red-600">
                          Client *
                        </Label>
                        <Select
                          value={formData.clientId}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value, departmentLocationId: '' }))}
                        >
                          <SelectTrigger className="w-full h-12 text-left">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Assignment Type Selection */}
                  {formData.clientId && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Building className="h-4 w-4 mr-2 text-indigo-600" />
                        Assignment Type
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-200">
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-gray-600" />
                            <div>
                              <Label htmlFor="assignToPool" className="text-sm font-semibold text-gray-700">
                                Assign to Client Pool
                              </Label>
                              <p className="text-xs text-gray-500">Add printer to client's undeployed pool for later assignment</p>
                            </div>
                          </div>
                          <Switch
                            id="assignToPool"
                            checked={formData.assignToPool}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              assignToPool: checked,
                              departmentLocationId: checked ? '' : prev.departmentLocationId
                            }))}
                            disabled={loading}
                          />
                        </div>

                        {formData.assignToPool && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-yellow-800">
                                <p className="font-medium">Pool Assignment</p>
                                <p>This printer will be marked as "UnDeployed" and added to the client's printer pool. It can be assigned to specific departments and locations later.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Department & Location - Only show if not assigning to pool */}
                  {formData.clientId && !formData.assignToPool && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Building className="h-4 w-4 mr-2 text-purple-600" />
                        Department & Location
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="departmentLocationId" className="text-sm font-semibold text-red-600">
                          Department / Location *
                        </Label>
                        {deptsLoading ? (
                          <div className="animate-pulse h-12 bg-gray-200 rounded-lg w-full"></div>
                        ) : (
                          <Select
                            value={formData.departmentLocationId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, departmentLocationId: value }))}
                          >
                            <SelectTrigger className="w-full h-12 text-left">
                              <SelectValue placeholder="Select a department and location" />
                            </SelectTrigger>
                            <SelectContent>
                              {departmentLocationOptions.map(opt => (
                                <SelectItem key={opt.id} value={opt.id}>
                                  {opt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assignment Details */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-yellow-600" />
                      Assignment Details
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Deployment Date */}
                      <div className="space-y-2">
                        <Label htmlFor="deploymentDate" className="text-sm font-semibold text-red-600 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formData.assignToPool ? 'Assignment Date *' : 'Deployment Date *'}
                        </Label>
                        <input
                          type="date"
                          id="deploymentDate"
                          value={formData.deploymentDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, deploymentDate: e.target.value }))}
                          required
                          disabled={loading}
                          className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:bg-gray-100 text-base"
                        />
                      </div>

                      {/* Usage Type */}
                      <div className="space-y-2">
                        <Label htmlFor="usageType" className="text-sm font-semibold text-gray-700">
                          Usage Type
                        </Label>
                        <Select
                          value={formData.usageType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, usageType: value }))}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full h-12 text-left">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service_unit">Service Unit</SelectItem>
                            <SelectItem value="client_owned">Client Owned</SelectItem>
                            <SelectItem value="rental">Rental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Monthly Price for Rental */}
                      {formData.usageType === 'rental' && (
                        <div className="space-y-2">
                          <Label htmlFor="monthlyPrice" className="text-sm font-semibold text-gray-700 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Monthly Rental Price
                          </Label>
                          <input
                            type="number"
                            id="monthlyPrice"
                            value={formData.monthlyPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                            disabled={loading}
                            min="0"
                            step="0.01"
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:bg-gray-100 text-base"
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      {/* Security Deposit */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-gray-600" />
                            <div>
                              <Label htmlFor="hasSecurityDeposit" className="text-sm font-semibold text-gray-700">
                                Security Deposit
                              </Label>
                              <p className="text-xs text-gray-500">Does this assignment require a security deposit?</p>
                            </div>
                          </div>
                          <Switch
                            id="hasSecurityDeposit"
                            checked={formData.hasSecurityDeposit}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSecurityDeposit: checked }))}
                            disabled={loading}
                          />
                        </div>

                        {formData.hasSecurityDeposit && (
                          <div className="space-y-2">
                            <Label htmlFor="securityDepositAmount" className="text-sm font-semibold text-gray-700">
                              Security Deposit Amount
                            </Label>
                            <input
                              type="number"
                              id="securityDepositAmount"
                              value={formData.securityDepositAmount}
                              onChange={(e) => setFormData(prev => ({ ...prev, securityDepositAmount: e.target.value }))}
                              disabled={loading}
                              min="0"
                              step="0.01"
                              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:bg-gray-100 text-base"
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                          Notes (Optional)
                        </Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          disabled={loading}
                          placeholder="Additional notes about this assignment..."
                          className="w-full min-h-[100px] resize-none text-base"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Mobile Footer - Sticky */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 sm:rounded-b-2xl">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {step === 1 ? (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full sm:w-auto h-12 text-base font-medium"
                >
                  Cancel
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-full sm:w-auto h-12 text-base font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.clientId || !formData.deploymentDate || (!formData.assignToPool && !formData.departmentLocationId)}
                    className="w-full sm:w-auto h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isTransferMode ? 'Transferring...' : 'Assigning...'}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        {formData.assignToPool ? 'Add to Pool' : isTransferMode ? 'Transfer Printer' : 'Assign Printer'}
                      </div>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
