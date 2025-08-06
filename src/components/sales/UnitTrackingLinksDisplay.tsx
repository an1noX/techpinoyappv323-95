import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Unlink, Package, Calendar } from 'lucide-react';
import { useUnitTracking } from '@/hooks/useUnitTracking';
import { UnitDeliveryLinkWithDetails } from '@/types/unitTracking';
import { toast } from 'sonner';

interface UnitTrackingLinksDisplayProps {
  purchaseOrderId: string;
  onUnlink?: () => void;
}

export const UnitTrackingLinksDisplay = ({ purchaseOrderId, onUnlink }: UnitTrackingLinksDisplayProps) => {
  const { useUnitDeliveryLinks, deleteUnitLink } = useUnitTracking();
  const { data: links = [], isLoading, refetch } = useUnitDeliveryLinks(purchaseOrderId);

  const handleUnlinkUnit = async (linkId: string) => {
    try {
      await deleteUnitLink.mutateAsync(linkId);
      await refetch();
      onUnlink?.();
    } catch (error) {
      // Error already handled by the hook
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading unit links...</div>;
  }

  if (links.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No linked delivery units</div>;
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                Unit #{link.delivery_unit?.unit_number} - Delivery Item {link.delivery_unit?.delivery_item_id}
              </span>
              <Badge variant="secondary" className="text-xs">
                {link.link_status}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Linked: {new Date(link.linked_at).toLocaleDateString()}
              </div>
              {link.delivery_unit?.serial_number && (
                <div>Serial: {link.delivery_unit.serial_number}</div>
              )}
              {link.delivery_unit?.batch_number && (
                <div>Batch: {link.delivery_unit.batch_number}</div>
              )}
              {link.notes && (
                <div>Notes: {link.notes}</div>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnlinkUnit(link.id)}
            className="text-destructive hover:text-destructive"
          >
            <Unlink className="h-3 w-3 mr-1" />
            Unlink
          </Button>
        </div>
      ))}
    </div>
  );
};