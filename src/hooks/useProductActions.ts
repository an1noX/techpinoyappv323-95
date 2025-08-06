
import { useState } from 'react';
import { Product } from '@/types/database';
import { productService } from '@/services/productService';
import { printerService } from '@/services/printerService';
import { useToast } from '@/hooks/use-toast';

export const useProductActions = (
  product: Product,
  onProductUpdate?: () => void,
  onProductDeleted?: () => void,
  loadProductData?: () => Promise<void>
) => {
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const handleEditProduct = async (productData: Partial<Product> & { printers?: string }) => {
    try {
      // Extract printers data
      const { printers, ...productUpdateData } = productData;
      
      // Update product basic information
      await productService.updateProduct(product.id, productUpdateData);
      
      // Handle printer updates if printers data is provided
      if (printers !== undefined) {
        const printerNames = printers.trim() 
          ? printers.split(',').map(name => name.trim()).filter(name => name.length > 0)
          : [];
        
        await printerService.addPrintersToProduct(product.id, printerNames);
      }
      
      if (loadProductData) await loadProductData();
      setShowEditProduct(false);
      
      toast({
        title: "Success",
        description: "Product updated successfully!",
      });
      
      if (onProductUpdate) onProductUpdate();
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await productService.deleteProduct(product.id);
      setShowDeleteConfirm(false);
      
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      
      if (onProductDeleted) onProductDeleted();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    showEditProduct,
    setShowEditProduct,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleEditProduct,
    handleDeleteProduct,
  };
};
