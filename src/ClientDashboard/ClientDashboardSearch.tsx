import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Product } from "@/types/sales";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import AddPrinterModal from "@/components/AddPrinterModal";
import { Printer as PrinterType } from "@/types/database";
import { Users, Printer, Monitor, ShoppingCart, LifeBuoy, User, LogOut, CornerUpLeft, Search, X, Building, Settings, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDepartments } from "@/components/admin-dashboard/hooks/useDepartments";

// Components
import { FilterButtons } from "../PrinterDashboard/components/FilterButtons";
import { AddButtonNavigation } from "../PrinterDashboard/components/AddButtonNavigation";
import { AddPurchaseModal } from '@/SalesDashboard/AddPurchaseModal';

// Hooks
import { usePrinterSearch } from "../PrinterDashboard/hooks/usePrinterSearch";
import PrinterSelectionModal from "@/components/admin-dashboard/components/PrinterSelectionModal";
import AssignPrinterToClientModal from "../PrinterDashboard/AssignPrinterToClientModal";
import AddCompanyPrinterModal from './AddCompanyPrinterModal';

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

interface ClientDashboardSearchProps {
  activeTab: 'departments' | 'products' | 'printers' | 'available-printers' | 'support';
  setActiveTab: (tab: 'departments' | 'products' | 'printers' | 'available-printers' | 'support') => void;
  onFilteredDataChange?: (data: PrinterWithProducts[]) => void;
  client?: any;
  onClientUpdated?: (client: any) => void;
}

