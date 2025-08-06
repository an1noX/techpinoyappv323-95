
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface ProductInfoTabProps {
  data: {
    product: {
      name: string;
      sku: string;
      category: string;
      description?: string;
      color?: string;
      alias?: string;
    };
    printers: Array<{
      id: string;
      name: string;
      model: string;
      is_recommended: boolean;
      compatibility_notes?: string;
    }>;
  };
}

export const ProductInfoTab = ({ data }: ProductInfoTabProps) => {
  const { product, printers } = data;

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Product Details</h3>
          <div className="space-y-2 text-sm">
            {product.category && (
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            )}
            {product.color && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: product.color }}
                  />
                  <span className="text-gray-900">{product.color}</span>
                </div>
              </div>
            )}
            {product.alias && (
              <div className="flex justify-between">
                <span className="text-gray-600">Alias:</span>
                <span className="text-gray-900">{product.alias}</span>
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* Compatible Printers */}
      {printers.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Compatible Printers ({printers.length})</h4>
          <div className="space-y-2">
            {printers.map((printer) => (
              <div key={printer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {printer.is_recommended && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{printer.name}</div>
                    {printer.model && (
                      <div className="text-xs text-gray-500">{printer.model}</div>
                    )}
                  </div>
                </div>
                {printer.is_recommended && (
                  <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                    Recommended
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {printers.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No compatible printers found</p>
        </div>
      )}
    </div>
  );
};
