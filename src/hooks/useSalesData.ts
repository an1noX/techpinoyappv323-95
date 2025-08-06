import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopClient {
  name: string;
  sales: number;
  percentage: number;
}

export interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

export interface UnpaidItem {
  type: 'Sales' | 'Purchase Orders' | 'Deliveries';
  amount: number;
  count: number;
}

export interface SalesData {
  month: string;
  sales: number;
}

export const useSalesData = () => {
  // Fetch total sales and top clients
  const { data: clientData = { topClients: [], totalSales: 0 }, isLoading: loadingClients } = useQuery({
    queryKey: ['topClients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          supplier_client_id,
          clients!inner(name),
          purchase_order_items(total_price)
        `)
        .not('supplier_client_id', 'is', null);

      if (error) throw error;

      // Calculate TOTAL sales from ALL purchase orders
      let grandTotal = 0;
      
      // Aggregate sales by client
      const clientSales = data.reduce((acc: Record<string, { name: string; sales: number }>, po) => {
        const clientId = po.supplier_client_id!;
        const clientName = po.clients?.name || 'Unknown Client';
        const totalSales = po.purchase_order_items?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0;
        
        grandTotal += totalSales; // Add to grand total

        if (!acc[clientId]) {
          acc[clientId] = { name: clientName, sales: 0 };
        }
        acc[clientId].sales += totalSales;
        return acc;
      }, {});

      // Convert to array and sort for top clients
      const clientArray = Object.values(clientSales).sort((a, b) => b.sales - a.sales);
      const maxSales = clientArray[0]?.sales || 1;

      const topClients = clientArray.slice(0, 4).map(client => ({
        name: client.name,
        sales: client.sales,
        percentage: Math.round((client.sales / maxSales) * 100)
      }));

      return {
        topClients,
        totalSales: grandTotal // Return the actual total sales
      };
    }
  });

  // Fetch top products by sales
  const { data: topProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['topProducts'],
    queryFn: async (): Promise<TopProduct[]> => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          product_id,
          quantity,
          total_price,
          products!inner(name)
        `)
        .not('product_id', 'is', null);

      if (error) throw error;

      // Aggregate by product
      const productSales = data.reduce((acc: Record<string, { name: string; units: number; revenue: number }>, item) => {
        const productId = item.product_id!;
        const productName = item.products?.name || 'Unknown Product';
        const units = item.quantity || 0;
        const revenue = Number(item.total_price || 0);

        if (!acc[productId]) {
          acc[productId] = { name: productName, units: 0, revenue: 0 };
        }
        acc[productId].units += units;
        acc[productId].revenue += revenue;
        return acc;
      }, {});

      return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);
    }
  });

  // Fetch unpaid items with better validation
  const { data: unpaidItems = [], isLoading: loadingUnpaid } = useQuery({
    queryKey: ['unpaidItems'],
    queryFn: async (): Promise<UnpaidItem[]> => {
      const { data: unpaidPOs, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          payment_status,
          purchase_order_items(total_price)
        `)
        .neq('payment_status', 'paid')
        .neq('payment_status', 'completed');

      if (error) throw error;

      const totalUnpaidAmount = unpaidPOs.reduce((sum, po) => {
        const poTotal = po.purchase_order_items?.reduce((poSum, item) => poSum + Number(item.total_price || 0), 0) || 0;
        return sum + poTotal;
      }, 0);

      // Validate that unpaid amount makes sense
      console.log('Unpaid Purchase Orders:', {
        count: unpaidPOs.length,
        total: totalUnpaidAmount,
        orders: unpaidPOs.map(po => ({
          id: po.id,
          status: po.payment_status,
          total: po.purchase_order_items?.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
        }))
      });

      return [
        { type: 'Purchase Orders', amount: totalUnpaidAmount, count: unpaidPOs.length },
        { type: 'Sales', amount: 0, count: 0 },
        { type: 'Deliveries', amount: 0, count: 0 },
      ];
    }
  });

  // Fetch sales by product category
  const { data: salesByProduct = [], isLoading: loadingByProduct } = useQuery({
    queryKey: ['salesByProduct'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(`
          total_price,
          products!inner(category)
        `)
        .not('product_id', 'is', null);

      if (error) throw error;

      const categorySales = data.reduce((acc: Record<string, number>, item) => {
        const category = item.products?.category || 'Other';
        const sales = Number(item.total_price || 0);
        acc[category] = (acc[category] || 0) + sales;
        return acc;
      }, {});

      return Object.entries(categorySales).map(([name, sales]) => ({ name, sales }));
    }
  });

  // Fetch monthly sales trend
  const { data: monthlySales = [], isLoading: loadingMonthlySales } = useQuery({
    queryKey: ['monthlySales'],
    queryFn: async (): Promise<SalesData[]> => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          created_at,
          purchase_order_items(total_price)
        `)
        .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString())
        .order('created_at');

      if (error) throw error;

      const monthlyData = data.reduce((acc: Record<string, number>, po) => {
        const month = new Date(po.created_at!).toLocaleDateString('en-US', { month: 'short' });
        const sales = po.purchase_order_items?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0;
        acc[month] = (acc[month] || 0) + sales;
        return acc;
      }, {});

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map(month => ({
        month,
        sales: monthlyData[month] || 0
      }));
    }
  });

  return {
    topClients: clientData.topClients,
    totalSales: clientData.totalSales,
    topProducts,
    unpaidItems,
    salesByProduct,
    monthlySales,
    isLoading: loadingClients || loadingProducts || loadingUnpaid || loadingByProduct || loadingMonthlySales
  };
};