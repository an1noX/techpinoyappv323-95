
import { useState } from 'react';
import { supplierService } from '@/services/supplierService';
import { toast } from 'sonner';
import { Supplier } from '@/types/database';

export const useSupplierActions = (onSupplierUpdate?: () => void) => {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const success = await supplierService.createSupplier(supplierData);
      if (success) {
        toast.success('Supplier added successfully');
        if (onSupplierUpdate) onSupplierUpdate();
        setShowAddSupplier(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to add supplier:', error);
      toast.error('Failed to add supplier');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    setIsLoading(true);
    try {
      const success = await supplierService.updateSupplier(id, supplierData);
      if (success) {
        toast.success('Supplier updated successfully');
        if (onSupplierUpdate) onSupplierUpdate();
        setEditingSupplier(null);
      }
      return success;
    } catch (error) {
      console.error('Failed to update supplier:', error);
      toast.error('Failed to update supplier');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    setIsLoading(true);
    try {
      const success = await supplierService.deleteSupplier(id);
      if (success) {
        toast.success('Supplier deleted successfully');
        if (onSupplierUpdate) onSupplierUpdate();
      }
      return success;
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast.error('Failed to delete supplier');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showAddSupplier,
    setShowAddSupplier,
    editingSupplier,
    setEditingSupplier,
    handleAddSupplier,
    handleUpdateSupplier,
    handleDeleteSupplier,
    isLoading,
  };
};
