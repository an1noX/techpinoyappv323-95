
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supplierService } from '@/services/supplierService';
import { clientService } from '@/services/clientService';

interface AddSupplierClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'supplier' | 'client';
  productId: string;
  productName: string;
  onSuccess: () => void;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface ClientOption {
  id: string;
  name: string;
}

const AddSupplierClientModal: React.FC<AddSupplierClientModalProps> = ({
  isOpen,
  onClose,
  type,
  productId,
  productName,
  onSuccess
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [price, setPrice] = useState('');
  const [marginPercentage, setMarginPercentage] = useState('');
  const [showNewEntityForm, setShowNewEntityForm] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityEmail, setNewEntityEmail] = useState('');
  const [newEntityPhone, setNewEntityPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<(SupplierOption | ClientOption)[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadEntities();
      resetForm();
    }
  }, [isOpen, type]);

  const resetForm = () => {
    setSelectedEntityId('');
    setPrice('');
    setMarginPercentage('');
    setShowNewEntityForm(false);
    setNewEntityName('');
    setNewEntityEmail('');
    setNewEntityPhone('');
  };

  const loadEntities = async () => {
    try {
      if (type === 'supplier') {
        const suppliers = await supplierService.getSuppliers();
        setEntities(suppliers);
      } else {
        const clients = await clientService.getClients();
        setEntities(clients);
      }
    } catch (error) {
      console.error(`Error loading ${type}s:`, error);
      toast.error(`Failed to load ${type}s`);
    }
  };

  const handleSubmit = async () => {
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!selectedEntityId && !showNewEntityForm) {
      toast.error(`Please select a ${type} or create a new one`);
      return;
    }

    if (showNewEntityForm && !newEntityName.trim()) {
      toast.error(`Please enter ${type} name`);
      return;
    }

    setLoading(true);
    try {
      if (type === 'supplier') {
        const { productService } = await import('@/services/productService');
        await productService.addSupplierToProduct(
          productId,
          showNewEntityForm ? {
            name: newEntityName,
            contact_email: newEntityEmail,
            phone: newEntityPhone
          } : { name: entities.find(e => e.id === selectedEntityId)?.name || '' },
          priceValue
        );
      } else {
        const { productService } = await import('@/services/productService');
        const marginValue = marginPercentage ? parseFloat(marginPercentage) : undefined;
        await productService.addClientToProduct(
          productId,
          showNewEntityForm ? {
            name: newEntityName,
            contact_email: newEntityEmail,
            phone: newEntityPhone
          } : { name: entities.find(e => e.id === selectedEntityId)?.name || '' },
          priceValue,
          marginValue
        );
      }

      toast.success(`${type === 'supplier' ? 'Supplier' : 'Client'} pricing added successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error adding ${type} pricing:`, error);
      toast.error(`Failed to add ${type} pricing`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {type === 'supplier' ? 'Supplier' : 'Client'} Pricing
          </DialogTitle>
          <div className="text-sm text-gray-600">
            {productName}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {!showNewEntityForm ? (
                  <>
                    <div>
                      <Label htmlFor="entity">Select {type === 'supplier' ? 'Supplier' : 'Client'}</Label>
                      <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${type}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewEntityForm(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New {type === 'supplier' ? 'Supplier' : 'Client'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>New {type === 'supplier' ? 'Supplier' : 'Client'}</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="newName">Name *</Label>
                      <Input
                        id="newName"
                        value={newEntityName}
                        onChange={(e) => setNewEntityName(e.target.value)}
                        placeholder={`Enter ${type} name`}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newEmail">Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEntityEmail}
                        onChange={(e) => setNewEntityEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newPhone">Phone</Label>
                      <Input
                        id="newPhone"
                        value={newEntityPhone}
                        onChange={(e) => setNewEntityPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    step="0.01"
                    min="0"
                  />
                </div>

                {type === 'client' && (
                  <div>
                    <Label htmlFor="margin">Margin Percentage</Label>
                    <Input
                      id="margin"
                      type="number"
                      value={marginPercentage}
                      onChange={(e) => setMarginPercentage(e.target.value)}
                      placeholder="Enter margin %"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Adding...' : 'Add Pricing'}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierClientModal;
