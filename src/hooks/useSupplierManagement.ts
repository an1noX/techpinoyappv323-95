
import { useState } from 'react';
import { Supplier } from '@/types/database';
import { supplierService } from '@/services/supplierService';
import { useToast } from '@/hooks/use-toast';

export interface SupplierManagementProps {
  showAddSupplier: boolean;
  setShowAddSupplier: (show: boolean) => void;
  editingSupplier: Supplier | null;
  setEditingSupplier: (supplier: Supplier | null) => void;
  handleAddSupplier: (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  handleUpdateSupplier: (id: string, supplierData: Partial<Supplier>) => Promise<boolean>;
  handleDeleteSupplier: (id: string, name?: string) => Promise<boolean>;
}

export const useSupplierManagement = (): SupplierManagementProps => {
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const handleAddSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await supplierService.createSupplier(supplierData);
      toast({
        title: "Success",
        description: "Supplier added successfully!",
      });
      return true;
    } catch (error) {
      console.error('Failed to add supplier:', error);
      toast({
        title: "Error",
        description: "Failed to add supplier. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpdateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      await supplierService.updateSupplier(id, supplierData);
      toast({
        title: "Success",
        description: "Supplier updated successfully!",
      });
      return true;
    } catch (error) {
      console.error('Failed to update supplier:', error);
      toast({
        title: "Error",
        description: "Failed to update supplier. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteSupplier = async (id: string, name: string = 'Supplier') => {
    try {
      await supplierService.deleteSupplier(id);
      toast({
        title: "Success",
        description: "Supplier deleted successfully!",
      });
      return true;
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
        variant: "destructive",
      });
      return false;
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
  };
};
