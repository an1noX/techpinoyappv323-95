import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  Eye, 
  MapPin, 
  Calendar,
  DollarSign,
  Shield,
  AlertCircle
} from 'lucide-react';
import { PrinterUnit } from '@/types/printer-unit';

interface EnhancedPrinterUnitCardProps {
  unit: PrinterUnit;
  onEdit: (unit: PrinterUnit) => void;
  onMaintenance: (unit: PrinterUnit) => void;
  onStatusChange: (unit: PrinterUnit, status: PrinterUnit['status']) => void;
  onVisibilityChange: (unit: any) => void;
  clients: Array<{ id: string; name: string }>;
}

export default function EnhancedPrinterUnitCard({
  unit,
  onEdit,
  onMaintenance,
  onStatusChange,
  onVisibilityChange,
  clients
}: EnhancedPrinterUnitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      case 'rented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Safe access to printer data with null checks
  const printerName = unit.printer?.name || 'Unknown Printer';
  const printerManufacturer = unit.printer?.manufacturer || '';
  const printerModel = unit.printer?.model || '';
  const printerImage = unit.printer?.image_url || '';

  const displayName = `${printerManufacturer} ${printerName}`.trim();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {printerImage && (
              <img 
                src={printerImage} 
                alt={printerName}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <CardTitle className="text-lg font-semibold">
                {displayName}
              </CardTitle>
              {printerModel && (
                <p className="text-sm text-gray-600 mt-1">Model: {printerModel}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(unit.status)}>
                  {unit.status}
                </Badge>
                <Badge className={getConditionColor(unit.condition)}>
                  {unit.condition}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(unit)}
            >
              {/* <Settings className="h-4 w-4" /> */}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMaintenance(unit)}
              disabled={unit.status === 'maintenance'}
            >
              <Wrench className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVisibilityChange(unit)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Basic Info</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Serial:</span> {unit.serial_number}</p>
              {unit.asset_tag && (
                <p><span className="text-gray-500">Asset Tag:</span> {unit.asset_tag}</p>
              )}
              {unit.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span>{unit.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Information */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Assignment</h4>
            <div className="space-y-1 text-sm">
              {unit.assignments && unit.assignments.length > 0 ? (
                unit.assignments.map((assignment, index) => (
                  <div key={index} className="space-y-1">
                    {assignment.clients && (
                      <p><span className="text-gray-500">Client:</span> {assignment.clients.name}</p>
                    )}
                    {assignment.departments_location && (
                      <p>
                        <span className="text-gray-500">Location:</span> 
                        {assignment.departments_location.departments?.name} - {assignment.departments_location.name}
                      </p>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {assignment.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Not assigned</p>
              )}
            </div>
          </div>

          {/* Financial Information */}
          {(unit.purchase_price || unit.purchase_date) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Financial</h4>
              <div className="space-y-1 text-sm">
                {unit.purchase_price && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span>${unit.purchase_price}</span>
                  </div>
                )}
                {unit.purchase_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>Purchased: {new Date(unit.purchase_date).toLocaleDateString()}</span>
                  </div>
                )}
                {unit.warranty_expiry && (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-gray-400" />
                    <span>Warranty: {new Date(unit.warranty_expiry).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Maintenance Information */}
        {(unit.last_maintenance_date || unit.next_maintenance_due || unit.maintenance_notes) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Maintenance</h4>
            <div className="space-y-1 text-sm">
              {unit.last_maintenance_date && (
                <p><span className="text-gray-500">Last Service:</span> {new Date(unit.last_maintenance_date).toLocaleDateString()}</p>
              )}
              {unit.next_maintenance_due && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                  <span>Next Due: {new Date(unit.next_maintenance_due).toLocaleDateString()}</span>
                </div>
              )}
              {unit.maintenance_notes && (
                <p><span className="text-gray-500">Notes:</span> {unit.maintenance_notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Visibility Information */}
        {unit.visibility && unit.visibility.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Visible to Clients</h4>
            <div className="flex flex-wrap gap-1">
              {unit.visibility.map((vis, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {vis.clients?.name || 'Unknown Client'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {unit.notes && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Notes</h4>
            <p className="text-sm text-gray-600">{unit.notes}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {unit.status !== 'maintenance' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStatusChange(unit, 'maintenance')}
              >
                Mark for Maintenance
              </Button>
            )}
            {unit.status === 'available' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStatusChange(unit, 'assigned')}
              >
                Mark as Assigned
              </Button>
            )}
            {unit.status !== 'available' && unit.status !== 'retired' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onStatusChange(unit, 'available')}
              >
                Mark Available
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 