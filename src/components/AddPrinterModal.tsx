import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Check, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { printerService } from '@/services/printerService';
import { useToast } from '@/hooks/use-toast';
import { Printer } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [colorType, setColorType] = useState<'colored' | 'monochrome' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCustomManufacturer, setShowCustomManufacturer] = useState(false);
  const [customManufacturer, setCustomManufacturer] = useState('');
  const [showCustomSeries, setShowCustomSeries] = useState(false);
  const [customSeries, setCustomSeries] = useState('');
  const [seriesOptions, setSeriesOptions] = useState<string[]>([]);

  // Predefined manufacturer options
  const manufacturerOptions = [
    'HP', 'Brother', 'Samsung', 'Canon', 'Epson', 'Xerox', 'Lexmark', 'Dell', 'Ricoh', 'Kyocera'
  ];

  // Printer types
  const printerTypes = [
    'Print Only',
    'Multifunction',
    'Scanner Only',
    'Copy Only'
  ];

  // Technology types
  const technologyTypes = [
    'laser',
    'inkjet',
    'dot-matrix',
    'thermal'
  ];

  // Common paper sizes
  const paperSizes = ['A4', 'A3', 'A5', 'Letter', 'Legal', 'Executive', 'Folio'];
  
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    series: '',
    color: '',
    printer_type: 'Print Only', // Default to "Print Only"
    technology_type: 'laser', // Default to "laser"
    image_url: '',
    is_available: true,
    supported_paper_sizes: 'A4, Letter, Legal, Folio', // Default paper sizes
    connectivity_usb: true, // Default USB enabled
    connectivity_wifi: false,
    connectivity_wifi_direct: false,
    connectivity_ethernet: false,
  });

  // Generate printer name automatically
  const generatePrinterName = () => {
    const parts = [];
    if (formData.manufacturer) parts.push(formData.manufacturer);
    if (formData.series) parts.push(formData.series);
    if (formData.model) parts.push(formData.model);
    return parts.join(' ') || 'New Printer';
  };

  const printerName = generatePrinterName();

  // Parse selected paper sizes from string to array
  const selectedPaperSizes = formData.supported_paper_sizes 
    ? formData.supported_paper_sizes.split(',').map(size => size.trim()).filter(size => size)
    : [];

  // Check if series contains DCP or MFC (multifunction indicators)
  const isMultifunction = (series: string) => {
    return /\b(DCP|MFC)\b/i.test(series);
  };

  // Update printer type and technology based on series
  useEffect(() => {
    if (formData.series) {
      if (isMultifunction(formData.series)) {
        setFormData(prev => ({
          ...prev,
          printer_type: 'Multifunction',
          technology_type: 'multifunction'
        }));
      } else {
        // Reset to defaults if not multifunction
        setFormData(prev => ({
          ...prev,
          printer_type: 'Print Only',
          technology_type: 'laser'
        }));
      }
    }
  }, [formData.series]);

  // Handle paper size checkbox changes
  const handlePaperSizeChange = (paperSize: string, checked: boolean) => {
    let updatedSizes = [...selectedPaperSizes];
    
    if (checked) {
      if (!updatedSizes.includes(paperSize)) {
        updatedSizes.push(paperSize);
      }
    } else {
      updatedSizes = updatedSizes.filter(size => size !== paperSize);
    }
    
    const sizesString = updatedSizes.join(', ');
    handleInputChange('supported_paper_sizes', sizesString);
  };

  // Fetch existing series options when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSeriesOptions();
    }
  }, [isOpen]);

  const fetchSeriesOptions = async (manufacturer?: string) => {
    try {
      const series = await printerService.getUniqueSeries(manufacturer);
      setSeriesOptions(series.filter(s => s && s.trim() !== ''));
    } catch (error) {
      console.error('Error fetching series options:', error);
      setSeriesOptions([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManufacturerChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomManufacturer(true);
      setCustomManufacturer('');
      handleInputChange('manufacturer', '');
      setSeriesOptions([]);
      handleInputChange('series', '');
    } else {
      setShowCustomManufacturer(false);
      setCustomManufacturer('');
      handleInputChange('manufacturer', value);
      fetchSeriesOptions(value);
      handleInputChange('series', '');
    }
  };

  const handleCustomManufacturerChange = (value: string) => {
    setCustomManufacturer(value);
    handleInputChange('manufacturer', value);
    
    if (value && value.trim() !== '') {
      fetchSeriesOptions(value.trim());
    } else {
      setSeriesOptions([]);
    }
    
    handleInputChange('series', '');
  };

  const handleSeriesChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomSeries(true);
      setCustomSeries('');
      handleInputChange('series', '');
    } else {
      setShowCustomSeries(false);
      setCustomSeries('');
      handleInputChange('series', value);
    }
  };

  const handleCustomSeriesChange = (value: string) => {
    setCustomSeries(value);
    handleInputChange('series', value);
  };

  const handleColorTypeChange = (type: 'colored' | 'monochrome') => {
    setColorType(type);
    if (type === 'colored') {
      handleInputChange('color', 'CYMK');
    } else if (type === 'monochrome') {
      handleInputChange('color', 'Monochrome');
    }
  };

  // FIXED: Handle image selection for preview only (no upload yet)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file (PNG, JPG, JPEG, GIF)',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive'
        });
        return;
      }

      // Store file for later upload and create preview
      setImageFile(file);
      setErrorMsg(null);
      
      // Create temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear any existing image URL since we're using a file now
      handleInputChange('image_url', '');
    }
  };

  // FIXED: Upload image to Supabase storage (only called during form submission)
  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('printer-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
        
      if (error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }
      
      const { data: urlData } = supabase.storage
        .from('printer-images')
        .getPublicUrl(fileName);
        
      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleRemoveImage = () => {
    // Clean up preview URL to prevent memory leaks
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImageFile(null);
    setImagePreview('');
    handleInputChange('image_url', '');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.manufacturer?.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a manufacturer',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.model?.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a model',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      let finalImageUrl = formData.image_url;

      // FIXED: Upload image only when form is being submitted
      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToStorage(imageFile);
          
          if (finalImageUrl) {
            toast({
              title: 'Image Uploaded',
              description: 'Image uploaded successfully',
            });
          }
        } catch (uploadError: any) {
          // Handle image upload error
          setErrorMsg(`Image upload failed: ${uploadError.message}`);
          toast({
            title: 'Upload Failed',
            description: uploadError.message || 'Failed to upload image',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
      }

      // Create printer data with uploaded image URL
      const printerData: Omit<Printer, 'id' | 'created_at' | 'updated_at'> = {
        name: printerName,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        series: formData.series || null,
        color: formData.color || null,
        printer_type: formData.printer_type || null,
        description: null,
        image_url: finalImageUrl || null,
        rental_status: null,
        rental_price_per_month: null,
        rental_start_date: null,
        rental_end_date: null,
        rental_eligible: false, // Fixed: Added the missing value
        rental_price_type: null,
        rental_price_per_print: null,
        purchase_price: null,
        status: 'active',
        is_available: formData.is_available,
        aliases: null,
        location_count: null,
        automatic_duplex: null,
        connectivity_usb: formData.connectivity_usb,
        connectivity_wifi: formData.connectivity_wifi,
        connectivity_wifi_direct: formData.connectivity_wifi_direct,
        connectivity_ethernet: formData.connectivity_ethernet,
        connectivity_bluetooth: false,
        connectivity_nfc: false,
        cloud_printing_support: null,
        driver_download_url: null,
        software_download_url: null,
        user_manual_url: null,
        supported_os: null,
        print_resolution: null,
        print_speed_bw: null,
        print_speed_color: null,
        first_page_out_time: null,
        input_tray_capacity: null,
        output_tray_capacity: null,
        supported_paper_sizes: formData.supported_paper_sizes || null,
        supported_paper_types: null,
      };

      const createdPrinter = await printerService.createPrinter(printerData);

      // Automatically add to inventory as service unit
      await printerService.createPrinterAssignment({
        printer_id: createdPrinter.id,
        client_id: null,
        serial_number: null,
        usage_type: 'service_unit',
        status: 'available',
        deployment_date: null,
        department_location_id: null,
        is_client_owned: false,
      });
      
      toast({
        title: 'Success',
        description: 'Printer added to catalog and inventory successfully'
      });
      
      onPrinterAdded();
      onClose();
      
      // Clean up and reset form
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setFormData({
        manufacturer: '',
        model: '',
        series: '',
        color: '',
        printer_type: 'Print Only', // Reset to default
        technology_type: 'laser', // Reset to default
        image_url: '',
        is_available: true,
        supported_paper_sizes: 'A4, Letter, Legal, Folio', // Reset to defaults
        connectivity_usb: true, // Reset to default (enabled)
        connectivity_wifi: false,
        connectivity_wifi_direct: false,
        connectivity_ethernet: false,
      });
      
      setShowCustomManufacturer(false);
      setCustomManufacturer('');
      setShowCustomSeries(false);
      setCustomSeries('');
      setColorType(null);
      setImageFile(null);
      setImagePreview('');
      setErrorMsg(null);
    
    } catch (error: any) {
      console.error('Error adding printer:', error);
      
      let errorMessage = 'Failed to add printer. Please try again.';
      let errorTitle = 'Error';
      
      if (error.code === '23505' || 
          error.message?.toLowerCase().includes('duplicate key') ||
          error.message?.toLowerCase().includes('unique constraint') ||
          error.message?.toLowerCase().includes('already exists')) {
        
        errorTitle = 'Duplicate Printer';
        const errorText = (error.message || '').toLowerCase();
        
        if (errorText.includes('unique_printer_name') || 
            (errorText.includes('name') && errorText.includes('duplicate'))) {
          errorMessage = `A printer named "${printerName}" already exists. Please choose different values.`;
        } else if (errorText.includes('unique_printer_model') || 
                   (errorText.includes('model') && errorText.includes('duplicate'))) {
          errorMessage = `A printer with model "${formData.model?.trim() || ''}" already exists. Please choose a different model.`;
        } else {
          errorMessage = 'A printer with the same name or model already exists. Please use different values.';
        }
      } else if (error.message?.includes('permission denied') || error.message?.includes('unauthorized')) {
        errorTitle = 'Permission Error';
        errorMessage = 'You do not have permission to add printers. Please contact your administrator.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorTitle = 'Connection Error';
        errorMessage = 'Network error occurred. Please check your connection and try again.';
      }
      
      setErrorMsg(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Clean up preview URL when modal closes
  const handleClose = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    onClose();
  };

  // FIXED: Clean up preview URL on component unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      {/* Mobile-first modal container */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-lg sm:rounded-2xl sm:shadow-2xl flex flex-col">
        
        {/* Header with Auto-Generated Printer Name */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 sm:rounded-t-2xl">
          <div className="p-4 text-center">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {printerName}
            </h2>
            <p className="text-sm text-gray-500">
              {printerName === 'New Printer' 
                ? 'Enter details to generate printer name' 
                : 'Auto-generated from manufacturer, series & model'
              }
            </p>
          </div>
        </div>

        {/* Scrollable Content - Hierarchy Order */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            
            {/* 1. Printer Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Printer Image
              </Label>
              
              <div className="flex items-center gap-3">
                {imagePreview || formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={imagePreview || formData.image_url} 
                      alt="Printer Preview" 
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Show preview indicator */}
                    {imageFile && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 bg-opacity-90 text-white text-xs px-1 py-0.5 rounded-b-lg text-center">
                        Preview
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="h-5 w-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={isLoading}
                    />
                  </label>
                )}
                
                <div className="flex-1">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => {
                      handleInputChange('image_url', e.target.value);
                      // Clear file preview if URL is entered
                      if (e.target.value && imageFile) {
                        if (imagePreview && imagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(imagePreview);
                        }
                        setImageFile(null);
                        setImagePreview('');
                      }
                    }}
                    placeholder="Or paste image URL..."
                    className="h-11"
                    disabled={!!imageFile || isLoading}
                  />
                </div>
              </div>
              
              {/* Show file info when file is selected */}
              {imageFile && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  📁 {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB) - Will upload when printer is saved
                </div>
              )}
              
              {errorMsg && (
                <div className="text-red-500 text-sm">{errorMsg}</div>
              )}
            </div>

            {/* 2. Model */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium text-gray-900">
                Model *
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
                className="h-11"
                placeholder="e.g., M404dn, P1006, TS3520"
              />
              <p className="text-xs text-gray-500">
                Enter only the model number (e.g., M404dn, P1006) without manufacturer or series
              </p>
            </div>

            {/* 3. Manufacturer */}
            <div className="space-y-2">
              <Label htmlFor="manufacturer" className="text-sm font-medium text-gray-900">
                Manufacturer *
              </Label>
              {!showCustomManufacturer ? (
                <Select value={formData.manufacturer} onValueChange={handleManufacturerChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select manufacturer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturerOptions.map((manufacturer) => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="border-t mt-1 pt-2">
                      <div className="flex items-center">
                        <Plus className="h-3 w-3 mr-2" />
                        Add Custom Manufacturer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={customManufacturer}
                    onChange={(e) => handleCustomManufacturerChange(e.target.value)}
                    className="h-11"
                    placeholder="Enter custom manufacturer"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomManufacturer(false);
                        setCustomManufacturer('');
                        handleInputChange('manufacturer', '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (customManufacturer.trim()) {
                          setShowCustomManufacturer(false);
                        }
                      }}
                      disabled={!customManufacturer.trim()}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Confirm
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Series */}
            <div className="space-y-2">
              <Label htmlFor="series" className="text-sm font-medium text-gray-900">
                Series
              </Label>
              {!showCustomSeries ? (
                <Select 
                  value={formData.series} 
                  onValueChange={handleSeriesChange}
                  disabled={!formData.manufacturer}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue 
                      placeholder={
                        !formData.manufacturer 
                          ? "Select manufacturer first..." 
                          : seriesOptions.length === 0 
                            ? "No series found"
                            : "Select series..."
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesOptions.length > 0 ? (
                      <>
                        {seriesOptions.map((series) => (
                          <SelectItem key={series} value={series}>
                            {series}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom" className="border-t mt-1 pt-2">
                          <div className="flex items-center">
                            <Plus className="h-3 w-3 mr-2" />
                            Add Custom Series
                          </div>
                        </SelectItem>
                      </>
                    ) : formData.manufacturer ? (
                      <SelectItem value="custom">
                        <div className="flex items-center">
                          <Plus className="h-3 w-3 mr-2" />
                          Add New Series for {formData.manufacturer}
                        </div>
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={customSeries}
                    onChange={(e) => handleCustomSeriesChange(e.target.value)}
                    className="h-11"
                    placeholder={`Enter series for ${formData.manufacturer}`}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomSeries(false);
                        setCustomSeries('');
                        handleInputChange('series', '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (customSeries.trim()) {
                          setShowCustomSeries(false);
                        }
                      }}
                      disabled={!customSeries.trim()}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Confirm
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Color Type (renumbered from 7) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Color Type
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="colorType"
                    checked={colorType === 'colored'}
                    onChange={() => handleColorTypeChange('colored')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Colored (CYMK)</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="colorType"
                    checked={colorType === 'monochrome'}
                    onChange={() => handleColorTypeChange('monochrome')}
                    className="h-4 w-4 text-gray-600"
                  />
                  <span className="text-sm">Monochrome</span>
                </label>
              </div>
            </div>

            {/* 6. Connectivity Options (renumbered from 8) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Connectivity Options
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-between cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                  <span className="text-sm">USB</span>
                  <Switch
                    checked={formData.connectivity_usb || false}
                    onCheckedChange={(checked) => handleInputChange('connectivity_usb', checked)}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Wi-Fi</span>
                  <Switch
                    checked={formData.connectivity_wifi || false}
                    onCheckedChange={(checked) => handleInputChange('connectivity_wifi', checked)}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Wi-Fi Direct</span>
                  <Switch
                    checked={formData.connectivity_wifi_direct || false}
                    onCheckedChange={(checked) => handleInputChange('connectivity_wifi_direct', checked)}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Ethernet</span>
                  <Switch
                    checked={formData.connectivity_ethernet || false}
                    onCheckedChange={(checked) => handleInputChange('connectivity_ethernet', checked)}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                </label>
              </div>
            </div>

            {/* 7. Supported Paper Sizes (renumbered from 9) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Supported Paper Sizes
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {paperSizes.map((paperSize) => (
                  <label key={paperSize} className="flex items-center space-x-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`paper-${paperSize}`}
                      checked={selectedPaperSizes.includes(paperSize)}
                      onCheckedChange={(checked) => handlePaperSizeChange(paperSize, checked as boolean)}
                    />
                    <span className="text-sm">{paperSize}</span>
                  </label>
                ))}
              </div>
              
              {selectedPaperSizes.length > 0 && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  Selected: {selectedPaperSizes.join(', ')}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 sm:rounded-b-2xl">
          <div className="p-4">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.manufacturer || !formData.model}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {imageFile ? 'Uploading & Adding...' : 'Adding...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Add Printer
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPrinterModal;
