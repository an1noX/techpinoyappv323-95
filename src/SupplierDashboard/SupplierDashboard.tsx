
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, DollarSign, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import SupplierEditModal from '@/components/admin-dashboard/components/SupplierEditModal';
import SupplierInfoModal from '@/components/admin-dashboard/components/SupplierInfoModal';
import ProductPricingModal from '@/components/admin-dashboard/components/ProductPricingModal';
import TopMobileHeader from '@/includes/TopMobileHeader';
import BottomMobileNavigation from '@/includes/BottomMobileNavigation';

// Components for navigation
import NavigationButton from '../PrinterDashboard/components/NavigationButton';

interface Supplier {
  id: string;
  name: string;
  description?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  current_price: number;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    description?: string;
  };
}

const SupplierDashboard: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'products-price' | 'all-products'>('products-price');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedProductSupplier, setSelectedProductSupplier] = useState<ProductSupplier | null>(null);

  // Fetch supplier details
  const { data: supplier, isLoading: supplierLoading, error } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: async () => {
      if (!supplierId) throw new Error('Supplier ID is required');
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .maybeSingle();

      if (error) throw error;
      return data as Supplier | null;
    },
    enabled: !!supplierId,
  });

  // Fetch supplier products and pricing
  const { data: supplierProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('product_suppliers')
        .select(`
          *,
          product:products(*),
          supplier:suppliers(*)
        `)
        .eq('supplier_id', supplierId);

      if (error) throw error;
      return data as ProductSupplier[] || [];
    },
    enabled: !!supplierId,
  });

  // Fetch all products for "All Products" tab
  const { data: allProducts, isLoading: allProductsLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (supplierData: Partial<Supplier>) => {
      if (!supplierId) throw new Error('Supplier ID is required');
      
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Supplier updated successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      setShowEditModal(false);
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
      toast.error('Failed to update supplier');
    },
  });

  const handleBack = () => {
    navigate('/admin-dashboard');
  };

  const handleProductClick = (productSupplier: ProductSupplier) => {
    setSelectedProductSupplier(productSupplier);
    setShowPricingModal(true);
  };

  const handleSupplierUpdated = (updatedSupplier: Supplier) => {
    updateSupplierMutation.mutate(updatedSupplier);
  };

  // Mobile-optimized tab configuration
  const supplierTabs = [
    { id: 'products-price' as const, label: 'Pricing', icon: DollarSign },
    { id: 'all-products' as const, label: 'Products', icon: Package },
  ];

  if (error || (supplier === null && !supplierLoading)) {
    toast.error('Supplier not found or error loading supplier details');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm">Supplier not found or error loading supplier details</p>
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (supplierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'products-price') {
      return (
        <div className="h-full">
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 text-sm">Loading products...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {supplierProducts && supplierProducts.length > 0 ? (
                supplierProducts.map((item: ProductSupplier) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 active:scale-[0.98] cursor-pointer transition-all duration-200 shadow-sm"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{item.product?.name}</h3>
                        <p className="text-xs text-gray-600 truncate">{item.product?.sku}</p>
                        <p className="text-xs text-gray-500 truncate">{item.product?.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-blue-600 text-sm">
                          ₱{item.current_price?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">Current Price</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No products with pricing available for this supplier.</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'all-products') {
      return (
        <div className="h-full">
          {allProductsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 text-sm">Loading all products...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {allProducts && allProducts.length > 0 ? (
                allProducts.map((product: any) => (
                  <div key={product.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-gray-600 truncate">{product.sku}</p>
                        <p className="text-xs text-gray-500 truncate">{product.category}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 active:scale-95 transition-transform"
                          onClick={() => {
                            // TODO: Add product to supplier pricing
                            toast.info('Add pricing functionality to be implemented');
                          }}
                        >
                          Add Price
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No products available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-3 flex items-center justify-between border-b border-blue-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-base font-semibold text-gray-900 truncate block">{supplier?.name || 'Supplier'}</span>
            <span className="text-xs text-gray-600">Dashboard</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 flex-shrink-0" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-blue-500" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4">
          {renderTabContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl safe-area-bottom">
        <BottomMobileNavigation
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'products-price' | 'all-products')}
          tabs={supplierTabs}
        />
      </div>

      {/* Modals */}
      <SupplierEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        supplier={supplier}
        onSupplierUpdated={handleSupplierUpdated}
        isLoading={updateSupplierMutation.isPending}
      />
      <SupplierInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        supplier={supplier}
      />
      <ProductPricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setSelectedProductSupplier(null);
        }}
        productSupplier={selectedProductSupplier}
        supplierId={supplierId || ''}
      />
    </div>
  );
};

export default SupplierDashboard;
