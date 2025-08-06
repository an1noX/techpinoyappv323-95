
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Save, History, Users } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPHP } from "@/utils/currency";

interface PriceHistoryEntry {
  id: string;
  date: string;
  price: number;
  client_name: string;
  note?: string;
}

interface AddClientPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableClients: Array<{ id: string; name: string }>;
  onSave: (clientId: string, price: number) => void;
  initialClientId?: string;
  initialPrice?: number;
  productId?: string;
}

export function AddClientPriceDialog({
  open,
  onOpenChange,
  availableClients,
  onSave,
  initialClientId = '',
  initialPrice = 0,
  productId,
}: AddClientPriceDialogProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const formSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
  });

  type FormValues = z.infer<typeof formSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: initialClientId,
      price: initialPrice,
    },
    values: {
      clientId: initialClientId,
      price: initialPrice,
    },
  });

  // Fetch client price history only for this product
  const fetchClientPriceHistory = async () => {
    if (!productId) return;
    
    setLoadingHistory(true);
    try {
      const { data: clientHistory, error } = await supabase
        .from('client_price_history')
        .select(`
          id,
          price,
          timestamp,
          note,
          product_clients!inner(
            client:clients(name)
          )
        `)
        .eq('product_clients.product_id', productId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedHistory: PriceHistoryEntry[] = (clientHistory || []).map(item => ({
        id: item.id,
        date: item.timestamp,
        price: item.price,
        client_name: item.product_clients?.client?.name || 'Unknown Client',
        note: item.note || undefined,
      }));

      setPriceHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching client price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load data when dialog opens
  useEffect(() => {
    if (open && productId) {
      fetchClientPriceHistory();
    }
  }, [open, productId]);
  
  const handleAddClientPrice = async (data: FormValues) => {
    try {
      // Check if product_client relationship exists
      let { data: existingRelation, error: checkError } = await supabase
        .from('product_clients')
        .select('id, quoted_price')
        .eq('product_id', productId)
        .eq('client_id', data.clientId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRelation) {
        // Update existing relationship
        const { error: updateError } = await supabase
          .from('product_clients')
          .update({ 
            quoted_price: data.price,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRelation.id);

        if (updateError) throw updateError;
      } else {
        // Create new relationship
        const { error: insertError } = await supabase
          .from('product_clients')
          .insert({
            product_id: productId,
            client_id: data.clientId,
            quoted_price: data.price,
          });

        if (insertError) throw insertError;
      }

      toast.success('Client price saved successfully');
      onSave(data.clientId, data.price);
      form.reset();
      
      // Refresh price history
      fetchClientPriceHistory();
    } catch (error) {
      console.error('Error saving client price:', error);
      toast.error('Failed to save client price');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Manage Client Pricing</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="client" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="client" className="flex items-center gap-1 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Client Pricing</span>
              <span className="sm:hidden">Price</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 text-xs sm:text-sm">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="client" className="mt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddClientPrice)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white max-h-[200px]">
                            {availableClients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="pl-8" 
                              placeholder="0.00"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 sm:flex-none"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 sm:flex-none">
                      <Save className="h-4 w-4 mr-2" /> Save Price
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-3">Client Price History</div>
                {loadingHistory ? (
                  <div className="text-gray-400 text-sm text-center py-8">
                    Loading price history...
                  </div>
                ) : priceHistory.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-8">
                    No client price history available.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {priceHistory.map((entry) => (
                      <div key={entry.id} className="bg-gray-50 p-3 rounded border">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {formatPHP(entry.price)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {entry.client_name} • {formatDate(entry.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                              Client
                            </span>
                          </div>
                        </div>
                        {entry.note && (
                          <div className="text-xs text-gray-600 mt-2">
                            {entry.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
