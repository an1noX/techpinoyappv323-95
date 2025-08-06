import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientPricing {
  id: string;
  product_id: string;
  client_id: string;
  quoted_price: number;
  margin_percentage: number;
  product_name: string;
  product_sku: string;
  client_name: string;
  updated_at: string;
  created_at: string;
}

interface AddClientPricingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: ClientPricing | null;
}

export const AddClientPricingForm: React.FC<AddClientPricingFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData
}) => {
  const [formData, setFormData] = useState({
    product_id: '',
    client_id: '',
    quoted_price: '',
    margin_percentage: ''
  });
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Add new state for current item details
  const [currentDetails, setCurrentDetails] = useState({
    productName: '',
    clientName: '',
    currentPrice: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchClients();
      
      if (editData) {
        setFormData({
          product_id: editData.product_id,
          client_id: editData.client_id,
          quoted_price: editData.quoted_price.toString(),
          margin_percentage: editData.margin_percentage?.toString() || ''
        });
        
        // Set current details when editing
        setCurrentDetails({
          productName: editData.product_name,
          clientName: editData.client_name,
          currentPrice: editData.quoted_price.toString()
        });
      } else {
        setFormData({
          product_id: '',
          client_id: '',
          quoted_price: '',
          margin_percentage: ''
        });
        setCurrentDetails({
          productName: '',
          clientName: '',
          currentPrice: ''
        });
      }
    }
  }, [isOpen, editData]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.client_id || !formData.quoted_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        product_id: formData.product_id,
        client_id: formData.client_id,
        quoted_price: parseFloat(formData.quoted_price),
        margin_percentage: formData.margin_percentage ? parseFloat(formData.margin_percentage) : null
      };

      if (editData) {
        const { error } = await supabase
          .from('product_clients')
          .update(submitData)
          .eq('id', editData.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Client pricing updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('product_clients')
          .insert([submitData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Client pricing added successfully"
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving client pricing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save client pricing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Edit Client Pricing' : 'Add Client Pricing'}
          </DialogTitle>
        </DialogHeader>
        
        {editData && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Current Details:</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Product:</span> {currentDetails.productName}</p>
              <p><span className="font-medium">Client:</span> {currentDetails.clientName}</p>
              <p><span className="font-medium">Current Price:</span> ${Number(currentDetails.currentPrice).toFixed(2)}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoted_price">Quoted Price *</Label>
            <Input
              id="quoted_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.quoted_price}
              onChange={(e) => setFormData(prev => ({ ...prev, quoted_price: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="margin_percentage">Margin Percentage</Label>
            <Input
              id="margin_percentage"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.margin_percentage}
              onChange={(e) => setFormData(prev => ({ ...prev, margin_percentage: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editData ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};