import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Package, Calendar, User, FileText, Loader2 } from "lucide-react";
import { usePurchaseOrderDetails } from "@/hooks/usePurchaseOrderDetails";

interface PurchaseOrderListProps {
  paymentStatus?: 'paid' | 'unpaid';
  title: string;
  onBack: () => void;
}

export const PurchaseOrderList = ({ paymentStatus, title, onBack }: PurchaseOrderListProps) => {
  const { data: purchaseOrders, isLoading } = usePurchaseOrderDetails(paymentStatus);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full min-h-screen">
          <main className="flex-1 overflow-y-auto pb-20">
            <div className="px-4 lg:px-8 py-6 flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-blue-600">Loading purchase orders...</span>
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
          <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={onBack}>
                ←
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            </div>

            {/* Summary */}
            <Card className="rounded-xl shadow-md border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{purchaseOrders?.length || 0}</div>
                    <div className="text-sm text-gray-500">Total Orders</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ₱{(purchaseOrders?.reduce((sum, po) => sum + po.total_amount, 0) || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Amount</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Orders List */}
            <div className="space-y-3">
              {purchaseOrders?.map((order) => (
                <Card key={order.id} className="rounded-xl shadow-md border-blue-200">
                  <Collapsible 
                    open={expandedOrders.has(order.id)}
                    onOpenChange={() => toggleExpanded(order.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 rounded-t-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedOrders.has(order.id) ? 
                              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            }
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div className="text-left">
                              <CardTitle className="text-sm font-semibold">
                                {order.purchase_order_number || `PO-${order.id.slice(0, 8)}`}
                              </CardTitle>
                              <div className="text-xs text-gray-500">{order.supplier_name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                              ₱{order.total_amount.toLocaleString()}
                            </div>
                            <Badge className={`text-xs ${getStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 px-4 pb-4">
                        {/* Order Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Date: {new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>Status: {order.status}</span>
                          </div>
                          {order.client_po && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="h-4 w-4" />
                              <span>Client PO: {order.client_po}</span>
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Items ({order.items.length})
                          </div>
                          {order.items.map((item, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{item.product_name}</div>
                                  {item.model && (
                                    <div className="text-xs text-gray-500">{item.model}</div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Qty: {item.quantity} × ₱{item.unit_price.toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-sm font-semibold">
                                  ₱{item.total_price.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}

              {(!purchaseOrders || purchaseOrders.length === 0) && (
                <Card className="rounded-xl shadow-md border-gray-200">
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-500">No purchase orders found</div>
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