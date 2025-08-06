import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPHP } from '@/utils/currency';

interface ClientPricing {
  id: string;
  product_id: string;
  client_id: string;
  client_name: string;
  product_name: string;
  product_sku: string;
  quoted_price: number;
  margin_percentage?: number;
  updated_at: string;
}

interface ClientPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: any;
  clientId: string;
  onSuccess?: () => void;
}

const ClientPricingModal: React.FC<ClientPricingModalProps> = ({
  isOpen,
  onClose,
  productGroup,
  clientId,
  onSuccess
}) => {
  const [allClientPricing, setAllClientPricing] = useState<ClientPricing[]>([]);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [editingPricing, setEditingPricing] = useState<ClientPricing | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newPricing, setNewPricing] = useState({
    quoted_price: '',
    margin_percentage: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && productGroup && clientId) {
      loadClientPricing();
      loadClientInfo();
    }
  }, [isOpen, productGroup, clientId]);

  const loadClientPricing = async () => {
    try {
      const productIds = productGroup.allProducts.map((p: any) => p.product_id);
      
      const { data, error } = await supabase
        .from('product_clients')
        .select(`
          id,
          product_id,
          client_id,
          quoted_price,
          margin_percentage,
          updated_at,
          clients(
            id,
            name
          ),
          products(
            id,
            name,
            sku
          )
        `)
        .eq('client_id', clientId)
        .in('product_id', productIds);

      if (error) throw error;

      if (data && data.length > 0) {
        // Map all pricing entries with product information
        const pricingData: ClientPricing[] = data.map(entry => ({
          id: entry.id,
          product_id: entry.product_id,
          client_id: entry.client_id,
          client_name: entry.clients?.name || 'Unknown Client',
          product_name: entry.products?.name || 'Unknown Product',
          product_sku: entry.products?.sku || 'Unknown SKU',
          quoted_price: entry.quoted_price,
          margin_percentage: entry.margin_percentage,
          updated_at: entry.updated_at
        }));
        setAllClientPricing(pricingData);
      } else {
        setAllClientPricing([]);
      }
    } catch (error) {
      console.error('Error loading client pricing:', error);
      toast({
        title: "Error",
        description: "Failed to load client pricing",
        variant: "destructive"
      });
    }
  };

  const loadClientInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClientInfo(data);
    } catch (error) {
      console.error('Error loading client info:', error);
    }
  };

  const handleAddPricing = async () => {
    if (!newPricing.quoted_price || !selectedProductId) {
      toast({
        title: "Error",
        description: "Please select a product and enter a quoted price",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const insertData = {
        product_id: selectedProductId,
        client_id: clientId,
        quoted_price: parseFloat(newPricing.quoted_price),
        margin_percentage: newPricing.margin_percentage ? parseFloat(newPricing.margin_percentage) : null
      };

      const { error } = await supabase
        .from('product_clients')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client pricing added successfully"
      });

      setShowAddForm(false);
      setSelectedProductId('');
      setNewPricing({ quoted_price: '', margin_percentage: '' });
      loadClientPricing();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding client pricing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add client pricing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePricing = async (pricing: ClientPricing) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_clients')
        .update({
          quoted_price: pricing.quoted_price,
          margin_percentage: pricing.margin_percentage
        })
        .eq('id', pricing.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client pricing updated successfully"
      });

      setEditingPricing(null);
      loadClientPricing();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating client pricing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client pricing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_clients')
        .delete()
        .eq('id', pricingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client pricing removed successfully"
      });

      loadClientPricing();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error deleting client pricing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove client pricing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Client Pricing Management
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {clientInfo?.name} - {productGroup?.name} - SKU: {productGroup?.baseSku}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Add New Pricing */}
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing for Products
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Add Pricing for {clientInfo?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-select">Select Product *</Label>
                  <select
                    id="product-select"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Select a product...</option>
                    {productGroup.allProducts
                      .filter((product: any) => !allClientPricing.find(p => p.product_id === product.product_id))
                      .map((product: any) => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="price">Quoted Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPricing.quoted_price}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, quoted_price: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="margin">Margin Percentage</Label>
                  <Input
                    id="margin"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPricing.margin_percentage}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, margin_percentage: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddPricing} disabled={loading} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Adding...' : 'Add Pricing'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Client Pricing - Each Product Individually */}
          {allClientPricing.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Current Pricing</h3>
              {allClientPricing.map((pricing) => (
                <Card key={pricing.id}>
                  <CardContent className="p-4">
                    {editingPricing?.id === pricing.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{pricing.product_name}</h4>
                            <p className="text-sm text-gray-600">SKU: {pricing.product_sku}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPricing(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                            
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-price">Quoted Price</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              step="0.01"
                              value={editingPricing.quoted_price}
                              onChange={(e) => setEditingPricing(prev => 
                                prev ? { ...prev, quoted_price: parseFloat(e.target.value) || 0 } : null
                              )}
                            />
                          </div>
                              
                          <div>
                            <Label htmlFor="edit-margin">Margin %</Label>
                            <Input
                              id="edit-margin"
                              type="number"
                              step="0.01"
                              value={editingPricing.margin_percentage || ''}
                              onChange={(e) => setEditingPricing(prev => 
                                prev ? { ...prev, margin_percentage: parseFloat(e.target.value) || undefined } : null
                              )}
                            />
                          </div>
                        </div>
                            
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleUpdatePricing(editingPricing)}
                            disabled={loading}
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingPricing(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{pricing.product_name}</h4>
                          <p className="text-sm text-gray-600">SKU: {pricing.product_sku}</p>
                          <div className="text-sm text-muted-foreground">
                            Price: {formatPHP(pricing.quoted_price)}
                            {pricing.margin_percentage && (
                              <> • Margin: {pricing.margin_percentage}%</>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Updated: {new Date(pricing.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPricing(pricing)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePricing(pricing.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {allClientPricing.length === 0 && !showAddForm && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No pricing configured for {clientInfo?.name} yet
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientPricingModal;
