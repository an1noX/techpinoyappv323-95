
import React from 'react';
import { Users, Printer, ShoppingCart, Monitor, ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface BottomMobileNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs?: Array<{ id: string; label: string; icon: React.ElementType }>;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightButton?: React.ReactNode;
}

const defaultTabs = [
  { id: 'all-transaction', label: 'All Transaction', icon: ShoppingCart },
  { id: 'deliveries', label: 'Deliveries', icon: Printer },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: Users },
  { id: 'overview', label: 'Overview', icon: Monitor },
];

const BottomMobileNavigation: React.FC<BottomMobileNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs,
  showBackButton = true,
  onBackClick,
  rightButton
}) => {
  const location = useLocation();
  const bottomTabs = tabs || defaultTabs;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl transition-all">
      <div className="flex items-center px-2 py-2 min-h-[60px]">
        {/* Left section - Back button */}
        {showBackButton && (
          <div className="flex-shrink-0 w-12 flex justify-center mr-2">
            <button
              onClick={handleBackClick}
              className="h-12 w-12 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Center section - Filter buttons */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          <div className="flex gap-1 w-full min-w-0 items-stretch">
            {bottomTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isTextOnlyTab = tab.id === 'purchase-orders' || tab.id === 'deliveries';
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`transition-all duration-200 min-w-0 rounded-lg h-full flex items-center justify-center
                    ${isActive 
                      ? 'flex-[2] bg-blue-600 text-white shadow-md gap-3 px-4 py-3'
                      : isTextOnlyTab 
                        ? 'flex-[2] bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-3'
                        : 'flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-0 py-3'
                    }
                  `}
                  aria-pressed={isActive}
                  style={{ minWidth: 0 }}
                >
                  {!isTextOnlyTab && <Icon className="h-5 w-5 flex-shrink-0" />}
                  {(isActive || isTextOnlyTab) && (
                    <span className="text-base font-semibold truncate text-center leading-tight ml-2">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right section */}
        {rightButton && (
          <div className="flex-shrink-0 w-12 flex justify-center ml-2">
            {rightButton}
          </div>
        )}
      </div>
    </nav>
  );
};

export default BottomMobileNavigation;
