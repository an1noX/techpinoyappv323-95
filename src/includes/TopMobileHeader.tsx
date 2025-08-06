
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Printer, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/types/database';
import { SyncStatusDialog } from '@/components/sync/SyncStatusDialog';
import { HeaderButtons } from '@/components/header/HeaderButtons';
import { HeaderLogo } from '@/components/header/HeaderLogo';
import { ClientDetailsCard } from '@/components/header/ClientDetailsCard';
import { EnhancedUpdateDialog } from '@/components/header/EnhancedUpdateDialog';
import { useHeaderLogic } from '@/hooks/useHeaderLogic';
import { APP_VERSION } from '@/utils/version';

interface TopMobileHeaderProps {
  client: Client;
  onBack?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onAddDepartment?: () => void;
  onAddLocation?: () => void;
  onAssignPrinter?: () => void;
  appVersion?: string;
  onLogout?: () => void;
  hideSync?: boolean;
  showPrinterIcon?: boolean;
  printerBadgeCount?: number;
  onPrinterIconClick?: () => void;
  onTicketIconClick?: () => void;
}

const TopMobileHeader: React.FC<TopMobileHeaderProps> = ({
  client,
  onBack,
  onEdit = () => {},
  appVersion = APP_VERSION,
  onLogout,
  hideSync = false,
  showPrinterIcon = false,
  printerBadgeCount = 0,
  onPrinterIconClick,
  onTicketIconClick
}) => {
  const navigate = useNavigate();
  
  const {
    infoExpanded,
    setInfoExpanded,
    updateDialogOpen,
    setUpdateDialogOpen,
    syncDialogOpen,
    setSyncDialogOpen,
    isSyncing,
    isOnline,
    handleCheckUpdate,
    handleQuickSync,
    handleSyncStatus,
    hasUpdates,
    availableUpdates,
    lastChecked
  } = useHeaderLogic();

  // Unified back button handler
  const handleBackButton = () => {
    if (onBack) {
      onBack();
    } else if (onLogout) {
      onLogout();
    } else {
      // Default navigation behavior
      navigate('/');
    }
  };

  return (
    <div className="bg-blue-600 text-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <HeaderLogo 
            clientName={client.name}
            isMainDashboard={false}
            onClick={() => navigate('/')}
          />
        </div>
        <div className="flex items-center space-x-3">
          <HeaderButtons
            shouldShowLogout={false}
            isMainDashboard={false}
            isClientUser={false}
            isSyncing={isSyncing}
            isOnline={isOnline}
            appVersion={appVersion}
            onBack={handleBackButton}
            onQuickSync={handleQuickSync}
            onSyncStatus={handleSyncStatus}
            onCheckUpdate={handleCheckUpdate}
            hasUpdates={hasUpdates}
            hideSync={hideSync}
          />
          {showPrinterIcon && (
            <>
              <button
                type="button"
                className="relative focus:outline-none"
                onClick={onTicketIconClick}
                aria-label="Show Support Tickets"
                title="Ticket"
              >
                <LifeBuoy className="h-8 w-8 ml-1 text-blue-100" style={{ marginRight: '10px' }} />
              </button>
              <button
                type="button"
                className="relative focus:outline-none"
                onClick={onPrinterIconClick}
                aria-label="Show Available Printers"
                title="Available Printers"
              >
                <Printer className="h-8 w-8 ml-1" style={{ marginRight: '10px' }} />
                {printerBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {printerBadgeCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {infoExpanded && (
        <div className="px-4 pb-4">
          <ClientDetailsCard client={client} onEdit={onEdit} />
        </div>
      )}

      <SyncStatusDialog 
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
      />

      <EnhancedUpdateDialog 
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        currentVersion={appVersion}
        availableUpdates={availableUpdates}
        hasUpdates={hasUpdates}
        lastChecked={lastChecked}
      />
    </div>
  );
};

export default TopMobileHeader;
