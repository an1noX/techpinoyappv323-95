import { ProductWithSuppliers } from '@/types/database';

export const getPriceAnalysis = (productWithSuppliers: ProductWithSuppliers | null) => {
  if (!productWithSuppliers || !productWithSuppliers.suppliers || productWithSuppliers.suppliers.length === 0) return null;

  // Filter out suppliers with zero or null prices AND exclude ZK suppliers from analysis
  const validSuppliers = productWithSuppliers.suppliers.filter(s => 
    s.current_price != null && 
    s.current_price > 0 && 
    s.supplier && 
    !s.supplier.name.toLowerCase().includes('zk')
  );

  if (validSuppliers.length === 0) return null;

  const prices = validSuppliers.map(s => s.current_price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  return {
    minPrice,
    maxPrice,
    avgPrice,
    difference: maxPrice - minPrice,
    suppliers: validSuppliers
      .filter(supplier => supplier && supplier.supplier)
      .map(supplier => {
        const priceStatus: 'lowest' | 'highest' | 'middle' = 
          supplier.current_price === minPrice ? 'lowest' : 
          supplier.current_price === maxPrice ? 'highest' : 'middle';
        
        return {
          ...supplier,
          priceStatus,
          percentageDiff: ((supplier.current_price - minPrice) / minPrice) * 100,
        };
      })
  };
};

export const transformSuppliersForDisplay = (suppliers: any[]) => {
  return suppliers
    .filter(supplier => supplier.current_price != null && supplier.current_price > 0)
    .map(supplier => ({
      id: supplier.id,
      name: supplier.supplier?.name || 'Unknown Supplier',
      price: supplier.current_price,
      lastUpdated: new Date(supplier.updated_at),
      contactEmail: supplier.supplier?.contact_email || undefined,
      phone: supplier.supplier?.phone || undefined,
      notes: supplier.supplier?.notes || undefined,
      priceHistory: supplier.priceHistory?.map((h: any) => ({
        price: h.price,
        timestamp: new Date(h.timestamp),
        note: h.note || undefined,
      })) || [],
      priceStatus: supplier.priceStatus,
      percentageDiff: supplier.percentageDiff,
    }));
};

/**
 * Calculates department, location, and printer counts from a departments array.
 * @param departments Array of department objects, each with a locations array, each location with printer_count.
 * @returns { departmentCount, locationCount, printerCount }
 */
export function getClientCounts(departments: Array<{ locations: Array<{ printer_count?: number }> }>) {
  const departmentCount = departments.length;
  const locationCount = departments.reduce((sum, dept) => sum + (dept.locations?.length || 0), 0);
  const printerCount = departments.reduce(
    (sum, dept) => sum + (dept.locations?.reduce((locSum, loc) => locSum + (loc.printer_count || 0), 0) || 0),
    0
  );
  return { departmentCount, locationCount, printerCount };
}
