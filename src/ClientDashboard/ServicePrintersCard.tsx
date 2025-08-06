import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

const colorClasses: { [key: string]: string } = {
  black: 'bg-black',
  cyan: 'bg-cyan-500',
  magenta: 'bg-pink-500',
  yellow: 'bg-yellow-400',
};

const ColorDot = ({ color }: { color: string }) => {
  const colorClass = colorClasses[color?.toLowerCase()] || 'bg-gray-400';
  return <div className={`w-3 h-3 rounded-full ${colorClass}`} />;
};

interface ServicePrintersCardProps {
  printer: any;
  clientId?: string;
}

const ServicePrintersCard: React.FC<ServicePrintersCardProps> = ({ printer, clientId }) => {
  const [compatibleProducts, setCompatibleProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!printer.printer_id) return;
      setLoadingProducts(true);
      try {
        // You may want to use your productService here
        const products = [];
        setCompatibleProducts(products);
      } catch (error) {
        setCompatibleProducts([]);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, [printer.printer_id]);

  return (
    <div className="bg-orange-50/50 border border-orange-200/80 rounded-lg p-3 my-2 shadow-sm select-none">
      <div className="flex items-start space-x-4">
        <img
          src={printer.printer?.image_url || '/placeholder.svg'}
          alt={printer.printer?.name || 'Printer'}
          className="w-24 h-24 object-cover rounded-md flex-shrink-0"
        />
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">
            {[printer.printer?.manufacturer, printer.printer?.series, printer.printer?.model || printer.printer?.name].filter(Boolean).join(' ')}
          </h4>
          <p className="text-sm text-gray-600">Serial: {printer.serial_number || 'N/A'}</p>
          {/* Compatible products under Serial */}
          {compatibleProducts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {compatibleProducts.map(product => (
                <Badge
                  key={product.id}
                  variant="outline"
                  className="flex items-center space-x-2 py-1 px-2 text-xs"
                >
                  {product.color && <ColorDot color={product.color} />}
                  <span className="font-medium">
                    {product.name}
                    {product.sku && (
                      <span className="text-gray-500"> ({product.sku})</span>
                    )}
                  </span>
                </Badge>
              ))}
            </div>
          )}
          {printer.printer?.color && <ColorDot color={printer.printer.color} />}
        </div>
        <div className="flex flex-col items-center space-y-2">
           <Badge variant="outline" className="capitalize text-xs">
              {printer.status || 'Unknown'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ServicePrintersCard; 