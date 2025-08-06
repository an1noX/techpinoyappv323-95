
import { useState, useEffect } from 'react';
import { Product, ProductWithSuppliers } from '@/types/database';
import { productService } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

export const useProductData = (product: Product | null) => {
  const [productWithSuppliers, setProductWithSuppliers] = useState<ProductWithSuppliers | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProductData = async () => {
    if (!product) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await productService.getProductWithSuppliers(product.id);
      setProductWithSuppliers(data);
    } catch (error) {
      console.error('Failed to load product data:', error);
      toast({
        title: "Error",
        description: "Failed to load product data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product?.id) {
      loadProductData();
    } else {
      setLoading(false);
      setProductWithSuppliers(null);
    }
  }, [product?.id]);

  return {
    productWithSuppliers,
    loading,
    loadProductData,
  };
};
