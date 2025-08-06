
import { supabase } from '@/integrations/supabase/client';
import { Product, Supplier, ProductSupplier } from '@/types/database';

export interface PriceComparisonData {
  products: Product[];
  suppliers: Supplier[];
  priceMatrix: Record<string, Record<string, number | null>>;
  productSupplierMap: Record<string, ProductSupplier>;
}

export interface PriceComparisonFilters {
  searchTerm?: string;
  categoryFilter?: string;
  supplierFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  showEmptyOnly?: boolean;
  showDuplicatesOnly?: boolean;
  pageSize?: number;
  currentPage?: number;
}

export const priceComparisonService = {
  async getPriceComparisonData(): Promise<PriceComparisonData> {
    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Fetch all suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      throw suppliersError;
    }

    // Fetch all product-supplier relationships with prices
    const { data: productSuppliers, error: psError } = await supabase
      .from('product_suppliers')
      .select('*');
    
    if (psError) {
      console.error('Error fetching product suppliers:', psError);
      throw psError;
    }

    // Build price matrix
    const priceMatrix: Record<string, Record<string, number | null>> = {};
    const productSupplierMap: Record<string, ProductSupplier> = {};

    // Initialize matrix with null values
    products?.forEach(product => {
      priceMatrix[product.id] = {};
      suppliers?.forEach(supplier => {
        priceMatrix[product.id][supplier.id] = null;
      });
    });

    // Fill in actual prices
    productSuppliers?.forEach(ps => {
      if (priceMatrix[ps.product_id]) {
        priceMatrix[ps.product_id][ps.supplier_id] = ps.current_price;
        productSupplierMap[`${ps.product_id}-${ps.supplier_id}`] = ps;
      }
    });

    return {
      products: products || [],
      suppliers: suppliers || [],
      priceMatrix,
      productSupplierMap
    };
  },

  filterData(
    data: PriceComparisonData, 
    filters: PriceComparisonFilters
  ): PriceComparisonData {
    // Apply search filter
    let filteredProducts = [...data.products];
    let filteredSuppliers = [...data.suppliers];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    if (filters.categoryFilter) {
      filteredProducts = filteredProducts.filter(product =>
        product.category === filters.categoryFilter
      );
    }

    if (filters.supplierFilter) {
      filteredSuppliers = filteredSuppliers.filter(supplier =>
        supplier.id === filters.supplierFilter
      );
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => {
        const prices = filteredSuppliers
          .map(supplier => data.priceMatrix[product.id]?.[supplier.id])
          .filter(price => price !== null) as number[];
        
        if (prices.length === 0) return !filters.showEmptyOnly;
        
        const minProductPrice = Math.min(...prices);
        const maxProductPrice = Math.max(...prices);
        
        const meetsMin = filters.minPrice === undefined || maxProductPrice >= filters.minPrice;
        const meetsMax = filters.maxPrice === undefined || minProductPrice <= filters.maxPrice;
        
        return meetsMin && meetsMax;
      });
    }

    if (filters.showEmptyOnly) {
      filteredProducts = filteredProducts.filter(product => {
        return filteredSuppliers.some(supplier => 
          data.priceMatrix[product.id]?.[supplier.id] === null
        );
      });
    }

    if (filters.showDuplicatesOnly) {
      const duplicateProducts = this.findDuplicateProducts(data.products);
      filteredProducts = filteredProducts.filter(product => 
        duplicateProducts.some(dup => dup.id === product.id)
      );
    }

    const filteredPriceMatrix: Record<string, Record<string, number | null>> = {};
    filteredProducts.forEach(product => {
      filteredPriceMatrix[product.id] = {};
      filteredSuppliers.forEach(supplier => {
        filteredPriceMatrix[product.id][supplier.id] = data.priceMatrix[product.id]?.[supplier.id] || null;
      });
    });

    return {
      products: filteredProducts,
      suppliers: filteredSuppliers,
      priceMatrix: filteredPriceMatrix,
      productSupplierMap: data.productSupplierMap
    };
  },

  findDuplicateProducts(products: Product[]): Product[] {
    const duplicates: Product[] = [];
    const patternMap = new Map<string, Product[]>();

    // Enhanced duplicate detection for 4+ character sequences
    products.forEach(product => {
      const combinedText = `${product.name} ${product.sku}`.toLowerCase();
      
      // Extract all 4+ character alphanumeric sequences
      const patterns = combinedText.match(/\b[a-z0-9]{4,}\b/g);
      if (patterns) {
        patterns.forEach(pattern => {
          if (pattern.length >= 4 && /[a-z0-9]/.test(pattern)) {
            if (!patternMap.has(pattern)) {
              patternMap.set(pattern, []);
            }
            patternMap.get(pattern)!.push(product);
          }
        });
      }

      // Extract 4+ character sequences that mix letters and numbers
      const mixedPatterns = combinedText.match(/\b[a-z]*\d[a-z0-9]*\b|\b\d*[a-z][a-z0-9]*\b/g);
      if (mixedPatterns) {
        mixedPatterns.forEach(mixedPattern => {
          if (mixedPattern.length >= 4) {
            if (!patternMap.has(mixedPattern)) {
              patternMap.set(mixedPattern, []);
            }
            patternMap.get(mixedPattern)!.push(product);
          }
        });
      }

      // Extract pure number sequences (4+ digits)
      const numbers = combinedText.match(/\d{4,}/g);
      if (numbers) {
        numbers.forEach(number => {
          if (!patternMap.has(number)) {
            patternMap.set(number, []);
          }
          patternMap.get(number)!.push(product);
        });
      }

      // Extract model numbers and codes (common patterns)
      const modelPatterns = combinedText.match(/\b[a-z]{2,}\d{2,}\b|\b\d{2,}[a-z]{2,}\b/g);
      if (modelPatterns) {
        modelPatterns.forEach(model => {
          if (model.length >= 4) {
            if (!patternMap.has(model)) {
              patternMap.set(model, []);
            }
            patternMap.get(model)!.push(product);
          }
        });
      }
    });

    // Find products that share patterns
    patternMap.forEach(productGroup => {
      if (productGroup.length > 1) {
        productGroup.forEach(product => {
          if (!duplicates.some(dup => dup.id === product.id)) {
            duplicates.push(product);
          }
        });
      }
    });

    // Also check for exact name/SKU duplicates
    const nameMap = new Map<string, Product[]>();
    const skuMap = new Map<string, Product[]>();

    products.forEach(product => {
      const normalizedName = product.name.toLowerCase().trim();
      const normalizedSku = product.sku.toLowerCase().trim();

      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(product);

      if (!skuMap.has(normalizedSku)) {
        skuMap.set(normalizedSku, []);
      }
      skuMap.get(normalizedSku)!.push(product);
    });

    nameMap.forEach(productGroup => {
      if (productGroup.length > 1) {
        productGroup.forEach(product => {
          if (!duplicates.some(dup => dup.id === product.id)) {
            duplicates.push(product);
          }
        });
      }
    });

    skuMap.forEach(productGroup => {
      if (productGroup.length > 1) {
        productGroup.forEach(product => {
          if (!duplicates.some(dup => dup.id === product.id)) {
            duplicates.push(product);
          }
        });
      }
    });

    return duplicates;
  },

  exportToCSV(data: PriceComparisonData): string {
    const headers = ['Product Name', 'SKU', 'Category'];
    data.suppliers.forEach(supplier => {
      headers.push(`${supplier.name} - Price`);
    });
    
    const rows = [headers];

    data.products.forEach(product => {
      const row = [product.name, product.sku, product.category];
      data.suppliers.forEach(supplier => {
        const price = data.priceMatrix[product.id]?.[supplier.id];
        row.push(price !== null ? price.toString() : '');
      });
      rows.push(row);
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  },

  calculateStatistics(data: PriceComparisonData) {
    let totalPrices = 0;
    let priceCount = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let emptyCells = 0;
    let totalCells = 0;

    data.products.forEach(product => {
      data.suppliers.forEach(supplier => {
        totalCells++;
        const price = data.priceMatrix[product.id]?.[supplier.id];
        
        if (price === null) {
          emptyCells++;
        } else {
          totalPrices += price;
          priceCount++;
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        }
      });
    });

    return {
      totalProducts: data.products.length,
      totalSuppliers: data.suppliers.length,
      totalPriceEntries: priceCount,
      emptyCells,
      totalCells,
      coveragePercentage: totalCells > 0 ? ((priceCount / totalCells) * 100) : 0,
      averagePrice: priceCount > 0 ? (totalPrices / priceCount) : 0,
      minPrice: priceCount > 0 ? minPrice : 0,
      maxPrice: priceCount > 0 ? maxPrice : 0
    };
  }
};
