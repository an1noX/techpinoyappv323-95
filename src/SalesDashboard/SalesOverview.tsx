
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Package, AlertCircle, DollarSign, Loader2, Eye, ChevronRight } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";
import { useAdvancedSalesAnalytics } from "@/hooks/useAdvancedSalesAnalytics";
import { PurchaseOrderList } from "@/components/PurchaseOrderList";

export const SalesOverview = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'unpaid-pos' | 'paid-pos'>('overview');
  
  // Fetch real data from Supabase
  const { 
    topClients, 
    totalSales,
    topProducts, 
    unpaidItems, 
    salesByProduct, 
    monthlySales, 
    isLoading 
  } = useSalesData();

  // Fetch advanced analytics data
  const {
    unpaidClients,
    topSellingProducts,
    productsByClient,
    productsByMonth,
    isLoading: isLoadingAdvanced
  } = useAdvancedSalesAnalytics();

  // Prepare data for charts - MOVED BEFORE EARLY RETURNS
  const salesByClient = useMemo(() => {
    const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
    return topClients.map((client, index) => ({
      name: client.name.split(' ')[0], // Short name for chart
      value: client.sales,
      fill: colors[index % colors.length]
    }));
  }, [topClients]);

  const unpaidByType = useMemo(() => {
    return unpaidItems
      .filter(item => item.amount > 0)
      .map(item => ({
        name: item.type === 'Purchase Orders' ? 'P.O.' : item.type,
        value: item.amount,
        fill: item.type === 'Sales' ? "#ef4444" : 
              item.type === 'Purchase Orders' ? "#f97316" : "#eab308"
      }));
  }, [unpaidItems]);


  const totalUnpaid = useMemo(() => {
    return unpaidItems.reduce((sum, item) => sum + item.amount, 0);
  }, [unpaidItems]);

  // Handle view changes - MOVED AFTER ALL HOOKS
  if (currentView === 'unpaid-pos') {
    return (
      <PurchaseOrderList 
        paymentStatus="unpaid" 
        title="Unpaid Purchase Orders" 
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (currentView === 'paid-pos') {
    return (
      <PurchaseOrderList 
        paymentStatus="paid" 
        title="Paid Purchase Orders" 
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (isLoading || isLoadingAdvanced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full min-h-screen">
          <main className="flex-1 overflow-y-auto pb-20">
            <div className="px-4 lg:px-8 py-6 flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-blue-600">Loading sales data...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full min-h-screen">
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">₱{totalSales.toLocaleString()}</div>
                  <div className="text-sm text-gray-500 mt-1">Total Sales</div>
                </CardContent>
              </Card>
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{topProducts.reduce((sum, p) => sum + p.units, 0)}</div>
                  <div className="text-sm text-gray-500 mt-1">Units Sold</div>
                </CardContent>
              </Card>
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">₱{totalUnpaid.toLocaleString()}</div>
                  <div className="text-sm text-gray-500 mt-1">Unpaid Amount</div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Grid Layout for Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Top Clients */}
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <Users className="h-5 w-5 text-blue-600" />
                    Top Clients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  {topClients.map((client, index) => (
                    <div key={client.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{client.name}</span>
                        <span className="text-sm font-semibold">₱{client.sales.toLocaleString()}</span>
                      </div>
                      <Progress value={client.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <Package className="h-5 w-5 text-green-600" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {topProducts.map((product, index) => (
                    <div key={product.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.units} units sold</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">₱{product.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="rounded-xl shadow-md border-green-200 lg:col-span-2 xl:col-span-1">
                <CardHeader className="pb-3 bg-green-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <Package className="h-5 w-5 text-green-600" />
                    Purchase Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12 border-green-200 hover:bg-green-50"
                    onClick={() => setCurrentView('unpaid-pos')}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>View Unpaid Orders</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12 border-green-200 hover:bg-green-50"
                    onClick={() => setCurrentView('paid-pos')}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>View Paid Orders</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Unpaid Summary - Full width */}
            <Card className="rounded-xl shadow-md border-red-200">
              <CardHeader className="pb-3 bg-red-50 rounded-t-xl">
                <CardTitle className="flex items-center justify-between text-lg text-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Unpaid Summary
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentView('unpaid-pos')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {unpaidItems.map((item) => (
                    <div key={item.type} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-red-700 border-red-300">
                          {item.count} items
                        </Badge>
                        <span className="font-medium text-sm">{item.type}</span>
                      </div>
                      <span className="font-semibold text-red-600">₱{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts Section with desktop grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unpaid Clients Section */}
              <Card className="rounded-xl shadow-md border-red-200 lg:col-span-2">
                <CardHeader className="pb-3 bg-red-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Clients with Unpaid Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {unpaidClients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No unpaid items found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unpaidClients.slice(0, 6).map((client) => (
                        <div key={client.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="font-medium text-sm mb-2">{client.name}</div>
                          <div className="space-y-1 text-xs">
                            {client.unpaid_po_count > 0 && (
                              <div className="flex justify-between">
                                <span>Unpaid POs:</span>
                                <span className="font-semibold text-red-600">
                                  {client.unpaid_po_count} (₱{client.unpaid_po_amount.toLocaleString()})
                                </span>
                              </div>
                            )}
                            {client.unpaid_delivery_count > 0 && (
                              <div className="flex justify-between">
                                <span>Advance Deliveries:</span>
                                <span className="font-semibold text-orange-600">
                                  {client.unpaid_delivery_count} (₱{client.unpaid_delivery_amount.toLocaleString()})
                                </span>
                              </div>
                            )}
                            <div className="pt-1 border-t border-red-300 flex justify-between font-semibold">
                              <span>Total:</span>
                              <span className="text-red-700">₱{client.total_unpaid.toLocaleString()}</span>
                            </div>
                          </div>
                          {client.contact_person && (
                            <div className="text-xs text-gray-600 mt-2">
                              Contact: {client.contact_person}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Selling Products Section */}
              <Card className="rounded-xl shadow-md border-green-200 lg:col-span-2">
                <CardHeader className="pb-3 bg-green-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {topSellingProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No product sales data found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topSellingProducts.slice(0, 6).map((product, index) => (
                        <div key={product.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              {product.category}
                            </Badge>
                          </div>
                          <div className="font-medium text-sm mb-2">{product.name}</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Units Sold:</span>
                              <span className="font-semibold">{product.total_quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Revenue:</span>
                              <span className="font-semibold text-green-600">₱{product.total_revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Clients:</span>
                              <span className="font-semibold">{product.client_count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products by Client Section */}
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <Users className="h-5 w-5 text-blue-600" />
                    Top Products by Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {productsByClient.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No client product data found
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {productsByClient.slice(0, 10).map((item, index) => (
                        <div key={`${item.client_id}-${item.product_id}`} className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{item.client_name}</div>
                              <div className="text-xs text-gray-600 truncate">{item.product_name}</div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="font-semibold text-sm text-blue-600">₱{item.total_revenue.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Qty: {item.total_quantity}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products by Month Section */}
              <Card className="rounded-xl shadow-md border-purple-200">
                <CardHeader className="pb-3 bg-purple-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-purple-800">
                    <Package className="h-5 w-5 text-purple-600" />
                    Top Products by Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {productsByMonth.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No monthly product data found
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {productsByMonth.slice(0, 10).map((item, index) => (
                        <div key={`${item.month}-${item.year}-${item.product_id}`} className="p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{item.product_name}</div>
                              <div className="text-xs text-gray-600">{item.month} {item.year}</div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="font-semibold text-sm text-purple-600">₱{item.total_revenue.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Qty: {item.total_quantity}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sales by Product Chart */}
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Sales by Product
                  </CardTitle>
                </CardHeader>
                <CardContent className="w-full p-4">
                  <div className="w-full h-80">
                    <ChartContainer config={{}} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesByProduct} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="sales" 
                            fill="#8884d8" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sales by Client Chart */}
              <Card className="rounded-xl shadow-md border-blue-200">
                <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <Users className="h-5 w-5 text-blue-600" />
                    Sales by Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="w-full p-4">
                  <div className="w-full h-80">
                    <ChartContainer config={{}} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesByClient}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {salesByClient.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Sales Trend - Full width on desktop */}
              <Card className="rounded-xl shadow-md border-blue-200 lg:col-span-2">
                <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Monthly Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="w-full p-4">
                  <div className="w-full h-80">
                    <ChartContainer config={{}} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlySales} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Unpaid by Type Chart */}
              {unpaidByType.length > 0 && (
                <Card className="rounded-xl shadow-md border-blue-200 lg:col-span-2">
                  <CardHeader className="pb-3 bg-blue-50 rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                      <DollarSign className="h-5 w-5 text-red-600" />
                      Unpaid by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="w-full p-4">
                    <div className="w-full h-80">
                      <ChartContainer config={{}} className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={unpaidByType}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ₱${value.toLocaleString()}`}
                            >
                              {unpaidByType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
