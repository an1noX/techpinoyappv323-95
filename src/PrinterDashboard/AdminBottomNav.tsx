
import React from 'react';
import { Users, Package, Building2, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_DASHBOARD_TABS } from '@/constants/adminDashboard';

type TabType = typeof ADMIN_DASHBOARD_TABS[keyof typeof ADMIN_DASHBOARD_TABS];

interface AdminBottomNavProps {
  activeTab: TabType;
  onTabChange: (tabId: TabType) => void;
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({
  activeTab,
  onTabChange
}) => {
  const bottomTabs = [
    { id: ADMIN_DASHBOARD_TABS.SUPPLIERS, label: 'Suppliers', icon: Building2 },
    { id: ADMIN_DASHBOARD_TABS.PRINTERS, label: 'Printers', icon: Printer },
    { id: ADMIN_DASHBOARD_TABS.PRODUCT, label: 'Products', icon: Package },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
      <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-2xl">
        <div className="grid grid-cols-5 px-2 py-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`h-16 rounded-2xl mx-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminBottomNav; 