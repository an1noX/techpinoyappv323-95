import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Product } from '@/types/database';
import ColorIndicator from '@/components/ColorIndicator';
import { Package, Edit, Trash2 } from 'lucide-react';

interface ProductGroup {
  baseSku: string;
  allProducts: Product[];
}

interface ProductVariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: ProductGroup;
  onProductSelect: (product: Product) => void;
  action: 'edit' | 'delete' | null;
}

const ProductVariantSelectionModal: React.FC<ProductVariantSelectionModalProps> = ({
  isOpen,
  onClose,
  productGroup,
  onProductSelect,
  action,
}) => {
  if (!isOpen) return null;

  const title = action === 'edit' ? 'Select a Product to Edit' : 'Select a Product to Delete';
  const description = `The SKU group ${productGroup.baseSku} contains multiple products. Please select the specific one you'd like to ${action}.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {productGroup.allProducts.map(product => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                </div>
                {product.color && <ColorIndicator color={product.color} />}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onProductSelect(product)}
                aria-label={`Select ${product.name}`}
              >
                {action === 'edit' ? (
                  <Edit className="h-4 w-4 mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {action === 'edit' ? 'Edit' : 'Delete'}
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductVariantSelectionModal; 