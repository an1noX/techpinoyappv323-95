import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Edit, Plus, Trash2, Save, XCircle, Check, FileText, Package, DollarSign } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { productService } from '@/services/productService';
import { inventoryPurchaseService } from '@/services/inventoryPurchaseService';
import { supplierService } from '@/services/supplierService';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
interface InventoryPurchaseWithItems {
  id: string;
  supplier_name: string;
  purchase_date: string;
  reference_number: string;
  total_amount: number;
  notes?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  inventory_purchase_items: Array<{
    id: string;
    product_id?: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }>;
}
interface PurchaseInventoryPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: InventoryPurchaseWithItems;
}
export const PurchaseInventoryPreview: React.FC<PurchaseInventoryPreviewProps> = ({
  isOpen,
  onClose,
  purchaseOrder
}) => {
  const isMobile = useIsMobile();
  const {
    userProfile
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPurchaseOrder, setEditedPurchaseOrder] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [newItem, setNewItem] = useState<any>({
    product_id: '',
    product_name: '',
    quantity: 0,
    unit_cost: 0
  });
  const [withholdingTaxEnabled, setWithholdingTaxEnabled] = useState(false);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(2);
  const [discount, setDiscount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string>('due-on-receipt');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [pdfMode, setPdfMode] = useState<'quotation' | 'purchase' | null>(null);
  const [hidePrices, setHidePrices] = useState(false);

  // Soft state for item changes
  const [softEditedItems, setSoftEditedItems] = useState<any[]>([]);
  const [softAddedItems, setSoftAddedItems] = useState<any[]>([]);
  const [softDeletedItems, setSoftDeletedItems] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchSuppliers();
      setEditedPurchaseOrder(purchaseOrder);

      // Load saved tax settings from notes if they exist
      if (purchaseOrder.notes) {
        const taxSettingsMatch = purchaseOrder.notes.match(/\[TAX_SETTINGS: (.*?)\]/);
        if (taxSettingsMatch) {
          try {
            const savedSettings = JSON.parse(taxSettingsMatch[1]);
            setDiscount(savedSettings.discount || 0);
            setWithholdingTaxEnabled(savedSettings.withholdingTaxEnabled || false);
            setWithholdingTaxRate(savedSettings.withholdingTaxRate || 2);
            setSelectedPaymentTerms(savedSettings.paymentTerms || 'due-on-receipt');
          } catch (error) {
            console.error('Error parsing saved tax settings:', error);
          }
        }
      }

      // Reset all soft changes when opening
      setHasUnsavedChanges(false);
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
    }
  }, [isOpen, purchaseOrder]);
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchSuppliers = async () => {
    try {
      const suppliersData = await supplierService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };
  const handlePrint = () => {
    setIsEditing(false);
    setShowPrintOptions(true);
  };
  const handlePrintOptionSelect = async (type: 'quotation' | 'purchase') => {
    setShowPrintOptions(false);
    setPdfMode(type);
    try {
      // Wait a bit for the modal to close and mode to update
      await new Promise(resolve => setTimeout(resolve, 200));
      await generatePDF(type);
    } finally {
      // Reset PDF mode
      setPdfMode(null);
    }
  };
  const generatePDF = async (type: 'quotation' | 'purchase') => {
    const element = document.getElementById('inventory-purchase-preview');
    if (!element) {
      toast.error('Unable to find content to print');
      return;
    }
    try {
      // Create canvas from the element with high quality settings
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: clonedDoc => {
          const clonedElement = clonedDoc.getElementById('inventory-purchase-preview');
          if (clonedElement) {
            clonedElement.style.padding = '20px';
            clonedElement.style.backgroundColor = '#ffffff';
          }
        }
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      let remainingHeight = imgHeight - pageHeight;

      // Add additional pages if needed
      while (remainingHeight >= 0) {
        position = remainingHeight - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }

      // Generate filename based on type
      const docType = type === 'quotation' ? 'Price_Quotation' : 'Inventory_Purchase';

      // Open PDF in browser
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      toast.success(`${type === 'quotation' ? 'Price quotation' : 'Inventory purchase'} PDF opened in new tab!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset all changes when canceling edit
      setEditedPurchaseOrder(purchaseOrder);

      // Reset tax settings to saved values from notes if they exist
      if (purchaseOrder.notes) {
        const taxSettingsMatch = purchaseOrder.notes.match(/\[TAX_SETTINGS: (.*?)\]/);
        if (taxSettingsMatch) {
          try {
            const savedSettings = JSON.parse(taxSettingsMatch[1]);
            setDiscount(savedSettings.discount || 0);
            setWithholdingTaxEnabled(savedSettings.withholdingTaxEnabled || false);
            setWithholdingTaxRate(savedSettings.withholdingTaxRate || 2);
          } catch (error) {
            console.error('Error parsing saved tax settings:', error);
            setDiscount(0);
            setWithholdingTaxEnabled(false);
            setWithholdingTaxRate(2);
          }
        } else {
          setDiscount(0);
          setWithholdingTaxEnabled(false);
          setWithholdingTaxRate(2);
        }
      } else {
        setDiscount(0);
        setWithholdingTaxEnabled(false);
        setWithholdingTaxRate(2);
      }
      setHasUnsavedChanges(false);
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
    }
    setIsEditing(!isEditing);
  };
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Save purchase order changes
      if (editedPurchaseOrder) {
        await inventoryPurchaseService.updateInventoryPurchase(editedPurchaseOrder.id, {
          reference_number: editedPurchaseOrder.reference_number,
          notes: editedPurchaseOrder.notes,
          supplier_name: editedPurchaseOrder.supplier_name
        });
      }

      // Save tax and discount settings
      const taxSettings = {
        discount,
        withholdingTaxEnabled,
        withholdingTaxRate,
        paymentTerms: selectedPaymentTerms,
        savedAt: new Date().toISOString()
      };
      const updatedNotes = editedPurchaseOrder?.notes ? `${editedPurchaseOrder.notes}\n\n[TAX_SETTINGS: ${JSON.stringify(taxSettings)}]` : `[TAX_SETTINGS: ${JSON.stringify(taxSettings)}]`;
      await inventoryPurchaseService.updateInventoryPurchase(editedPurchaseOrder.id, {
        notes: updatedNotes
      });
      toast.success('Changes saved successfully');
      setHasUnsavedChanges(false);
      setSoftEditedItems([]);
      setSoftAddedItems([]);
      setSoftDeletedItems(new Set());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  const handleItemChange = (itemId: string, field: string, value: any) => {
    const updatedItem = {
      id: itemId,
      [field]: field === 'quantity' || field === 'unit_cost' ? Number(value) : value
    };
    setSoftEditedItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === itemId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...updatedItem
        };
        return updated;
      } else {
        return [...prev, updatedItem];
      }
    });
    setHasUnsavedChanges(true);
  };
  const handleAddItem = () => {
    if (!newItem.product_name || !newItem.quantity || !newItem.unit_cost) {
      toast.error('Please fill all required fields');
      return;
    }
    const selectedProduct = products.find(p => p.id === newItem.product_id);
    const tempItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      inventory_purchase_id: purchaseOrder.id,
      product_id: newItem.product_id,
      product_name: selectedProduct ? getProductDisplayName(selectedProduct) : newItem.product_name,
      quantity: Number(newItem.quantity),
      unit_cost: Number(newItem.unit_cost),
      total_cost: Number(newItem.quantity) * Number(newItem.unit_cost),
      isTemp: true
    };
    setSoftAddedItems(prev => [...prev, tempItem]);
    setNewItem({
      product_id: '',
      product_name: '',
      quantity: 0,
      unit_cost: 0
    });
    setHasUnsavedChanges(true);
    toast.success('Item added');
  };
  const handleDeleteItem = (itemId: string) => {
    const isSoftAddedItem = softAddedItems.some(item => item.id === itemId);
    if (isSoftAddedItem) {
      setSoftAddedItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item removed');
    } else {
      setSoftDeletedItems(prev => new Set([...prev, itemId]));
      toast.success('Item marked for deletion');
    }
    setHasUnsavedChanges(true);
  };
  const handlePurchaseOrderChange = async (field: string, value: string) => {
    if (editedPurchaseOrder) {
      setEditedPurchaseOrder({
        ...editedPurchaseOrder,
        [field]: value
      });
      setHasUnsavedChanges(true);

      // If supplier is changed, update all item prices
      if (field === 'supplier_name') {
        await updateItemPricesForSupplier(value);
      }
    }
  };
  const updateItemPricesForSupplier = async (supplierName: string) => {
    const selectedSupplier = suppliers.find(s => s.name === supplierName);
    if (!selectedSupplier) return;

    // Update prices for all existing items
    const updatedSoftEdits: any[] = [];
    for (const item of purchaseOrder.inventory_purchase_items || []) {
      if (item.product_id) {
        try {
          const productWithSuppliers = await productService.getProductWithSuppliers(item.product_id);
          if (productWithSuppliers && productWithSuppliers.suppliers) {
            const supplierEntry = productWithSuppliers.suppliers.find((s: any) => s.supplier_id === selectedSupplier.id);
            if (supplierEntry) {
              const newPrice = supplierEntry.current_price || supplierEntry.unit_price || 0;
              updatedSoftEdits.push({
                id: item.id,
                unit_cost: newPrice
              });
            }
          }
        } catch (error) {
          console.error('Error fetching price for product:', item.product_name, error);
        }
      }
    }

    // Update soft edited items with new prices
    setSoftEditedItems(prev => {
      const updated = [...prev];
      updatedSoftEdits.forEach(newEdit => {
        const existingIndex = updated.findIndex(item => item.id === newEdit.id);
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...newEdit
          };
        } else {
          updated.push(newEdit);
        }
      });
      return updated;
    });
    if (updatedSoftEdits.length > 0) {
      toast.success(`Updated prices for ${updatedSoftEdits.length} items based on selected supplier`);
    }
  };
  const handleDiscountChange = (value: number) => {
    setDiscount(value);
    setHasUnsavedChanges(true);
  };
  const handleWithholdingTaxToggle = (enabled: boolean) => {
    setWithholdingTaxEnabled(enabled);
    setHasUnsavedChanges(true);
  };
  const handleWithholdingTaxRateChange = (rate: number) => {
    setWithholdingTaxRate(rate);
    setHasUnsavedChanges(true);
  };
  const handlePaymentTermsChange = (value: string) => {
    setSelectedPaymentTerms(value);
    setHasUnsavedChanges(true);
  };
  const getProductDisplayName = (product?: Product) => {
    if (!product) return 'N/A';
    const parts = [product.name];
    if (product.sku) parts.push(`(${product.sku})`);
    if (product.color) {
      const colorAbbreviations: {
        [key: string]: string;
      } = {
        'black': 'BK',
        'cyan': 'CY',
        'yellow': 'YL',
        'magenta': 'MG',
        'blue': 'BL',
        'red': 'RD',
        'green': 'GR',
        'white': 'WH',
        'gray': 'GY',
        'grey': 'GY',
        'orange': 'OR',
        'purple': 'PR',
        'pink': 'PK',
        'brown': 'BR'
      };
      const colorLower = product.color.toLowerCase();
      const abbreviation = colorAbbreviations[colorLower] || product.color.substring(0, 2).toUpperCase();
      parts.push(abbreviation);
    }
    return parts.join(' ');
  };
  const handleDeletePurchaseOrder = async () => {
    setDeleting(true);
    try {
      await inventoryPurchaseService.deleteInventoryPurchase(purchaseOrder.id);
      toast.success('Inventory purchase deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting inventory purchase:', error);
      toast.error('Failed to delete inventory purchase');
    } finally {
      setDeleting(false);
    }
  };

  // Get the current value for an item field, checking soft edits first
  const getItemValue = (item: any, field: string) => {
    const softEdit = softEditedItems.find(edited => edited.id === item.id);
    return softEdit?.[field] ?? item[field];
  };

  // Combine all items (existing, soft edited, soft added, minus soft deleted)
  const getAllItems = () => {
    const originalItems = purchaseOrder.inventory_purchase_items?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost
    })) || [];

    // Start with original items and apply soft edits
    let allItems = originalItems.map(item => {
      const softEdit = softEditedItems.find(edited => edited.id === item.id);
      const mergedItem = softEdit ? {
        ...item,
        ...softEdit
      } : item;
      return {
        ...mergedItem,
        original_id: item.id,
        isEdited: !!softEdit
      };
    });

    // Add soft added items
    allItems = [...allItems, ...softAddedItems];

    // Remove soft deleted items
    allItems = allItems.filter(item => !softDeletedItems.has(item.original_id || item.id));
    return allItems;
  };
  const allItems = getAllItems();

  // Calculate totals using current values (including soft edits)
  const subtotal = allItems.reduce((sum, item) => {
    const quantity = getItemValue(item, 'quantity') || 0;
    const unitCost = getItemValue(item, 'unit_cost') || 0;
    return sum + quantity * unitCost;
  }, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const withholdingTaxAmount = withholdingTaxEnabled ? afterDiscount * (withholdingTaxRate / 100) : 0;
  const grandTotal = afterDiscount - withholdingTaxAmount;
  if (!isOpen) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden mobile-optimized">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #inventory-purchase-preview, #inventory-purchase-preview * {
                visibility: visible !important;
              }
              #inventory-purchase-preview {
                position: absolute !important;
                left: 0; top: 0; width: 100vw; min-height: 100vh;
                background: white !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 20px !important;
                z-index: 9999 !important;
              }
              .no-print {
                display: none !important;
              }
            }
            
            /* Mobile optimization styles - matching PurchaseInvoicePreview */
            @media (max-width: 768px) {
              .mobile-optimized {
                max-width: 100vw !important;
                width: 100vw !important;
                max-height: 95vh !important;
                margin: 0 !important;
                border-radius: 0 !important;
              }
              
              .mobile-scaled-content {
                transform: none !important;
                width: 100% !important;
                height: auto !important;
                padding: 12px !important;
                font-size: 12px;
                line-height: 1.3;
                touch-action: pinch-zoom;
                user-select: text;
              }
              
              .mobile-header {
                padding: 6px 8px !important;
                flex-wrap: wrap;
                gap: 4px !important;
              }
              
              .mobile-scroll-container {
                height: calc(95vh - 50px);
                overflow-x: auto;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                touch-action: manipulation;
              }
            }
            
            .modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: #9ca3af #e5e7eb;
            }
            
            .modal-scroll::-webkit-scrollbar {
              width: 8px;
            }
            
            .modal-scroll::-webkit-scrollbar-track {
              background: #e5e7eb;
              border-radius: 4px;
            }
            
            .modal-scroll::-webkit-scrollbar-thumb {
              background: #9ca3af;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            
            .modal-scroll::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }
          `}
        </style>
        
        <div className="h-full flex flex-col bg-white">
          {/* Header with actions - matching PurchaseInvoicePreview layout */}
          <div className="flex-shrink-0 px-6 py-4 border-b bg-white no-print mobile-header">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Inventory Purchase Preview</span>
              <div className="flex gap-2">
                {isEditing ? <>
                    <Button onClick={handleSaveChanges} variant="default" size="sm" disabled={saving || !hasUnsavedChanges} className="bg-green-600 hover:bg-green-700 disabled:opacity-50">
                      {saving ? <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          Saving...
                        </> : <>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </>}
                    </Button>
                    
                    <Button onClick={handleEditToggle} variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    
                    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Inventory Purchase</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this inventory purchase? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeletePurchaseOrder} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                            {deleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </> : <>
                    <Button onClick={handleEditToggle} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      onClick={() => setHidePrices(!hidePrices)} 
                      variant="outline" 
                      size="sm"
                      className={hidePrices ? "bg-red-50 text-red-600 border-red-200" : ""}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      {hidePrices ? "Show Prices" : "Hide Prices"}
                    </Button>
                    
                    <Button onClick={handlePrint} variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Print PDF
                    </Button>
                  </>}
                
                <Button onClick={onClose} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto modal-scroll mobile-scroll-container" style={{
          maxHeight: 'calc(90vh - 80px)'
        }}>
            <div id="inventory-purchase-preview" className="bg-white p-8 space-y-6 mobile-scaled-content zoomable-content">
              
              {/* Header */}
              <div className="border-b pb-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    
                    
                    <div className="text-xs text-gray-500 mt-2">
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2 border-b">SUPPLIER INFORMATION</h3>
                        <div className="text-sm space-y-1">
                          <p><strong>Name:</strong> {editedPurchaseOrder?.supplier_name || purchaseOrder.supplier_name}</p>
                          <p><strong>Address:</strong> N/A</p>
                          <p><strong>Phone:</strong> N/A</p>
                          <p><strong>Email:</strong> N/A</p>
                        </div>
                      </div>
                      
                      
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-blue-800 mb-2">
                      INVENTORY PURCHASE
                    </h2>
                    <div className="text-sm space-y-1">
                      <p><strong>Purchase #:</strong> IP-{purchaseOrder.id.slice(0, 8)}</p>
                      <p><strong>Reference #:</strong> {purchaseOrder.reference_number}</p>
                      <p><strong>Date:</strong> {new Date(purchaseOrder.purchase_date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${pdfMode === 'quotation' ? 'bg-blue-100 text-blue-800' : pdfMode === 'purchase' ? 'bg-green-100 text-green-800' : purchaseOrder.status === 'completed' ? 'bg-green-100 text-green-800' : purchaseOrder.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pdfMode === 'quotation' ? 'PRICE QUOTATION REQUEST' : pdfMode === 'purchase' ? 'APPROVED' : (purchaseOrder.status || 'pending').toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                {isEditing && <div className="grid grid-cols-3 gap-6 p-4 bg-blue-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="supplier-select" className="text-sm font-medium text-gray-700">
                        Supplier
                      </Label>
                      <Select value={editedPurchaseOrder?.supplier_name || ''} onValueChange={value => {
                    const selectedSupplier = suppliers.find(s => s.name === value);
                    if (selectedSupplier) {
                      handlePurchaseOrderChange('supplier_name', selectedSupplier.name);
                    }
                  }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Supplier" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {suppliers.map(supplier => <SelectItem key={supplier.id} value={supplier.name}>
                              {supplier.name}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="purchase-date" className="text-sm font-medium text-gray-700">
                        Purchase Date
                      </Label>
                      <Input id="purchase-date" type="date" value={purchaseOrder.purchase_date ? new Date(purchaseOrder.purchase_date).toISOString().split('T')[0] : ''} onChange={e => handlePurchaseOrderChange('purchase_date', e.target.value)} className="w-full" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reference-number" className="text-sm font-medium text-gray-700">
                        Reference Number
                      </Label>
                      <Input id="reference-number" type="text" placeholder="Enter Reference Number" value={editedPurchaseOrder?.reference_number || ''} onChange={e => handlePurchaseOrderChange('reference_number', e.target.value)} className="w-full" />
                    </div>
                  </div>}
              </div>


              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">ITEMS</h3>
                </div>
                 
                <table className="w-full border-collapse border border-gray-300 items-table">
                  <thead>
                    <tr className="bg-blue-800 text-white">
                      <th className="border border-gray-300 px-4 py-2 text-left">ITEM</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">PRODUCT NAME</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">QTY</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">UNIT COST</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.length > 0 ? allItems.map((item, index) => <tr key={`${item.id}-${index}`} className={[index % 2 === 0 ? 'bg-gray-50' : 'bg-white', item.isTemp ? 'bg-green-50' : '', item.isEdited ? 'bg-blue-50' : '', softDeletedItems.has(item.original_id || item.id) ? 'opacity-50 bg-red-50' : ''].filter(Boolean).join(' ')}>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className="text-gray-700 font-medium">{index + 1}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 product-name">
                          {isEditing ? <div className="flex items-center justify-between">
                              <Select value={getItemValue(item, 'product_id') || ''} onValueChange={value => {
                          const selectedProduct = products.find(p => p.id === value);
                          handleItemChange(item.id, 'product_id', value);
                          if (selectedProduct) {
                            handleItemChange(item.id, 'product_name', getProductDisplayName(selectedProduct));
                          }
                        }}>
                                <SelectTrigger className="w-full text-xs">
                                  <SelectValue placeholder="Select product..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border shadow-lg z-50">
                                  {products.map(product => <SelectItem key={product.id} value={product.id}>
                                      {getProductDisplayName(product)}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                              {!softDeletedItems.has(item.original_id || item.id) && <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.original_id || item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6 ml-2">
                                  <Trash2 className="h-3 w-3" />
                                </Button>}
                            </div> : <span className="text-xs">
                              {(() => {
                          const product = products.find(p => p.id === getItemValue(item, 'product_id'));
                          return product ? getProductDisplayName(product) : getItemValue(item, 'product_name') || 'N/A';
                        })()}
                              {item.isTemp && <span className="text-green-600 ml-1">(New)</span>}
                              {item.isEdited && <span className="text-blue-600 ml-1">(Modified)</span>}
                              {softDeletedItems.has(item.original_id || item.id) && <span className="text-red-600 ml-1">(Deleted)</span>}
                            </span>}
                        </td>
                        <td className="border border-gray-300 px-1 py-2 text-center qty-cell">
                          {isEditing ? <Input type="number" value={getItemValue(item, 'quantity') || ''} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="w-12 text-xs text-center p-1" min="0" max="999" /> : <span className="text-xs">{getItemValue(item, 'quantity')}</span>}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right price-cell">
                          {isEditing ? <Input type="number" step="0.01" value={getItemValue(item, 'unit_cost') || ''} onChange={e => handleItemChange(item.id, 'unit_cost', e.target.value)} className="w-20 text-xs text-right p-1" /> : <span className={`text-xs ${pdfMode === 'quotation' ? 'invisible' : ''}`}>
                            {hidePrices ? "₱0.00" : `₱${(getItemValue(item, 'unit_cost') || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </span>}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right price-cell">
                          <span className={`text-xs ${pdfMode === 'quotation' ? 'invisible' : ''}`}>
                            {hidePrices ? "₱0.00" : `₱${((getItemValue(item, 'quantity') || 0) * (getItemValue(item, 'unit_cost') || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </span>
                        </td>
                      </tr>) : <tr>
                        <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>}
                    
                    {/* Add new item row */}
                    {isEditing && <tr className="bg-blue-50">
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className="text-sm text-gray-500">NEW</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="space-y-2">
                            <Select value={newItem.product_id || ''} onValueChange={async value => {
                          const selectedProduct = products.find(p => p.id === value);
                          let unitCost = 0;

                          // Get price for selected supplier if available
                          if (selectedProduct && editedPurchaseOrder?.supplier_name) {
                            const selectedSupplier = suppliers.find(s => s.name === editedPurchaseOrder.supplier_name);
                            if (selectedSupplier) {
                              try {
                                const productWithSuppliers = await productService.getProductWithSuppliers(value);
                                if (productWithSuppliers && productWithSuppliers.suppliers) {
                                  const supplierEntry = productWithSuppliers.suppliers.find((s: any) => s.supplier_id === selectedSupplier.id);
                                  unitCost = supplierEntry ? supplierEntry.current_price || supplierEntry.unit_price || 0 : 0;
                                }
                              } catch (error) {
                                console.error('Error fetching price for new item:', error);
                              }
                            }
                          }
                          setNewItem({
                            ...newItem,
                            product_id: value,
                            product_name: selectedProduct ? getProductDisplayName(selectedProduct) : '',
                            unit_cost: unitCost
                          });
                        }}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select product..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white border shadow-lg z-50">
                                {products.map(product => <SelectItem key={product.id} value={product.id}>
                                    {getProductDisplayName(product)}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input value={newItem.product_name} onChange={e => setNewItem({
                          ...newItem,
                          product_name: e.target.value
                        })} placeholder="Or enter custom item name" />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input type="number" placeholder="Qty" value={newItem.quantity || ''} onChange={e => setNewItem({
                        ...newItem,
                        quantity: e.target.value
                      })} className="w-20" />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input type="number" step="0.01" placeholder="Cost" value={newItem.unit_cost || ''} onChange={e => setNewItem({
                        ...newItem,
                        unit_cost: e.target.value
                      })} onBlur={() => {
                        if (newItem.product_name && newItem.quantity && newItem.unit_cost) {
                          handleAddItem();
                        }
                      }} className="w-24" />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {hidePrices ? "₱0.00" : `₱${(Number(newItem.quantity) * Number(newItem.unit_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </td>
                      </tr>}
                  </tbody>
                </table>
              </div>

              {/* Terms and Tax Computation */}
              <div className="flex justify-between items-start gap-8">
                {/* Terms */}
                <div className="w-1/2">
                  
                </div>
                
                {/* Tax Computation */}
                <div className="w-80 totals-section">
                  <table className="w-full text-sm border border-gray-300">
                    <tbody>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2 font-medium text-gray-800">Total (Incl.)</td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right font-bold text-green-600">
                          {hidePrices ? "₱0.00" : `₱${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2 text-gray-800">Discount</td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right text-gray-800">
                           {isEditing ? <input type="number" min={0} step="0.01" value={discount} onChange={e => handleDiscountChange(Number(e.target.value))} className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs bg-white text-gray-800 text-right" placeholder="0.00" /> : (hidePrices ? "₱0.00" : `₱${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-2">
                          {isEditing ? <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={withholdingTaxEnabled} onChange={e => handleWithholdingTaxToggle(e.target.checked)} className="accent-blue-800" />
                              <span className="text-gray-800">Withhold.</span>
                              <input type="number" min={0} max={100} value={withholdingTaxRate} onChange={e => handleWithholdingTaxRateChange(Number(e.target.value))} className="w-8 px-1 py-0.5 border border-gray-300 rounded text-xs bg-white text-gray-800" disabled={!withholdingTaxEnabled} />
                              <span className="text-gray-800">%</span>
                            </label> : <span className="text-gray-800">Withholding Tax ({withholdingTaxRate}%)</span>}
                        </td>
                        <td className="border-b border-gray-300 px-3 py-2 text-right text-gray-800">
                          {hidePrices ? "₱0.00" : `₱${withholdingTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-300 px-3 py-3 font-bold text-base text-center text-gray-800" colSpan={2}>
                          TOTAL DUE
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-3 font-bold text-lg text-center text-green-600" colSpan={2}>
                          {hidePrices ? "₱0.00" : `₱${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes - Filter out TAX_SETTINGS */}
              {(() => {
              if (!purchaseOrder.notes) return null;
              const cleanNotes = purchaseOrder.notes.replace(/\[TAX_SETTINGS: .*?\]/g, '').trim();
              if (!cleanNotes) return null;
              return <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-800 mb-2">NOTES</h3>
                    {isEditing ? <textarea className="w-full p-3 border border-gray-300 rounded-md text-sm" rows={3} value={editedPurchaseOrder?.notes?.replace(/\[TAX_SETTINGS:.*?\]/g, '').trim() || ''} onChange={e => handlePurchaseOrderChange('notes', e.target.value)} placeholder="Enter notes..." /> : <p className="text-sm text-gray-600">{cleanNotes}</p>}
                  </div>;
            })()}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-xs text-gray-500">
                
                <p className="mt-1">This is a computer-generated document. No signature required.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Print Options Modal */}
      <Dialog open={showPrintOptions} onOpenChange={setShowPrintOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Document Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose the type of document you want to generate:
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => handlePrintOptionSelect('quotation')} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="font-medium">Price Quotation Request</div>
                  <div className="text-xs text-gray-500">Remove pricing, show as quotation</div>
                </div>
              </Button>
              
              <Button onClick={() => handlePrintOptionSelect('purchase')} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                <Package className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="font-medium">Inventory Purchase</div>
                  <div className="text-xs text-gray-500">Show complete document with pricing</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>;
};
export default PurchaseInventoryPreview;