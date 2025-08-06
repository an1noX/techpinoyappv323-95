import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, X, Warehouse } from 'lucide-react';
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal';
import { CreateDeliveryModal } from './CreateDeliveryModal';
import { CreateInventoryPurchaseModal } from './CreateInventoryPurchaseModal';

interface CreateSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalType = 'selection' | 'purchase-order' | 'delivery' | 'inventory-purchase';

export const CreateSalesModal: React.FC<CreateSalesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [modalType, setModalType] = useState<ModalType>('selection');

  const handleClose = () => {
    setModalType('selection');
    onClose();
  };

  const handleSuccess = () => {
    setModalType('selection');
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleBack = () => {
    setModalType('selection');
  };

  if (modalType === 'purchase-order') {
    return (
      <CreatePurchaseOrderModal
        onClose={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  if (modalType === 'delivery') {
    return (
      <CreateDeliveryModal
        onClose={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  if (modalType === 'inventory-purchase') {
    return (
      <CreateInventoryPurchaseModal
        onClose={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New</DialogTitle>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            onClick={() => setModalType('purchase-order')}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="text-center">
              <div className="font-semibold">Purchase Order</div>
              <div className="text-xs text-gray-500">Create a new purchase order</div>
            </div>
          </Button>

          <Button
            onClick={() => setModalType('delivery')}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
          >
            <Package className="h-8 w-8 text-green-600" />
            <div className="text-center">
              <div className="font-semibold">Delivery Receipt</div>
              <div className="text-xs text-gray-500">Create a new delivery receipt</div>
            </div>
          </Button>

          <Button
            onClick={() => setModalType('inventory-purchase')}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
          >
            <Warehouse className="h-8 w-8 text-purple-600" />
            <div className="text-center">
              <div className="font-semibold">Inventory Purchase</div>
              <div className="text-xs text-gray-500">Record inventory stock purchase</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};