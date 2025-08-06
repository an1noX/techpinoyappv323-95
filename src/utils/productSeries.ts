
export interface ProductSeries {
  seriesName: string;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    variation: string;
    product: any; // Full product object
  }>;
}

export const detectProductSeries = (products: any[]): ProductSeries[] => {
  const seriesMap = new Map<string, any[]>();
  
  products.forEach(product => {
    const seriesName = extractSeriesName(product.name, product.sku);
    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, []);
    }
    seriesMap.get(seriesName)!.push({
      id: product.id,
      name: product.name,
      sku: product.sku,
      variation: extractVariation(product.name, product.sku),
      product // Keep the full product object
    });
  });

  // Only return series with more than one product
  return Array.from(seriesMap.entries())
    .filter(([_, products]) => products.length > 1)
    .map(([seriesName, products]) => ({
      seriesName,
      products: products.sort((a, b) => a.variation.localeCompare(b.variation))
    }));
};

export const extractSeriesName = (name: string, sku: string): string => {
  // Try to extract series from SKU first (more reliable)
  const skuMatch = sku.match(/^([A-Z]+\d+)[A-Z]*$/);
  if (skuMatch) {
    return skuMatch[1];
  }
  
  // Fallback to name-based extraction
  const nameMatch = name.match(/^(.+?)\s+(?:CF\d+[A-Z]|[A-Z]+\d+[A-Z])/);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  // If no pattern matches, use the full name/sku
  return name;
};

export const extractVariation = (name: string, sku: string): string => {
  // Extract variation from SKU (letters after the base)
  const skuMatch = sku.match(/[A-Z]+\d+([A-Z]+)$/);
  if (skuMatch) {
    return skuMatch[1];
  }
  
  // Extract from name if pattern exists
  const nameMatch = name.match(/(CF\d+[A-Z]|[A-Z]+\d+[A-Z])$/);
  if (nameMatch) {
    return nameMatch[1];
  }
  
  return '';
};

export const isProductInSeries = (product: any, products: any[]): boolean => {
  const seriesName = extractSeriesName(product.name, product.sku);
  return products.some(p => 
    p.id !== product.id && 
    extractSeriesName(p.name, p.sku) === seriesName
  );
};

export const getRelatedProducts = (product: any, products: any[]): any[] => {
  const seriesName = extractSeriesName(product.name, product.sku);
  return products.filter(p => 
    p.id !== product.id && 
    extractSeriesName(p.name, p.sku) === seriesName
  );
};
