
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Settings, Eye, MapPin, Calendar, DollarSign, Package, Users, MoreVertical, Trash2, Edit, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { usePrinterAssignments } from '@/hooks/usePrinterAssignments';
import PrinterDetailsModal from '@/components/PrinterDetailsModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PrinterDashboardCardProps {
  printer: {
    id: string;
    name: string;
    manufacturer?: string;
    model?: string;
    series?: string;
    color?: string;
    image_url?: string;
    description?: string;
    is_color_printer?: boolean;
    created_at: string;
    updated_at: string;
  };
  onPrinterUpdated?: () => void;
  onPrinterDeleted?: (printerId: string) => void;
}

const PrinterDashboardCard: React.FC<PrinterDashboardCardProps> = ({ 
  printer, 
  onPrinterUpdated,
  onPrinterDeleted 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { userProfile } = useAuth();
  
  const { data: assignments = [], isLoading } = usePrinterAssignments(printer.id);

  // Check if user is admin/owner for delete permissions
  const canDelete = userProfile && ['admin', 'owner'].includes(userProfile.role || '');

  const allAssignments = assignments || [];
  const activeAssignments = allAssignments.filter(a => a.status === 'active');
  
  const getStatusInfo = () => {
    if (isLoading) return { label: 'Loading...', color: 'bg-gray-100 text-gray-600' };
    
    if (activeAssignments.length === 0) {
      return { label: 'Available', color: 'bg-green-100 text-green-800' };
    } else if (activeAssignments.length === 1) {
      return { label: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: `Multi-Assigned (${activeAssignments.length})`, color: 'bg-orange-100 text-orange-800' };
    }
  };

  const statusInfo = getStatusInfo();

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (onPrinterDeleted) {
      onPrinterDeleted(printer.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Printer Image/Icon */}
              <div className="flex-shrink-0">
                {printer.image_url ? (
                  <img 
                    src={printer.image_url} 
                    alt={printer.name}
                    className="w-12 h-12 object-contain rounded-lg bg-gray-50 p-1"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Printer className="w-6 h-6 text-blue-600" />
                  </div>
                )}
              </div>
              
              {/* Printer Info */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold text-gray-900 truncate">
                  {printer.name}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                  {printer.color && (
                    <Badge variant="outline" className="text-xs">
                      {printer.color}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Printer
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Printer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0" onClick={() => setShowDetails(true)}>
          <div className="space-y-3">
            {/* Printer Details */}
            <div className="text-sm text-gray-600 space-y-1">
              {printer.manufacturer && (
                <div className="flex items-center">
                  <span className="font-medium w-20">Brand:</span>
                  <span>{printer.manufacturer}</span>
                </div>
              )}
              {printer.model && (
                <div className="flex items-center">
                  <span className="font-medium w-20">Model:</span>
                  <span>{printer.model}</span>
                </div>
              )}
              {printer.series && (
                <div className="flex items-center">
                  <span className="font-medium w-20">Series:</span>
                  <span>{printer.series}</span>
                </div>
              )}
            </div>

            {/* Assignment Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Assignments</span>
                <Badge variant="outline" className="text-xs">
                  {allAssignments.length} total
                </Badge>
              </div>
              
              {activeAssignments.length > 0 ? (
                <div className="space-y-1">
                  {activeAssignments.slice(0, 2).map((assignment, index) => (
                    <div key={assignment.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {assignment.departments_location?.department?.name} - {assignment.departments_location?.name}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {assignment.clients?.name}
                      </span>
                    </div>
                  ))}
                  {activeAssignments.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{activeAssignments.length - 2} more assignments
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  No active assignments
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {printer.image_url ? (
                <img 
                  src={printer.image_url} 
                  alt={printer.name}
                  className="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Printer className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <span>{printer.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Printer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Printer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: printer.name },
                    { label: 'Manufacturer', value: printer.manufacturer },
                    { label: 'Model', value: printer.model },
                    { label: 'Series', value: printer.series }
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">{label}</span>
                      <span className="text-sm text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Color', value: printer.color },
                    { label: 'Type', value: printer.is_color_printer ? 'Color Printer' : 'Monochrome Printer' },
                    { label: 'Created', value: new Date(printer.created_at).toLocaleDateString() },
                    { label: 'Updated', value: new Date(printer.updated_at).toLocaleDateString() }
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">{label}</span>
                      <span className="text-sm text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {printer.description && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-500 block mb-1">Description</span>
                  <p className="text-sm text-gray-900">{printer.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Assignments */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Current Assignments ({allAssignments.length})
              </h3>
              
              {allAssignments.length > 0 ? (
                <div className="space-y-3">
                  {allAssignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                            {assignment.status}
                          </Badge>
                          <span className="font-medium">
                            {assignment.clients?.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.usage_type}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>
                            {assignment.departments_location?.department?.name} - {assignment.departments_location?.name}
                          </span>
                        </div>
                        
                        {assignment.deployment_date && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>
                              Deployed: {new Date(assignment.deployment_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {assignment.monthly_price && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>
                              ₱{assignment.monthly_price.toFixed(2)}/month
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {assignment.serial_number && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Serial:</span> {assignment.serial_number}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No assignments found for this printer</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <PrinterDetailsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        printer={printer}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Printer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{printer.name}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PrinterDashboardCard;
