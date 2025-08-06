import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getDeliveryLinkingStatus } from '@/utils/deliveryLinkingUtils';

interface DeliveryItem {
  id: string;
  product_id?: string;
  quantity_delivered: number;
}

interface POItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

interface AvailabilityDisplayProps {
  deliveryId: string;
  purchaseOrderId: string;
  deliveryItems: DeliveryItem[];
  poItems: POItem[];
}

export const AvailabilityDisplay = ({
  deliveryId,
  purchaseOrderId,
  deliveryItems,
  poItems
}: AvailabilityDisplayProps) => {
  const [status, setStatus] = useState<{
    status: 'not_linked' | 'partially_linked' | 'fully_linked' | 'no_matches';
    availableItems: number;
    totalMatchingItems: number;
    linkedItems: number;
  } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const linkingStatus = await getDeliveryLinkingStatus(
          deliveryId,
          purchaseOrderId,
          deliveryItems,
          poItems
        );
        setStatus(linkingStatus);
      } catch (error) {
        console.error('Error checking delivery linking status:', error);
      }
    };

    checkStatus();
  }, [deliveryId, purchaseOrderId, deliveryItems, poItems]);

  if (!status) {
    return (
      <div className="text-xs text-center text-gray-500">
        <Clock className="h-3 w-3 animate-spin inline mr-1" />
        Checking availability...
      </div>
    );
  }

  const { status: linkingStatus, availableItems, totalMatchingItems, linkedItems } = status;

  const getStatusDisplay = () => {
    switch (linkingStatus) {
      case 'no_matches':
        return (
          <div className="text-xs text-center text-gray-500">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            No matching products
          </div>
        );
      
      case 'not_linked':
        return (
          <div className="text-xs text-center text-blue-600">
            <div>{availableItems} of {totalMatchingItems} available</div>
          </div>
        );
      
      case 'partially_linked':
        return (
          <div className="text-xs text-center">
            <div className="text-green-600 mb-1">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              {linkedItems} linked
            </div>
            <div className="text-blue-600">
              {availableItems} still available
            </div>
          </div>
        );
      
      case 'fully_linked':
        return (
          <div className="text-xs text-center text-green-600">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            All {totalMatchingItems} items linked
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (linkingStatus) {
      case 'no_matches':
        return <Badge variant="outline" className="text-xs">No Matches</Badge>;
      
      case 'not_linked':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Available</Badge>;
      
      case 'partially_linked':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Partial</Badge>;
      
      case 'fully_linked':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Complete</Badge>;
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {getStatusBadge()}
      {getStatusDisplay()}
    </div>
  );
};