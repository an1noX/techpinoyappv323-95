
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Printer, Package, MapPin, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { assetService } from '@/services/assetService';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import { CustomLoading } from "@/components/ui/CustomLoading";

interface PrinterPoolManagementProps {
  clientId: string;
  clientName: string;
}

export const PrinterPoolManagement: React.FC<PrinterPoolManagementProps> = ({
  clientId,
  clientName
}) => {
  const [deployingPrinterId, setDeployingPrinterId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const { toast } = useToast();

  // Fetch undeployed printers for this client
  const { data: poolPrinters = [], isLoading: poolLoading, refetch: refetchPool } = useQuery({
    queryKey: ['client-printer-pool', clientId],
    queryFn: () => assetService.getClientPrinterPool(clientId),
    enabled: !!clientId
  });

  // Fetch department locations for deployment
  const { data: departmentLocations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['client-departments', clientId],
    queryFn: () => clientService.getDepartmentsByClient(clientId),
    enabled: !!clientId && !!deployingPrinterId
  });

  const handleDeployPrinter = async (assignmentId: string) => {
    if (!selectedLocation) {
      toast({
        title: 'Error',
        description: 'Please select a department and location for deployment.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await assetService.deployPrinterFromPool(assignmentId, selectedLocation);
      
      toast({
        title: 'Success',
        description: 'Printer deployed successfully!'
      });

      // Reset state and refetch data
      setDeployingPrinterId(null);
      setSelectedLocation('');
      refetchPool();
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deploy printer. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (poolLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Printer Pool - {clientName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomLoading message="Loading printers" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Printer Pool - {clientName}</span>
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Undeployed printers available for assignment to departments and locations
        </p>
      </CardHeader>
      <CardContent>
        {poolPrinters.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No printers in pool</p>
            <p className="text-sm text-gray-400">All printers are currently deployed or no printers assigned to this client.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {poolPrinters.map((assignment) => (
              <Card key={assignment.id} className="border border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-yellow-100 rounded-lg border border-yellow-200">
                        {assignment.printer?.image_url ? (
                          <img
                            src={assignment.printer.image_url}
                            alt={assignment.printer.name}
                            className="object-contain w-full h-full rounded"
                          />
                        ) : (
                          <Printer className="h-6 w-6 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {assignment.printer?.name || 'Unknown Printer'}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {assignment.printer?.manufacturer && (
                            <p>Manufacturer: {assignment.printer.manufacturer}</p>
                          )}
                          {assignment.printer?.model && (
                            <p>Model: {assignment.printer.model}</p>
                          )}
                          {assignment.serial_number && (
                            <p>Serial: {assignment.serial_number}</p>
                          )}
                          {assignment.deployment_date && (
                            <p className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Added: {new Date(assignment.deployment_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            UnDeployed
                          </Badge>
                          {assignment.usage_type && (
                            <Badge variant="outline" className="text-xs">
                              {assignment.usage_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      {deployingPrinterId === assignment.id ? (
                        <div className="space-y-3 min-w-[200px]">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Deploy to:</Label>
                            {locationsLoading ? (
                              <CustomLoading message="Loading locations" />
                            ) : (
                              <Select 
                                value={selectedLocation} 
                                onValueChange={setSelectedLocation}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departmentLocations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleDeployPrinter(assignment.id)}
                              disabled={!selectedLocation}
                              className="flex-1"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Deploy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDeployingPrinterId(null);
                                setSelectedLocation('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setDeployingPrinterId(assignment.id)}
                          className="flex items-center space-x-1"
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span>Deploy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {assignment.notes && (
                    <div className="mt-3 p-2 bg-white rounded border border-yellow-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {assignment.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Pool Management</p>
                  <p>These printers are assigned to {clientName} but not deployed to specific locations. Click "Deploy" to assign them to departments and locations.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
