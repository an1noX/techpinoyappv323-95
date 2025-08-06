
import { Package, Users, Truck } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: Tab[];
}

export const BottomNavigation = ({ activeTab, onTabChange, tabs }: BottomNavigationProps) => {
  const defaultTabs = [
    { id: "products", label: "Products", icon: Package },
    { id: "client-pricing", label: "Client Pricing", icon: Users },
    { id: "supplier-pricing", label: "Supplier Pricing", icon: Truck },
  ];

  const tabsToRender = tabs || defaultTabs;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl">
      <div className="px-2 py-2">
        <div className="flex gap-1 w-full min-w-0 items-stretch">
          {tabsToRender.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon || Package;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`transition-all duration-200 min-w-0 rounded-lg h-full flex items-center justify-center
                  ${isActive 
                    ? 'flex-[2] bg-blue-600 text-white shadow-md gap-3 px-4 py-3'
                    : 'flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-0 py-3'
                  }
                `}
                aria-pressed={isActive}
                style={{ minWidth: 0 }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isActive && (
                  <span className="text-base font-semibold truncate text-center leading-tight ml-2">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
