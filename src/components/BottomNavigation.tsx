
import { Home, Users, ShoppingCart, Printer, Truck, Package, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';
import NavigationButton from '@/PrinterDashboard/components/NavigationButton';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: Tab[];
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightButton?: React.ReactNode;
}

export const BottomNavigation = ({ 
  activeTab, 
  onTabChange, 
  tabs, 
  showBackButton = true,
  onBackClick,
  rightButton 
}: BottomNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const defaultTabs = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "printers", label: "Printers", icon: Printer },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "products", label: "Products", icon: Package },
  ];

  const tabsToRender = tabs || defaultTabs;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate('/');
    }
  };

  function getGridColsClass(n: number) {
    switch (n) {
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-3";
      case 4: return "grid-cols-4";
      case 5: return "grid-cols-5";
      case 6: return "grid-cols-6";
      case 7: return "grid-cols-7";
      case 8: return "grid-cols-8";
      default: return "grid-cols-1";
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl flex items-center px-1 sm:px-2 py-1 sm:py-2 transition-all safe-area-bottom">
      {/* Back button - left side with icon */}
      {showBackButton && (
        <div className="flex-shrink-0 sm:mr-2">
          <button
            onClick={handleBackClick}
            className="h-12 w-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Center section - Tab Navigation */}
      <div className="flex-1 flex justify-center min-w-0">
        <div className={`grid ${getGridColsClass(tabsToRender.length)} w-full gap-1 max-w-md`}>
          {tabsToRender.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`h-12 w-full rounded-lg flex flex-col items-center justify-center gap-1 min-w-0 flex-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {Icon && (
                  <Icon
                    size={16}
                    className={`h-4 w-4 transition-transform duration-200 ${
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
      
      {/* Right side - optional button or placeholder */}
      <div className="flex-shrink-0 sm:ml-2">
        {rightButton || <div className="w-10"></div>}
      </div>
    </nav>
  );
};
