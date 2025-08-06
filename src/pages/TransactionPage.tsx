import { useState } from "react";
import { CreditCard, FileText, Printer, Edit3, Plus, BarChart3, Edit, Search, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomMobileNavigation from '@/includes/BottomMobileNavigation';
import TransactionRecord from '@/transactions/pages/TransactionRecord';
import PurchaseOrdersPage from '@/pages/PurchaseOrdersPage';
import DeliveriesPage from '@/pages/DeliveriesPage';
import { CreateDeliveryModal } from "@/components/sales/CreateDeliveryModal";
import { CreatePurchaseOrderModal } from "@/components/sales/CreatePurchaseOrderModal";
import { CreateSalesModal } from "@/components/sales/CreateSalesModal";
import { SalesOverview } from "@/SalesDashboard/SalesOverview";

const TransactionPage = () => {
  const [activeTab, setActiveTab] = useState<string>("purchase-orders");
  const [editMode, setEditMode] = useState(false);
  const [poEditMode, setPOEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [deliveriesEditMode, setDeliveriesEditMode] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [showCreateSalesModal, setShowCreateSalesModal] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveriesKey, setDeliveriesKey] = useState(0);

  const transactionTabs = [
    { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText },
    { id: 'deliveries', label: 'Deliveries', icon: Printer },
    { id: 'all-transaction', label: 'All Transactions', icon: CreditCard },
    { id: 'overview', label: 'Summary', icon: BarChart3 },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleSavePendingChanges = async () => {
    // Handle saving all pending changes
    // This will be implemented in the table component
    window.dispatchEvent(new CustomEvent('save-pending-changes'));
  };

  const handleCancelEdit = () => {
    setPOEditMode(false);
    setPendingChanges([]);
    // Clear any pending changes
    window.dispatchEvent(new CustomEvent('cancel-edit-mode'));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'purchase-orders':
        return <PurchaseOrdersPage 
          isEditMode={poEditMode} 
          setIsEditMode={setPOEditMode}
          onPendingChanges={setPendingChanges}
        />;
      case 'deliveries':
        return <DeliveriesPage key={deliveriesKey} isEditMode={deliveriesEditMode} />;
      case 'overview':
        return <SalesOverview />;
      case 'all-transaction':
        return <TransactionRecord editMode={editMode} toggleEditMode={toggleEditMode} />;
      default:
        return <TransactionRecord editMode={editMode} toggleEditMode={toggleEditMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-2 md:p-4">
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 w-full">
          <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
            {activeTab === 'purchase-orders' ? 'Purchase Orders' : 
             activeTab === 'deliveries' ? 'Deliveries' : 
             activeTab === 'overview' ? 'Summary' : 'All Transactions'}
          </h1>
          {activeTab === 'all-transaction' && (
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 w-full xs:w-auto">
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={toggleEditMode}
                className="flex items-center gap-2 w-full xs:w-auto"
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden xs:inline">{editMode ? "Exit Edit Mode" : "Edit Mode"}</span>
                <span className="xs:hidden">{editMode ? "Exit Edit" : "Edit"}</span>
              </Button>
              {editMode && (
                <p className="text-xs text-muted-foreground hidden md:block">
                  Click any cell to edit. Changes are saved automatically.
                </p>
              )}
            </div>
          )}
          {activeTab === 'deliveries' && (
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
              {searchVisible ? (
                <div className="flex items-center gap-2 w-full xs:w-auto">
                  <Input
                    placeholder="Search deliveries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full xs:w-48"
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchVisible(false);
                      setSearchQuery("");
                    }}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchVisible(true)}
                  className="flex items-center gap-2 w-full xs:w-auto"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden xs:inline">Search</span>
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 w-full xs:w-auto"
                onClick={() => setShowDeliveryModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Add Deliveries</span>
                <span className="xs:hidden">Add</span>
              </Button>
              <Button
                variant={deliveriesEditMode ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2 w-full xs:w-auto"
                onClick={() => setDeliveriesEditMode(!deliveriesEditMode)}
              >
                <Edit className="h-4 w-4" />
                <span className="hidden xs:inline">{deliveriesEditMode ? "Exit Edit" : "Edit"}</span>
                <span className="xs:hidden">{deliveriesEditMode ? "Exit" : "Edit"}</span>
              </Button>
            </div>
          )}
          {activeTab === 'purchase-orders' && (
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 w-full xs:w-auto"
                onClick={() => setShowPurchaseOrderModal(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Add Client PO</span>
                <span className="xs:hidden">Add PO</span>
              </Button>
              
              {!poEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 w-full xs:w-auto"
                  onClick={() => setPOEditMode(true)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden md:inline">Edit Mode</span>
                  <span className="md:hidden">Edit</span>
                </Button>
              ) : (
                <div className="flex gap-2 w-full xs:w-auto">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 flex-1 xs:flex-none"
                    onClick={handleSavePendingChanges}
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden md:inline">Save</span>
                    <span className="md:hidden">Save</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 flex-1 xs:flex-none"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden md:inline">Cancel</span>
                    <span className="md:hidden">Cancel</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-2 md:px-4 lg:px-6 overflow-x-hidden">
        <div className="w-full max-w-none">
          <div className="overflow-x-auto">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomMobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={transactionTabs}
        rightButton={
          <Button
            onClick={() => setShowCreateSalesModal(true)}
            variant="default"
            size="sm"
            className="h-12 w-12 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Add new"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {/* Modals */}
      {showDeliveryModal && (
        <CreateDeliveryModal 
          onClose={() => setShowDeliveryModal(false)}
          onSuccess={() => {
            setShowDeliveryModal(false);
            // Force DeliveriesPage to re-mount and fetch fresh data
            setDeliveriesKey(prev => prev + 1);
          }}
        />
      )}
      {showPurchaseOrderModal && (
        <CreatePurchaseOrderModal 
          onClose={() => setShowPurchaseOrderModal(false)}
          onSuccess={() => setShowPurchaseOrderModal(false)}
        />
      )}
      {showCreateSalesModal && (
        <CreateSalesModal 
          isOpen={showCreateSalesModal}
          onClose={() => setShowCreateSalesModal(false)}
          onSuccess={() => setShowCreateSalesModal(false)}
        />
      )}
    </div>
  );
};

export default TransactionPage;