import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddSupplierPricingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: {
    id: string;
    product_id: string;
    supplier_id: string;
    current_price: number;
  } | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Supplier {
  id: string;
  name: string;
}

export const AddSupplierPricingForm = ({ isOpen, onClose, onSuccess, editData }: AddSupplierPricingFormProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    current_price: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchSuppliers();
      if (editData) {
        setFormData({
          product_id: editData.product_id,
          supplier_id: editData.supplier_id,
          current_price: editData.current_price.toString()
        });
      }
    }
  }, [isOpen, editData]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku')
      .order('name');
    setProducts(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name');
    setSuppliers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        product_id: formData.product_id,
        supplier_id: formData.supplier_id,
        current_price: parseFloat(formData.current_price)
      };

      if (editData) {
        const { error } = await supabase
          .from('product_suppliers')
          .update(data)
          .eq('id', editData.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Supplier pricing updated successfully" });
      } else {
        const { error } = await supabase
          .from('product_suppliers')
          .insert([data]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Supplier pricing added successfully" });
      }

      setFormData({ product_id: "", supplier_id: "", current_price: "" });
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: editData ? "Failed to update supplier pricing" : "Failed to add supplier pricing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader className="pb-4">
          <SheetTitle>{editData ? "Edit Supplier Pricing" : "Add Supplier Pricing"}</SheetTitle>
          <SheetDescription>
            {editData ? "Update pricing information for this supplier" : "Set pricing for a product and supplier combination"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
              disabled={loading}
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
            <Label htmlFor="supplier">Supplier</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_price">Current Price (₱)</Label>
            <Input
              id="current_price"
              type="number"
              step="0.01"
              value={formData.current_price}
              onChange={(e) => setFormData(prev => ({ ...prev, current_price: e.target.value }))}
              disabled={loading}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editData ? "Update Pricing" : "Add Pricing"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};