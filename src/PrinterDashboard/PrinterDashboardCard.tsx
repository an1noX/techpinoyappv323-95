import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Eye, ArrowRightLeft, Edit3, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import AssignedToSection from './components/AssignedToSection';
import { CompatibleProducts } from './components/CompatibleProducts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import UnassignPrinterModal from './UnassignPrinterModal';
import TransferPrinterModal from './TransferPrinterModal';
import { clientService } from '@/services/clientService';
import ViewPrinterModal from './ViewPrinterModal';
import EditAssignmentModal from './components/modals/EditAssignment';
import { assetService } from '@/services/assetService';
import { supabase } from '@/integrations/supabase/client';
import AssignmentMaintenanceStatusForm from './components/AssignmentMaintenanceStatusForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import MaintenanceStatusDisplay from './components/MaintenanceStatusDisplay';
import UpdateMaintenanceStatusModal from './components/modals/UpdateMaintenanceStatusModal';
import { useAuth } from '@/hooks/useAuth';

const PrinterDashboardCard = ({ printer, onEdit, onDelete, onTransfer, onEditAssignment = undefined, debug = false }) => {
  const { userProfile } = useAuth();
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const navigate = useNavigate();
  // Add state for compatible product fallback
  const [firstCompatibleProduct, setFirstCompatibleProduct] = useState(null);

  useEffect(() => {
    if (!printer.product_name) {
      // Only fetch if product_name is missing
      (async () => {
        try {
          const products = await productService.getProductsByPrinter(printer.id);
          if (products && products.length > 0) {
            setFirstCompatibleProduct(products[0]);
          }
        } catch (e) {
          setFirstCompatibleProduct(null);
        }
      })();
    }
  }, [printer.product_name, printer.id]);

  useEffect(() => {
    if (showTransferModal && clients.length === 0) {
      clientService.getClients().then(setClients);
    }
  }, [showTransferModal, clients.length]);

  const getDepartmentsByClient = async (clientId) => {
    return await clientService.getDepartmentsByClient(clientId);
  };

  const handleTransfer = async (assignment, toClientId, toDepartmentId) => {
    try {
      // Update the assignment in the database
      const { error } = await supabase
        .from('printer_assignments')
        .update({
          client_id: toClientId,
          department_location_id: toDepartmentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (error) {
        console.error('Transfer failed:', error);
        throw error;
      }

      setShowTransferModal(false);
    } catch (error) {
      console.error('Transfer error:', error);
      throw error;
    }
  };

  const assignmentsByClient = (printer.printer_assignments || []).reduce((acc, assignment) => {
    const clientName = assignment.clients?.name || 'Unknown Client';
    acc[clientName] = (acc[clientName] || 0) + 1;
    return acc;
  }, {});

  const handleDeleteClick = () => {
    setShowUnassignModal(true);
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
  };

  const handleTransferModalClose = () => {
    setShowTransferModal(false);
  };

  const handleEditAssignmentClick = () => {
    if (typeof onEditAssignment === 'function') {
      onEditAssignment(printer);
    } else {
      setShowEditAssignmentModal(true);
    }
  };

  // Get all assignments (including inactive ones)
  const allAssignments = printer.printer_assignments || [];

  // Use the assigned_count from the data service (same pattern as Available tab)
  const assignmentCount = printer.assigned_count || 0;

  return (
    <div className="bg-orange-50/80 border border-orange-200/80 rounded-lg shadow-sm w-full max-w-full hover:shadow-md transition-shadow touch-manipulation">
      {/* Mobile Debug Info - Collapsible */}
      {debug && (
        <details className="mb-2">
          <summary className="text-xs font-medium text-yellow-800 cursor-pointer p-2 bg-yellow-100 rounded-t">
            Debug Info (tap to expand)
          </summary>
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-b text-xs text-yellow-900 max-h-48 overflow-y-auto">
            <div className="space-y-1">
              <div><b>Printer ID:</b> {printer.id}</div>
              <div><b>Name:</b> {printer.name}</div>
              <div><b>Manufacturer:</b> {printer.manufacturer}</div>
              <div><b>Model:</b> {printer.model}</div>
              <div><b>Series:</b> {printer.series}</div>
              <div><b>Assignments:</b> {printer.printer_assignments?.length || 0}</div>
            </div>
          </div>
        </details>
      )}
      
      {/* Mobile-First Card Layout */}
      <div className="p-3 w-full max-w-full flex flex-col">
        {/* Printer name (top row) */}
        <div className="mb-1">
          <span className="font-bold text-base text-gray-900 truncate">
            {[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
          </span>
        </div>
        {/* Second row: image (left), right: action buttons (top), product info (below) */}
        <div className="flex items-start gap-3 mb-1">
          {/* Printer image */}
          <div className="relative flex-shrink-0">
            <img
              src={printer.image_url || '/placeholder.svg'}
              alt={printer.name || 'Printer'}
              className="w-24 h-24 object-cover rounded-md"
              onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
            />
            {/* Only show assignment count badge if user is NOT a client */}
            {userProfile?.role !== 'client' && assignmentCount > 1 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
              >
                {assignmentCount}
              </Badge>
            )}
          </div>
          {/* Right side: action buttons (top), product info (below, left-aligned under buttons) */}
          <div className="flex-1 min-w-0 flex flex-col justify-start h-16">
            {/* Action buttons */}
            {userProfile?.role !== 'client' && (
              <div className="flex gap-2 mb-1 justify-start">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Update Assignment"
                  onClick={handleEditAssignmentClick}
                >
                  <Edit className="h-4 w-4 text-green-600" />
                </Button>
                {userProfile?.role === 'superadmin' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={handleDeleteClick} 
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="View"
                  onClick={e => { e.stopPropagation(); setShowViewModal(true); }}
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Transfer"
                  onClick={handleTransferClick}
                >
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Maintenance"
                  onClick={() => setShowMaintenanceModal(true)}
                >
                  <Wrench className="h-4 w-4 text-orange-500" />
                </Button>
              </div>
            )}
            {/* Compatible Products: product name, sku, color dot */}
            <CompatibleProducts 
              printerId={printer.id} 
              className="text-xs flex flex-row flex-wrap gap-2 mt-1" 
            />
          </div>
        </div>
        {/* Section Divider */}
        <hr className="my-2 border-t border-orange-200/50" />
        {/* Assignment Section */}
        <div>
          <AssignedToSection printerId={printer.id} />
        </div>
      </div>

      <UnassignPrinterModal
        isOpen={showUnassignModal}
        onClose={() => setShowUnassignModal(false)}
        printerId={printer.id}
        onUnassigned={async () => {
          setShowUnassignModal(false);
          // Only refresh data, don't call onDelete which causes DeleteConfirmDialog
          if (onEdit) onEdit(); // This triggers a data refresh
        }}
      />
      <TransferPrinterModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        printerId={printer.id}
        clients={clients}
        getDepartmentsByClient={getDepartmentsByClient}
        onTransfer={handleTransfer}
      />
      <ViewPrinterModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        printer={printer}
      />
      {showEditAssignmentModal && (
        <EditAssignmentModal
          isOpen={showEditAssignmentModal}
          onClose={() => setShowEditAssignmentModal(false)}
          printerId={printer.id}
          onAssignmentUpdated={async () => {
            try {
              setShowEditAssignmentModal(false);
              // Trigger a refresh to show updated data
              if (onEdit) onEdit();
            } catch (error) {
              console.error('Failed to refresh after assignment update:', error);
            }
          }}
        />
      )}
      <UpdateMaintenanceStatusModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        printerId={printer.id}
        onStatusUpdated={onEdit}
      />
    </div>
  );
};

export default PrinterDashboardCard;
