import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { deliveryItemLinkService } from '@/services/deliveryItemLinkService';

interface POItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

interface ItemDeliveryStatusProps {
  item: POItem;
  className?: string;
}

interface ItemStatus {
  orderedQuantity: number;
  linkedQuantity: number;
  remainingQuantity: number;
  fulfillmentPercentage: number;
  status: 'pending' | 'partial' | 'complete';
}

export const ItemDeliveryStatus = ({ item, className }: ItemDeliveryStatusProps) => {
  const [status, setStatus] = useState<ItemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStatus = async () => {
      try {
        setLoading(true);
        
        // Get total linked quantity for this PO item
        const linkedQuantity = await deliveryItemLinkService.getTotalLinkedQuantityForPOItem(item.id);
        
        const orderedQuantity = item.quantity;
        const remainingQuantity = Math.max(0, orderedQuantity - linkedQuantity);
        const fulfillmentPercentage = orderedQuantity > 0 ? (linkedQuantity / orderedQuantity) * 100 : 0;
        
        let itemStatus: 'pending' | 'partial' | 'complete';
        if (linkedQuantity === 0) {
          itemStatus = 'pending';
        } else if (linkedQuantity >= orderedQuantity) {
          itemStatus = 'complete';
        } else {
          itemStatus = 'partial';
        }

        setStatus({
          orderedQuantity,
          linkedQuantity,
          remainingQuantity,
          fulfillmentPercentage,
          status: itemStatus
        });
      } catch (error) {
        console.error('Error calculating item delivery status:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateStatus();
  }, [item.id, item.quantity]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Calculating...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        <AlertTriangle className="h-4 w-4 inline mr-1" />
        Error calculating status
      </div>
    );
  }

  const { orderedQuantity, linkedQuantity, remainingQuantity, fulfillmentPercentage, status: itemStatus } = status;

  const getStatusBadge = () => {
    switch (itemStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Partial</Badge>;
      case 'complete':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Complete</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (itemStatus) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{item.model || 'Unknown Product'}</span>
          {getStatusBadge()}
        </div>
        <div className="text-right">
          <div className="font-medium text-sm">₱{item.unit_price.toFixed(2)}</div>
          <div className="text-xs text-gray-600">{fulfillmentPercentage.toFixed(1)}% fulfilled</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-600">
        <span>Ordered: <strong>{orderedQuantity}</strong></span>
        <span className="mx-2">•</span>
        <span>Linked: <strong>{linkedQuantity}</strong></span>
        <span className="mx-2">•</span>
        <span>Remaining: <strong>{remainingQuantity}</strong></span>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            itemStatus === 'complete' ? 'bg-green-500' : 
            itemStatus === 'partial' ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          style={{ width: `${Math.min(fulfillmentPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
};