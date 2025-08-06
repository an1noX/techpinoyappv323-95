
import React from 'react';
import { AssignModal } from '@/PrinterDashboard/AssignModal';
import AddPrinterModal from '@/PrinterDashboard/AddPrinterModal';
import EditAssignmentModal from '@/PrinterDashboard/components/modals/EditAssignment';

interface PrinterDashboardModalsProps {
  showPrinterSelection: boolean;
  onClosePrinterSelection: () => void;
  onPrinterSelected: (printerId: string, printerName: string) => void;
  
  showAssignToClient: boolean;
  onCloseAssignToClient: () => void;
  selectedPrinter: { id: string; name: string } | null;
  onAssignmentComplete: () => void;
  
  showAddPrinter: boolean;
  onCloseAddPrinter: () => void;
  onPrinterAdded: () => void;
  
  showEditAssignmentModal: boolean;
  onCloseEditAssignmentModal: () => void;
  selectedPrinterForAssignment: any;
  onAssignmentUpdated: () => void;
}

const PrinterDashboardModals = React.memo(({
  showPrinterSelection,
  onClosePrinterSelection,
  onPrinterSelected,
  showAssignToClient,
  onCloseAssignToClient,
  selectedPrinter,
  onAssignmentComplete,
  showAddPrinter,
  onCloseAddPrinter,
  onPrinterAdded,
  showEditAssignmentModal,
  onCloseEditAssignmentModal,
  selectedPrinterForAssignment,
  onAssignmentUpdated,
}: PrinterDashboardModalsProps) => {
  return (
    <>
      {showPrinterSelection && (
        <AssignModal 
          isOpen={showPrinterSelection} 
          onClose={onClosePrinterSelection} 
          onAssigned={onAssignmentComplete}
        />
      )}
      
      {showAddPrinter && (
        <AddPrinterModal 
          isOpen={showAddPrinter} 
          onClose={onCloseAddPrinter} 
          onPrinterAdded={onPrinterAdded} 
        />
      )}
      
      {showEditAssignmentModal && selectedPrinterForAssignment && (
        <EditAssignmentModal
          isOpen={showEditAssignmentModal}
          onClose={onCloseEditAssignmentModal}
          printerId={selectedPrinterForAssignment.id}
          onAssignmentUpdated={onAssignmentUpdated}
          isLoading={false}
        />
      )}
    </>
  );
});

PrinterDashboardModals.displayName = 'PrinterDashboardModals';

export default PrinterDashboardModals;
