
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Sparkles, AlertTriangle, FlaskConical, Clock } from 'lucide-react';
import { VersionInfo } from '@/services/updateService';

interface WhatsNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionInfo: VersionInfo;
  currentVersion: string;
  onUpdate: () => void;
  onRemindLater: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  open,
  onOpenChange,
  versionInfo,
  currentVersion,
  onUpdate,
  onRemindLater
}) => {
  const getUpdateIcon = (updateType: VersionInfo['updateType']) => {
    switch (updateType) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      case 'beta':
        return <FlaskConical className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getUpdateBadgeVariant = (updateType: VersionInfo['updateType']) => {
    switch (updateType) {
      case 'critical':
        return 'destructive';
      case 'beta':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getUpdateTypeLabel = (updateType: VersionInfo['updateType']) => {
    switch (updateType) {
      case 'critical':
        return 'Critical Update';
      case 'beta':
        return 'Beta Release';
      default:
        return 'Feature Update';
    }
  };

  const formatReleaseDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          {getUpdateIcon(versionInfo.updateType)}
          What's New in v{versionInfo.version}
        </DialogTitle>
        
        <DialogDescription asChild>
          <div className="space-y-4">
            {/* Update Type Badge */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={getUpdateBadgeVariant(versionInfo.updateType)}
                className="flex items-center gap-1"
              >
                {getUpdateIcon(versionInfo.updateType)}
                {getUpdateTypeLabel(versionInfo.updateType)}
              </Badge>
              {versionInfo.isRequired && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>

            {/* Version Information */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Version:</span>
                <span className="font-medium">v{currentVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">New Version:</span>
                <span className="font-medium text-blue-600">v{versionInfo.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Release Date:</span>
                <span className="font-medium">{formatReleaseDate(versionInfo.releaseDate)}</span>
              </div>
              {versionInfo.fileSize && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Download Size:</span>
                  <span className="font-medium">{formatFileSize(versionInfo.fileSize)}</span>
                </div>
              )}
            </div>

            {/* What's New List */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">What's New:</h4>
              <ul className="space-y-1">
                {versionInfo.whatsNew.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogDescription>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!versionInfo.isRequired && (
            <Button 
              variant="ghost" 
              onClick={onRemindLater}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Remind Me Later
            </Button>
          )}
          <Button 
            onClick={onUpdate}
            className="flex items-center gap-2"
            variant={versionInfo.updateType === 'critical' ? 'destructive' : 'default'}
          >
            <Download className="h-4 w-4" />
            {versionInfo.updateType === 'critical' ? 'Update Now' : 'Download Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
