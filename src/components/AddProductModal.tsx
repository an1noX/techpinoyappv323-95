import React, { useState } from 'react';
import { X, Package, Plus } from 'lucide-react';
import { productService } from '@/services/productService';
import { printerService } from '@/services/printerService';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import ColorSelector from './ColorSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (productId: string) => void;
  searchTerm: string;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  searchTerm,
}) => {
  const [formData, setFormData] = useState({
    name: searchTerm,
    sku: searchTerm,
    category: '',
    printers: '',
    colors: [] as string[],
    alias: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();
  const { categories, loading: categoriesLoading } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    
    let finalCategory = formData.category;
    if (isAddingNewCategory) {
      if (!newCategoryName.trim()) {
        newErrors.category = 'New category name is required';
      } else {
        finalCategory = newCategoryName.trim();
      }
    } else if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.colors || formData.colors.length === 0) {
      newErrors.colors = 'Select at least one color';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const printerNames = formData.printers
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      const createdProductIds: string[] = [];
      if (formData.colors.length === 1) {
        const newProduct = await productService.createProduct({
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: finalCategory,
          color: formData.colors[0],
          alias: formData.alias.trim(),
        });
        createdProductIds.push(newProduct.id);
        for (const printerName of printerNames) {
          let printer = await printerService.findOrCreatePrinter(printerName);
          await linkProductToPrinter(newProduct.id, printer.id);
        }
      } else {
        for (const color of formData.colors) {
          const newProduct = await productService.createProduct({
            name: formData.name.trim(),
            sku: formData.sku.trim(),
            category: finalCategory,
            color,
            alias: formData.alias.trim(),
          });
          createdProductIds.push(newProduct.id);
          for (const printerName of printerNames) {
            let printer = await printerService.findOrCreatePrinter(printerName);
            await linkProductToPrinter(newProduct.id, printer.id);
          }
        }
      }
      toast({
        title: "Success",
        description: formData.colors.length === 1 ? "Product created successfully!" : "All product variants created and linked!",
      });
      setFormData({ name: '', sku: '', category: '', printers: '', colors: [], alias: '' });
      setNewCategoryName('');
      setIsAddingNewCategory(false);
      setErrors({});
      onProductAdded(createdProductIds[0]);
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') 
          ? 'A product with this SKU already exists'
          : "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-fill SKU when Product Name changes, unless SKU was manually edited
      if (field === 'name' && (prev.sku === prev.name || prev.sku === '')) {
        newData.sku = value;
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleColorChange = (colors: string[] | string) => {
    setFormData(prev => ({ ...prev, colors: Array.isArray(colors) ? colors : [colors] }));
  };

  const handleCategorySelect = (value: string) => {
    if (value === 'add-new') {
      setIsAddingNewCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      setFormData(prev => ({ ...prev, category: value }));
    }
    
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        name: searchTerm,
        sku: searchTerm
      }));
    }
  }, [isOpen, searchTerm]);

  // Helper to link product to printer
  const linkProductToPrinter = async (productId: string, printerId: string) => {
    await supabase.from('product_printers').insert({ product_id: productId, printer_id: printerId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
              disabled={loading}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.sku ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter SKU"
              disabled={loading}
            />
            {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            {!isAddingNewCategory ? (
              <Select 
                value={formData.category} 
                onValueChange={handleCategorySelect}
                disabled={loading}
              >
                <SelectTrigger className={`w-full ${errors.category ? 'border-red-300' : ''}`}>
                  <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent className="bg-white z-[110]">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="add-new" className="text-green-600 font-medium">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add new category</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (errors.category) {
                      setErrors(prev => ({ ...prev, category: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter new category name"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewCategory(false);
                    setNewCategoryName('');
                    setErrors(prev => ({ ...prev, category: '' }));
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Cancel - Select existing category
                </button>
              </div>
            )}
            {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
          </div>

          <ColorSelector
            selectedColor={formData.colors.length === 1 ? formData.colors[0] : undefined}
            selectedColors={formData.colors.length > 1 ? formData.colors : undefined}
            onColorChange={handleColorChange}
            size="lg"
            multiSelect={true}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Printers
            </label>
            <textarea
              value={formData.printers}
              onChange={(e) => handleChange('printers', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter supported printer models separated by commas (e.g., HP LaserJet Pro, Canon PIXMA, Epson EcoTank)"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alias" className="text-sm font-medium">Alias</Label>
            <Input
              id="alias"
              value={formData.alias}
              onChange={(e) => handleChange('alias', e.target.value)}
              className="w-full"
              placeholder="e.g., 128A"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
