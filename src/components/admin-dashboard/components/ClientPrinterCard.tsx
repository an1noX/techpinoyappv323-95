import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Package, PauseCircle, CheckCircle, Pencil, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CompatibleProducts } from '@/PrinterDashboard/components/CompatibleProducts';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface ClientPrinterCardProps {
  printer: any;
  onManage: () => void;
  clientId: string;
  departmentName?: string;
  locationName?: string;
  showUndeployedStatus?: boolean;
  onDataRefresh?: () => void;
  onUnassign?: (assignmentId: string) => void;
}

const ClientPrinterCard: React.FC<ClientPrinterCardProps> = ({
  printer,
  onManage,
  clientId,
  departmentName,
  locationName,
  showUndeployedStatus = false,
  onDataRefresh,
  onUnassign
}) => {
  const { userProfile } = useAuth();
  const [showSerialDialog, setShowSerialDialog] = useState(false);
  const [serialInput, setSerialInput] = useState('');
  const [showSerialConfirm, setShowSerialConfirm] = useState(false);
  const [isSerialUpdating, setIsSerialUpdating] = useState(false);
  const [serialError, setSerialError] = useState('');

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'undeployed':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isInactive = printer.status?.toLowerCase() === 'inactive';
  const isActive = printer.status?.toLowerCase() === 'active';
  const isUndeployed = printer.status?.toLowerCase() === 'undeployed';
  const isAvailable = printer.status?.toLowerCase() === 'available';

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${isInactive ? 'bg-gray-50 border-l-4 border-gray-400 opacity-80' : ''} ${isActive ? 'bg-white border-l-4 border-green-400' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Printer image thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={printer.image_url || '/placeholder.svg'}
                alt={printer.name || 'Printer'}
                className="w-24 h-24 object-cover rounded-md"
                onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
              />
            </div>
            {/* Info/details right of image */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-medium text-sm truncate ${isInactive ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                  {printer.name || printer.printer?.name || 'Unknown Printer'}
                </h4>
                {printer.usage_type === 'client_owned' && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-1" variant="outline">
                    Client Owned
                  </Badge>
                )}
                {showUndeployedStatus && (
                  <Badge 
                    className={`text-xs px-2 py-1 ${getStatusColor('undeployed')}`}
                    variant="outline"
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Undeployed
                  </Badge>
                )}
                {!showUndeployedStatus && printer.status && isActive && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-1 flex items-center gap-1" variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                    Active
                  </Badge>
                )}
                {!showUndeployedStatus && printer.status && !isInactive && !isActive && (
                  <Badge 
                    className={`text-xs px-2 py-1 ${getStatusColor(printer.status)}`}
                    variant="outline"
                  >
                    {printer.status}
                  </Badge>
                )}
                {isInactive && (
                  <Badge className="bg-gray-200 text-gray-700 border-gray-300 text-xs px-2 py-1 flex items-center gap-1" variant="outline">
                    <PauseCircle className="w-3 h-3 mr-1 text-gray-400" />
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {printer.model && (
                  <p className={`text-xs ${isInactive ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                    Model: {printer.model}
                  </p>
                )}
                {printer.serial_number ? (
                  <p className={`text-xs ${isInactive ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                    S/N: {printer.serial_number}
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 flex items-center gap-1">
                    S/N: Missing Serial No.
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 h-4 w-4"
                      onClick={() => {
                        setSerialInput('');
                        setShowSerialDialog(true);
                      }}
                      title="Edit Serial Number"
                    >
                      <Pencil className="h-4 w-4 text-orange-600" />
                    </Button>
                  </p>
                )}
                {departmentName && locationName && (
                  <div className={`flex items-center gap-4 text-xs ${isInactive ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{departmentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{locationName}</span>
                    </div>
                  </div>
                )}
                {showUndeployedStatus && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Package className="w-3 h-3" />
                    <span>Available for deployment to any location</span>
                  </div>
                )}
                {isInactive && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 italic mt-1">
                    <PauseCircle className="w-3 h-3" />
                    <span>This printer is currently inactive and not deployed.</span>
                  </div>
                )}
              </div>
              {/* Section Divider and Compatible Products */}
              <hr className="my-2 border-t border-orange-200/50" />
              <CompatibleProducts 
                printerId={printer.printer_id}
                className="text-xs flex flex-row flex-wrap gap-2 mt-1" 
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onManage}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Transfer Printer"
              >
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Serial Number Update Dialog */}
      <AlertDialog open={showSerialDialog} onOpenChange={setShowSerialDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Serial Number</AlertDialogTitle>
          </AlertDialogHeader>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full mb-3"
            placeholder="Enter Serial Number"
            value={serialInput}
            onChange={e => setSerialInput(e.target.value)}
            disabled={isSerialUpdating}
          />
          {serialError && <p className="text-xs text-red-600 mb-2 text-center">{serialError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSerialDialog(false)} disabled={isSerialUpdating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSerialUpdating || !serialInput.trim()}
              onClick={async () => {
                setIsSerialUpdating(true);
                setSerialError('');
                try {
                  // Update serial number in Supabase
                  const { error } = await supabase
                    .from('printer_assignments')
                    .update({ serial_number: serialInput.trim() })
                    .eq('id', printer.assignment_id);
                  if (error) throw error;
                  printer.serial_number = serialInput.trim();
                  setShowSerialDialog(false);
                  setShowSerialConfirm(true);
                  if (onDataRefresh) onDataRefresh();
                } catch (err) {
                  setSerialError('Failed to update serial number. Please try again.');
                } finally {
                  setIsSerialUpdating(false);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSerialUpdating ? 'Saving...' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showSerialConfirm && (
        <AlertDialog open={showSerialConfirm} onOpenChange={setShowSerialConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Serial number has been updated.</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex flex-col items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
              <Button variant="default" size="sm" onClick={() => setShowSerialConfirm(false)}>
                OK
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default ClientPrinterCard;
