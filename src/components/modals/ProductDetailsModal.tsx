
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/sales";
import { ProductInfoTab } from "./ProductDetailsModal/ProductInfoTab";
import { ClientsTab } from "./ProductDetailsModal/ClientsTab";
import { SuppliersTab } from "./ProductDetailsModal/SuppliersTab";
import { supabase } from '@/integrations/supabase/client';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductDetailsModal = ({ isOpen, onClose, product }: ProductDetailsModalProps) => {
  const [data, setData] = useState<any | null>(null); // Changed type to any as offlineProductService is removed
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const fetchProductDetails = async (productId: string) => {
    setLoading(true);
    try {
      // Replaced offlineProductService.getProductDetails(productId) with direct Supabase queries
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, printers:printers(id, name), clients:clients(id, name), suppliers:suppliers(id, name)')
        .eq('id', productId)
        .single();

      if (productError) {
        throw productError;
      }

      if (productData) {
        setData(productData);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product?.id && isOpen) {
      fetchProductDetails(product.id);
    }
  }, [product?.id, isOpen]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">{product.name}</span>
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info" className="text-xs">Product</TabsTrigger>
              <TabsTrigger value="clients" className="text-xs">Clients</TabsTrigger>
              <TabsTrigger value="suppliers" className="text-xs">Suppliers</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <CustomLoading message="Loading details" />
                </div>
              ) : data ? (
                <>
                  <TabsContent value="info" className="mt-0">
                    <ProductInfoTab data={data} />
                  </TabsContent>
                  <TabsContent value="clients" className="mt-0">
                    <ClientsTab clients={data.clients} />
                  </TabsContent>
                  <TabsContent value="suppliers" className="mt-0">
                    <SuppliersTab suppliers={data.suppliers} />
                  </TabsContent>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
