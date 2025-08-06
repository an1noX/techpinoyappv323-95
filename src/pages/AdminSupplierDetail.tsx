import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { CustomLoading } from "@/components/ui/CustomLoading";

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

const AdminSupplierDetail: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
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

  // Tab configuration similar to AdminBottomNav
  const supplierTabs = [
    { id: 'products-price' as const, label: 'Products Price', icon: DollarSign },
    { id: 'all-products' as const, label: 'All Products', icon: Package },
  ];

  if (error || (supplier === null && !supplierLoading)) {
    toast.error('Supplier not found or error loading supplier details');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Supplier not found or error loading supplier details</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (supplierLoading) {
    return (
      <CustomLoading message="Loading" />
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'products-price') {
      return (
        <div className="h-full">
          {productsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {supplierProducts && supplierProducts.length > 0 ? (
                supplierProducts.map((item: ProductSupplier) => (
                  <div 
                    key={item.id} 
                    className="bg-gray-50 rounded-lg p-3 border hover-scale cursor-pointer"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product?.name}</h3>
                        <p className="text-sm text-gray-600">{item.product?.sku}</p>
                        <p className="text-sm text-gray-500">{item.product?.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          ₱{item.current_price?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">Current Price</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No products with pricing available for this supplier.</p>
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
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading all products...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {allProducts && allProducts.length > 0 ? (
                allProducts.map((product: any) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-3 border hover-scale">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.sku}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs hover-scale"
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
                <div className="text-center py-8">
                  <p className="text-gray-500">No products available.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {isMobile ? (
        // Mobile Layout (original design)
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white hover:bg-blue-700 p-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{supplier?.name || 'Supplier Name'}</h1>
                <p className="text-blue-100 text-sm">Supplier Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-2"
                onClick={() => setShowInfoModal(true)}
                title="View supplier information"
              >
                <FileText className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-2"
                onClick={() => setShowEditModal(true)}
                title="Edit supplier details"
              >
                {/* Removed Settings icon */}
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 pb-24 overflow-y-auto">
            <div className="animate-fade-in">
              {renderTabContent()}
            </div>
          </div>

          {/* Bottom Navigation - Fixed (Similar to AdminBottomNav) */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-2xl">
              <div className="grid grid-cols-2 px-2 py-2">
                {supplierTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      className={`h-16 rounded-2xl mx-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
                      <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                        {tab.label}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout - Modern design
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar Navigation */}
          <div className="w-80 bg-white/70 backdrop-blur-xl shadow-xl flex flex-col animate-slide-in-right">
            {/* Sidebar Header */}
            <div className="p-8 border-b border-gray-100">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-6 h-12 w-12 p-0 rounded-xl hover:bg-blue-50 hover:scale-110 transition-all duration-300 shadow-lg bg-white/80"
              >
                <ArrowLeft className="h-5 w-5 text-blue-600" />
              </Button>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {supplier?.name || 'Supplier Name'}
                  </h1>
                  <p className="text-gray-500 text-sm">Supplier Management</p>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-6">
              <div className="space-y-3">
                {supplierTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-14 rounded-2xl transition-all duration-300 group hover:scale-105 hover:shadow-lg",
                        isActive 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      )}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className={cn(
                        "h-6 w-6 mr-4 transition-all duration-300 group-hover:scale-110",
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-green-600'
                      )} />
                      <span className={cn(
                        "font-medium transition-all duration-300",
                        isActive ? 'font-semibold text-white' : 'group-hover:font-medium'
                      )}>
                        {tab.label}
                      </span>
                      
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-6 border-t border-gray-100">
              <Button
                onClick={() => setShowInfoModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl h-12 mb-3"
              >
                <FileText className="h-5 w-5 mr-2" />
                View Info
              </Button>
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                className="w-full border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl h-12 transition-all duration-300"
              >
                {/* Removed Settings icon */}
                Edit Supplier
              </Button>
            </div>
          </div>

          {/* Desktop Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Desktop Header */}
            <div className="bg-white/80 backdrop-blur-xl shadow-lg mx-6 mt-6 rounded-2xl px-8 py-6 animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {activeTab === 'products-price' && 'Product Pricing'}
                    {activeTab === 'all-products' && 'All Products'}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {activeTab === 'products-price' && 'Manage product pricing and relationships'}
                    {activeTab === 'all-products' && 'Browse all available products'}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Content Area */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto">
              <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-lg h-full overflow-y-auto animate-scale-in">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default AdminSupplierDetail;