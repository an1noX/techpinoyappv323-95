import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, Merge, DollarSign } from 'lucide-react';
import ProductCard from './ProductCard';
import AddProductModal from '@/components/AddProductModal';
import AdminEditProductModal from './AdminEditProductModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Product } from '@/types/database';
import { productService } from '@/services/productService';
import { toast } from 'sonner';
import ProductVariantSelectionModal from './ProductVariantSelectionModal';
import AdminProductSelectionModal from './AdminProductSelectionModal';
import AdminMergeProductsModal from './AdminMergeProductsModal';
import { printerService } from '@/services/printerService';
import { clientService } from '@/services/clientService';
import { supabase } from '@/integrations/supabase/client';
import PriceCheckModal from './PriceCheckModal';
import { CustomLoading } from '@/components/ui/CustomLoading';
interface ProductGroup {
  baseSku: string;
  category: string;
  name: string;
  colors: string[];
  priceType: string;
  status: string;
  allProducts: any[];
  supportedPrinters: any[];
  departmentsSupplied: any[];
  customPricing?: any;
  skus: string[];
  productSkus: Array<{
    sku: string;
    color?: string;
  }>;
}
interface ProductsTabProps {
  products: any[];
  onAddProduct?: () => void;
  onEditProduct?: (product: any) => void;
  onDeleteProduct?: (product: any) => void;
  onRefresh?: () => void;
  onEditClientPrice?: (productId: string, clientId: string) => void;
  onEditSupplierPrice?: (productId: string, supplierId: string) => void;
  onRequestQuote?: (productId: string, supplierId: string) => void;
}

// Helper function to group products by similar SKU
const groupProductsBySimilarSku = (products: any[]): ProductGroup[] => {
  const groups: {
    [key: string]: ProductGroup;
  } = {};
  products.forEach(product => {
    let baseSku = (product.sku || '').trim();
    let groupKey: string;
    let groupName: string;
    if (baseSku) {
      // Group by SKU if it exists
      baseSku = baseSku.replace(/[A-Z]$/, '');
      const ceMatch = baseSku.match(/^CE(\d+)$/i);
      if (ceMatch) {
        const ceToBase: {
          [key: string]: string;
        } = {
          '320': '128',
          '321': '128',
          '322': '128',
          '323': '128'
        };
        baseSku = ceToBase[ceMatch[1]] || ceMatch[1];
      }
      groupKey = baseSku;
      groupName = `SKU: ${baseSku}`;
    } else {
      // For blank SKUs, use the product ID for a unique group and the product name for display.
      groupKey = product.id;
      groupName = product.name;
    }
    if (!groups[groupKey]) {
      groups[groupKey] = {
        baseSku: groupKey,
        category: product.category || '',
        name: groupName,
        colors: [],
        priceType: 'standard',
        status: 'active',
        allProducts: [],
        supportedPrinters: [],
        departmentsSupplied: [],
        skus: [],
        productSkus: []
      };
    }
    groups[groupKey].allProducts.push(product);
    if (!groups[groupKey].skus.includes(product.sku)) {
      groups[groupKey].skus.push(product.sku);
      groups[groupKey].productSkus.push({
        sku: product.sku,
        color: product.color
      });
    }
    if (product.color && !groups[groupKey].colors.includes(product.color)) {
      groups[groupKey].colors.push(product.color);
    }
  });
  return Object.values(groups);
};

