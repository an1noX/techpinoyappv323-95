import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Users, Truck, Plus, ArrowLeft, Layers } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import TopMobileHeader from '@/includes/TopMobileHeader';
import ProductTabContent from './components/ProductTabContent';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { SEARCH_PLACEHOLDERS, LOADING_MESSAGES } from '@/constants/adminDashboard';
import { Button } from '@/components/ui/button';
import { BottomNavigation as ProductDashboardNav } from './ProductDashboardNav';
import AddProductModal from '@/components/AddProductModal';
import PriceCheckModal from '@/components/admin-dashboard/components/PriceCheckModal';
import { ClientPricingTab } from './ClientPricingTab';
import { SupplierPricingTab } from './SupplierPricingTab';
import { ProductSetsTab } from '@/components/ProductSets/ProductSetsTab';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useRefreshFunctions } from '@/hooks/useRefreshFunctions';
import BottomMobileNavigation from '@/includes/BottomMobileNavigation';

// Placeholder client object for header
const placeholderClient = {
  id: 'placeholder',
  name: 'Product Catalog',
  contact_person: '',
  contact_email: '',
  phone: '',
  address: '',
  department_count: 0,
  location_count: 0,
  printer_count: 0,
  notes: '',
  created_at: '1970-01-01T00:00:00Z',
  updated_at: '1970-01-01T00:00:00Z'
};

const ProductDashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'client-pricing' | 'supplier-pricing' | 'product-sets'>('products');

  // Fetch products
  const {
    data: products = [],
    isLoading: productsLoading,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts()
  });

  // Get refresh functions
  const { refreshProducts } = useRefreshFunctions();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Mobile-First Container */}
        <div className="w-full min-h-screen bg-white shadow-xl">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-3 flex items-center justify-between border-b border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-base font-semibold text-gray-900 truncate block">Product Catalog</span>
                <span className="text-xs text-gray-600">Dashboard</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 flex-shrink-0"
              onClick={() => navigate('/')}
              aria-label="Back"
            >
              <Package className="h-5 w-5 text-blue-500" />
            </Button>
          </div>

          {/* Main Content - Mobile Optimized */}
          <div className="pb-20 overflow-y-auto">
            <PullToRefresh onRefresh={refreshProducts}>
              <div className="p-4">
                {activeTab === 'products' && (
                  <ProductTabContent 
                    isLoading={productsLoading} 
                    filteredData={products} 
                    searchQuery={searchQuery} 
                    onDataRefresh={refetchProducts} 
                  />
                )}
                {activeTab === 'client-pricing' && products.length > 0 && (
                  <ClientPricingTab 
                    product={{
                      ...products[0],
                      price: (products[0] as any).price ?? 0,
                      brand: (products[0] as any).brand ?? '',
                      quantityInStock: (products[0] as any).quantityInStock ?? 0
                    }} 
                  />
                )}
                {activeTab === 'supplier-pricing' && <SupplierPricingTab />}
                {activeTab === 'product-sets' && <ProductSetsTab />}
              </div>
            </PullToRefresh>
          </div>

          {/* Mobile Bottom Navigation with Back Button */}
          <BottomMobileNavigation
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as 'products' | 'client-pricing' | 'supplier-pricing' | 'product-sets')}
            tabs={[
              { id: 'products', label: 'Products', icon: Package },
              { id: 'client-pricing', label: 'Client Pricing', icon: Users },
              { id: 'supplier-pricing', label: 'Supplier Pricing', icon: Truck },
              { id: 'product-sets', label: 'Product Sets', icon: Layers },
            ]}
            showBackButton={true}
            onBackClick={() => navigate('/')}
            rightButton={
              <Button
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full h-10 w-10 p-0 shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Add Product"
              >
                <Plus size={18} />
              </Button>
            }
          />

          {/* Modals */}
          <AddProductModal 
            isOpen={showAddProduct} 
            onClose={() => setShowAddProduct(false)} 
            onProductAdded={() => {
              setShowAddProduct(false);
              refetchProducts();
            }} 
            searchTerm={searchQuery} 
          />
          <PriceCheckModal 
            isOpen={showPriceCheck} 
            onClose={() => setShowPriceCheck(false)} 
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductDashboard;
