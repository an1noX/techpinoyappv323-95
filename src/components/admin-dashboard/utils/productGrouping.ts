import { ClientProduct } from '../hooks/useClientProducts';

export interface ProductGroup {
  name: string;
  category: string;
  baseSku: string;
  colors: string[];
  priceType: 'custom' | 'default';
  status: 'active' | 'discontinued';
  supportedPrinters: Array<{
    id: string;
    name: string;
    model?: string;
    manufacturer?: string;
  }>;
  departmentsSupplied: Array<{
    clientName?: string;
    departmentName: string;
    locationName: string;
  }>;
  customPricing?: {
    quoted_price?: number;
    margin_percentage?: number;
  };
  allProducts: ClientProduct[];
  skus: string[];
  productSkus: Array<{
    sku: string;
    color?: string;
  }>;
}

// Helper function to normalize SKU for grouping (remove color suffixes and extract base)
export const normalizeSku = (sku: string): string => {
  // Handle HP CE series (CE320A, CE321A, etc.) - extract base like 128A
  const ceMatch = sku.match(/^CE(\d+)[A-Z]$/i);
  if (ceMatch) {
    // Map CE series to their base SKU equivalents
    const ceToBase: { [key: string]: string } = {
      '320': '128A', // CE320A -> 128A (Black)
      '321': '128A', // CE321A -> 128A (Cyan) 
      '322': '128A', // CE322A -> 128A (Yellow)
      '323': '128A', // CE323A -> 128A (Magenta)
    };
    return ceToBase[ceMatch[1]] || `${ceMatch[1]}A`;
  }
  
  // Handle other common patterns
  const patterns = [
    // Remove color suffixes like BK, C, M, Y
    /[_-](BK|BLACK|K)$/i,
    /[_-](C|CYAN)$/i,
    /[_-](M|MAGENTA)$/i,
    /[_-](Y|YELLOW)$/i,
    /[_-](R|RED)$/i,
    /[_-](B|BLUE)$/i,
    /[_-](G|GREEN)$/i,
    // Remove trailing letters that might indicate color variants
    /[A-Z]$/,
  ];
  
  let normalizedSku = sku;
  patterns.forEach(pattern => {
    const temp = normalizedSku.replace(pattern, '');
    if (temp.length > 0) {
      normalizedSku = temp;
    }
  });
  
  return normalizedSku;
};

export const groupProductsBySku = (products: ClientProduct[]): Record<string, ProductGroup> => {
  const skuGroupsMap: Record<string, ProductGroup> = {};

  products.forEach(product => {
    const normalizedSku = normalizeSku(product.sku);
    const key = normalizedSku; // Group by normalized SKU only
    
    if (!skuGroupsMap[key]) {
      skuGroupsMap[key] = {
        name: product.name,
        category: product.category,
        baseSku: normalizedSku,
        colors: [],
        priceType: product.priceType,
        status: product.status,
        supportedPrinters: [...product.supportedPrinters],
        departmentsSupplied: product.departmentsSupplied?.map((dept: any) => ({
          clientName: dept.clientName,
          departmentName: dept.departmentName || dept.clientName || '',
          locationName: dept.locationName || dept.departmentName || dept.clientName || ''
        })) || [],
        customPricing: product.quoted_price ? {
          quoted_price: product.quoted_price,
          margin_percentage: product.margin_percentage
        } : undefined,
        allProducts: [],
        skus: [],
        productSkus: []
      };
    }
    
    // Add color if not already included
    if (product.color && !skuGroupsMap[key].colors.includes(product.color)) {
      skuGroupsMap[key].colors.push(product.color);
    }
    
    // Add SKU if not already included
    if (!skuGroupsMap[key].skus.includes(product.sku)) {
      skuGroupsMap[key].skus.push(product.sku);
      skuGroupsMap[key].productSkus.push({
        sku: product.sku,
        color: product.color
      });
    }
    
    // Merge printers (avoid duplicates)
    product.supportedPrinters.forEach(printer => {
      if (!skuGroupsMap[key].supportedPrinters.some(p => p.id === printer.id)) {
        skuGroupsMap[key].supportedPrinters.push(printer);
      }
    });
    
    // Merge departments (avoid duplicates)
    product.departmentsSupplied.forEach((dept: any) => {
      const deptWithLocation = {
        clientName: dept.clientName,
        departmentName: dept.departmentName || dept.clientName || '',
        locationName: dept.locationName || dept.departmentName || dept.clientName || ''
      };
      const existingDept = skuGroupsMap[key].departmentsSupplied.find(d =>
        d.departmentName === deptWithLocation.departmentName && d.locationName === deptWithLocation.locationName && d.clientName === deptWithLocation.clientName
      );
      if (!existingDept) {
        skuGroupsMap[key].departmentsSupplied.push(deptWithLocation);
      }
    });
    
    skuGroupsMap[key].allProducts.push(product);
  });

  return skuGroupsMap;
};

export const filterProducts = (
  products: ClientProduct[],
  searchQuery: string,
  statusFilter: string,
  priceTypeFilter: string
): ClientProduct[] => {
  return products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesPriceType = priceTypeFilter === 'all' || product.priceType === priceTypeFilter;
    
    return matchesSearch && matchesStatus && matchesPriceType;
  });
};
