import { productService } from './productService';
import { Product } from '@/types/database';

interface SimilarSku {
  id: string;
  sku: string;
  name: string;
  price: number;
  color?: string;
}

export class SimilarSkuService {
  async getSimilarSkus(currentProduct: Product): Promise<SimilarSku[]> {
    if (!currentProduct.sku) return [];
    
    try {
      // Extract base SKU as the first word (before any space)
      const baseSku = currentProduct.sku.split(' ')[0];
      const allProducts = await productService.getProducts();
      
      // Find products with the same base SKU
      const similarSkuProducts = allProducts.filter(p => {
        if (p.id === currentProduct.id || !p.sku) return false;
        const otherBaseSku = p.sku.split(' ')[0];
        return otherBaseSku === baseSku;
      });
      
      // Get pricing data for similar products
      const similarSkusWithPricing = await Promise.all(
        similarSkuProducts.map(async (product) => {
          try {
            const productWithSuppliers = await productService.getProductWithSuppliers(product.id);
            
            // Find the lowest valid price from suppliers
            const validSuppliers = productWithSuppliers?.suppliers?.filter(s => 
              s.current_price != null && 
              s.current_price > 0 && 
              s.supplier && 
              !s.supplier.name.toLowerCase().includes('zk')
            ) || [];
            
            const lowestPrice = validSuppliers.length > 0 
              ? Math.min(...validSuppliers.map(s => s.current_price))
              : 0;
            
            return {
              id: product.id,
              sku: product.sku,
              name: product.name,
              price: lowestPrice,
              color: product.color
            };
          } catch (error) {
            console.error(`Failed to get pricing for product ${product.id}:`, error);
            return {
              id: product.id,
              sku: product.sku,
              name: product.name,
              price: 0,
              color: product.color
            };
          }
        })
      );
      
      // Filter out products without valid pricing and sort by price
      return similarSkusWithPricing
        .filter(sku => sku.price > 0)
        .sort((a, b) => a.price - b.price);
      
    } catch (error) {
      console.error('Failed to get similar SKUs:', error);
      return [];
    }
  }
}

export const similarSkuService = new SimilarSkuService();
