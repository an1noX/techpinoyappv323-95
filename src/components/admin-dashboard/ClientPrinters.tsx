import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Printer, Search, MoreHorizontal, Settings as Gear, Monitor, Package, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { productService } from '@/services/productService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import AdminEditProductModal from './components/AdminEditProductModal';
import { AddClientPriceDialog } from '@/components/products/pricing/AddClientPriceDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import AssignPrinterToLocationModal from './components/AssignPrinterToLocationModal';
import { useDepartments } from './hooks/useDepartments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TransferPrinterModal from './components/TransferPrinterModal';
import EditPrinterAssignmentModal from './components/EditPrinterAssignmentModal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';

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

interface PrinterAssignment {
  id: string;
  printer_id: string;
  department_location_id: string | null;
  serial_number: string | null;
  status: 'active' | 'inactive' | 'returned';
  deployment_date: string | null;
  usage_type: 'rental' | 'service_unit' | 'client_owned';
  monthly_price: number | null;
  printer: {
    name: string;
    model?: string;
    manufacturer?: string;
    image_url?: string;
    series?: string;
  };
  department_location?: {
    name: string;
    department: {
      name: string;
    };
  };
}

interface ClientPrintersProps {
  clientId: string;
}

const ClientPrinters: React.FC<ClientPrintersProps> = ({ clientId }) => {
  const isMobile = useIsMobile();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [printerProducts, setPrinterProducts] = useState<Record<string, any[]>>({});
  const [editProduct, setEditProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<PrinterAssignment | null>(null);
  const { data: departments = [] } = useDepartments(clientId);

  // Check if user is a client user (not admin/owner/sales_admin)
  const isClientUser = userProfile && !['admin', 'sales_admin'].includes(userProfile.role || '');

  // Fetch printer assignments for this client using the correct schema
  const {
    data: printerAssignments = [],
    isLoading,
  } = useQuery({
    queryKey: ['client-printer-assignments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_assignments')
        .select(`
          *,
          printer:printers(name, model, manufacturer, image_url, series),
          department_location:departments_location(
            name,
            department:departments(name)
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('created_at');
      
      if (error) throw error;
      return (data || []) as PrinterAssignment[];
    },
  });

  useEffect(() => {
    const fetchProducts = async () => {
      const result: Record<string, any[]> = {};
      for (const assignment of printerAssignments) {
        try {
          const products = await productService.getProductsByPrinter(assignment.printer_id);
          
          // Fetch client pricing for these products
          if (products.length > 0) {
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
            result[assignment.id] = productsWithPrices;
          } else {
            result[assignment.id] = products;
          }
        } catch {
          result[assignment.id] = [];
        }
      }
      setPrinterProducts(result);
    };
    if (printerAssignments && printerAssignments.length > 0) {
      fetchProducts();
    }
  }, [printerAssignments, clientId]);

  // Filter printers based on search
  const filteredAssignments = printerAssignments.filter(assignment => {
    const matchesSearch = assignment.printer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (assignment.serial_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (assignment.printer.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (assignment.printer.manufacturer || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group assignments by unique printer (by printer_id)
  const uniquePrintersMap: Record<string, { printer: PrinterAssignment['printer']; assignments: PrinterAssignment[] }> = {};
  filteredAssignments.forEach(assignment => {
    if (!uniquePrintersMap[assignment.printer_id]) {
      uniquePrintersMap[assignment.printer_id] = {
        printer: assignment.printer,
        assignments: []
      };
    }
    uniquePrintersMap[assignment.printer_id].assignments.push(assignment);
  });
  const uniquePrinters = Object.entries(uniquePrintersMap);

  const getLocationDisplay = (assignment: PrinterAssignment) => {
    if (assignment.department_location) {
      return `${assignment.department_location.department.name} - ${assignment.department_location.name}`;
    }
    return 'Unassigned';
  };

  const handleProductClick = (product) => {
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
    console.log('Price saved successfully:', { clientId: selectedClientId, price, productId: selectedProduct?.id });
    setShowPriceModal(false);
    
    // Refresh the products to show updated pricing
    const fetchProducts = async () => {
      const result: Record<string, any[]> = {};
      for (const assignment of printerAssignments) {
        try {
          const products = await productService.getProductsByPrinter(assignment.printer_id);
          
          if (products.length > 0) {
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
            result[assignment.id] = productsWithPrices;
          } else {
            result[assignment.id] = products;
          }
        } catch {
          result[assignment.id] = [];
        }
      }
      setPrinterProducts(result);
    };
    
    fetchProducts();
  };

  const handleAssignPrinter = () => {
    setShowAssignModal(true);
  };

  const handleTransferPrinter = () => {
    setShowTransferModal(true);
  };

  const handleUpdateSerialNumber = (assignment: PrinterAssignment) => {
    setSelectedAssignment(assignment);
    setShowEditAssignmentModal(true);
  };

  const handleShowAssignmentDetails = (assignment: PrinterAssignment) => {
    setSelectedAssignment(assignment);
    setShowEditAssignmentModal(true);
  };

  // Desktop Printer Card Component
  const DesktopPrinterCard = ({ printerId, printer, assignments }: { printerId: string, printer: any, assignments: PrinterAssignment[] }) => {
    const grouped: Record<string, { name: string; sku?: string; colors: string[]; product: any }> = {};
    assignments.forEach(assignment => {
      const products = printerProducts[assignment.id] || [];
      products.forEach(product => {
        const key = `${product.type}-${product.name}`;
        if (!grouped[key]) {
          grouped[key] = {
            name: product.name,
            sku: product.sku,
            colors: [],
            product: product
          };
        }
        if (product.color && !grouped[key].colors.includes(product.color)) {
          grouped[key].colors.push(product.color);
        }
      });
    });

    return (
      <Card key={printerId} className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Printer Thumbnail */}
            <div className="flex flex-col items-center min-w-[120px] w-32">
              <div className="bg-blue-50 rounded-lg flex items-center justify-center w-28 h-24">
                {printer.image_url ? (
                  <img
                    src={printer.image_url}
                    alt={printer.name}
                    className="object-contain w-full h-full rounded-lg"
                  />
                ) : (
                  <Printer className="w-16 h-16 text-blue-400" />
                )}
              </div>
              <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-800 mt-2 text-center">
                {assignments.length} unit{assignments.length !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xl text-gray-900 leading-tight mb-1">
                {printer.series ? (
                  printer.model ? `${printer.series} ${printer.model}` : `${printer.series} ${printer.name}`
                ) : (
                  printer.model || printer.name
                )}
              </div>
              <div className="text-sm text-gray-500 mb-3">{printer.manufacturer}</div>
              {/* Assigned To - always visible, directly under name/manufacturer */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-2 font-medium">Assigned To:</div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {assignments.map((assignment, idx) => (
                    <li key={assignment.id || idx} className="leading-tight flex items-center justify-between">
                      <span>
                        {getLocationDisplay(assignment)}
                        {assignment.serial_number ? (
                          ` (SN: ${assignment.serial_number})`
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-orange-500 cursor-help flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                                <span className="sr-only">Missing serial number</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Missing serial number</TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                                          {/* Only show gear button for non-client users */}
                    {!isClientUser && (
                      <button
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          handleShowAssignmentDetails(assignment);
                        }}
                        title="Edit printer assignment"
                      >
                        <Gear className="h-4 w-4" />
                      </button>
                    )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Compatible Printers & Prices Section - only visible when expanded */}
          {expandedCard === printerId && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {Object.entries(grouped).map(([key, group]) => (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    className={`flex items-center space-x-2 py-1 px-2 text-xs ${!isClientUser ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(group.product);
                    }}
                    title={!isClientUser ? "Click to edit product info" : "Product information"}
                  >
                    <ColorDot color={group.colors[0]} />
                    <span className="font-medium">
                      {group.name}
                      {group.sku && (
                        <span className="text-gray-500"> ({group.sku})</span>
                      )}
                    </span>
                    {/* Only show price for non-client users */}
                    {!isClientUser && typeof group.product.client_price === 'number' && (
                      <span
                        className="font-semibold text-blue-600 ml-2 underline decoration-dotted cursor-pointer hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePriceClick(e, group.product);
                        }}
                        title="Click to manage pricing"
                      >
                        : ₱{group.product.client_price.toFixed(2)}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Mobile Printer Card Component (original design)
  const MobilePrinterCard = ({ printerId, printer, assignments }: { printerId: string, printer: any, assignments: PrinterAssignment[] }) => {
    const grouped: Record<string, { name: string; sku?: string; colors: string[]; product: any }> = {};
    assignments.forEach(assignment => {
      const products = printerProducts[assignment.id] || [];
      products.forEach(product => {
        const key = `${product.type}-${product.name}`;
        if (!grouped[key]) {
          grouped[key] = {
            name: product.name,
            sku: product.sku,
            colors: [],
            product: product
          };
        }
        if (product.color && !grouped[key].colors.includes(product.color)) {
          grouped[key].colors.push(product.color);
        }
      });
    });

    return (
      <div
        key={printerId}
        className="bg-white rounded-lg border shadow-sm p-4 mb-3 w-full cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ minHeight: 0 }}
        onClick={() => setExpandedCard(expandedCard === printerId ? null : printerId)}
      >
        <div className="flex items-center gap-4">
          {/* Printer Thumbnail */}
          <div className="flex flex-col items-center min-w-[96px] w-28">
            <div className="bg-blue-50 rounded-lg flex items-center justify-center w-24 h-20">
              {printer.image_url ? (
                <img
                  src={printer.image_url}
                  alt={printer.name}
                  className="object-contain w-full h-full rounded-lg"
                />
              ) : (
                <Printer className="w-12 h-12 text-blue-400" />
              )}
            </div>
            <span className="inline-block bg-gray-100 rounded-full px-3 py-0.5 text-xs font-medium text-gray-800 mt-2 text-center">
              {assignments.length} unit{assignments.length !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-gray-900 leading-tight mb-0">
              {printer.series ? (
                printer.model ? `${printer.series} ${printer.model}` : `${printer.series} ${printer.name}`
              ) : (
                printer.model || printer.name
              )}
            </div>
            <div className="text-sm text-gray-500 mb-1">{printer.manufacturer}</div>
            {/* Assigned To - always visible, directly under name/manufacturer */}
            <div className="mt-1 mb-2">
              <div className="text-xs text-gray-600 mb-1 pl-0">Assigned To:</div>
              <ul className="list-disc pl-5 text-xs text-gray-700 space-y-0.5 mb-0">
                {assignments.map((assignment, idx) => (
                  <li key={assignment.id || idx} className="leading-tight flex items-center justify-between">
                    <span>
                      {getLocationDisplay(assignment)}
                      {assignment.serial_number ? (
                        ` (SN: ${assignment.serial_number})`
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 text-orange-500 cursor-help flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-0.5 text-orange-500" />
                              <span className="sr-only">Missing serial number</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Missing serial number</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    {/* Only show gear button for non-client users */}
                    {!isClientUser && (
                      <button
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          handleShowAssignmentDetails(assignment);
                        }}
                        title="Edit printer assignment"
                      >
                        <Gear className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Compatible Printers & Prices Section - only visible when expanded */}
        {expandedCard === printerId && (
          <>
            <hr className="my-2 border-gray-200" />
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(grouped).map(([key, group]) => (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className={`flex items-center space-x-2 py-1 px-2 text-xs ${!isClientUser ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(group.product);
                  }}
                  title={!isClientUser ? "Click to edit product info" : "Product information"}
                >
                  <ColorDot color={group.colors[0]} />
                  <span className="font-medium">
                    {group.name}
                    {group.sku && (
                      <span className="text-gray-500"> ({group.sku})</span>
                    )}
                  </span>
                  {/* Only show price for non-client users */}
                  {!isClientUser && typeof group.product.client_price === 'number' && (
                    <span
                      className="font-semibold text-blue-600 ml-2 underline decoration-dotted cursor-pointer hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick(e, group.product);
                      }}
                      title="Click to manage pricing"
                    >
                      : ₱{group.product.client_price.toFixed(2)}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions Bar */}
      {isMobile ? (
        // Mobile Search Bar (original design)
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search printers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {!isClientUser && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAssignPrinter}
            >
              Assign
            </Button>
          )}
          {!isClientUser && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTransferPrinter}
            >
              Transfer
            </Button>
          )}
        </div>
      ) : (
        // Desktop Search and Actions
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Client Printers</h2>
            <div className="flex items-center space-x-3">
              {!isClientUser && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAssignPrinter}
                  className="flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  Assign Printer
                </Button>
              )}
              {!isClientUser && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTransferPrinter}
                  className="flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  Transfer Printer
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search printers by name, model, manufacturer, or serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Printer Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading printers...</p>
          </div>
        ) : uniquePrinters.length === 0 ? (
          <div className="text-center py-8">
            <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No printers found.</p>
          </div>
        ) : (
          uniquePrinters.map(([printerId, { printer, assignments }]) => (
            isMobile ? (
              <MobilePrinterCard
                key={printerId}
                printerId={printerId}
                printer={printer}
                assignments={assignments}
              />
            ) : (
              <DesktopPrinterCard
                key={printerId}
                printerId={printerId}
                printer={printer}
                assignments={assignments}
              />
            )
          ))
        )}
      </div>

      {/* Modals */}
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
          }}
        />
      )}

      {selectedProduct && clientId && (
        <AddClientPriceDialog
          open={showPriceModal}
          onOpenChange={(open) => {
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

      {showAssignModal && (
        <AssignPrinterToLocationModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          location={null}
          departmentBaseName=""
          clientId={clientId}
          departments={departments}
          onPrinterAssigned={() => {
            setShowAssignModal(false);
            // Refresh the data
            window.location.reload();
          }}
        />
      )}

      {showTransferModal && (
        <TransferPrinterModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          assignment={null}
          currentClientId={clientId}
          onTransferCompleted={() => {
            setShowTransferModal(false);
            // Refresh the data
            window.location.reload();
          }}
        />
      )}

      {showEditAssignmentModal && selectedAssignment && (
        <EditPrinterAssignmentModal
          isOpen={showEditAssignmentModal}
          onClose={() => {
            setShowEditAssignmentModal(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          departments={departments}
          onAssignmentUpdated={() => {
            setShowEditAssignmentModal(false);
            setSelectedAssignment(null);
            // Refresh the data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default ClientPrinters;
