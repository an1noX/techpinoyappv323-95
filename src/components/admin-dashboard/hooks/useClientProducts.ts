
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeSku } from '../utils/productGrouping';

export interface ClientProduct {
  id: string;
  product_id: string;
  name: string;
  category: string;
  sku: string;
  color?: string;
  quoted_price?: number;
  margin_percentage?: number;
  priceType: 'custom' | 'default';
  status: 'active' | 'discontinued';
  supportedPrinters: Array<{
    id: string;
    name: string;
    model?: string;
    manufacturer?: string;
    series?: string;
  }>;
  departmentsSupplied: Array<{
    clientName: string;
    departmentName: string;
  }>;
}

export const useClientProducts = (clientId: string) => {
  return useQuery({
    queryKey: ['client-products-enhanced', clientId],
    queryFn: async () => {
      // First, get all client-specific pricing for this client
      const { data: clientPricing, error: pricingError } = await supabase
        .from('product_clients')
        .select(`
          id,
          product_id,
          quoted_price,
          margin_percentage,
          product:products(
            id,
            name,
            category,
            sku,
            color
          )
        `)
        .eq('client_id', clientId);

      if (pricingError) {
        throw pricingError;
      }

      // Get printer assignments to determine which printers support these products
      const { data: assignments, error: assignmentError } = await supabase
        .from('printer_assignments')
        .select(`
          printer_id,
          status,
          department_location_id,
          printer:printers(
            id,
            name,
            model,
            manufacturer,
            series,
            product_printers(
              product:products(id)
            )
          ),
          departments_location:department_location_id(
            id,
            name,
            department:departments(
              id,
              name,
              client:clients(
                id,
                name
              )
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active');

      if (assignmentError) {
        throw assignmentError;
      }

      // Create a map of product_id to supported printers
      const productPrintersMap = new Map<string, Set<any>>();
      const productDepartmentsMap = new Map<string, Set<any>>();

      assignments?.forEach(assignment => {
        const printer = assignment.printer;
        const departmentLocation = assignment.departments_location;
        
        if (!printer || !departmentLocation) return;
        
        const printerInfo = {
          id: printer.id,
          name: printer.name,
          model: printer.model,
          manufacturer: printer.manufacturer,
          series: printer.series
        };

        const departmentInfo = {
          clientName: departmentLocation.department?.client?.name || 'Unknown Client',
          departmentName: departmentLocation.department?.name || 'Unknown Department'
        };

        // Add this printer to all products it supports
        printer.product_printers?.forEach((pp: any) => {
          if (pp.product?.id) {
            if (!productPrintersMap.has(pp.product.id)) {
              productPrintersMap.set(pp.product.id, new Set());
            }
            if (!productDepartmentsMap.has(pp.product.id)) {
              productDepartmentsMap.set(pp.product.id, new Set());
            }
            
            productPrintersMap.get(pp.product.id)!.add(JSON.stringify(printerInfo));
            productDepartmentsMap.get(pp.product.id)!.add(JSON.stringify(departmentInfo));
          }
        });
      });

      // Process client pricing data into the final result
      const result: ClientProduct[] = [];

      clientPricing?.forEach(pricing => {
        if (!pricing.product) return;

        const product = pricing.product;
        const supportedPrinters = Array.from(productPrintersMap.get(product.id) || [])
          .map(printerStr => JSON.parse(printerStr));
        
        const departmentsSupplied = Array.from(productDepartmentsMap.get(product.id) || [])
          .map(deptStr => JSON.parse(deptStr));

        result.push({
          id: pricing.id,
          product_id: product.id,
          name: product.name,
          category: product.category,
          sku: product.sku,
          color: product.color,
          quoted_price: pricing.quoted_price,
          margin_percentage: pricing.margin_percentage,
          priceType: 'custom',
          status: 'active',
          supportedPrinters: supportedPrinters,
          departmentsSupplied: departmentsSupplied
        });
      });

      return result;
    },
  });
};
