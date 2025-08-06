import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Product } from "@/types/sales";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import AddPrinterModal from "@/components/AddPrinterModal";
import { Printer as PrinterType } from "@/types/database";
import { AssignModal } from "./AssignModal";
import { AddToInventoryModal } from "./components/AddToInventoryModal";
import { MobileNavLayout } from "@/components/navigation/MobileNavLayout";

// Components
import { FilterButtons } from "./components/FilterButtons";
import NavigationButton from "@/PrinterDashboard/components/NavigationButton";
import { AddButtonNavigation } from "./components/AddButtonNavigation";

interface PrinterWithProducts extends Omit<PrinterType, 'printer_assignments'> {
  compatibleProducts: Array<{
    id: string;
    name: string;
    sku?: string;
    color?: string;
  }>;
  printer_assignments?: Array<{
    id: string;
    status: string;
    is_unassigned?: boolean;
    serial_number?: string;
    client_id?: string;
    clients?: { id: string; name: string };
    department_location?: { name: string; department: { name: string } };
  }>;
}

interface PrinterDashboardNavProps {
  printerFilter: 'assigned' | 'catalog' | 'available' | 'inventory' | 'all';
  setPrinterFilter: (filter: 'assigned' | 'catalog' | 'available' | 'inventory' | 'all') => void;
  onFilteredDataChange: (data: PrinterWithProducts[]) => void;
  editAssignmentModal?: React.ReactNode;
}

export const PrinterDashboardNav = ({ 
  printerFilter, 
  setPrinterFilter,
  onFilteredDataChange,
  editAssignmentModal
}: PrinterDashboardNavProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showPrinterSelection, setShowPrinterSelection] = useState(false);
  const [showAssignToClient, setShowAssignToClient] = useState(false);
  const [showAddToInventory, setShowAddToInventory] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<{ id: string; name: string } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleCloseProductDetails = () => {
    setShowProductDetails(false);
    setSelectedProduct(null);
  };

  const handlePrinterSelected = (printerId: string, printerName: string) => {
    setSelectedPrinter({ id: printerId, name: printerName });
    setShowPrinterSelection(false);
    setShowAssignToClient(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignToClient(false);
    setSelectedPrinter(null);
  };

  const handleAssignPrinter = () => {
    setShowPrinterSelection(true);
  };

  const handleAddPrinter = () => {
    setShowAddPrinter(true);
  };

  const handleAddToInventory = () => {
    setShowAddToInventory(true);
  };

  const handleInventoryAdded = () => {
    setShowAddToInventory(false);
  };

  return (
    <>
      <MobileNavLayout
        leftSection={
          <NavigationButton 
            label="Back"
            isActive={false}
            show={location.pathname !== '/'}
            onClick={() => navigate(-1)}
          />
        }
        centerSection={
          <FilterButtons 
            printerFilter={printerFilter}
            setPrinterFilter={setPrinterFilter}
          />
        }
        rightSection={
          <AddButtonNavigation
            onAssignPrinter={handleAssignPrinter}
            onAddPrinter={handleAddPrinter}
            onAddToInventory={handleAddToInventory}
          />
        }
      />

      {/* Modals */}
      {showProductDetails && selectedProduct && (
        <ProductDetailsModal
          isOpen={showProductDetails}
          onClose={handleCloseProductDetails}
          product={selectedProduct} 
        />
      )}
      {showAddPrinter && (
        <AddPrinterModal 
          isOpen={showAddPrinter} 
          onClose={() => setShowAddPrinter(false)} 
          onPrinterAdded={() => {}} 
        />
      )}
      {showAddToInventory && (
        <AddToInventoryModal
          isOpen={showAddToInventory}
          onClose={() => setShowAddToInventory(false)}
          onAdded={handleInventoryAdded}
        />
      )}
      {showPrinterSelection && (
        <AssignModal
          isOpen={showPrinterSelection}
          onClose={() => setShowPrinterSelection(false)}
          onAssigned={handleAssignmentComplete}
        />
      )}
      {showAssignToClient && selectedPrinter && (
        <AssignModal
          isOpen={showAssignToClient}
          onClose={() => setShowAssignToClient(false)}
          onAssigned={handleAssignmentComplete}
          preSelectedClientId={selectedPrinter.id}
        />
      )}
    </>
  );
};
