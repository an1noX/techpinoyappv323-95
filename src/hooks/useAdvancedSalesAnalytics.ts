import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnpaidClient {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  unpaid_po_amount: number;
  unpaid_po_count: number;
  unpaid_delivery_amount: number;
  unpaid_delivery_count: number;
  total_unpaid: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
  client_count: number;
}

export interface ProductByClient {
  client_id: string;
  client_name: string;
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface ProductByMonth {
  month: string;
  year: number;
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export const useAdvancedSalesAnalytics = () => {
  // Fetch clients with unpaid purchase orders and advance deliveries
  const { data: unpaidClients = [], isLoading: loadingUnpaidClients } = useQuery({
    queryKey: ['unpaidClients'],
    queryFn: async (): Promise<UnpaidClient[]> => {
      // Get unpaid purchase orders by client
      const { data: unpaidPOs, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          supplier_client_id,
          payment_status,
          clients!inner(id, name, contact_person, phone),
          purchase_order_items(total_price)
        `)
        .neq('payment_status', 'paid')
        .not('supplier_client_id', 'is', null);

      if (poError) throw poError;

      // Get advance deliveries (deliveries without purchase_order_id but with client_id)
      // Note: Using type assertion as client_id exists in the database but not in generated types
      const { data: advanceDeliveries, error: deliveryError } = await (supabase as any)
        .from('deliveries')
        .select(`
          id,
          client_id,
          delivery_items(
            quantity_delivered,
            products(name, sku)
          )
        `)
        .is('purchase_order_id', null)
        .not('client_id', 'is', null);

      if (deliveryError) throw deliveryError;

      // Aggregate unpaid data by client
      const clientMap = new Map<string, UnpaidClient>();

      // Process unpaid purchase orders
      unpaidPOs.forEach(po => {
        const clientId = po.supplier_client_id!;
        const client = po.clients!;
        const poTotal = po.purchase_order_items?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: client.name,
            contact_person: client.contact_person,
            phone: client.phone,
            unpaid_po_amount: 0,
            unpaid_po_count: 0,
            unpaid_delivery_amount: 0,
            unpaid_delivery_count: 0,
            total_unpaid: 0
          });
        }

        const clientData = clientMap.get(clientId)!;
        clientData.unpaid_po_amount += poTotal;
        clientData.unpaid_po_count += 1;
      });

      // Get client info for advance deliveries
      const clientIds = [...new Set(advanceDeliveries?.map((d: any) => d.client_id).filter(Boolean) as string[])];
      const { data: clientsData } = clientIds.length > 0 ? await supabase
        .from('clients')
        .select('id, name, contact_person, phone')
        .in('id', clientIds) : { data: [] };

      const clientsMap = new Map((clientsData || []).map(c => [c.id, c]));

      // Process advance deliveries (assuming they need to be paid)
      advanceDeliveries?.forEach((delivery: any) => {
        const clientId = delivery.client_id;
        const client = clientsMap.get(clientId);
        if (!client) return;

        // For now, we'll estimate delivery value based on average item prices
        // You might want to add actual pricing logic here
        const estimatedValue = (delivery.delivery_items?.length || 0) * 1000; // Placeholder

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: client.name,
            contact_person: client.contact_person,
            phone: client.phone,
            unpaid_po_amount: 0,
            unpaid_po_count: 0,
            unpaid_delivery_amount: 0,
            unpaid_delivery_count: 0,
            total_unpaid: 0
          });
        }

        const clientData = clientMap.get(clientId)!;
        clientData.unpaid_delivery_amount += estimatedValue;
        clientData.unpaid_delivery_count += 1;
      });

      // Calculate totals and return as array
      return Array.from(clientMap.values())
        .map(client => ({
          ...client,
          total_unpaid: client.unpaid_po_amount + client.unpaid_delivery_amount
        }))
        .filter(client => client.total_unpaid > 0)
        .sort((a, b) => b.total_unpaid - a.total_unpaid);
    }
  });

  // Fetch top selling products overall
  const { data: topSellingProducts = [], isLoading: loadingTopProducts } = useQuery({
    queryKey: ['topSellingProducts'],
    queryFn: async (): Promise<TopSellingProduct[]> => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          product_id,
          quantity,
          total_price,
          purchase_orders!inner(supplier_client_id),
          products!inner(id, name, category)
        `)
        .not('product_id', 'is', null);

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, TopSellingProduct>();

      data.forEach(item => {
        const product = item.products!;
        const productId = product.id;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: product.name,
            category: product.category || 'Other',
            total_quantity: 0,
            total_revenue: 0,
            client_count: 0
          });
        }

        const productData = productMap.get(productId)!;
        productData.total_quantity += item.quantity || 0;
        productData.total_revenue += Number(item.total_price || 0);
      });

      // Calculate unique client count for each product
      const clientCounts = new Map<string, Set<string>>();
      data.forEach(item => {
        const productId = item.product_id!;
        const clientId = item.purchase_orders?.supplier_client_id;
        
        if (clientId) {
          if (!clientCounts.has(productId)) {
            clientCounts.set(productId, new Set());
          }
          clientCounts.get(productId)!.add(clientId);
        }
      });

      return Array.from(productMap.values())
        .map(product => ({
          ...product,
          client_count: clientCounts.get(product.id)?.size || 0
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
    }
  });

  // Fetch top selling products by client
  const { data: productsByClient = [], isLoading: loadingProductsByClient } = useQuery({
    queryKey: ['productsByClient'],
    queryFn: async (): Promise<ProductByClient[]> => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          product_id,
          quantity,
          total_price,
          purchase_orders!inner(
            supplier_client_id,
            clients!inner(id, name)
          ),
          products!inner(id, name)
        `)
        .not('product_id', 'is', null)
        .not('purchase_orders.supplier_client_id', 'is', null);

      if (error) throw error;

      // Aggregate by client and product
      const clientProductMap = new Map<string, ProductByClient>();

      data.forEach(item => {
        const clientId = item.purchase_orders?.supplier_client_id!;
        const clientName = item.purchase_orders?.clients?.name!;
        const productId = item.product_id!;
        const productName = item.products?.name!;
        const key = `${clientId}-${productId}`;

        if (!clientProductMap.has(key)) {
          clientProductMap.set(key, {
            client_id: clientId,
            client_name: clientName,
            product_id: productId,
            product_name: productName,
            total_quantity: 0,
            total_revenue: 0
          });
        }

        const data_item = clientProductMap.get(key)!;
        data_item.total_quantity += item.quantity || 0;
        data_item.total_revenue += Number(item.total_price || 0);
      });

      return Array.from(clientProductMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 20);
    }
  });

  // Fetch top selling products by month
  const { data: productsByMonth = [], isLoading: loadingProductsByMonth } = useQuery({
    queryKey: ['productsByMonth'],
    queryFn: async (): Promise<ProductByMonth[]> => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          product_id,
          quantity,
          total_price,
          purchase_orders!inner(created_at),
          products!inner(id, name)
        `)
        .not('product_id', 'is', null)
        .gte('purchase_orders.created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

      if (error) throw error;

      // Aggregate by month and product
      const monthProductMap = new Map<string, ProductByMonth>();

      data.forEach(item => {
        const date = new Date(item.purchase_orders?.created_at!);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const productId = item.product_id!;
        const productName = item.products?.name!;
        const key = `${year}-${month}-${productId}`;

        if (!monthProductMap.has(key)) {
          monthProductMap.set(key, {
            month,
            year,
            product_id: productId,
            product_name: productName,
            total_quantity: 0,
            total_revenue: 0
          });
        }

        const monthData = monthProductMap.get(key)!;
        monthData.total_quantity += item.quantity || 0;
        monthData.total_revenue += Number(item.total_price || 0);
      });

      return Array.from(monthProductMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 50);
    }
  });

  return {
    unpaidClients,
    topSellingProducts,
    productsByClient,
    productsByMonth,
    isLoading: loadingUnpaidClients || loadingTopProducts || loadingProductsByClient || loadingProductsByMonth
  };
};