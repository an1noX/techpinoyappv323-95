import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

import { assetService, PrinterAssignment } from '@/services/assetService';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { usePrinters } from '@/hooks/usePrinters';
import { Printer } from '@/types/database';
import AssignPrinterToClientModal from '@/PrinterDashboard/AssignPrinterToClientModal';

const AssetManagement = () => {
  const [assignments, setAssignments] = useState<PrinterAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<PrinterAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<PrinterAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filter states - default to recently assigned
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showRecentlyAssigned, setShowRecentlyAssigned] = useState(true);
  const [showMaintenanceSchedule, setShowMaintenanceSchedule] = useState(false);
  const [displayMode, setDisplayMode] = useState<'all' | 'active' | 'rental'>('all');
  
  // Clients for filter dropdown
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  
  // Available printers for assignment
  const { printers: availablePrinters, loading: loadingAvailable } = usePrinters(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAssignments();
    loadClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assignments, searchTerm, selectedClient, selectedStatus, showRecentlyAssigned, showMaintenanceSchedule, displayMode]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assetService.getAllAssignments();
      console.log('Loaded assignments:', data);
      setAssignments(data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load printer assignments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await clientService.getClients();
      setClients(clientsData.map(client => ({ id: client.id, name: client.name })));
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...assignments];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => {
        const printerName = getCombinedPrinterName(assignment);
        const clientName = assignment.client?.name || '';
        const department = assignment.department || '';
        const serialNumber = assignment.serial_number || '';

        return (
          printerName.toLowerCase().includes(searchLower) ||
          clientName.toLowerCase().includes(searchLower) ||
          department.toLowerCase().includes(searchLower) ||
          serialNumber.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply client filter
    if (selectedClient !== 'all') {
      filtered = filtered.filter(assignment => assignment.client_id === selectedClient);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === selectedStatus);
    }

    // Apply recently assigned filter (last 30 days)
    if (showRecentlyAssigned) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(assignment => 
        new Date(assignment.deployment_date) >= thirtyDaysAgo
      );
    }

    // Apply maintenance schedule filter (mock logic - assignments deployed more than 6 months ago)
    if (showMaintenanceSchedule) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      filtered = filtered.filter(assignment => 
        new Date(assignment.deployment_date) <= sixMonthsAgo && assignment.status === 'active'
      );
    }

    // Apply display mode filter
    if (displayMode === 'active') {
      filtered = filtered.filter(assignment => assignment.status === 'active');
    } else if (displayMode === 'rental') {
      filtered = filtered.filter(assignment => assignment.usage_type === 'rental');
    }

    setFilteredAssignments(filtered);
  };

  const getAssignmentCounts = () => {
    return {
      total: assignments.length,
      active: assignments.filter(a => a.status === 'active').length,
      inactive: assignments.filter(a => a.status === 'inactive').length,
      returned: assignments.filter(a => a.status === 'returned').length,
      rental: assignments.filter(a => a.usage_type === 'rental').length,
    };
  };

  const getCombinedPrinterName = (assignment: PrinterAssignment) => {
    const printer = assignment.printer;
    if (!printer) return 'Unknown Printer';

    const series = printer.series || '';
    const model = printer.model || '';
    
    if (series && model) {
      return `${series} ${model}`;
    } else if (series) {
      return series;
    } else if (model) {
      return model;
    }
    return printer.name;
  };

  const handleAssignmentSelect = (assignment: PrinterAssignment) => {
    setSelectedAssignment(assignment);
    // Set search term to show the serial number for better identification
    setSearchTerm(`${getCombinedPrinterName(assignment)} (SN: ${assignment.serial_number})`);
  };

  const handleAssignmentUpdate = async () => {
    await loadAssignments();
    if (selectedAssignment) {
      // Refresh the selected assignment
      try {
        const updatedAssignment = await assetService.getAssignmentById(selectedAssignment.id);
        setSelectedAssignment(updatedAssignment);
      } catch (error) {
        console.error('Failed to refresh assignment:', error);
      }
    }
  };

  const handleAssignmentDeleted = async () => {
    setSelectedAssignment(null);
    setSearchTerm('');
    await loadAssignments();
  };

  const handleBackToResults = () => {
    setSelectedAssignment(null);
    setSearchTerm('');
  };

  const handleOpenAssignModal = (printer: Printer) => {
    setSelectedPrinter(printer);
    setShowAssignModal(true);
  };
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedPrinter(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading printer assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Asset Management</h1>
        <p className="text-gray-600">Asset management components are being developed.</p>
      </div>
    </div>
  );
};

export default AssetManagement;
