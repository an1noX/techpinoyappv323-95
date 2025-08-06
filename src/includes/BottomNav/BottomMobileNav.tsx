
import { Home, Users, ShoppingCart, Printer, Truck, Package } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: Tab[];
}

export const BottomNavigation = ({ activeTab, onTabChange, tabs }: BottomNavigationProps) => {
  const defaultTabs = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "printers", label: "Printers", icon: Printer },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "products", label: "Products", icon: Package },
  ];

  const tabsToRender = tabs || defaultTabs;

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
      <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-2xl">
        <div className={`grid grid-cols-${tabsToRender.length} px-2 py-2`}>
          {tabsToRender.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`h-16 rounded-2xl mx-1 flex flex-col items-center justify-center gap-1 min-w-0 flex-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {Icon && (
                  <Icon
                    size={20}
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 text-white' : 'text-gray-500'
                    }`}
                  />
                )}
                <span
                  className={`text-xs font-medium transition-all duration-200 ${
                    isActive ? 'font-semibold text-white' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 