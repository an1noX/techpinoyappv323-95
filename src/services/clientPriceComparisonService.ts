
import { supabase } from '@/integrations/supabase/client';
import { Product, Client, ProductClient } from '@/types/database';

export interface ClientPriceComparisonData {
  products: Product[];
  clients: Client[];
  priceMatrix: Record<string, Record<string, { price: number } | null>>;
  productClientMap: Record<string, ProductClient>;
}

export interface ClientFiltersType {
  searchTerm?: string;
  categoryFilter?: string;
  clientFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  showEmptyOnly?: boolean;
  showDuplicatesOnly?: boolean;
  pageSize?: number;
  currentPage?: number;
}

export const clientPriceComparisonService = {
  async getClientPriceComparisonData(): Promise<ClientPriceComparisonData> {
    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    // Fetch all product-client relationships with quoted prices
    const { data: productClients, error: pcError } = await supabase
      .from('product_clients')
      .select('*');
    
    if (pcError) {
      console.error('Error fetching product clients:', pcError);
      throw pcError;
    }

    // Build price matrix
    const priceMatrix: Record<string, Record<string, { price: number } | null>> = {};
    const productClientMap: Record<string, ProductClient> = {};

    // Initialize matrix with null values
    products?.forEach(product => {
      priceMatrix[product.id] = {};
      clients?.forEach(client => {
        priceMatrix[product.id][client.id] = null;
      });
    });

    // Fill in actual prices
    productClients?.forEach(pc => {
      if (priceMatrix[pc.product_id]) {
        priceMatrix[pc.product_id][pc.client_id] = {
          price: pc.quoted_price
        };
        productClientMap[`${pc.product_id}-${pc.client_id}`] = pc;
      }
    });

    return {
      products: products || [],
      clients: clients || [],
      priceMatrix,
      productClientMap
    };
  },

  filterData(
    data: ClientPriceComparisonData, 
    filters: ClientFiltersType
  ): ClientPriceComparisonData {
    // Apply search filter
    let filteredProducts = [...data.products];
    let filteredClients = [...data.clients];

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

    if (filters.clientFilter) {
      filteredClients = filteredClients.filter(client =>
        client.id === filters.clientFilter
      );
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => {
        const prices = filteredClients
          .map(client => data.priceMatrix[product.id]?.[client.id]?.price)
          .filter(price => price !== null && price !== undefined) as number[];
        
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
        return filteredClients.some(client => 
          data.priceMatrix[product.id]?.[client.id] === null
        );
      });
    }

    if (filters.showDuplicatesOnly) {
      const duplicateProducts = this.findDuplicateProducts(data.products);
      filteredProducts = filteredProducts.filter(product => 
        duplicateProducts.some(dup => dup.id === product.id)
      );
    }

    const filteredPriceMatrix: Record<string, Record<string, { price: number } | null>> = {};
    filteredProducts.forEach(product => {
      filteredPriceMatrix[product.id] = {};
      filteredClients.forEach(client => {
        filteredPriceMatrix[product.id][client.id] = data.priceMatrix[product.id]?.[client.id] || null;
      });
    });

    return {
      products: filteredProducts,
      clients: filteredClients,
      priceMatrix: filteredPriceMatrix,
      productClientMap: data.productClientMap
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
        mixedPatterns.forEach(pattern => {
          if (pattern.length >= 4) {
            if (!patternMap.has(pattern)) {
              patternMap.set(pattern, []);
            }
            patternMap.get(pattern)!.push(product);
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

  exportToCSV(data: ClientPriceComparisonData): string {
    const headers = ['Product Name', 'SKU', 'Category'];
    data.clients.forEach(client => {
      headers.push(`${client.name} - Price`);
    });
    
    const rows = [headers];

    data.products.forEach(product => {
      const row = [product.name, product.sku, product.category];
      data.clients.forEach(client => {
        const clientData = data.priceMatrix[product.id]?.[client.id];
        row.push(clientData ? clientData.price.toString() : '');
      });
      rows.push(row);
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  },

  calculateStatistics(data: ClientPriceComparisonData) {
    let totalPrices = 0;
    let priceCount = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let emptyCells = 0;
    let totalCells = 0;

    data.products.forEach(product => {
      data.clients.forEach(client => {
        totalCells++;
        const clientData = data.priceMatrix[product.id]?.[client.id];
        
        if (clientData === null) {
          emptyCells++;
        } else {
          totalPrices += clientData.price;
          priceCount++;
          minPrice = Math.min(minPrice, clientData.price);
          maxPrice = Math.max(maxPrice, clientData.price);
        }
      });
    });

    return {
      totalProducts: data.products.length,
      totalClients: data.clients.length,
      totalQuoteEntries: priceCount,
      emptyCells,
      totalCells,
      coveragePercentage: totalCells > 0 ? ((priceCount / totalCells) * 100) : 0,
      averagePrice: priceCount > 0 ? (totalPrices / priceCount) : 0,
      minPrice: priceCount > 0 ? minPrice : 0,
      maxPrice: priceCount > 0 ? maxPrice : 0
    };
  }
};
