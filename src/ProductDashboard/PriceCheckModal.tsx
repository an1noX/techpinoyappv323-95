
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, DollarSign, Plus, Edit, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { productService } from '@/services/productService';
import { toast } from 'sonner';
import ColorIndicator from '@/components/ColorIndicator';
import PriceManagementModal from './PriceManagementModal';
import AddSupplierClientModal from '../SupplierDashboard/AddSupplierClientModal';

interface PriceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductWithPricing {
  id: string;
  name: string;
  sku: string;
  category: string;
  color?: string;
  suppliers: Array<{
    id: string;
    supplier: {
      id: string;
      name: string;
    };
    current_price: number;
    updated_at: string;
  }>;
  clients: Array<{
    id: string;
    client: {
      id: string;
      name: string;
    };
    quoted_price: number;
    margin_percentage?: number;
  }>;
}

const PriceCheckModal: React.FC<PriceCheckModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [productsWithPricing, setProductsWithPricing] = useState<ProductWithPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceManagementModal, setPriceManagementModal] = useState<{
    isOpen: boolean;
    type: 'supplier' | 'client';
    entityName: string;
    currentPrice: number;
    productName: string;
    productId: string;
    relationId: string;
  } | null>(null);
  const [addPricingModal, setAddPricingModal] = useState<{
    isOpen: boolean;
    type: 'supplier' | 'client';
    productId: string;
    productName: string;
  } | null>(null);

  // Search products and load their pricing
  useEffect(() => {
    const searchAndLoadPricing = async () => {
      if (!searchQuery.trim()) {
        setProducts([]);
        setProductsWithPricing([]);
        return;
      }
      try {
        setLoading(true);
        const results = await productService.searchProducts(searchQuery);
        setProducts(results);

        // Load pricing for each product
        const productsWithPricingData = await Promise.all(results.map(async product => {
          try {
            const [withSuppliers, withClients] = await Promise.all([
              productService.getProductWithSuppliers(product.id), 
              productService.getProductWithClients(product.id)
            ]);
            return {
              ...product,
              suppliers: withSuppliers?.suppliers || [],
              clients: withClients?.clients || []
            };
          } catch (error) {
            console.error(`Error loading pricing for product ${product.id}:`, error);
            return {
              ...product,
              suppliers: [],
              clients: []
            };
          }
        }));
        setProductsWithPricing(productsWithPricingData as ProductWithPricing[]);
      } catch (error) {
        console.error('Error searching products:', error);
        toast.error('Failed to search products');
      } finally {
        setLoading(false);
      }
    };
    const debounceTimer = setTimeout(searchAndLoadPricing, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    setProducts([]);
    setProductsWithPricing([]);
    onClose();
  };

  const handleSupplierClick = (product: ProductWithPricing, supplierRelation: any) => {
    setPriceManagementModal({
      isOpen: true,
      type: 'supplier',
      entityName: supplierRelation.supplier.name,
      currentPrice: supplierRelation.current_price,
      productName: product.name,
      productId: product.id,
      relationId: supplierRelation.id
    });
  };

  const handleClientClick = (product: ProductWithPricing, clientRelation: any) => {
    setPriceManagementModal({
      isOpen: true,
      type: 'client',
      entityName: clientRelation.client.name,
      currentPrice: clientRelation.quoted_price,
      productName: product.name,
      productId: product.id,
      relationId: clientRelation.id
    });
  };

  const handleAddSupplierPrice = (product: ProductWithPricing) => {
    setAddPricingModal({
      isOpen: true,
      type: 'supplier',
      productId: product.id,
      productName: product.name
    });
  };

  const handleAddClientPrice = (product: ProductWithPricing) => {
    setAddPricingModal({
      isOpen: true,
      type: 'client',
      productId: product.id,
      productName: product.name
    });
  };

  const handlePriceUpdate = async (newPrice: number, note?: string) => {
    if (!priceManagementModal) return;

    try {
      if (priceManagementModal.type === 'supplier') {
        await productService.updateSupplierPrice(priceManagementModal.relationId, newPrice, note);
      } else {
        // For client pricing updates, we'd need to implement this in productService
        toast.info('Client price update functionality coming soon');
        return;
      }
      
      // Refresh the pricing data
      const searchAndLoadPricing = async () => {
        const results = await productService.searchProducts(searchQuery);
        const productsWithPricingData = await Promise.all(results.map(async product => {
          try {
            const [withSuppliers, withClients] = await Promise.all([
              productService.getProductWithSuppliers(product.id), 
              productService.getProductWithClients(product.id)
            ]);
            return {
              ...product,
              suppliers: withSuppliers?.suppliers || [],
              clients: withClients?.clients || []
            };
          } catch (error) {
            console.error(`Error loading pricing for product ${product.id}:`, error);
            return {
              ...product,
              suppliers: [],
              clients: []
            };
          }
        }));
        setProductsWithPricing(productsWithPricingData as ProductWithPricing[]);
      };
      
      await searchAndLoadPricing();
    } catch (error) {
      throw error;
    }
  };

  const handleAddPricingSuccess = async () => {
    // Refresh the pricing data
    const results = await productService.searchProducts(searchQuery);
    const productsWithPricingData = await Promise.all(results.map(async product => {
      try {
        const [withSuppliers, withClients] = await Promise.all([
          productService.getProductWithSuppliers(product.id), 
          productService.getProductWithClients(product.id)
        ]);
        return {
          ...product,
          suppliers: withSuppliers?.suppliers || [],
          clients: withClients?.clients || []
        };
      } catch (error) {
        console.error(`Error loading pricing for product ${product.id}:`, error);
        return {
          ...product,
          suppliers: [],
          clients: []
        };
      }
    }));
    setProductsWithPricing(productsWithPricingData as ProductWithPricing[]);
  };

  // Get price trend indicator (placeholder for now)
  const getPriceTrend = () => {
    const trends = ['up', 'down', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)];
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-full max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price Check
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Section */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search products by name, SKU, or category..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8 text-gray-500">
                Searching and loading pricing data...
              </div>
            )}

            {/* No Results */}
            {!loading && searchQuery && productsWithPricing.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products found
              </div>
            )}

            {/* Results */}
            {!loading && productsWithPricing.length > 0 && (
              <div className="space-y-3">
                {productsWithPricing.map(product => (
                  <Card key={product.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Product Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 leading-tight">
                                {product.name}
                              </h4>
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {product.sku}
                              </span>
                              {product.color && <ColorIndicator color={product.color} size="sm" />}
                            </div>
                          </div>
                        </div>

                        {/* Supplier Pricing */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="font-medium">Supplier pricing:</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddSupplierPrice(product)}
                              className="h-6 px-2 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          
                          {product.suppliers && product.suppliers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.suppliers.map(supplierRelation => {
                                const trend = getPriceTrend();
                                return (
                                  <div 
                                    key={supplierRelation.id}
                                    className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 transition-colors cursor-pointer"
                                    onClick={() => handleSupplierClick(product, supplierRelation)}
                                  >
                                    <span className="text-xs font-medium text-blue-800">
                                      {supplierRelation.supplier?.name}:
                                    </span>
                                    <span className="text-xs font-semibold text-blue-900">
                                      ₱{supplierRelation.current_price?.toLocaleString()}
                                    </span>
                                    <TrendIcon trend={trend} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">No supplier pricing available</div>
                          )}
                        </div>

                        {/* Client Pricing */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="font-medium">Client pricing:</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddClientPrice(product)}
                              className="h-6 px-2 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          
                          {product.clients && product.clients.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.clients.map(clientRelation => (
                                <div 
                                  key={clientRelation.id}
                                  className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-1 hover:bg-green-100 transition-colors cursor-pointer"
                                  onClick={() => handleClientClick(product, clientRelation)}
                                >
                                  <span className="text-xs font-medium text-green-800">
                                    {clientRelation.client?.name}:
                                  </span>
                                  <span className="text-xs font-semibold text-green-900">
                                    ₱{clientRelation.quoted_price?.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">No client pricing available</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Management Modal */}
      {priceManagementModal && (
        <PriceManagementModal
          isOpen={priceManagementModal.isOpen}
          onClose={() => setPriceManagementModal(null)}
          type={priceManagementModal.type}
          entityName={priceManagementModal.entityName}
          currentPrice={priceManagementModal.currentPrice}
          productName={priceManagementModal.productName}
          onPriceUpdate={handlePriceUpdate}
        />
      )}

      {/* Add Pricing Modal */}
      {addPricingModal && (
        <AddSupplierClientModal
          isOpen={addPricingModal.isOpen}
          onClose={() => setAddPricingModal(null)}
          type={addPricingModal.type}
          productId={addPricingModal.productId}
          productName={addPricingModal.productName}
          onSuccess={handleAddPricingSuccess}
        />
      )}
    </>
  );
};

export default PriceCheckModal;