// Helper to fetch supplied departments for a product
const fetchProductDepartments = async (productId: string) => {
  const {
    data,
    error
  } = await supabase.from('product_clients').select(`*, client:clients(*)`).eq('product_id', productId);
  if (error) return [];
  return (data || []).map((pc: any) => ({
    id: pc.client?.id,
    departmentName: pc.client?.department || '',
    locationName: pc.client?.location || '',
    clientName: pc.client?.name || ''
  }));
};
const ProductsTab: React.FC<ProductsTabProps> = ({
  products = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProductGroup, setSelectedProductGroup] = useState<ProductGroup | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [variantAction, setVariantAction] = useState<'edit' | 'delete' | null>(null);
  const [showMergeSelection, setShowMergeSelection] = useState(false);
  const [productsToMerge, setProductsToMerge] = useState<Product[]>([]);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [productToPreselect, setProductToPreselect] = useState<Product | undefined>(undefined);
  const [groupedProductsWithRelations, setGroupedProductsWithRelations] = useState<ProductGroup[]>([]);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Group all products first.
  const allGroupedProducts = groupProductsBySimilarSku(products);

  // Fetch and aggregate compatible printers and supplied departments for each group
  useEffect(() => {
    const fetchRelations = async () => {
      setLocalLoading(true);
      const enrichedGroups = await Promise.all(allGroupedProducts.map(async group => {
        let allPrinters: any[] = [];
        let allDepartments: any[] = [];
        for (const product of group.allProducts) {
          try {
            const printers = await printerService.getProductPrinters(product.id);
            allPrinters.push(...(printers || []));
          } catch {}
          try {
            const departments = await fetchProductDepartments(product.id);
            allDepartments.push(...(departments || []));
          } catch {}
        }
        const uniquePrinters = allPrinters.filter((p, idx, arr) => p && p.id && arr.findIndex(x => x.id === p.id) === idx);
        const uniqueDepartments = allDepartments.filter((d, idx, arr) => d && d.id && arr.findIndex(x => x.id === d.id) === idx);
        return {
          ...group,
          supportedPrinters: uniquePrinters,
          departmentsSupplied: uniqueDepartments
        };
      }));
      setGroupedProductsWithRelations(enrichedGroups);
      setLocalLoading(false);
    };
    fetchRelations();
  }, [products]);

  // Then, filter the groups based on the search query.
  const filteredGroupedProducts = groupedProductsWithRelations.filter(group => {
    if (!searchQuery.trim()) {
      return true;
    }
    const term = searchQuery.toLowerCase();
    if (group.baseSku.toLowerCase().includes(term)) {
      return true;
    }
    return group.allProducts.some(p => p.name?.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term) || p.alias?.toLowerCase().includes(term));
  });
  const handleAddProduct = () => {
    if (onAddProduct) {
      onAddProduct();
    } else {
      setShowAddModal(true);
    }
  };
  const handleEditProduct = (productGroup: ProductGroup) => {
    if (productGroup.allProducts.length === 1) {
      const product = productGroup.allProducts[0];
      if (onEditProduct) {
        onEditProduct(product);
      } else {
        setSelectedProduct(product);
        setShowEditModal(true);
      }
    } else {
      setSelectedProductGroup(productGroup);
      setVariantAction('edit');
      setShowVariantSelector(true);
    }
  };
  const handleDeleteProduct = (productGroup: ProductGroup) => {
    if (productGroup.allProducts.length === 1) {
      const product = productGroup.allProducts[0];
      if (onDeleteProduct) {
        onDeleteProduct(product);
      } else {
        setSelectedProduct(product);
        setShowDeleteDialog(true);
      }
    } else {
      setSelectedProductGroup(productGroup);
      setVariantAction('delete');
      setShowVariantSelector(true);
    }
  };
  const handleViewDetails = (productGroup: ProductGroup) => {
    const product = productGroup.allProducts[0];
    console.log('View product details:', product);
  };
  const handleVariantSelected = (product: Product) => {
    setShowVariantSelector(false);
    if (variantAction === 'edit') {
      setSelectedProduct(product);
      setShowEditModal(true);
    } else if (variantAction === 'delete') {
      setSelectedProduct(product);
      setShowDeleteDialog(true);
    }
    setSelectedProductGroup(null);
    setVariantAction(null);
  };
  const handleStartMergeFromEdit = (product: Product) => {
    setShowEditModal(false);
    setProductToPreselect(product);
    setShowMergeSelection(true);
  };
  const handleMergeSelected = (selected: Product[]) => {
    setProductsToMerge(selected);
    setShowMergeSelection(false);
    setShowMergeConfirm(true);
  };
  const handleMergeComplete = () => {
    setShowMergeConfirm(false);
    setProductsToMerge([]);
    if (onRefresh) onRefresh();
  };
  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    // Immediately close the dialog and reset state
    setShowDeleteDialog(false);
    setSelectedProduct(null);
    
    try {
      await productService.deleteProduct(selectedProduct.id);
      toast.success('Product deleted successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };
  const handleProductAdded = () => {
    setShowAddModal(false);
    if (onRefresh) onRefresh();
    toast.success('Product added successfully');
  };
  const handleProductUpdated = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    if (onRefresh) onRefresh();
    toast.success('Product updated successfully');
  };
  const handleCloneProduct = (productGroup: ProductGroup) => {
    // Implement clone logic or open a modal for cloning
    toast.info(`Clone product: ${productGroup.allProducts[0].name}`);
  };
  const handleMergeProduct = (productGroup: ProductGroup) => {
    // Implement merge logic or open a modal for merging
    setProductToPreselect(productGroup.allProducts[0]);
    setShowMergeSelection(true);
  };
  return <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Products List */}
      {localLoading ? (
        <CustomLoading message="Loading products..." />
      ) : (
        filteredGroupedProducts.length === 0 ? <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try adjusting your search' : 'No products available'}
              </p>
            </CardContent>
          </Card> : <div className="space-y-3">
            {filteredGroupedProducts.map((productGroup, index) => <ProductCard key={`${productGroup.baseSku}-${index}`} productGroup={productGroup} onEdit={() => handleEditProduct(productGroup)} onDelete={() => handleDeleteProduct(productGroup)} onViewDetails={() => handleViewDetails(productGroup)} onClone={handleCloneProduct} onMerge={handleMergeProduct} />)}
          </div>
      )}

      {/* Modals */}
      {showAddModal && <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onProductAdded={handleProductAdded} searchTerm="" />}
      {showEditModal && selectedProduct && <AdminEditProductModal isOpen={showEditModal} onClose={() => {
      setShowEditModal(false);
      setSelectedProduct(null);
    }} product={selectedProduct} onProductUpdated={handleProductUpdated} onStartMerge={handleStartMergeFromEdit} />}
      {showDeleteDialog && selectedProduct && (
        <AlertDialog open={showDeleteDialog && !!selectedProduct} onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setSelectedProduct(null);
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product: {selectedProduct.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedProduct.name} ({selectedProduct.sku})? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {selectedProductGroup && <ProductVariantSelectionModal isOpen={showVariantSelector} onClose={() => {
      setShowVariantSelector(false);
      setSelectedProductGroup(null);
      setVariantAction(null);
    }} productGroup={selectedProductGroup} onProductSelect={handleVariantSelected} action={variantAction} />}
      {showMergeSelection && <AdminProductSelectionModal isOpen={showMergeSelection} onClose={() => setShowMergeSelection(false)} onProductsSelected={handleMergeSelected} allProducts={products} initialSelectedProduct={productToPreselect} />}
      {showMergeConfirm && <AdminMergeProductsModal isOpen={showMergeConfirm} onClose={() => setShowMergeConfirm(false)} products={productsToMerge} onMergeComplete={handleMergeComplete} />}
      <PriceCheckModal isOpen={showPriceCheck} onClose={() => setShowPriceCheck(false)} />
    </div>;
};
export default ProductsTab;