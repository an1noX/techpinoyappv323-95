import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, Unlink } from 'lucide-react';
import { deliveryItemLinkService } from '@/services/deliveryItemLinkService';
import { DeliveryItemLinkWithDetails } from '@/services/deliveryItemLinkService';
import { toast } from 'sonner';

interface DeliveryLinksDisplayProps {
  purchaseOrderId: string;
  onUnlink?: () => void;
}

export const DeliveryLinksDisplay = ({ purchaseOrderId, onUnlink }: DeliveryLinksDisplayProps) => {
  const [links, setLinks] = useState<DeliveryItemLinkWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, [purchaseOrderId]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const linkData = await deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId);
      setLinks(linkData);
    } catch (error) {
      console.error('Error fetching delivery links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkItem = async (linkId: string) => {
    try {
      await deliveryItemLinkService.deleteDeliveryItemLink(linkId);
      toast.success('Item unlinked successfully');
      await fetchLinks();
      onUnlink?.();
    } catch (error) {
      toast.error('Failed to unlink item');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (links.length === 0) {
    return <div className="text-center py-8 text-gray-500">No linked deliveries</div>;
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <div>
            <div className="font-medium text-sm">
              {link.delivery_item?.product?.name || 'Unknown Product'}
            </div>
            <div className="text-xs text-gray-600">
              Quantity: {link.linked_quantity}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnlinkItem(link.id)}
            className="text-red-600"
          >
            <Unlink className="h-3 w-3 mr-1" />
            Unlink
          </Button>
        </div>
      ))}
    </div>
  );
};