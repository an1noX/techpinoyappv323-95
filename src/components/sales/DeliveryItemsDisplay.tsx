import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryItem {
  product_id: string;
  quantity_delivered: number;
  product?: {
    name: string;
    sku?: string;
    color?: string;
  };
}

interface POItem {
  product_id: string;
  quantity: number;
  model?: string;
}

interface DeliveryItemsDisplayProps {
  items: DeliveryItem[];
  poItems: POItem[];
}

export const DeliveryItemsDisplay = ({ items, poItems }: DeliveryItemsDisplayProps) => {
  const [showUnmatched, setShowUnmatched] = useState(false);

  if (items.length === 0) return null;

  // Separate matching and unmatched items
  const matchingItems = items.filter(item => 
    poItems.some(poItem => poItem.product_id === item.product_id)
  );
  
  const unmatchedItems = items.filter(item => 
    !poItems.some(poItem => poItem.product_id === item.product_id)
  );

  const renderItem = (item: DeliveryItem, index: number) => {
    const matchingPOItem = poItems.find(poItem => poItem.product_id === item.product_id);
    const isMatching = !!matchingPOItem;
    const quantityDiff = matchingPOItem ? item.quantity_delivered - matchingPOItem.quantity : 0;
    
    return (
      <div key={index} className={`text-xs p-2 rounded border ${isMatching ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
            <div className="text-xs text-gray-600">Delivered: {item.quantity_delivered}</div>
            {matchingPOItem && (
              <div className="text-xs text-gray-600">
                PO Qty: {matchingPOItem.quantity}
                {quantityDiff !== 0 && (
                  <span className={`ml-2 ${quantityDiff > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    ({quantityDiff > 0 ? '+' : ''}{quantityDiff})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            {isMatching ? (
              <div className="text-green-600 text-xs flex items-center">
                ✓ Match
                {quantityDiff > 0 && <span className="ml-1 text-orange-600">Over</span>}
                {quantityDiff < 0 && <span className="ml-1 text-yellow-600">Under</span>}
              </div>
            ) : (
              <div className="text-red-600 text-xs">✗ No Match</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-3">
      <div className="text-xs font-medium text-gray-700 mb-1">Items in delivery:</div>
      <div className="space-y-1">
        {/* Show all matching items first */}
        {matchingItems.map((item, index) => renderItem(item, index))}
        
        {/* Show unmatched items section if there are any */}
        {unmatchedItems.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUnmatched(!showUnmatched)}
              className="h-6 px-2 text-xs text-gray-600 hover:text-gray-800"
            >
              {showUnmatched ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              {unmatchedItems.length} unmatched item{unmatchedItems.length !== 1 ? 's' : ''}
            </Button>
            
            {showUnmatched && (
              <div className="space-y-1 mt-1">
                {unmatchedItems.map((item, index) => renderItem(item, matchingItems.length + index))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Show missing PO items */}
      {(() => {
        const missingItems = poItems.filter(poItem => 
          !items.some(deliveryItem => deliveryItem.product_id === poItem.product_id)
        );
        return missingItems.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-xs font-medium text-yellow-800 mb-1">Missing from delivery:</div>
            <div className="space-y-1">
              {missingItems.slice(0, 2).map((item, index) => (
                <div key={index} className="text-xs text-yellow-700">
                  • {item.model || 'Unknown Product'} (Qty: {item.quantity})
                </div>
              ))}
              {missingItems.length > 2 && (
                <div className="text-xs text-yellow-600">+{missingItems.length - 2} more missing</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};