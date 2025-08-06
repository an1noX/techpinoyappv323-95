
import { useState, useEffect, useRef } from 'react';
import { updateService, UpdateCheckResult, VersionInfo } from '@/services/updateService';
import { useToast } from '@/hooks/use-toast';

interface UseBackgroundUpdateCheckerOptions {
  currentVersion: string;
  checkIntervalHours?: number;
  enableNotifications?: boolean;
  enableBackgroundChecks?: boolean;
  onNewVersionDetected?: (versionInfo: VersionInfo) => void;
}

export const useBackgroundUpdateChecker = ({
  currentVersion,
  checkIntervalHours = 24, // Check daily by default
  enableNotifications = true,
  enableBackgroundChecks = true,
  onNewVersionDetected
}: UseBackgroundUpdateCheckerOptions) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Check for updates
  const checkForUpdates = async (silent: boolean = false) => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await updateService.checkForUpdates(currentVersion);
      setUpdateInfo(result);

      // If there's an error in the result, handle it gracefully
      if (result.error) {
        console.log('⚠️ Update check completed with error:', result.error);
        if (!silent && enableNotifications && !result.error.includes('network unavailable')) {
          toast({
            title: 'Update Check Notice',
            description: result.error,
            variant: 'default'
          });
        }
        return;
      }

      // Check if we should show the "What's New" modal
      if (result.hasUpdates && result.latestVersionInfo) {
        const hasBeenShown = updateService.hasVersionBeenShown(result.latestVersion);
        
        if (!hasBeenShown) {
          // Show the modal for new version
          if (onNewVersionDetected) {
            onNewVersionDetected(result.latestVersionInfo);
          }
          setShowWhatsNew(true);
        }
      }

      // Show notification for new updates (only if not silent and notifications enabled)
      if (!silent && enableNotifications && result.hasUpdates) {
        const criticalUpdates = result.availableUpdates.filter(u => u.updateType === 'critical');
        
        if (criticalUpdates.length > 0) {
          toast({
            title: 'Critical Update Available',
            description: `Version v${result.latestVersion} contains important fixes. Please update soon.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'New Update Available',
            description: `Version v${result.latestVersion} is now available for download.`,
          });
        }
      }
    } catch (error) {
      console.error('Background update check failed:', error);
      // Don't show error toasts for silent background checks to reduce noise
      if (!silent && enableNotifications) {
        toast({
          title: 'Update Check Failed',
          description: 'Could not check for updates. Please try again later.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Manual update check
  const manualUpdateCheck = () => checkForUpdates(false);

  // Handle "What's New" modal actions
  const handleUpdate = () => {
    if (updateInfo?.latestVersionInfo?.downloadUrl) {
      // Mark version as shown
      updateService.markVersionAsShown(updateInfo.latestVersion);
      
      // Open download link
      window.open(updateInfo.latestVersionInfo.downloadUrl, '_blank');
      setShowWhatsNew(false);
    }
  };

  const handleRemindLater = () => {
    // Don't mark as shown, so it will show again next time
    setShowWhatsNew(false);
    
    toast({
      title: 'Reminder Set',
      description: 'We\'ll remind you about this update later.',
    });
  };

  const handleCloseWhatsNew = () => {
    if (updateInfo?.latestVersion) {
      // Mark as shown when manually closed
      updateService.markVersionAsShown(updateInfo.latestVersion);
    }
    setShowWhatsNew(false);
  };

  // Start background checking
  useEffect(() => {
    if (!enableBackgroundChecks) return;

    // Check immediately on mount (silent)
    const cachedInfo = updateService.getCachedUpdateInfo();
    if (cachedInfo) {
      setUpdateInfo(cachedInfo);
      
      // Check if we should show modal for cached latest version
      if (cachedInfo.hasUpdates && cachedInfo.latestVersionInfo && !cachedInfo.error) {
        const hasBeenShown = updateService.hasVersionBeenShown(cachedInfo.latestVersion);
        if (!hasBeenShown) {
          if (onNewVersionDetected) {
            onNewVersionDetected(cachedInfo.latestVersionInfo);
          }
          setShowWhatsNew(true);
        }
      }
    } else {
      // Delay initial check slightly to avoid blocking app startup
      setTimeout(() => checkForUpdates(true), 2000);
    }

    // Set up periodic checking with longer intervals to reduce server load
    intervalRef.current = setInterval(() => {
      checkForUpdates(true); // Silent background checks
    }, checkIntervalHours * 60 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentVersion, checkIntervalHours, enableBackgroundChecks]);

  // Check when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (enableBackgroundChecks) {
        // Small delay to ensure connection is stable
        setTimeout(() => checkForUpdates(true), 3000);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enableBackgroundChecks]);

  return {
    updateInfo,
    isChecking,
    checkForUpdates: manualUpdateCheck,
    hasUpdates: updateInfo?.hasUpdates || false,
    availableUpdates: updateInfo?.availableUpdates || [],
    latestVersion: updateInfo?.latestVersion,
    lastChecked: updateInfo?.lastChecked,
    // What's New modal state and handlers
    showWhatsNew,
    setShowWhatsNew,
    handleUpdate,
    handleRemindLater,
    handleCloseWhatsNew,
    latestVersionInfo: updateInfo?.latestVersionInfo
  };
};
