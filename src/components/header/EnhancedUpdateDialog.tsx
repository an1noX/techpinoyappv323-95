
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, AlertTriangle, Sparkles, FlaskConical } from 'lucide-react';
import { APKInfo } from '@/services/updateService';

interface EnhancedUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: string;
  availableUpdates: APKInfo[];
  hasUpdates: boolean;
  lastChecked?: Date;
}

export const EnhancedUpdateDialog: React.FC<EnhancedUpdateDialogProps> = ({
  open,
  onOpenChange,
  currentVersion,
  availableUpdates,
  hasUpdates,
  lastChecked
}) => {
  const getUpdateIcon = (updateType: APKInfo['updateType']) => {
    switch (updateType) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'beta':
        return <FlaskConical className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getUpdateBadgeVariant = (updateType: APKInfo['updateType']) => {
    switch (updateType) {
      case 'critical':
        return 'destructive';
      case 'beta':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getUpdateTypeLabel = (updateType: APKInfo['updateType']) => {
    switch (updateType) {
      case 'critical':
        return 'Critical';
      case 'beta':
        return 'Beta';
      default:
        return 'Feature';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          App Updates
        </DialogTitle>
        
        <DialogDescription asChild>
          <div className="space-y-4">
            {/* Current Version Info */}
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="text-sm font-medium text-blue-900">Current Version</div>
              <div className="text-lg font-bold text-blue-800">v{currentVersion}</div>
            </div>

            {/* Update Status */}
            {hasUpdates ? (
              <div className="space-y-3">
                <div className="text-sm font-medium text-green-700">
                  {availableUpdates.length} update{availableUpdates.length !== 1 ? 's' : ''} available
                </div>
                
                {/* Available Updates */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableUpdates.map((update, index) => (
                    <div key={update.filename} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">v{update.version}</div>
                        <div className="flex items-center gap-2">
                          {update.isLatest && (
                            <Badge variant="default" className="text-xs">Latest</Badge>
                          )}
                          <Badge 
                            variant={getUpdateBadgeVariant(update.updateType)}
                            className="text-xs flex items-center gap-1"
                          >
                            {getUpdateIcon(update.updateType)}
                            {getUpdateTypeLabel(update.updateType)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {update.filename}
                      </div>
                      
                      <a
                        href={update.downloadUrl}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded-lg border text-center">
                <div className="text-sm font-medium text-green-800">You're up to date!</div>
                <div className="text-xs text-green-600 mt-1">
                  No newer versions available
                </div>
              </div>
            )}

            {/* Last Check Info */}
            {lastChecked && (
              <div className="text-xs text-gray-500 text-center">
                Last checked: {lastChecked.toLocaleString()}
              </div>
            )}
          </div>
        </DialogDescription>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
