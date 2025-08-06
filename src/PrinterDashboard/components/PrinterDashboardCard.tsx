
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, Edit, Trash2 } from 'lucide-react';

interface PrinterDashboardCardProps {
  printer: any;
  onEdit?: (printer: any) => void;
  onDelete?: (printer: any) => void;
  debug?: boolean;
}

const PrinterDashboardCard: React.FC<PrinterDashboardCardProps> = ({
  printer,
  onEdit,
  onDelete,
  debug = false
}) => {
  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Printer className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {printer.printer?.name || printer.name || 'Unknown Printer'}
              </h3>
              <p className="text-sm text-gray-600">
                {printer.printer?.model || printer.model || 'No model specified'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {printer.status || 'Unknown'}
            </Badge>
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(printer)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(printer)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {debug && (
          <div className="mt-2 text-xs text-gray-500">
            ID: {printer.id}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrinterDashboardCard;
