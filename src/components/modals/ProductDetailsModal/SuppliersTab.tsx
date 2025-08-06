
import { Badge } from "@/components/ui/badge";
import { Truck, TrendingUp, TrendingDown } from "lucide-react";

interface SuppliersTabProps {
  suppliers: Array<{
    id: string;
    supplier_name: string;
    current_price: number;
    last_updated: string;
  }>;
}

export const SuppliersTab = ({ suppliers }: SuppliersTabProps) => {
  if (suppliers.length === 0) {
    return (
      <div className="text-center py-8">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-500 mb-1">No Suppliers</h3>
        <p className="text-xs text-gray-400">No supplier pricing available for this product</p>
      </div>
    );
  }

  const sortedSuppliers = [...suppliers].sort((a, b) => a.current_price - b.current_price);
  const lowestPrice = sortedSuppliers[0]?.current_price;
  const highestPrice = sortedSuppliers[sortedSuppliers.length - 1]?.current_price;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Supplier Pricing</h3>
        <Badge variant="outline" className="text-xs">
          {suppliers.length} {suppliers.length === 1 ? 'Supplier' : 'Suppliers'}
        </Badge>
      </div>

      <div className="space-y-2">
        {sortedSuppliers.map((supplier, index) => {
          const isLowest = supplier.current_price === lowestPrice;
          const isHighest = supplier.current_price === highestPrice && suppliers.length > 1;
          
          return (
            <div key={supplier.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-sm">{supplier.supplier_name}</span>
                  {isLowest && suppliers.length > 1 && (
                    <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Best Price
                    </Badge>
                  )}
                  {isHighest && (
                    <Badge variant="outline" className="text-xs text-red-700 border-red-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Highest
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${isLowest ? 'text-green-600' : 'text-gray-900'}`}>
                    ${supplier.current_price.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Updated: {formatDate(supplier.last_updated)}
              </div>
            </div>
          );
        })}
      </div>

      {suppliers.length > 1 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-700">
            <div className="font-medium mb-1">Cost Analysis</div>
            <div className="flex justify-between">
              <span>Lowest Price:</span>
              <span>${lowestPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Highest Price:</span>
              <span>${highestPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Price Difference:</span>
              <span>${(highestPrice - lowestPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Price:</span>
              <span>${(suppliers.reduce((sum, s) => sum + s.current_price, 0) / suppliers.length).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
