
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { productService } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';
import AdminEditProductModal from './AdminEditProductModal';
import { AddClientPriceDialog } from '@/components/products/pricing/AddClientPriceDialog';
import { useAuth } from '@/hooks/useAuth';

const colorClasses: {
  [key: string]: string;
} = {
  black: 'bg-black',
  cyan: 'bg-cyan-500',
  magenta: 'bg-pink-500',
  yellow: 'bg-yellow-400'
};

const ColorDot = ({ color }: { color: string }) => {
  const colorClass = colorClasses[color?.toLowerCase()];
  if (!colorClass) return null;
  return <div className={`w-3 h-3 rounded-full ${colorClass}`} />;
};

const CMYKDots = () => (
  <div className="flex space-x-1 mt-1">
    <div className="w-3 h-3 rounded-full bg-cyan-500" />
    <div className="w-3 h-3 rounded-full bg-pink-500" />
    <div className="w-3 h-3 rounded-full bg-yellow-400" />
    <div className="w-3 h-3 rounded-full bg-black" />
  </div>
);

interface ClientServiceCardProps {
  printer: any;
  onManage?: (assignment: any) => void;
  clientId?: string;
  departmentName?: string;
  locationName?: string;
}

const ClientServiceCard: React.FC<ClientServiceCardProps> = ({
  printer,
  onManage,
  clientId,
  departmentName,
  locationName
}) => {
  const [compatibleProducts, setCompatibleProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userProfile } = useAuth();

  // Check if user is a client user (not admin/owner/sales_admin)
  const isClientUser = userProfile && !['admin', 'sales_admin'].includes(userProfile.role || '');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!printer.printer_id) return;
      setLoadingProducts(true);
      try {
        const products = await productService.getProductsByPrinter(printer.printer_id);

        // Fetch client pricing for these products
        if (clientId && products.length > 0) {
          const productIds = products.map(p => p.id);
          const { data: clientPrices, error } = await supabase
            .from('product_clients')
            .select('product_id, quoted_price')
            .eq('client_id', clientId)
            .in('product_id', productIds);
          
          if (error) throw error;
          
          const productsWithPrices = products.map(product => {
            const clientPrice = clientPrices?.find(cp => cp.product_id === product.id);
            return {
              ...product,
              client_price: clientPrice?.quoted_price
            };
          });
          setCompatibleProducts(productsWithPrices);
        } else {
          setCompatibleProducts(products);
        }
      } catch (error) {
        console.error("Failed to fetch compatible products:", error);
        setCompatibleProducts([]);
      }
      setLoadingProducts(false);
    };

    fetchProducts();
  }, [printer.printer_id, clientId]);

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleProductClick = product => {
    // Only allow editing for non-client users
    if (isClientUser) {
      return;
    }
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handlePriceClick = (e, product) => {
    // Only allow price editing for non-client users
    if (isClientUser) {
      return;
    }
    e.stopPropagation();
    setSelectedProduct(product);
    setShowPriceModal(true);
  };

  const handleSavePrice = async (selectedClientId: string, price: number) => {
    console.log('Price saved successfully:', {
      clientId: selectedClientId,
      price,
      productId: selectedProduct?.id
    });
    setShowPriceModal(false);

    // Refresh the products to show updated pricing
    const fetchProducts = async () => {
      if (!printer.printer_id) return;
      try {
        const products = await productService.getProductsByPrinter(printer.printer_id);
        if (clientId && products.length > 0) {
          const productIds = products.map(p => p.id);
          const { data: clientPrices, error } = await supabase
            .from('product_clients')
            .select('product_id, quoted_price')
            .eq('client_id', clientId)
            .in('product_id', productIds);
          
          if (error) throw error;
          
          const productsWithPrices = products.map(product => {
            const clientPrice = clientPrices?.find(cp => cp.product_id === product.id);
            return {
              ...product,
              client_price: clientPrice?.quoted_price
            };
          });
          setCompatibleProducts(productsWithPrices);
        }
      } catch (error) {
        console.error("Failed to refresh products:", error);
      }
    };
    fetchProducts();
  };

  // Prevent toggle when clicking on dropdown or modals
  const handleCardClick = e => {
    // If click is inside the settings button or dropdown, do not toggle
    if (e.target.closest('.printer-settings-dropdown') || e.target.closest('.modal')) {
      return;
    }
    setIsCollapsed(prev => !prev);
  };

  // Only use collapse logic if onManage is provided (admin context)
  const collapsible = !!onManage;

  return (
    <div
      className={"bg-orange-50/50 border border-orange-200/80 rounded-lg p-3 my-2 shadow-sm select-none " + (collapsible ? 'cursor-pointer' : 'cursor-default')}
      {...(collapsible ? { onClick: handleCardClick } : {})}
    >
      <div className="flex items-start space-x-4">
        <img 
          src={printer.printer?.image_url || '/placeholder.svg'} 
          alt={printer.printer?.name || 'Printer'} 
          className="w-24 h-24 object-cover rounded-md flex-shrink-0" 
        />
        <div className="flex-1">
          {/* Location Assignment */}
          {locationName && (
            <p className="text-sm font-medium text-blue-600 mb-1">
              {locationName}
            </p>
          )}
          <h4 className="font-bold text-gray-800">
            {[printer.printer?.manufacturer, printer.printer?.series, printer.printer?.model || printer.printer?.name].filter(Boolean).join(' ')}
          </h4>
          {/* Display SKU if available */}
          {printer.printer?.sku && (
            <div className="text-xs text-gray-500 font-mono mb-1">SKU: {printer.printer.sku}</div>
          )}
          <p className="text-sm text-gray-600">Serial: {printer.serial_number || 'N/A'}</p>
          
          {/* Move ColorDot here, immediately below Serial */}
          {printer.printer?.color && <ColorDot color={printer.printer.color} />}
          {printer.printer?.color?.toLowerCase() === 'black' && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800 font-semibold">Monochrome</span>
          )}
          {printer.printer?.color?.toLowerCase() === 'color' && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-200 text-blue-800 font-semibold">Colored</span>
          )}
        </div>
        <div className="flex flex-col items-center space-y-2 printer-settings-dropdown">
          <Badge variant="outline" className={`capitalize text-xs ${getStatusColor(printer.status)}`}>{printer.status || 'Unknown'}</Badge>
        </div>
      </div>
      {/* Collapsible details */}
      {(!collapsible || !isCollapsed) && (
        <div className="mt-3 pt-3 border-t border-orange-200/50">
          {loadingProducts ? (
            <p className="text-xs text-gray-500 italic">Loading products...</p>
          ) : compatibleProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {compatibleProducts.map(product => (
                <Badge
                  key={product.id}
                  variant="outline"
                  className={`flex items-center space-x-2 py-1 px-2 text-xs ${!isClientUser ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                  onClick={() => handleProductClick(product)}
                  title={!isClientUser ? "Click to edit product info" : "Product information"}
                >
                  {product.color && <ColorDot color={product.color} />}
                  <span className="font-medium">
                    {product.name}
                    {product.sku && (
                      <span className="text-gray-500"> ({product.sku})</span>
                    )}
                  </span>
                  {/* Only show price for non-client users */}
                  {!isClientUser && (
                    <span
                      className="font-semibold text-blue-600 ml-2 underline decoration-dotted cursor-pointer hover:text-blue-800"
                      onClick={e => handlePriceClick(e, product)}
                      title="Click to manage pricing"
                    >
                      : ₱{typeof product.client_price === 'number' ? product.client_price.toFixed(2) : '0.00'}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No compatible products found.</p>
          )}
        </div>
      )}
      
      {/* Product Edit Modal */}
      {selectedProduct && (
        <AdminEditProductModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onProductUpdated={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
            // Optionally refetch products
          }}
        />
      )}
      
      {/* Price Management Modal */}
      {selectedProduct && clientId && (
        <AddClientPriceDialog
          open={showPriceModal}
          onOpenChange={open => {
            setShowPriceModal(open);
            if (!open) setSelectedProduct(null);
          }}
          availableClients={[{ id: clientId, name: 'Current Client' }]}
          onSave={handleSavePrice}
          initialClientId={clientId}
          initialPrice={selectedProduct.client_price || 0}
          productId={selectedProduct.id}
        />
      )}
    </div>
  );
};

export default ClientServiceCard;
