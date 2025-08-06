
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Wifi, WifiOff, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyncStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SyncStatusDialog: React.FC<SyncStatusDialogProps> = ({ open, onOpenChange }) => {
  const [syncStatus, setSyncStatus] = useState<any[]>([]); // Changed type to any[] as SyncMetadata is removed
  const [syncProgress, setSyncProgress] = useState<any | null>(null); // Changed type to any
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRepairing, setIsRepairing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSyncStatus();
    }
  }, [open]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Remove this useEffect as syncService is removed
  // useEffect(() => {
  //   const unsubscribe = syncService.onSyncProgress((progress) => {
  //     setSyncProgress(progress);
  //     if (progress.status === 'completed' || progress.status === 'error') {
  //       loadSyncStatus(); // Refresh status after sync
  //     }
  //   });

  //   return unsubscribe;
  // }, []);

  const loadSyncStatus = async () => {
    try {
      // This function will now only load from SQLite, not from syncService
      // For now, we'll just return an empty array or a placeholder
      // In a real scenario, you'd fetch from your SQLite database here
      setSyncStatus([]); 
    } catch (error) {
      console.error('Failed to load sync status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync status',
        variant: 'destructive'
      });
    }
  };

  // Remove this function as handleSync is no longer available
  // const handleSync = async (forceFull = false) => {
  //   if (!isOnline) {
  //     toast({
  //       title: 'Offline',
  //       description: 'Cannot sync while offline',
  //       variant: 'destructive'
  //     });
  //     return;
  //   }

  //   try {
  //     await syncService.startSync(forceFull);
  //   } catch (error) {
  //     console.error('Sync failed:', error);
  //   }
  // };

  // Remove this function as handleRepairDatabase is no longer available
  // const handleRepairDatabase = async () => {
  //   setIsRepairing(true);
  //   try {
  //     await syncService.repairDatabase();
  //     await loadSyncStatus(); // Refresh status after repair
  //   } catch (error) {
  //     console.error('Database repair failed:', error);
  //   } finally {
  //     setIsRepairing(false);
  //   }
  // };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'conflict':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      synced: 'default',
      pending: 'secondary',
      error: 'destructive',
      conflict: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (date.getFullYear() === 1970) return 'Never';
    return date.toLocaleString();
  };

  const getTotalSyncedTables = () => syncStatus.filter(s => s.status === 'synced').length;
  const getTotalRecords = () => syncStatus.reduce((sum, s) => sum + (s.record_count || 0), 0);
  const hasErrors = () => syncStatus.some(s => s.status === 'error');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Sync Status
            <div className="flex items-center gap-1 ml-auto">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sync Progress */}
          {syncProgress && syncProgress.status === 'syncing' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Syncing {syncProgress.currentTable || 'data'}...
                </span>
              </div>
              <Progress value={syncProgress.overallProgress} className="w-full" />
              <div className="text-sm text-muted-foreground">
                {syncProgress.currentTable && (
                  <div>Current: {syncProgress.currentTable}</div>
                )}
                <div>
                  Overall Progress: {Math.round(syncProgress.overallProgress)}%
                </div>
              </div>
            </div>
          )}

          {/* Sync Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getTotalSyncedTables()}
              </div>
              <div className="text-sm text-muted-foreground">Tables Synced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getTotalRecords()}
              </div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {syncStatus.filter(s => s.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex flex-col gap-2">
            {/* Remove Quick Sync and Full Sync buttons as they are no longer available */}
            {/* <div className="flex gap-2">
              <Button
                onClick={() => handleSync(false)}
                disabled={syncService.isSyncing || !isOnline}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncService.isSyncing ? 'animate-spin' : ''}`} />
                {syncService.isSyncing ? 'Syncing...' : 'Quick Sync'}
              </Button>
              <Button
                onClick={() => handleSync(true)}
                disabled={syncService.isSyncing || !isOnline}
                variant="outline"
                className="flex-1"
              >
                Full Sync
              </Button>
            </div> */}
            
            {/* Remove Database Repair Button - Show when there are errors */}
            {/* {hasErrors() && (
              <Button
                onClick={handleRepairDatabase}
                disabled={isRepairing || syncService.isSyncing}
                variant="secondary"
                className="w-full"
              >
                <Wrench className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
                {isRepairing ? 'Fixing Database...' : 'Fix Database Structure'}
              </Button>
            )} */}
          </div>

          {/* Error Message for Offline Mode */}
          {!isOnline && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">Working Offline</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Changes will be stored locally and synced when connection is restored.
              </p>
            </div>
          )}

          {/* Table Status List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Table Status</h3>
            <div className="space-y-2">
              {syncStatus.map((table) => (
                <div
                  key={table.table_name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(table.status)}
                    <div>
                      <div className="font-medium capitalize">
                        {table.table_name.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {table.record_count || 0} records • Last sync: {formatDate(table.last_sync)}
                      </div>
                      {table.error_message && (
                        <div className="text-sm text-red-600 mt-1">
                          {table.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(table.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
