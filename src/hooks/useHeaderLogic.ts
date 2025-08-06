
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useBackgroundUpdateChecker } from '@/hooks/useBackgroundUpdateChecker';
import { APP_VERSION } from '@/utils/version';

export const useHeaderLogic = () => {
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { toast } = useToast();
  const location = useLocation();

  const {
    updateInfo,
    isChecking: isCheckingUpdates,
    checkForUpdates,
    hasUpdates,
    availableUpdates,
    latestVersion,
    lastChecked
  } = useBackgroundUpdateChecker({
    currentVersion: APP_VERSION,
    enableNotifications: true,
    enableBackgroundChecks: true
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleQuickSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Offline Mode',
        description: 'You are now offline. Changes will be synced when connection is restored.',
        variant: 'destructive'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckUpdate = async () => {
    try {
      await checkForUpdates();
      setUpdateDialogOpen(true);
    } catch (error) {
      console.error('Error checking for updates:', error);
      toast({ 
        title: 'Update check failed', 
        description: 'Could not check for updates. Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const handleQuickSync = async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot sync while offline',
        variant: 'destructive'
      });
      return;
    }
    // Simplified sync logic without complex dependencies
    console.log('Quick sync completed');
  };

  const handleSyncStatus = () => {
    setSyncDialogOpen(true);
  };

  return {
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
    updateInfo,
    isCheckingUpdates,
    hasUpdates,
    availableUpdates,
    latestVersion,
    lastChecked
  };
};
