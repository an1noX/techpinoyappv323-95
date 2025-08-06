import React, { useState, useEffect } from 'react';
import { Upload, Calendar, DollarSign, Shield, Hash, Plus, Users, Building, MapPin, Printer, ArrowLeft, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { clientService } from '@/services/clientService';
import { assetService } from '@/services/assetService';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/database';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { CompatibleProducts } from './components/CompatibleProducts';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface AssignPrinterToClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerId: string;
  printerName: string;
  onAssignmentCreated: () => void;
  preSelectedClientId?: string;
}

const AssignPrinterToClientModal: React.FC<AssignPrinterToClientModalProps> = ({
  isOpen,
  onClose,
  printerId,
  printerName,
  onAssignmentCreated,
  preSelectedClientId,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [printerDetails, setPrinterDetails] = useState<any>(null);
  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    departmentLocationId: '',
    deploymentDate: '',
    usageType: 'service_unit', // 'service_unit' | 'client_owned' | 'rental'
    monthlyPrice: '',
    hasSecurityDeposit: false,
    securityDepositAmount: '',
    notes: '',
  });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [accountabilityFile, setAccountabilityFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewDepartmentInput, setShowNewDepartmentInput] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [availableAssignments, setAvailableAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const { toast } = useToast();

  // Get departments for the selected client
  const [departmentLocationOptions, setDepartmentLocationOptions] = useState<{ id: string; name: string; location?: string }[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(false);

  useEffect(() => {
    const fetchDeptLocs = async () => {
      if (!formData.clientId) {
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
  }, [formData.clientId]);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadPrinterDetails();
      loadAvailableAssignments();
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ 
        ...prev, 
        deploymentDate: today,
        clientId: preSelectedClientId || ''
      }));
    }
  }, [isOpen, preSelectedClientId, printerId]);

  useEffect(() => {
    if (isOpen && !preSelectedClientId) {
      loadClients();
    }
  }, [isOpen, preSelectedClientId]);

  const loadClients = async () => {
    try {
      const clientsData = await clientService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadPrinterDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('printers')
        .select('id, name, manufacturer, model, series, image_url')
        .eq('id', printerId)
        .single();

      if (error) throw error;
      setPrinterDetails(data);
    } catch (error) {
      console.error('Failed to load printer details:', error);
    }
  };

  const loadAvailableAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('printer_assignments')
        .select('id, serial_number, usage_type')
        .eq('printer_id', printerId)
        .eq('status', 'available')
        .order('serial_number');

      if (error) throw error;
      setAvailableAssignments(data || []);
      
      // Auto-select the first assignment if available
      if (data && data.length > 0) {
        setSelectedAssignmentId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load available assignments:', error);
    }
  };

  const handleCreateNewDepartment = async () => {
    if (!newDepartmentName.trim() || !formData.clientId) {
      toast({
        title: "Error",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }

    setCreatingDepartment(true);
    try {
      // First create the department
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .insert({
          client_id: formData.clientId,
          name: newDepartmentName.trim(),
        })
        .select()
        .single();

      if (deptError) throw deptError;

      // Then create a default location for this department
      const { data: location, error: locError } = await supabase
        .from('departments_location')
        .insert({
          department_id: department.id,
          client_id: formData.clientId,
          name: 'Main',
          is_primary: true,
        })
        .select()
        .single();

      if (locError) throw locError;

      toast({
        title: "Success",
        description: "Department created successfully!",
      });

      // Re-fetch department locations to include the new one
      const updatedOptions = await clientService.getDepartmentsByClient(formData.clientId);
      setDepartmentLocationOptions(updatedOptions);
      setFormData(prev => ({ ...prev, departmentLocationId: location.id }));
      setNewDepartmentName('');
      setShowNewDepartmentInput(false);
    } catch (error) {
      console.error('Failed to create department:', error);
      toast({
        title: "Error",
        description: "Failed to create department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.departmentLocationId || !formData.deploymentDate || !selectedAssignmentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Client, Department Location, Deployment Date, and Serial Number).",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('printer_assignments')
        .update({
          client_id: formData.clientId,
          department_location_id: formData.departmentLocationId,
          deployment_date: formData.deploymentDate,
          usage_type: formData.usageType,
          monthly_price: formData.usageType === 'rental' && formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : null,
          has_security_deposit: formData.hasSecurityDeposit,
          security_deposit_amount: formData.hasSecurityDeposit && formData.securityDepositAmount ? parseFloat(formData.securityDepositAmount) : null,
          notes: formData.notes || null,
          status: 'active'
        })
        .eq('id', selectedAssignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Printer assigned to client successfully!",
      });
      onAssignmentCreated();
      handleClose();
    } catch (error) {
      console.error('Failed to assign printer:', error);
      toast({
        title: "Error",
        description: "Failed to assign printer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clientId: preSelectedClientId || '',
      departmentLocationId: '',
      deploymentDate: '',
      usageType: 'service_unit',
      monthlyPrice: '',
      hasSecurityDeposit: false,
      securityDepositAmount: '',
      notes: '',
    });
    setContractFile(null);
    setAccountabilityFile(null);
    setShowNewDepartmentInput(false);
    setNewDepartmentName('');
    setAvailableAssignments([]);
    setSelectedAssignmentId('');
    onClose();
  };

  const handleFileUpload = (file: File, type: 'contract' | 'accountability') => {
    if (type === 'contract') {
      setContractFile(file);
    } else {
      setAccountabilityFile(file);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      {/* Mobile-first modal container */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-lg sm:rounded-2xl sm:shadow-2xl flex flex-col">
        
        {/* Mobile Header - Sticky */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 sm:rounded-t-2xl">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2.5 rounded-xl">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Assign Printer</h2>
                <p className="text-xs sm:text-sm text-gray-500">Assigning printer to client</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Printer Information Card */}
          {printerDetails && (
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-start space-x-4">
                  {/* Printer Image */}
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                    {printerDetails.image_url ? (
                      <img
                        src={printerDetails.image_url}
                        alt={printerDetails.name}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <Printer className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Printer Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{printerDetails.name}</h3>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {printerDetails.manufacturer && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {printerDetails.manufacturer}
                        </Badge>
                      )}
                      {printerDetails.model && (
                        <Badge variant="outline" className="text-xs">
                          {printerDetails.model}
                        </Badge>
                      )}
                      {printerDetails.series && (
                        <Badge variant="outline" className="text-xs">
                          {printerDetails.series}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Compatible Products */}
                    <CompatibleProducts 
                      printerId={printerDetails.id} 
                      className="mb-4" 
                    />
                    
                    {/* Serial Number Selection */}
                    {availableAssignments.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="text-sm font-semibold text-red-600 mb-3 block">
                          Select Serial Number *
                        </label>
                        <Select
                          value={selectedAssignmentId}
                          onValueChange={setSelectedAssignmentId}
                        >
                          <SelectTrigger className="w-full h-12 text-left">
                            <SelectValue placeholder="Choose a serial number" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAssignments.map((assignment) => (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                {assignment.serial_number || `Assignment ID: ${assignment.id.slice(0, 8)}...`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            
            {/* Client Selection */}
            {!preSelectedClientId && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500"/>
                  Client *
                </label>
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
            )}
            
            {/* Department & Location */}
            {formData.clientId && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-blue-500" />
                  Department / Location *
                </label>
                {deptsLoading ? (
                  <CustomLoading message="Loading departments" />
                ) : (
                  <>
                    <Select
                      value={formData.departmentLocationId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, departmentLocationId: value }))}
                      disabled={showNewDepartmentInput}
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
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-sm h-10"
                      onClick={() => setShowNewDepartmentInput(!showNewDepartmentInput)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {showNewDepartmentInput ? 'Cancel' : 'Create New Department'}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* New Department Input */}
            {showNewDepartmentInput && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">
                  New Department Name
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter department name"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    className="flex-1 h-12"
                  />
                  <Button 
                    type="button" 
                    onClick={handleCreateNewDepartment}
                    disabled={creatingDepartment || !newDepartmentName.trim()}
                    className="h-12 px-4"
                  >
                    {creatingDepartment ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            )}

            {/* Deployment Date */}
            <div className="space-y-3">
              <label htmlFor="deploymentDate" className="text-sm font-semibold text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                Deployment Date *
              </label>
              <input
                type="date"
                id="deploymentDate"
                value={formData.deploymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deploymentDate: e.target.value }))}
                required
                disabled={loading}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-base"
              />
            </div>

            {/* Usage Type */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Usage Type</label>
                  <p className="text-xs text-gray-500 mt-1">Select the usage type for this assignment.</p>
                </div>
                <Select
                  value={formData.usageType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, usageType: value }))}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full sm:w-48 h-12 text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service_unit">Service Unit</SelectItem>
                    <SelectItem value="client_owned">Client Owned</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.usageType === 'rental' && (
                <div className="space-y-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <label htmlFor="monthlyPrice" className="text-sm font-semibold text-gray-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-yellow-600" />
                    Monthly Rental Price
                  </label>
                  <input
                    type="number"
                    id="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                    disabled={loading}
                    min="0"
                    step="0.01"
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-base"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Security Deposit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Security Deposit</label>
                    <p className="text-xs text-gray-500">Does this assignment require a security deposit?</p>
                  </div>
                </div>
                <Switch
                  checked={formData.hasSecurityDeposit}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSecurityDeposit: checked }))}
                  disabled={loading}
                />
              </div>

              {formData.hasSecurityDeposit && (
                <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <label htmlFor="securityDepositAmount" className="text-sm font-semibold text-gray-700">
                    Security Deposit Amount
                  </label>
                  <input
                    type="number"
                    id="securityDepositAmount"
                    value={formData.securityDepositAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, securityDepositAmount: e.target.value }))}
                    disabled={loading}
                    min="0"
                    step="0.01"
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-base"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Upload className="h-4 w-4 mr-2 text-blue-500" />
                Documents (Optional)
              </h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Contract Agreement
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'contract')}
                      disabled={loading}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {contractFile && (
                    <p className="text-xs text-green-600 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Selected: {contractFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Accountability Agreement
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'accountability')}
                      disabled={loading}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {accountabilityFile && (
                    <p className="text-xs text-green-600 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Selected: {accountabilityFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                Notes (Optional)
              </label>
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
          </form>
        </div>

        {/* Mobile Footer - Sticky */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 sm:rounded-b-2xl">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto h-12 text-base font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </div>
                ) : (
                  'Assign Printer'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPrinterToClientModal;
