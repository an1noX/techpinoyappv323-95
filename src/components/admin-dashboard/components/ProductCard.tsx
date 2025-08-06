import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Settings, Edit, Trash2, Eye, Copy, Merge, MoreVertical, Palette, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { CompatiblePrinters } from '@/PrinterDashboard/components/CompatiblePrinters';
import { supabase } from '@/integrations/supabase/client';

interface ProductGroup {
  baseSku: string;
  category: string;
  name: string;
  colors: string[];
  priceType: string;
  status: string;
  allProducts: any[];
  supportedPrinters: any[];
  departmentsSupplied: any[];
  customPricing?: any;
  skus: string[];
  productSkus: Array<{
    sku: string;
    color?: string;
  }>;
}

interface ProductCardProps {
  productGroup: ProductGroup;
  onEdit?: (productGroup: ProductGroup) => void;
  onDelete?: (productGroup: ProductGroup) => void;
  onViewDetails?: (productGroup: ProductGroup) => void;
  onClone?: (productGroup: ProductGroup) => void;
  onMerge?: (productGroup: ProductGroup) => void;
  onClientPricing?: (productGroup: ProductGroup) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  productGroup,
  onEdit,
  onDelete,
  onViewDetails,
  onClone,
  onMerge,
  onClientPricing
}) => {
  const { userProfile } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const [showPrices, setShowPrices] = useState(false);
  const [showDeleteSelection, setShowDeleteSelection] = useState(false);

  // Check if user is a client user (not admin/owner/sales_admin)
  const isClientUser = userProfile && !['admin', 'sales_admin', 'owner'].includes(userProfile.role || '');

  // Fetch client pricing for this product group
  const { data: clientPricing } = useQuery({
    queryKey: ['client-pricing', clientId, productGroup.allProducts.map(p => p.product_id)],
    queryFn: async () => {
      if (!clientId) return null;
      
      const productIds = productGroup.allProducts.map(p => p.product_id);
      const { data, error } = await supabase
        .from('product_clients')
        .select(`
          id,
          product_id,
          client_id,
          quoted_price,
          margin_percentage,
          updated_at
        `)
        .eq('client_id', clientId)
        .in('product_id', productIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && productGroup.allProducts.length > 0
  });

  const getColorForSku = (color?: string) => {
    if (!color) return '#6B7280';
    const colorMap: {
      [key: string]: string;
    } = {
      'black': '#000000',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'yellow': '#FFFF00',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00FF00'
    };
    return colorMap[color.toLowerCase()] || '#6B7280';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on SKU area or action buttons
    if ((e.target as HTMLElement).closest('.sku-area') || (e.target as HTMLElement).closest('.action-area')) {
      return;
    }
    // Open client pricing modal when card is clicked
    if (onClientPricing) {
      onClientPricing(productGroup);
    } else {
      setShowPrices(!showPrices);
    }
  };

  const handleSkuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Direct edit - no dialog for editing
    onEdit?.(productGroup);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Direct edit - no dialog for editing
    onEdit?.(productGroup);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productGroup.allProducts.length === 1) {
      // Single product - directly delete
      onDelete?.(productGroup);
    } else {
      // Multiple products - show selection modal (keep this for delete)
      setShowDeleteSelection(true);
    }
  };

  const handleProductDelete = (product: any) => {
    setShowDeleteSelection(false);
    // Create a single-product group for deletion
    const singleProductGroup = {
      ...productGroup,
      allProducts: [product]
    };
    onDelete?.(singleProductGroup);
  };

  return (
    <>
      <Card className="relative cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]" onClick={handleCardClick}>
        <CardContent className="p-3">
          {/* Mobile-first compact layout */}
          <div className="flex gap-3">
            {/* Left: Compact product info */}
            <div className="flex flex-col items-center min-w-[80px] w-20">
              {/* SKU(s) - clickable and compact */}
              <div 
                className="font-semibold text-xs text-gray-900 leading-tight mb-2 text-center sku-area cursor-pointer hover:text-blue-600 hover:underline transition-colors p-1 rounded touch-target"
                onClick={handleSkuClick}
                title="Tap to edit"
              >
                {Array.from(new Set(productGroup.allProducts.map(p => p.sku))).join(' / ')}
              </div>
              
              {/* Compact product thumbnail */}
              <div className="bg-blue-50 rounded-lg flex items-center justify-center w-16 h-16 mb-2">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              
              {/* Edit and Delete buttons below thumbnail - KEEP THE UI */}
              {!isClientUser && (
                <div className="flex gap-1 w-full action-area">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs flex-1"
                    onClick={handleEditClick}
                    title="Edit product"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeleteClick}
                    title="Delete product"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Right: Details - optimized for mobile */}
            <div className="flex-1 min-w-0">
              {/* Compatible Printers */}
              <div className="mb-2">
                <CompatiblePrinters 
                  productId={productGroup.allProducts[0]?.product_id} 
                  className="text-xs flex flex-row flex-wrap gap-2" 
                />
              </div>
              
              {/* Supplied To - compact */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-1">Supplied To:</div>
                {productGroup.departmentsSupplied.length > 0 ? (
                  <div className="text-xs text-gray-700 space-y-0.5">
                    {productGroup.departmentsSupplied.slice(0, 2).map((dept, idx) => (
                      <div key={idx} className="truncate">
                        {dept.clientName}
                        {dept.departmentName && ` - ${dept.departmentName}`}
                      </div>
                    ))}
                    {productGroup.departmentsSupplied.length > 2 && (
                      <div className="text-gray-500">+{productGroup.departmentsSupplied.length - 2} more</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">None</div>
                )}
              </div>
              
              {/* Printers - compact */}
              {productGroup.supportedPrinters.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Printers:</div>
                  <div className="text-xs text-gray-700">
                    {productGroup.supportedPrinters.slice(0, 2).map((printer, idx) => (
                      <span key={printer.id || idx} className="block truncate">
                        {[printer.manufacturer, printer.series, printer.model || printer.name]
                          .filter(Boolean).join(' ')}
                      </span>
                    ))}
                    {productGroup.supportedPrinters.length > 2 && (
                      <span className="text-gray-500">+{productGroup.supportedPrinters.length - 2} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Client Pricing - show current prices if available */}
              {clientId && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Client Price:</div>
                  <div className="text-xs text-gray-700">
                    {clientPricing && clientPricing.length > 0 ? (
                      <div className="space-y-1">
                        {clientPricing.map((pricing, idx) => {
                          const product = productGroup.allProducts.find(p => p.product_id === pricing.product_id);
                          return (
                            <div key={pricing.id} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                                {product?.name || 'N/A'} - ₱{pricing.quoted_price?.toFixed(2) || 'N/A'}
                              </span>
                              {pricing.margin_percentage && (
                                <span className="text-gray-500 text-xs flex-shrink-0">
                                  {pricing.margin_percentage}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">
                        No pricing set - Click to add
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action menu - mobile optimized */}
            {!isClientUser && (
              <div className="action-area flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 p-0 touch-target"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onViewDetails && onViewDetails(productGroup); }}>
                      <Eye className="mr-2 h-3 w-3" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit && onEdit(productGroup); }}>
                      <Edit className="mr-2 h-3 w-3" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onClone && onClone(productGroup); }}>
                      <Copy className="mr-2 h-3 w-3" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onMerge && onMerge(productGroup); }}>
                      <Merge className="mr-2 h-3 w-3" />
                      Merge
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onClientPricing && onClientPricing(productGroup); }}>
                      <DollarSign className="mr-2 h-3 w-3" />
                      Client Pricing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Product Selection Modal - KEEP THIS for delete action */}
      <Dialog open={showDeleteSelection} onOpenChange={setShowDeleteSelection}>
        <DialogContent className="w-[95vw] max-w-md h-[85vh] max-h-[600px] rounded-xl p-0 flex flex-col">
          <DialogHeader className="sticky top-0 bg-white z-10 p-4 border-b rounded-t-xl">
            <DialogTitle className="text-base text-red-600">Select Product to Delete</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {productGroup.allProducts.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer transition-colors active:scale-[0.98] touch-target"
                onClick={() => handleProductDelete(product)}
                tabIndex={0}
                role="button"
                aria-label={`Delete ${product.name}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleProductDelete(product);
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span 
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: getColorForSku(product.color) }} 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs text-gray-500 truncate">SKU: {product.sku}</div>
                    <div className="text-xs text-red-600 truncate">⚠️ This action cannot be undone</div>
                  </div>
                </div>
                <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
