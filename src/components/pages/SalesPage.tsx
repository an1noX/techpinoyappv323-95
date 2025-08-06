
import { useState } from "react";
import { Plus, ShoppingCart, FileText, Truck, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesTab } from "@/components/sales/SalesTab";
import { Sale } from "@/types/sales";
import PurchaseOrders from "@/transactions/pages/PurchaseOrders";
import DeliveryReceipts from "@/transactions/pages/DeliveryReceipts";

export const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState("pos");

  // Summary stats
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const pendingSales = sales.filter(s => s.status === 'pending').length;
  const completedSales = sales.filter(s => s.status === 'paid').length;

  return (
    <div className="px-4 py-4 pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sales Management</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₱{totalSales.toFixed(2)}</div>
            <div className="text-sm text-gray-500 mt-1">Total Sales</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingSales}</div>
            <div className="text-sm text-gray-500 mt-1">Pending Sales</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedSales}</div>
            <div className="text-sm text-gray-500 mt-1">Completed Sales</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="pos" className="flex items-center space-x-2">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">POS</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center space-x-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="flex items-center space-x-2">
            <FileText size={16} />
            <span className="hidden sm:inline">PO</span>
          </TabsTrigger>
          <TabsTrigger value="client-po" className="flex items-center space-x-2">
            <Receipt size={16} />
            <span className="hidden sm:inline">Client PO</span>
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex items-center space-x-2">
            <Truck size={16} />
            <span className="hidden sm:inline">Deliveries</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <SalesTab sales={sales} setSales={setSales} activeTab="pos" />
        </TabsContent>

        <TabsContent value="transactions">
          <SalesTab sales={sales} setSales={setSales} activeTab="transactions" />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <SalesTab sales={sales} setSales={setSales} activeTab="purchase-orders" />
        </TabsContent>

        <TabsContent value="client-po">
          <PurchaseOrders />
        </TabsContent>

        <TabsContent value="deliveries">
          <DeliveryReceipts />
        </TabsContent>
      </Tabs>
    </div>
  );
};
