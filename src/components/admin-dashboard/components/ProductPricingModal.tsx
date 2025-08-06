
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, History, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
}

interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  current_price: number;
  product: Product;
}

interface PriceHistory {
  id: string;
  price: number;
  note?: string;
  timestamp: string;
}

interface ProductPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSupplier: ProductSupplier | null;
  supplierId: string;
}

const ProductPricingModal: React.FC<ProductPricingModalProps> = ({
  isOpen,
  onClose,
  productSupplier,
  supplierId,
}) => {
  const [activeTab, setActiveTab] = useState('update-price');
  const [newPrice, setNewPrice] = useState(productSupplier?.current_price?.toString() || '');
  const [priceNote, setPriceNote] = useState('');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (productSupplier) {
      setNewPrice(productSupplier.current_price?.toString() || '');
      setPriceNote('');
    }
  }, [productSupplier]);

  // Fetch price history
  const { data: priceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['price-history', productSupplier?.id],
    queryFn: async () => {
      if (!productSupplier?.id) return [];
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_supplier_id', productSupplier.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data as PriceHistory[];
    },
    enabled: !!productSupplier?.id && isOpen,
  });

  // Fetch comparison prices from other suppliers
  const { data: comparisonPrices, isLoading: comparisonLoading } = useQuery({
    queryKey: ['comparison-prices', productSupplier?.product_id],
    queryFn: async () => {
      if (!productSupplier?.product_id) return [];
      
      const { data, error } = await supabase
        .from('product_suppliers')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('product_id', productSupplier.product_id)
        .neq('supplier_id', supplierId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!productSupplier?.product_id && isOpen,
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ price, note }: { price: number; note: string }) => {
      if (!productSupplier) throw new Error('No product supplier selected');

      const { error } = await supabase
        .from('product_suppliers')
        .update({ current_price: price })
        .eq('id', productSupplier.id);

      if (error) throw error;

      // Add to price history
      const { error: historyError } = await supabase
        .from('price_history')
        .insert({
          product_supplier_id: productSupplier.id,
          price: price,
          note: note || 'Price updated'
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      toast.success('Price updated successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['price-history', productSupplier?.id] });
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update price');
    },
  });

  const handleUpdatePrice = () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    updatePriceMutation.mutate({ price, note: priceNote });
  };

  if (!productSupplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Product Pricing - {productSupplier.product.name}
          </DialogTitle>
          <p className="text-sm text-gray-600">{productSupplier.product.sku}</p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="update-price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Update Price
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Comparison
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="update-price" className="mt-0">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700">Current Price</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ₱{productSupplier.current_price?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPrice" className="text-sm font-medium">New Price</Label>
                  <Input
                    id="newPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Enter new price"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceNote" className="text-sm font-medium">Note (Optional)</Label>
                  <Input
                    id="priceNote"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder="Reason for price change"
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={updatePriceMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePrice}
                    disabled={updatePriceMutation.isPending || !newPrice.trim()}
                    className="flex-1"
                  >
                    {updatePriceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Price'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="space-y-3">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading history...</span>
                  </div>
                ) : priceHistory && priceHistory.length > 0 ? (
                  priceHistory.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">₱{entry.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{entry.note || 'Price update'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No price history available.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              <div className="space-y-3">
                {comparisonLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading comparison...</span>
                  </div>
                ) : comparisonPrices && comparisonPrices.length > 0 ? (
                  comparisonPrices.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.supplier?.name}</p>
                          <p className="text-sm text-gray-600">Supplier</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₱{item.current_price?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-gray-500">Current Price</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No other suppliers found for this product.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPricingModal;
