
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderButtonsProps {
  shouldShowLogout: boolean;
  isMainDashboard: boolean;
  isClientUser: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  appVersion: string;
  hasUpdates?: boolean;
  onBack: () => void;
  onQuickSync: () => void;
  onSyncStatus: () => void;
  onCheckUpdate: () => void;
  hideSync?: boolean;
}

export const HeaderButtons: React.FC<HeaderButtonsProps> = ({
  shouldShowLogout,
  isMainDashboard,
  isClientUser,
  isSyncing,
  isOnline,
  appVersion,
  hasUpdates = false,
  onBack,
  onQuickSync,
  onSyncStatus,
  onCheckUpdate,
  hideSync = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      {hideSync ? null : (
        isMainDashboard ? (
          // Main dashboard - show app version, update buttons only (removed sync/settings)
          <>
            <span className="text-xs text-blue-100 px-2 py-1 bg-blue-500/30 rounded">
              v{appVersion}
            </span>
            {/* Removed Quick Sync and Sync Status buttons */}
            <button
              onClick={onCheckUpdate}
              className="p-1 rounded hover:bg-blue-700"
              aria-label="Check for update"
              title="Check for update"
            >
              <Download className="h-4 w-4" />
            </button>
            {hasUpdates && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full"
                title="Updates available"
              />
            )}
          </>
        ) : null
      )}
    </div>
  );
};
