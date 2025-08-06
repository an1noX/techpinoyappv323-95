import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, ShoppingCart, Plus, ArrowLeft } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { productService } from '@/services/productService';
import { printerService } from '@/services/printerService';
import ColorSelector from '@/components/ColorSelector';

interface AddProductToClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quotedPrice: z.coerce.number().min(0, 'Price cannot be negative'),
});

type FormValues = z.infer<typeof formSchema>;

const AddProductToClientDialog: React.FC<AddProductToClientDialogProps> = ({
  isOpen,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'select' | 'add'>('select'); // Toggle between views
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { toast } = useToast();

  // Product form data for adding new product
  const [newProductData, setNewProductData] = useState({
    name: '',
    sku: '',
    category: '',
    printers: '',
    colors: [] as string[],
    alias: '',
  });
  const [newProductErrors, setNewProductErrors] = useState<Record<string, string>>({});
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      quotedPrice: 0,
    },
  });

  // Filter products based on search query and put newly created products at the top
  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by creation date (newest first) then by name
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    form.setValue('productId', product.id);
  };

  const handleSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Check if product-client relationship already exists
      const { data: existingRelation, error: checkError } = await supabase
        .from('product_clients')
        .select('id')
        .eq('product_id', data.productId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRelation) {
        toast({
          title: "Product Already Added",
          description: "This product is already linked to this client.",
          variant: "destructive",
        });
        return;
      }

      // Create new product-client relationship
      const { error: insertError } = await supabase
        .from('product_clients')
        .insert({
          product_id: data.productId,
          client_id: clientId,
          quoted_price: data.quotedPrice,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Product has been added to client successfully.",
      });

      onSuccess();
      onClose();
      handleReset();
    } catch (error) {
      console.error('Error adding product to client:', error);
      toast({
        title: "Error",
        description: "Failed to add product to client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setSearchQuery('');
    setSelectedProduct(null);
    setView('select');
    setNewProductData({ name: '', sku: '', category: '', printers: '', colors: [], alias: '' });
    setNewProductErrors({});
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleAddNewProduct = () => {
    setView('add');
    setNewProductData(prev => ({
      ...prev,
      name: searchQuery,
      sku: searchQuery,
    }));
  };

  const handleBackToSelect = () => {
    setView('select');
    setNewProductErrors({});
  };

  const handleNewProductChange = (field: string, value: string) => {
    setNewProductData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-fill SKU when Product Name changes, unless SKU was manually edited
      if (field === 'name' && (prev.sku === prev.name || prev.sku === '')) {
        newData.sku = value;
      }
      
      return newData;
    });
    
    if (newProductErrors[field]) {
      setNewProductErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleColorChange = (colors: string[] | string) => {
    setNewProductData(prev => ({ ...prev, colors: Array.isArray(colors) ? colors : [colors] }));
  };

  const handleCategorySelect = (value: string) => {
    if (value === 'add-new') {
      setIsAddingNewCategory(true);
      setNewProductData(prev => ({ ...prev, category: '' }));
    } else {
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      setNewProductData(prev => ({ ...prev, category: value }));
    }
    
    if (newProductErrors.category) {
      setNewProductErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleCreateProduct = async () => {
    const errors: Record<string, string> = {};
    
    if (!newProductData.name.trim()) errors.name = 'Product name is required';
    if (!newProductData.sku.trim()) errors.sku = 'SKU is required';
    
    let finalCategory = newProductData.category;
    if (isAddingNewCategory) {
      if (!newCategoryName.trim()) {
        errors.category = 'New category name is required';
      } else {
        finalCategory = newCategoryName.trim();
      }
    } else if (!newProductData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!newProductData.colors || newProductData.colors.length === 0) {
      errors.colors = 'Select at least one color';
    }
    
    if (Object.keys(errors).length > 0) {
      setNewProductErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const printerNames = newProductData.printers
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      
      let createdProductId = '';
      
      if (newProductData.colors.length === 1) {
        const newProduct = await productService.createProduct({
          name: newProductData.name.trim(),
          sku: newProductData.sku.trim(),
          category: finalCategory,
          color: newProductData.colors[0],
          alias: newProductData.alias.trim(),
        });
        createdProductId = newProduct.id;
        
        for (const printerName of printerNames) {
          let printer = await printerService.findOrCreatePrinter(printerName);
          await supabase.from('product_printers').insert({ 
            product_id: newProduct.id, 
            printer_id: printer.id 
          });
        }
      } else {
        // For multiple colors, create the first one and use its ID
        for (let i = 0; i < newProductData.colors.length; i++) {
          const newProduct = await productService.createProduct({
            name: newProductData.name.trim(),
            sku: newProductData.sku.trim(),
            category: finalCategory,
            color: newProductData.colors[i],
            alias: newProductData.alias.trim(),
          });
          
          if (i === 0) createdProductId = newProduct.id; // Use first product ID
          
          for (const printerName of printerNames) {
            let printer = await printerService.findOrCreatePrinter(printerName);
            await supabase.from('product_printers').insert({ 
              product_id: newProduct.id, 
              printer_id: printer.id 
            });
          }
        }
      }
      
      toast({
        title: "Success",
        description: newProductData.colors.length === 1 ? "Product created successfully!" : "All product variants created!",
      });

      // Refresh products list
      await refetchProducts();
      
      // Auto-select the newly created product
      // We'll find it in the current products list since we just refreshed
      setTimeout(() => {
        const newProduct = products.find(p => p.id === createdProductId);
        if (newProduct) {
          handleProductSelect(newProduct);
        }
      }, 100); // Small delay to ensure products state is updated
      
      // Switch back to select view
      setView('select');
      setNewProductData({ name: '', sku: '', category: '', printers: '', colors: [], alias: '' });
      setNewProductErrors({});
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      
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
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            {view === 'add' && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 mr-2"
                onClick={handleBackToSelect}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            {view === 'select' ? 'Add Product to Client' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {view === 'select' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Search input */}
                <div>
                  <FormLabel>Search Products</FormLabel>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-3 h-11 text-sm"
                    placeholder="Search products to add..."
                  />
                </div>

                {/* Product selection */}
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Product</FormLabel>
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto">
                        {productsLoading ? (
                          <div className="p-4 text-center text-gray-500">
                            Loading products...
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            {searchQuery ? 'No products found' : 'No products available'}
                          </div>
                        ) : (
                          filteredProducts.map(product => (
                            <div
                              key={product.id}
                              className={`flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 transition cursor-pointer ${
                                selectedProduct?.id === product.id ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                              onClick={() => handleProductSelect(product)}
                            >
                              <div className="flex items-center gap-3 w-full min-w-0">
                                {product.color && (
                                  <span 
                                    className="inline-block w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                    title={product.color}
                                    style={{ backgroundColor: product.color }}
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 text-sm truncate">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    SKU: {product.sku} • {product.category}
                                  </div>
                                </div>
                                {selectedProduct?.id === product.id && (
                                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        
                        {/* Add new item button */}
                        <div className="p-3 border-t border-gray-200">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full h-11 text-green-600 hover:text-green-700 hover:bg-green-50 justify-start"
                            onClick={handleAddNewProduct}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add new item
                          </Button>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price input - only show when product is selected */}
                {selectedProduct && (
                  <FormField
                    control={form.control}
                    name="quotedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quoted Price for {selectedProduct.name}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                            <Input
                              type="number"
                              step="0.01"
                              className="pl-8 h-11"
                              placeholder="0.00"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-none h-11"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none h-11"
                    disabled={isLoading || !selectedProduct}
                  >
                    {isLoading ? 'Adding...' : 'Add Product'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            /* Add Product Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <Input
                  value={newProductData.name}
                  onChange={(e) => handleNewProductChange('name', e.target.value)}
                  className={newProductErrors.name ? 'border-red-300' : ''}
                  placeholder="Enter product name"
                  disabled={isLoading}
                />
                {newProductErrors.name && <p className="text-red-600 text-sm mt-1">{newProductErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <Input
                  value={newProductData.sku}
                  onChange={(e) => handleNewProductChange('sku', e.target.value)}
                  className={newProductErrors.sku ? 'border-red-300' : ''}
                  placeholder="Enter SKU"
                  disabled={isLoading}
                />
                {newProductErrors.sku && <p className="text-red-600 text-sm mt-1">{newProductErrors.sku}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                {!isAddingNewCategory ? (
                  <Select 
                    value={newProductData.category} 
                    onValueChange={handleCategorySelect}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={newProductErrors.category ? 'border-red-300' : ''}>
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
                    <Input
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        if (newProductErrors.category) {
                          setNewProductErrors(prev => ({ ...prev, category: '' }));
                        }
                      }}
                      className={newProductErrors.category ? 'border-red-300' : ''}
                      placeholder="Enter new category name"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(false);
                        setNewCategoryName('');
                        setNewProductErrors(prev => ({ ...prev, category: '' }));
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                      disabled={isLoading}
                    >
                      Cancel - Select existing category
                    </button>
                  </div>
                )}
                {newProductErrors.category && <p className="text-red-600 text-sm mt-1">{newProductErrors.category}</p>}
              </div>

              <ColorSelector
                selectedColor={newProductData.colors.length === 1 ? newProductData.colors[0] : undefined}
                selectedColors={newProductData.colors.length > 1 ? newProductData.colors : undefined}
                onColorChange={handleColorChange}
                size="lg"
                multiSelect={true}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supported Printers
                </label>
                <textarea
                  value={newProductData.printers}
                  onChange={(e) => handleNewProductChange('printers', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter supported printer models separated by commas"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alias</label>
                <Input
                  value={newProductData.alias}
                  onChange={(e) => handleNewProductChange('alias', e.target.value)}
                  placeholder="e.g., 128A"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none h-11"
                  onClick={handleBackToSelect}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateProduct}
                  className="flex-1 sm:flex-none h-11"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductToClientDialog;