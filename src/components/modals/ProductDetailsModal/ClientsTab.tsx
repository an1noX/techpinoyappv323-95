
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface ClientsTabProps {
  clients: Array<{
    id: string;
    client_name: string;
    printer_count: number;
    quoted_price: number;
    margin_percentage?: number;
  }>;
}

export const ClientsTab = ({ clients }: ClientsTabProps) => {
  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-500 mb-1">No Client Pricing</h3>
        <p className="text-xs text-gray-400">This product hasn't been quoted to any clients yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Client Pricing</h3>
        <Badge variant="outline" className="text-xs">
          {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}
        </Badge>
      </div>

      <div className="space-y-2">
        {clients.map((client) => (
          <div key={client.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-sm">{client.client_name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  ${client.quoted_price.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{client.printer_count} printer{client.printer_count !== 1 ? 's' : ''}</span>
              {client.margin_percentage !== undefined && client.margin_percentage !== null && (
                <Badge variant="secondary" className="text-xs">
                  {client.margin_percentage.toFixed(1)}% margin
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-700">
          <div className="font-medium mb-1">Pricing Summary</div>
          <div className="flex justify-between">
            <span>Average Price:</span>
            <span>${(clients.reduce((sum, c) => sum + c.quoted_price, 0) / clients.length).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Price Range:</span>
            <span>
              ${Math.min(...clients.map(c => c.quoted_price)).toFixed(2)} - 
              ${Math.max(...clients.map(c => c.quoted_price)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
