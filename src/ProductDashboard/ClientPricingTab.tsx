import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Plus, TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddClientPricingForm } from "./AddClientPricingForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CustomLoading } from "@/components/ui/CustomLoading";

interface ClientPricing {
  id: string;
  product_id: string;
  client_id: string;
  quoted_price: number;
  margin_percentage: number;
  product_name: string;
  product_sku: string;
  product_color: string;
  client_name: string;
  updated_at: string;
  created_at: string;
}

export const ClientPricingTab = ({ product }: { product?: any }) => {
  const [clientPricing, setClientPricing] = useState<ClientPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editData, setEditData] = useState<ClientPricing | null>(null);
  const { toast } = useToast();

  // Color mapping function
  const getColorValue = (colorName: string | null) => {
    if (!colorName) return '#6B7280'; // Gray for no color
    
    const colorMap: Record<string, string> = {
      // Common printer colors
      'black': '#000000',
      'cyan': '#00BFFF',
      'magenta': '#FF1493',
      'yellow': '#FFD700',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080',
      'white': '#FFFFFF',
      'monochrome': '#000000',
      // HP specific colors
      'tri-color': '#FF1493', // Magenta for tri-color
      'photo': '#4169E1', // Royal blue for photo
      // Brother colors
      'lc': '#00BFFF', // Light cyan
      'lm': '#FFB6C1', // Light magenta
      'ly': '#FFFFE0', // Light yellow
      // Canon colors
      'pgi': '#000000', // Pigment black
      'cli': '#00BFFF', // Dye-based colors
    };

    const normalizedColor = colorName.toLowerCase().trim();
    
    // Direct match
    if (colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }
    
    // Partial matches
    if (normalizedColor.includes('black')) return '#000000';
    if (normalizedColor.includes('cyan')) return '#00BFFF';
    if (normalizedColor.includes('magenta')) return '#FF1493';
    if (normalizedColor.includes('yellow')) return '#FFD700';
    if (normalizedColor.includes('red')) return '#FF0000';
    if (normalizedColor.includes('blue')) return '#0000FF';
    if (normalizedColor.includes('green')) return '#008000';
    
    // Default to gray for unknown colors
    return '#6B7280';
  };

  const fetchClientPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('product_clients')
        .select(`
          id,
          product_id,
          client_id,
          quoted_price,
          margin_percentage,
          updated_at,
          created_at,
          products (
            name,
            sku,
            color
          ),
          clients (
            name
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedData: ClientPricing[] = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        client_id: item.client_id,
        quoted_price: item.quoted_price,
        margin_percentage: item.margin_percentage,
        product_name: item.products?.name || 'Unknown Product',
        product_sku: item.products?.sku || 'N/A',
        product_color: item.products?.color || null,
        client_name: item.clients?.name || 'Unknown Client',
        updated_at: item.updated_at,
        created_at: item.created_at
      }));

      setClientPricing(formattedData);
    } catch (error) {
      console.error('Error fetching client pricing:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client pricing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientPricing();
  }, []);

  const filteredPricing = clientPricing.filter(pricing =>
    pricing.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pricing.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pricing.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by product to show price comparison
  const groupedByProduct = filteredPricing.reduce((acc, pricing) => {
    const key = `${pricing.product_id}`;
    if (!acc[key]) {
      acc[key] = {
        product_name: pricing.product_name,
        product_sku: pricing.product_sku,
        product_color: pricing.product_color,
        clients: []
      };
    }
    acc[key].clients.push(pricing);
    return acc;
  }, {} as Record<string, { product_name: string; product_sku: string; product_color: string; clients: ClientPricing[] }>);

  const getBestPrice = (clients: ClientPricing[]) => {
    return Math.max(...clients.map(c => c.quoted_price));
  };

  const getWorstPrice = (clients: ClientPricing[]) => {
    return Math.min(...clients.map(c => c.quoted_price));
  };

  const handleEdit = (pricing: ClientPricing) => {
    setEditData(pricing);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "Client pricing deleted successfully" });
      fetchClientPricing();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client pricing",
        variant: "destructive"
      });
    }
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditData(null);
  };

  const handleFormSuccess = () => {
    fetchClientPricing();
  };

  if (loading) {
    return <CustomLoading message="Loading client pricing" />;
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Client Pricing</h2>
          <Button 
            size="sm" 
            onClick={() => setShowAddForm(true)}
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, SKU, or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>
      </div>

      {/* Mobile-First Content */}
      <div className="space-y-3">
        {Object.keys(groupedByProduct).length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base font-medium text-muted-foreground mb-2">
                {searchTerm ? "No pricing found" : "No client pricing yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Start by adding client pricing for your products"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByProduct).map(([productId, productData]) => {
            const bestPrice = getBestPrice(productData.clients);
            const worstPrice = getWorstPrice(productData.clients);
            const sortedClients = [...productData.clients].sort((a, b) => b.quoted_price - a.quoted_price);
            const colorValue = getColorValue(productData.product_color);
            
            return (
              <Card key={productId} className="hover:shadow-md transition-shadow border-gray-200">
                <CardHeader className="pb-2 px-3 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Color Dot Indicator */}
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
                        style={{ 
                          backgroundColor: colorValue,
                          boxShadow: colorValue === '#FFFFFF' ? 'inset 0 0 0 1px #D1D5DB' : 'none'
                        }}
                        title={productData.product_color || 'No color specified'}
                      />
                      <CardTitle className="text-sm truncate">{productData.product_name}</CardTitle>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {productData.product_sku}
                      </Badge>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      <div className="text-green-600 font-semibold">
                        Best: ₱{bestPrice.toFixed(2)}
                      </div>
                      {productData.clients.length > 1 && (
                        <div className="text-muted-foreground">
                          Range: ₱{(bestPrice - worstPrice).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 px-3 pb-3">
                  <div className="space-y-2">
                    {sortedClients.map((client, index) => {
                      const isBest = client.quoted_price === bestPrice && productData.clients.length > 1;
                      const isWorst = client.quoted_price === worstPrice && productData.clients.length > 1;
                      
                      return (
                        <div key={client.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-xs truncate">{client.client_name}</span>
                            {isBest && (
                              <Badge variant="outline" className="text-xs text-green-700 border-green-200 flex-shrink-0">
                                <TrendingUp className="h-2 w-2 mr-1" />
                                Best
                              </Badge>
                            )}
                            {isWorst && (
                              <Badge variant="outline" className="text-xs text-orange-700 border-orange-200 flex-shrink-0">
                                <TrendingDown className="h-2 w-2 mr-1" />
                                Low
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <div className={`font-semibold text-xs ${isBest ? 'text-green-600' : ''}`}>
                                ₱{client.quoted_price.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {client.margin_percentage ? `${client.margin_percentage}% margin` : 'No margin'}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(client)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="mx-4 max-w-sm">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-base">Delete Client Pricing</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm">
                                      Are you sure you want to delete this pricing for {client.client_name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(client.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Mobile Revenue Analysis Summary */}
      {filteredPricing.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">Revenue Analysis</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-3 pb-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Clients:</span>
                <span className="font-semibold">
                  {new Set(filteredPricing.map(p => p.client_id)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Avg Price:</span>
                <span className="font-semibold">
                  ₱{(filteredPricing.reduce((sum, p) => sum + p.quoted_price, 0) / filteredPricing.length).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Products:</span>
                <span className="font-semibold">
                  {new Set(filteredPricing.map(p => p.product_id)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 dark:text-blue-400">Avg Margin:</span>
                <span className="font-semibold">
                  {(filteredPricing.reduce((sum, p) => sum + (p.margin_percentage || 0), 0) / filteredPricing.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form Modal */}
      <AddClientPricingForm 
        isOpen={showAddForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editData={editData}
      />
    </div>
  );
};
