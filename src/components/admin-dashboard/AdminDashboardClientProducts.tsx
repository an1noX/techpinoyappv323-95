import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Search, Filter, Grid, List, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useClientProducts } from './hooks/useClientProducts';
import { groupProductsBySku, filterProducts } from './utils/productGrouping';
import ProductFilters from './components/ProductFilters';
import ProductCard from './components/ProductCard';
import AdminEditProductModal from './components/AdminEditProductModal';
import ClientPricingModal from './components/ClientPricingModal';
import AddProductToClientDialog from './components/AddProductToClientDialog';
import { Product } from '@/types/database';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface AdminDashboardClientProductsProps {
  clientId: string;
}

const AdminDashboardClientProducts: React.FC<AdminDashboardClientProductsProps> = ({ clientId }) => {
  const isMobile = useIsMobile();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProductGroup, setSelectedProductGroup] = useState<any>(null);
  const [showClientPricingModal, setShowClientPricingModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Check if user is a client user (not admin/owner/sales_admin)
  const isClientUser = userProfile && !['admin', 'sales_admin', 'superadmin'].includes(userProfile.role || '');

  const { data: clientProducts = [], isLoading, refetch } = useClientProducts(clientId);

  // Filter products
  const filteredProducts = filterProducts(clientProducts, searchQuery, statusFilter, priceTypeFilter);

  // Group products by normalized SKU for similar products that only differ by color
  const skuGroupsMap = groupProductsBySku(filteredProducts);
  const skuGroups = Object.entries(skuGroupsMap);

  const handleEditProduct = (productGroup: any) => {
    // Extract the first product from the group for editing
    const clientProduct = productGroup.allProducts[0];
    
    console.log('ClientProduct object:', clientProduct);
    console.log('product_id:', clientProduct.product_id);
    console.log('id:', clientProduct.id);
    
    // Create a proper Product object using the product_id field
    const product: Product = {
      id: clientProduct.product_id, // Use product_id, not id
      name: clientProduct.name,
      sku: clientProduct.sku,
      category: clientProduct.category,
      color: clientProduct.color,
      created_at: '', // These will be filled by the database
      updated_at: ''
    };
    
    console.log('Created Product object:', product);
    
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleProductUpdated = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    refetch();
  };

  const handleClientPricing = (productGroup: any) => {
    setSelectedProductGroup(productGroup);
    setShowClientPricingModal(true);
  };

  const handleClientPricingSuccess = () => {
    refetch();
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
  };

  const handleAddProductSuccess = () => {
    setShowAddProductModal(false);
    refetch();
  };

  if (isLoading) {
    return <CustomLoading message="Loading products" />;
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile-first compact search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Search products..."
          />
        </div>
        
        {/* Only show add button for non-client users */}
        {!isClientUser && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-10 px-3 text-xs whitespace-nowrap touch-target"
            onClick={handleAddProduct}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Mobile-optimized products display */}
      {skuGroups.length === 0 ? (
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || priceTypeFilter !== 'all'
                ? 'Try adjusting your search or filters to find products.' 
                : 'Products will appear automatically based on assigned printers and their compatibility.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {skuGroups.map(([key, productGroup]) => (
            <ProductCard 
              key={key} 
              productGroup={productGroup} 
              onEdit={handleEditProduct}
              onClientPricing={handleClientPricing}
            />
          ))}
        </div>
      )}

      {/* Mobile-optimized Edit Product Modal */}
      {selectedProduct && (
        <AdminEditProductModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          variants={selectedProduct && skuGroupsMap[selectedProduct.sku]
            ? skuGroupsMap[selectedProduct.sku].allProducts.map(cp => ({
                id: cp.product_id,
                name: cp.name,
                sku: cp.sku,
                category: cp.category,
                color: cp.color,
                alias: '',
                description: '',
                created_at: '',
                updated_at: '',
              }))
            : []}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {/* Client Pricing Modal */}
      {selectedProductGroup && (
        <ClientPricingModal
          isOpen={showClientPricingModal}
          onClose={() => {
            setShowClientPricingModal(false);
            setSelectedProductGroup(null);
          }}
          productGroup={selectedProductGroup}
          clientId={clientId}
          onSuccess={handleClientPricingSuccess}
        />
      )}

      {/* Add Product to Client Modal */}
      <AddProductToClientDialog
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        clientId={clientId}
        onSuccess={handleAddProductSuccess}
      />
    </div>
  );
};

export default AdminDashboardClientProducts;
