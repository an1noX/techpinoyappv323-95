import { useState } from "react";
import { Plus, ShoppingCart, FileText, Truck, Package, BarChart3, ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SalesTab } from "@/components/sales/SalesTab";
import { Sale } from "@/types/sales";
import TopMobileHeader from "@/includes/TopMobileHeader";
import BottomMobileNavigation from "@/includes/BottomMobileNavigation";
import { CreateSalesModal } from "@/components/sales/CreateSalesModal";
import { useNavigate, useLocation } from "react-router-dom";
import { SalesOverview } from "./SalesOverview";
import PurchaseOrders from "@/transactions/pages/PurchaseOrders";
import DeliveryReceipts from "@/transactions/pages/DeliveryReceipts";

export const SalePage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'purchase-orders' | 'deliveries' | 'summary' | 'transactionsv2' | 'client-po'>('transactions');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Summary stats
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const pendingSales = sales.filter(s => s.status === 'pending').length;
  const completedSales = sales.filter(s => s.status === 'paid').length;

  // Tab configuration based on SalesTab.tsx
  const salesTabs = [
    { id: 'transactions' as const, label: 'Transactions', icon: FileText },
    { id: 'purchase-orders' as const, label: 'Purchase Orders', icon: Package },
    { id: 'client-po' as const, label: 'Client PO', icon: Receipt },
    { id: 'deliveries' as const, label: 'Deliveries', icon: Truck },
    { id: 'summary' as const, label: 'Summary', icon: BarChart3 },
    { id: 'transactionsv2' as const, label: 'Transactionsv2', icon: FileText },
  ];

  const salesClient = {
    id: 'sales-entry',
    name: 'Sales Entry',
    contact_email: '',
    phone: '',
    notes: '',
    address: '',
    contact_person: '',
    department_count: 0,
    printer_count: 0,
    location_count: 0,
    created_at: '',
    updated_at: '',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Fixed container for Safari compatibility */}
      <div className="w-full min-h-screen bg-white shadow-xl" style={{ minWidth: '320px', maxWidth: '100vw' }}>
        <TopMobileHeader
          client={salesClient}
          onBack={() => navigate('/')}
          onEdit={() => {}}
          appVersion="1.0.0"
        />
        {/* Main Content - Fixed padding for Safari */}
        <div className="px-4 sm:px-6 lg:px-8 pb-24 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Sales Management</h2>
          </div>


          {/* Sales Tab Content */}
          {activeTab === 'summary' ? (
            <SalesOverview />
          ) : activeTab === 'client-po' ? (
            <PurchaseOrders />
          ) : activeTab === 'deliveries' ? (
            <DeliveryReceipts />
          ) : (
            <SalesTab sales={sales} setSales={setSales} activeTab={activeTab} />
          )}
        </div>

        {/* Fixed Navigation Bar with back button enabled */}
        <BottomMobileNavigation
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'transactions' | 'purchase-orders' | 'deliveries' | 'summary' | 'transactionsv2' | 'client-po')}
          tabs={salesTabs}
          showBackButton={true}
          onBackClick={() => navigate('/')}
          rightButton={
            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              size="sm"
            >
              <Plus className="h-5 w-5" />
            </Button>
          }
        />

        {/* Create Sales Modal */}
        <CreateSalesModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Refresh the data after successful creation
            // You can add any refresh logic here if needed
          }}
        />
      </div>
    </div>
  );
};
