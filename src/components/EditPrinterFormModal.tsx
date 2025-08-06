import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Printer } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import PrinterSpecificationsForm from './PrinterSpecificationsForm';
import { v4 as uuidv4 } from 'uuid';

interface EditPrinterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: Printer;
  onPrinterUpdated: (printerData: Partial<Printer>) => void;
  isLoading?: boolean;
}

const EditPrinterFormModal: React.FC<EditPrinterFormModalProps> = ({
  isOpen,
  onClose,
  printer,
  onPrinterUpdated,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: printer.name || '',
    manufacturer: printer.manufacturer || '',
    model: printer.model || '',
    series: printer.series || '',
    color: printer.color || '',
    description: printer.description || '',
    image_url: printer.image_url || '',
    is_available: printer.is_available ?? true,
    rental_eligible: printer.rental_eligible ?? false,
    rental_price_per_month: printer.rental_price_per_month?.toString() || '',
    purchase_price: printer.purchase_price?.toString() || '',
    aliases: printer.aliases || '',
    // New specification fields
    print_resolution: printer.print_resolution || '',
    print_speed_bw: printer.print_speed_bw || '',
    print_speed_color: printer.print_speed_color || '',
    first_page_out_time: printer.first_page_out_time || '',
    input_tray_capacity: printer.input_tray_capacity || '',
    output_tray_capacity: printer.output_tray_capacity || '',
    supported_paper_sizes: printer.supported_paper_sizes || '',
    supported_paper_types: printer.supported_paper_types || '',
    automatic_duplex: printer.automatic_duplex ?? false,
    connectivity_usb: printer.connectivity_usb ?? false,
    connectivity_wifi: printer.connectivity_wifi ?? false,
    connectivity_wifi_direct: printer.connectivity_wifi_direct ?? false,
    connectivity_ethernet: printer.connectivity_ethernet ?? false,
    connectivity_bluetooth: printer.connectivity_bluetooth ?? false,
    connectivity_nfc: printer.connectivity_nfc ?? false,
    cloud_printing_support: printer.cloud_printing_support || '',
    driver_download_url: printer.driver_download_url || '',
    software_download_url: printer.software_download_url || '',
    user_manual_url: printer.user_manual_url || '',
    supported_os: printer.supported_os || '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(printer.image_url || '');
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch latest printer data from Supabase when modal opens or printer.id changes
  React.useEffect(() => {
    const fetchPrinter = async () => {
      if (isOpen && printer?.id) {
        setFetching(true);
        const { data, error } = await supabase.from('printers').select('*').eq('id', printer.id).single();
        if (data) {
          setFormData({
            name: data.name || '',
            manufacturer: data.manufacturer || '',
            model: data.model || '',
            series: data.series || '',
            color: data.color || '',
            description: data.description || '',
            image_url: data.image_url || '',
            is_available: data.is_available ?? true,
            rental_eligible: data.rental_eligible ?? false,
            rental_price_per_month: data.rental_price_per_month?.toString() || '',
            purchase_price: data.purchase_price?.toString() || '',
            aliases: data.aliases || '',
            // New specification fields
            print_resolution: data.print_resolution || '',
            print_speed_bw: data.print_speed_bw || '',
            print_speed_color: data.print_speed_color || '',
            first_page_out_time: data.first_page_out_time || '',
            input_tray_capacity: data.input_tray_capacity || '',
            output_tray_capacity: data.output_tray_capacity || '',
            supported_paper_sizes: data.supported_paper_sizes || '',
            supported_paper_types: data.supported_paper_types || '',
            automatic_duplex: data.automatic_duplex ?? false,
            connectivity_usb: data.connectivity_usb ?? false,
            connectivity_wifi: data.connectivity_wifi ?? false,
            connectivity_wifi_direct: data.connectivity_wifi_direct ?? false,
            connectivity_ethernet: data.connectivity_ethernet ?? false,
            connectivity_bluetooth: data.connectivity_bluetooth ?? false,
            connectivity_nfc: data.connectivity_nfc ?? false,
            cloud_printing_support: data.cloud_printing_support || '',
            driver_download_url: data.driver_download_url || '',
            software_download_url: data.software_download_url || '',
            user_manual_url: data.user_manual_url || '',
            supported_os: data.supported_os || '',
          });
          setImagePreview(data.image_url || '');
          setImageFile(null);
        }
        setFetching(false);
      }
    };
    fetchPrinter();
  }, [printer?.id, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setErrorMsg(null);
      setUploading(true);
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
          setErrorMsg(`Image upload failed: ${error.message || error}`);
          setUploading(false);
          return;
        }
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('printer-images')
          .getPublicUrl(fileName);
        const publicUrl = urlData?.publicUrl || '';
        setImagePreview(publicUrl);
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
        setImageFile(null); // Remove file from state after upload
      } catch (err: any) {
        setErrorMsg(`Image upload failed. ${err?.message || err}`);
      }
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (uploading) return;
    const updateData: Partial<Printer> = {
      name: formData.name,
      manufacturer: formData.manufacturer,
      model: formData.model,
      series: formData.series,
      color: formData.color,
      description: formData.description,
      image_url: formData.image_url,
      is_available: formData.is_available,
      rental_eligible: formData.rental_eligible,
      aliases: formData.aliases,
      rental_price_per_month: formData.rental_price_per_month ? parseFloat(formData.rental_price_per_month.toString()) : null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price.toString()) : null,
      // New specification fields
      print_resolution: formData.print_resolution,
      print_speed_bw: formData.print_speed_bw,
      print_speed_color: formData.print_speed_color,
      first_page_out_time: formData.first_page_out_time,
      input_tray_capacity: formData.input_tray_capacity,
      output_tray_capacity: formData.output_tray_capacity,
      supported_paper_sizes: formData.supported_paper_sizes,
      supported_paper_types: formData.supported_paper_types,
      automatic_duplex: formData.automatic_duplex,
      connectivity_usb: formData.connectivity_usb,
      connectivity_wifi: formData.connectivity_wifi,
      connectivity_wifi_direct: formData.connectivity_wifi_direct,
      connectivity_ethernet: formData.connectivity_ethernet,
      connectivity_bluetooth: formData.connectivity_bluetooth,
      connectivity_nfc: formData.connectivity_nfc,
      cloud_printing_support: formData.cloud_printing_support,
      driver_download_url: formData.driver_download_url,
      software_download_url: formData.software_download_url,
      user_manual_url: formData.user_manual_url,
      supported_os: formData.supported_os,
    };
    // Update printer record in Supabase
    try {
      const { error } = await supabase
        .from('printers')
        .update(updateData)
        .eq('id', printer.id);
      if (error) throw error;
      onPrinterUpdated(updateData);
    } catch (err: any) {
      setErrorMsg('Failed to update printer. Please try again.');
    }
  };

  if (!isOpen) return null;

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading printer info...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Printer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="series">Series</Label>
                  <Input
                    id="series"
                    value={formData.series}
                    onChange={(e) => handleInputChange('series', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Printer Image</Label>
                  <div className="flex items-center gap-4 mt-1">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Printer Preview" className="w-24 h-24 object-cover rounded border" />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-gray-600 hover:text-red-600"
                          onClick={handleRemoveImage}
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded cursor-pointer hover:border-blue-400">
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{imageFile ? 'Image will be uploaded on save.' : 'Current image will be kept unless changed.'}</p>
                  <Label htmlFor="image_url" className="mt-2">Or Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    placeholder="https://..."
                    disabled={!!imageFile}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="aliases">Aliases (comma-separated)</Label>
                <Input
                  id="aliases"
                  value={formData.aliases}
                  onChange={(e) => handleInputChange('aliases', e.target.value)}
                  placeholder="Alternative names, separated by commas"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rental_price_per_month">Monthly Rental Price</Label>
                  <Input
                    id="rental_price_per_month"
                    type="number"
                    step="0.01"
                    value={formData.rental_price_per_month}
                    onChange={(e) => handleInputChange('rental_price_per_month', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="purchase_price">Purchase Price</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_available">Available for Assignment</Label>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="rental_eligible">Rental Eligible</Label>
                  <Switch
                    id="rental_eligible"
                    checked={formData.rental_eligible}
                    onCheckedChange={(checked) => handleInputChange('rental_eligible', checked)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <PrinterSpecificationsForm
                formData={formData}
                onInputChange={handleInputChange}
              />
            </TabsContent>
          </Tabs>

          {errorMsg && (
            <div className="text-red-500 text-sm mb-2">{errorMsg}</div>
          )}

          <div className="flex space-x-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || uploading} className="flex-1">
              {isLoading || uploading ? 'Updating...' : 'Update Printer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPrinterFormModal;