// Enhanced SearchInput component with department navigation
interface EnhancedSearchInputProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder: string;
  departments: any[];
  onDepartmentSelect: (departmentId: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const EnhancedSearchInput = ({ 
  searchQuery, 
  onSearchChange, 
  placeholder, 
  departments, 
  onDepartmentSelect, 
  onFocus,
  onBlur
}: EnhancedSearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDepartments, setShowDepartments] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to check if input contains valid characters (a-z, 1-9, case-insensitive)
  const hasValidCharacters = (input: string): boolean => {
    // Regular expression to match valid characters: letters a-z (case-insensitive) or digits 1-9
    const validCharRegex = /[a-zA-Z1-9]/;
    return validCharRegex.test(input);
  };

  // Show departments when focused and no valid characters in search query
  useEffect(() => {
    if (isFocused && !hasValidCharacters(searchQuery) && departments.length > 1) {
      setShowDepartments(true);
    } else {
      setShowDepartments(false);
    }
  }, [isFocused, searchQuery, departments.length]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    // Delay hiding departments to allow for clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowDepartments(false);
      onBlur();
    }, 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onSearchChange(newValue);
    
    // Immediately hide departments if valid characters are typed
    if (hasValidCharacters(newValue)) {
      setShowDepartments(false);
    }
  };

  const handleDepartmentClick = (departmentId: string) => {
    onDepartmentSelect(departmentId);
    setShowDepartments(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/90 border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}
      
      {/* Department Navigation Dropdown - Fixed positioning and styling */}
      {showDepartments && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] max-h-60 overflow-y-auto backdrop-blur-sm">
          <div className="p-3">
            <div className="text-xs font-medium text-gray-500 mb-3 px-2 flex items-center gap-2">
              <Building className="h-3 w-3" />
              Jump to a department...
            </div>
            <div className="space-y-1">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleDepartmentClick(dept.id)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 rounded-md flex items-center gap-3 transition-all duration-150 group"
                >
                  <Building className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-blue-700">{dept.name}</span>
                  {dept.locations && dept.locations.length > 0 && (
                    <span className="text-xs text-gray-500 ml-auto bg-gray-100 px-2 py-1 rounded-full group-hover:bg-blue-100 transition-colors">
                      {dept.locations.length} location{dept.locations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const filterValueMap: Record<'assigned' | 'catalog' | 'available' | 'inventory', 'departments' | 'products' | 'printers' | 'inventory'> = {
  assigned: 'departments',
  catalog: 'products',
  available: 'printers',
  inventory: 'inventory',
};
const reverseFilterValueMap: Record<'departments' | 'products' | 'printers' | 'inventory', 'assigned' | 'catalog' | 'available' | 'inventory'> = {
  departments: 'assigned',
  products: 'catalog',
  printers: 'available',
  inventory: 'inventory',
};

export const ClientDashboardSearch = ({ 
  activeTab, 
  setActiveTab,
  onFilteredDataChange,
  client,
  onClientUpdated
}: ClientDashboardSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [showPrinterSelection, setShowPrinterSelection] = useState(false);
  const [showAssignToClient, setShowAssignToClient] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<{ id: string; name: string } | null>(null);
  const [isSearchFieldActive, setIsSearchFieldActive] = useState(false);
  const [hasClearedSearch, setHasClearedSearch] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  const [pendingDepartmentScroll, setPendingDepartmentScroll] = useState<string | null>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false); // NEW: controls the dropdown menu
  const [showAddCompanyPrinter, setShowAddCompanyPrinter] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { performSearch } = usePrinterSearch(onFilteredDataChange);
  const { clientId } = useParams<{ clientId: string }>();
  const { userProfile } = useAuth();
  
  // Fetch departments for navigation
  const { data: departments = [] } = useDepartments(clientId!);

  // Enhanced search logic for departments, locations, printers, and products
  useEffect(() => {
    if (!searchQuery.trim()) {
      onFilteredDataChange?.([]);
      return;
    }
    let cancelled = false;
    (async () => {
      // 1. Search products by name, sku, or alias
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .or([
          `name.ilike.%${searchQuery}%`,
          `sku.ilike.%${searchQuery}%`,
          `alias.ilike.%${searchQuery}%`
        ].join(','));
      const productIds = (products || []).map(p => p.id);

      // 2. Find printers related to those products
      let printerIdsFromProducts: string[] = [];
      if (productIds.length > 0) {
        const { data: productPrinters } = await supabase
          .from('product_printers')
          .select('printer_id')
          .in('product_id', productIds);
        printerIdsFromProducts = (productPrinters || []).map(pp => pp.printer_id);
      }

      // 3. Search printers directly (ensure partial/substring matching for name and model)
      // REMOVED: direct .or() search on printers table for name/model/id/serial_number
      // 4. Search printers directly (only name and model, ilike, case-insensitive)
      // REMOVED: direct .or() search on printers table for name/model
      const printerOrClause = [
        `name.ilike.%${searchQuery}%`,
        `model.ilike.%${searchQuery}%`
      ].join(',');
      const { data: printers } = await supabase
        .from('printers')
        .select('id')
        .or(printerOrClause);
      const printerIdsFromSearch = (printers || []).map(p => p.id);
      console.log('Printer search query:', searchQuery, 'Printer IDs found:', printerIdsFromSearch);

      // 5. Search departments by name
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .ilike('name', `%${searchQuery}%`);
      const departmentIds = (departments || []).map(d => d.id);

      // 6. Find locations for those departments
      let locationIdsFromDepartments: string[] = [];
      if (departmentIds.length > 0) {
        const { data: deptLocations } = await supabase
          .from('departments_location')
          .select('id')
          .in('department_id', departmentIds);
        locationIdsFromDepartments = (deptLocations || []).map(l => l.id);
      }

      // 7. Search locations by name
      const { data: locations } = await supabase
        .from('departments_location')
        .select('id')
        .ilike('name', `%${searchQuery}%`);
      const locationIdsFromName = (locations || []).map(l => l.id);

      // 8. Consolidate all location IDs
      const allLocationIds = Array.from(new Set([
        ...locationIdsFromDepartments,
        ...locationIdsFromName
      ]));

      // 9. Consolidate all printer IDs
      const allPrinterIds = Array.from(new Set([
        ...printerIdsFromProducts,
        ...printerIdsFromSearch
      ]));

      // 10. Query printer_assignments with correct location and printer matching, and assignment serial number search
      const assignmentOrClauses = [];
      if (allPrinterIds.length) assignmentOrClauses.push(`printer_id.in.(${allPrinterIds.join(',')})`);
      if (allLocationIds.length) assignmentOrClauses.push(`department_location_id.in.(${allLocationIds.join(',')})`);
      assignmentOrClauses.push(`serial_number.ilike.%${searchQuery}%`);
      const orClause = assignmentOrClauses.length > 1 ? assignmentOrClauses.join(',') : assignmentOrClauses[0];
      console.log('Printer assignment search .or() clause:', orClause);
      const { data: assignments } = await supabase
        .from('printer_assignments')
        .select(`
          *,
          printer:printers(*),
          location:departments_location(*, department:departments(*))
        `)
        .or(orClause)
        .eq('status', 'active')
        .eq('client_id', clientId);

      // 11. Aggregate results as before
      const results = (assignments || []).map(a => ({
        ...a.printer,
        printer_id: a.printer?.id,
        serial_number: a.serial_number,
        status: a.status,
        printer: a.printer,
        assignment_id: a.id,
        department_id: a.location?.department?.id,
        department_name: a.location?.department?.name,
        location_id: a.location?.id,
        location_name: a.location?.name,
        assignment_status: a.status,
        assignment_notes: a.notes,
        compatibleProducts: [],
        printer_assignments: [
          {
            id: a.id,
            status: a.status,
          },
        ],
      }));

      if (!cancelled) {
        onFilteredDataChange?.(results);
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, onFilteredDataChange]);

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

  const handleAddCompanyPrinter = () => {
    setShowAddCompanyPrinter(true);
  };

  // Department navigation handler
  const handleDepartmentSelect = (departmentId: string) => {
    if (activeTab === "products") {
      setActiveTab("departments");
      setPendingDepartmentScroll(departmentId);
    } else {
      const element = document.getElementById(`department-${departmentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Effect to scroll after switching to departments tab
  useEffect(() => {
    if (activeTab === "departments" && pendingDepartmentScroll) {
      const element = document.getElementById(`department-${pendingDepartmentScroll}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingDepartmentScroll(null);
      }
    }
  }, [activeTab, pendingDepartmentScroll]);

  // Enhanced context-aware navigation button logic
  const isSearchActive = searchQuery.trim().length > 0;
  const shouldShowBackButton = isSearchFieldActive || isSearchActive;

  // Reset hasClearedSearch if searchQuery changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setHasClearedSearch(false);
    }
  }, [searchQuery]);

  // Handle search field focus/blur to track active state
  const handleSearchFieldFocus = () => {
    setIsSearchFieldActive(true);
  };

  const handleSearchFieldBlur = () => {
    // Delay to allow for clicks on department items
    setTimeout(() => {
      if (!searchQuery.trim()) {
        setIsSearchFieldActive(false);
      }
    }, 200);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl transition-all">
        <div className="flex items-center px-2 py-2 min-h-[60px]">
          {/* Left section - Back button */}
          <div className="flex-shrink-0 w-12 flex justify-center">
            <button
              type="button"
              aria-label="Back"
              className="h-12 w-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Center section - Search and Tabs - Dynamically adjust based on right section */}
          <div className={`flex-1 flex items-center justify-center min-w-0 px-2 ${
            (userProfile?.role === 'admin' || userProfile?.role === 'client') ? 'pr-0' : 'pr-12'
          }`}>
            <div className="flex items-center gap-2 w-full max-w-full">
              <div className="flex-1 min-w-0">
                <EnhancedSearchInput
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  placeholder="Search printers, models..."
                  departments={departments}
                  onDepartmentSelect={handleDepartmentSelect}
                  onFocus={handleSearchFieldFocus}
                  onBlur={handleSearchFieldBlur}
                />
              </div>
              {/* Tab buttons */}
              <div className="flex gap-1 flex-shrink-0">
                {[
                  { key: 'departments', label: 'Printers', icon: Printer },
                  { key: 'products', label: 'Products', icon: ShoppingCart },
                ].map(({ key, label, icon: Icon }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key as ClientDashboardSearchProps['activeTab'])}
                      className={`flex items-center justify-center px-3 py-2 min-w-[60px] rounded-lg transition-all duration-200
                        ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      `}
                      aria-pressed={isActive}
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right section - Only render if needed, no fixed width */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'client') && (
            <div className="flex-shrink-0 flex justify-center ml-2">
              <AddButtonNavigation
                onAssignPrinter={handleAssignPrinter}
                onAddPrinter={handleAddPrinter}
                onAddToInventory={() => {}}
                onAddCompanyPrinter={handleAddCompanyPrinter}
              />
            </div>
          )}
        </div>
      </nav>
      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <ProductDetailsModal
          isOpen={showProductDetails}
          onClose={handleCloseProductDetails}
          product={selectedProduct} 
        />
      )}
      {/* AddPrinterModal */}
      {showAddPrinter && (
        <AddPrinterModal 
          isOpen={showAddPrinter} 
          onClose={() => setShowAddPrinter(false)} 
          onPrinterAdded={() => {}} 
        />
      )}
      {/* Printer Selection Modal */}
      {showPrinterSelection && (
        <PrinterSelectionModal
          isOpen={showPrinterSelection}
          onClose={() => setShowPrinterSelection(false)}
          onPrinterSelected={handlePrinterSelected}
        />
      )}

      {/* Assign Printer to Client Modal */}
      {showAssignToClient && selectedPrinter && (
        <AssignPrinterToClientModal
          isOpen={showAssignToClient}
          onClose={() => setShowAssignToClient(false)}
          printerId={selectedPrinter.id}
          printerName={selectedPrinter.name}
          onAssignmentCreated={handleAssignmentComplete}
        />
      )}
      {/* Add Purchase Order Modal */}
      {showAddPurchase && (
        <AddPurchaseModal
          isOpen={showAddPurchase}
          onClose={() => setShowAddPurchase(false)}
        />
      )}
      {/* Add Company Printer Modal */}
      {showAddCompanyPrinter && (
        <AddCompanyPrinterModal
          isOpen={showAddCompanyPrinter}
          onClose={() => setShowAddCompanyPrinter(false)}
          onPrinterAdded={() => setShowAddCompanyPrinter(false)}
          clientId={clientId}
        />
      )}

      {/* Placeholder Modal for Back Button */}
      <Dialog open={showPlaceholderModal} onOpenChange={setShowPlaceholderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-600 flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Placeholder for settings
                setShowPlaceholderModal(false);
                // Optionally, show a toast or do nothing
              }}
            >
              Settings
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
