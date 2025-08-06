
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SalesOverview } from "./SalesOverview";
import { SalesPage } from "@/components/pages/SalesPage";
import TopMobileHeader from '@/includes/TopMobileHeader';

interface SalesDashboardProps {
  onBack?: () => void;
}

export const SalesDashboard = ({ onBack }: SalesDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <SalesOverview />;
      case "sales":
        return <SalesPage />;
      case "purchase-orders":
        return <div className="px-4 py-4"><h2 className="text-lg font-semibold">Purchase Orders - Coming Soon</h2></div>;
      case "deliveries":
        return <div className="px-4 py-4"><h2 className="text-lg font-semibold">Deliveries - Coming Soon</h2></div>;
      default:
        return <SalesOverview />;
    }
  };

  // Generic client object for header
  const salesClient = {
    id: 'sales-dashboard',
    name: 'Sales Dashboard',
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
    <div className="min-h-screen bg-white">
      <TopMobileHeader
        client={salesClient}
        onBack={() => navigate('/')}
        onEdit={() => {}}
        appVersion="1.0.0"
      />
      <main className="flex-1 overflow-y-auto pb-20">
        {renderActiveTab()}
      </main>
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === "overview") {
            navigate('/overview');
          } else {
            setActiveTab(tab);
          }
        }}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "sales", label: "Sales" },
          { id: "purchase-orders", label: "Purchase Order" },
          { id: "deliveries", label: "Deliveries" }
        ]}
      />
    </div>
  );
}; 