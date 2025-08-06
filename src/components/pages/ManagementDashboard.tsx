
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PrintersPage } from "@/components/pages/PrintersPage";
import { SuppliersPage } from "@/components/pages/SuppliersPage";

interface ManagementDashboardProps {
  onBack: () => void;
}

export const ManagementDashboard = ({ onBack }: ManagementDashboardProps) => {
  const [activeTab, setActiveTab] = useState("printers");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "printers":
        return <PrintersPage />;
      case "suppliers":
        return <SuppliersPage />;
      default:
        return <PrintersPage />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Management</h1>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto pb-20">
        {renderActiveTab()}
      </main>
      
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        tabs={[
          { id: "printers", label: "Printers" },
          { id: "suppliers", label: "Suppliers" }
        ]}
      />
    </div>
  );
};
