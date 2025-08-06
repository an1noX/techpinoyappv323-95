
import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { printerService } from '@/services/printerService';
import { productService } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterAdded: () => void;
}

const AddPrinterModal: React.FC<AddPrinterModalProps> = ({
  isOpen,
  onClose,
  onPrinterAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    series: '',
    color: '',
    description: '',
    image_url: '',
  });
  const [supportedProducts, setSupportedProducts] = useState<{ id: string, name: string, color?: string }[]>([]);
  const [productInput, setProductInput] = useState('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [nameExists, setNameExists] = useState(false);
  const { toast } = useToast();

  const colorOptions = [
    { value: 'CMYK', label: 'CMYK (Color)' },
    { value: 'Monochrome', label: 'Monochrome (Black Only)' }
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        name: '',
        manufacturer: '',
        model: '',
        series: '',
        color: '',
        description: '',
        image_url: '',
      });
      setSupportedProducts([]);
      setProductInput('');
      setImageFile(null);
      setImagePreview('');
      setNameExists(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadAvailableProducts();
  }, []);

  // Check if printer name exists
  const checkPrinterNameExists = async (name: string) => {
    if (!name.trim()) {
      setNameExists(false);
      return;
    }

    try {
      const existingPrinters = await printerService.searchPrinters(name.trim());
      const exactMatch = existingPrinters.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
      setNameExists(!!exactMatch);
    } catch (error) {
      console.error('Error checking printer name:', error);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const products = await productService.getProducts();
      setAvailableProducts(products);
    } catch (error) {
      console.error('Failed to load available products:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nameExists) {
      toast({
        title: "Error",
        description: "A printer with this name already exists. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Printer name is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Double-check for duplicates before creating
      const existingPrinters = await printerService.searchPrinters(formData.name.trim());
      const exactMatch = existingPrinters.find(p => p.name.toLowerCase() === formData.name.trim().toLowerCase());
      
      if (exactMatch) {
        toast({
          title: "Error",
          description: "A printer with this name already exists. Please choose a different name.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create printer with either uploaded image URL or provided URL
      let finalImageUrl = formData.image_url;
      
      // For now, if an image file is selected, we'll use a placeholder
      // In a real implementation, you'd upload to a service like Supabase Storage
      if (imageFile && !formData.image_url) {
        finalImageUrl = imagePreview; // Use the data URL for now
      }

      const newPrinter = await printerService.createPrinter({
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim() || null,
        model: formData.model.trim() || null,
        series: formData.series.trim() || null,
        color: formData.color || null,
        description: formData.description.trim() || null,
        image_url: finalImageUrl || null,
      });

      // Add supported products if any
      if (supportedProducts.length > 0) {
        const productIds = supportedProducts.map(p => p.id);
        await printerService.updatePrinterProducts(newPrinter.id, productIds);
      }

      toast({
        title: "Success",
        description: "Printer added successfully!",
      });

      onPrinterAdded();
      onClose();
    } catch (error: any) {
      console.error('Failed to add printer:', error);
      
      let errorMessage = "Failed to add printer. Please try again.";
      
      if (error?.code === '23505' && error?.details?.includes('printers_name_key')) {
        errorMessage = "A printer with this name already exists. Please choose a different name.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check for duplicate names when name field changes
    if (name === 'name') {
      checkPrinterNameExists(value);
    }
  };

  const handleColorChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      color: value
    }));
  };

  const handleProductInputChange = (value: string) => {
    setProductInput(value);
    setShowProductDropdown(value.length > 0);
  };

  const addProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;
    // Prevent duplicate (same id)
    if (!supportedProducts.some(p => p.id === product.id)) {
      setSupportedProducts(prev => [...prev, { id: product.id, name: product.name, color: product.color }]);
    }
    setProductInput('');
    setShowProductDropdown(false);
  };

  const removeProduct = (productId: string) => {
    setSupportedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleProductInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmedValue = productInput.trim();
      if (trimmedValue) {
        addProduct(trimmedValue);
      }
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productInput.toLowerCase()) &&
    !supportedProducts.some(p => p.id === product.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Printer</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Printer Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                nameExists ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter printer name"
            />
            {nameExists && (
              <p className="mt-1 text-sm text-red-600">
                A printer with this name already exists. Please choose a different name.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
              Make/Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="e.g., HP, Canon, Epson"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="e.g., LaserJet Pro M404n"
            />
          </div>

          <div>
            <label htmlFor="series" className="block text-sm font-medium text-gray-700 mb-1">
              Series
            </label>
            <input
              type="text"
              id="series"
              name="series"
              value={formData.series}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="e.g., LaserJet Pro, PIXMA, MFP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Variation
            </label>
            <Select value={formData.color} onValueChange={handleColorChange} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select color type" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Enter printer description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Printer Image
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> printer image
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div className="text-center text-sm text-gray-500">OR</div>
              
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="https://example.com/printer-image.jpg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supported Products
            </label>
            <div className="relative">
              <input
                type="text"
                value={productInput}
                onChange={(e) => handleProductInputChange(e.target.value)}
                onKeyPress={handleProductInputKeyPress}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="Type product name and press Enter or comma"
              />
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredProducts.slice(0, 5).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                    >
                      {product.color && (
                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: product.color, display: 'inline-block' }} />
                      )}
                      {product.name}
                      {product.sku && (
                        <span className="ml-1 text-gray-400">({product.sku})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {supportedProducts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {supportedProducts.map((product) => (
                  <span
                    key={product.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 gap-1"
                  >
                    {product.color && (
                      <span className="w-3 h-3 rounded-full border border-gray-300 mr-1" style={{ backgroundColor: product.color, display: 'inline-block' }} />
                    )}
                    {product.name}
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Type product names and press Enter or comma to add them
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || nameExists}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Printer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPrinterModal;
