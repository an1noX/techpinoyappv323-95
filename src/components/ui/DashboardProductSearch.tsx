import { useState, useEffect, useRef } from "react";
import { Search, Eye, X, ArrowLeft, Printer, Package, Plus, UserPlus, User, Settings, LogOut, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/sales";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import { productService } from "@/services/productService";
import { useLocation } from "react-router-dom";
import { printerService } from "@/services/printerService";
import { Printer as PrinterType } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useClients } from "@/hooks/useClients";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AccountSettings from "@/components/AccountSettings";
import { SubmitReportModal } from "@/components/modals/SubmitReportModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Components
import { SearchInput } from "@/PrinterDashboard/components/SearchInput";
import NavigationButton from "@/PrinterDashboard/components/NavigationButton";
import { AddSalesModal } from "@/SalesDashboard/AddSalesModal";
import { AddPurchaseModal } from "@/SalesDashboard/AddPurchaseModal";
import { CreateDeliveryModal } from "@/components/sales/CreateDeliveryModal";
import DevTesting from '@/Dashboard/DevTesting';
import { TransactionRecordsList } from '@/components/sales/TransactionRecordsList';
import { MobileSearchInput } from '@/components/navigation/MobileSearchInput';
import { CustomLoading } from "@/components/ui/CustomLoading";
import { PurchaseInvoicePreview } from '@/components/sales/PurchaseInvoicePreview';
import { PurchaseDeliveryPreview } from '@/components/sales/PurchaseDeliveryPreview';

type SearchType = 'products' | 'printers' | 'records';

interface PrinterWithProducts extends Omit<PrinterType, 'printer_assignments'> {
  compatibleProducts: Array<{
    id: string;
    name: string;
    sku?: string;
    color?: string;
  }>;
  printer_assignments?: Array<{
    id: string;
    status: string;
    is_unassigned?: boolean;
    serial_number?: string;
    client_id?: string;
    clients?: { id: string; name: string };
    department_location?: { name: string; department: { name: string } };
  }>;
}

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

function TransactionRecordModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-0 w-full max-w-4xl flex flex-col items-stretch relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Transaction Records
          </h3>
          <button
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 pt-2 overflow-y-auto">
          <TransactionRecordsList />
        </div>
      </div>
    </div>
  );
}

export const DashboardProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>('products');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [productsWithPricing, setProductsWithPricing] = useState<any[]>([]);
  const [printersWithProducts, setPrintersWithProducts] = useState<PrinterWithProducts[]>([]);
  const [transactionRecords, setTransactionRecords] = useState<any[]>([]);
  const [showSupplierPrices, setShowSupplierPrices] = useState<{ [productId: string]: boolean }>({});
  const [showClientPrices, setShowClientPrices] = useState<{ [productId: string]: boolean }>({});
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const { clients, loading: clientsLoading } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);
  const [qtyPromptOpen, setQtyPromptOpen] = useState(false);
  const [qtyPromptProduct, setQtyPromptProduct] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState(1);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({}); // productId -> price
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showSubmitReportModal, setShowSubmitReportModal] = useState(false);
  const [activeDevTab, setActiveDevTab] = useState<'google'>("google");
  const [gsStatus, setGsStatus] = useState<string | null>(null);
  const [showTransactionRecordsModal, setShowTransactionRecordsModal] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showPurchaseInvoiceModal, setShowPurchaseInvoiceModal] = useState(false);
  const [showDeliveryReceiptModal, setShowDeliveryReceiptModal] = useState(false);

  const { userProfile } = useAuth();
  const location = useLocation();

  // Handler for + button in product search results (now in add item modal)
  const handleAddProductClick = (product: Product) => {
    setQtyPromptProduct(product);
    setQtyInput(1);
    setQtyPromptOpen(true);
    setTimeout(() => { qtyInputRef.current?.focus(); }, 100);
  };
  // Handler for confirming quantity (now only closes qty modal, not add item modal)
  const handleConfirmQty = () => {
    if (qtyPromptProduct && qtyInput > 0) {
      setAddedProducts(prev => [...prev, { ...qtyPromptProduct, quantity: qtyInput }]);
    }
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
    // Do NOT close addItemModalOpen here
  };
  // Handler for canceling
  const handleCancelQty = () => {
    setQtyPromptOpen(false);
    setQtyPromptProduct(null);
    setQtyInput(1);
  };

  const handleBack = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      setShowPlaceholderModal(true);
    } else {
      window.history.back();
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setProductsWithPricing([]);
      setPrintersWithProducts([]);
      setTransactionRecords([]);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        if (searchType === 'products') {
          // Product filter active
          let products = [];
          
          // First try direct product search
          try {
            const directProducts = await productService.searchProducts(searchQuery);
            products = directProducts;
          } catch (error) {
            console.log('Direct product search failed, trying printer-based search');
          }
          
          // If no direct products found, try searching by printer name/model
          if (products.length === 0) {
            try {
              const printers = await printerService.searchPrinters(searchQuery);
              // Get products for each found printer
              const printerProducts = await Promise.all(
                printers.map(async (printer) => {
                  try {
                    const { data: products, error } = await supabase
                      .from('product_printers')
                      .select('product:products(*)')
                      .eq('printer_id', printer.id)
                      .order('product(name)', { ascending: true })
                      .order('product(color)', { ascending: true });
                    return (products || []).map(pp => pp.product).filter(Boolean);
                  } catch (error) {
                    return [];
                  }
                })
              );
              // Flatten and deduplicate products
              const allProducts = printerProducts.flat();
              const uniqueProducts = allProducts.filter((product, index, self) => 
                index === self.findIndex(p => p.id === product.id)
              );
              products = uniqueProducts;
            } catch (error) {
              console.log('Printer-based product search failed');
            }
          }
          
          // Get pricing for found products
          const productsWithPricingData = await Promise.all(products.map(async product => {
            try {
              const [withSuppliers, withClients] = await Promise.all([
                productService.getProductWithSuppliers(product.id),
                productService.getProductWithClients(product.id)
              ]);
              return {
                ...product,
                suppliers: withSuppliers?.suppliers || [],
                clients: withClients?.clients || [],
                color: product.color
              };
            } catch (error) {
              return {
                ...product,
                suppliers: [],
                clients: [],
                color: product.color
              };
            }
          }));
          
          if (!cancelled) setProductsWithPricing(productsWithPricingData);
        } else if (searchType === 'printers') {
          // Printer filter active
          let printers = [];
          
          // First try direct printer search
          try {
            const directPrinters = await printerService.searchPrinters(searchQuery);
            printers = directPrinters;
          } catch (error) {
            console.log('Direct printer search failed, trying product-based search');
          }
          
          // If no direct printers found, try searching by product name/SKU
          if (printers.length === 0) {
            try {
              const products = await productService.searchProducts(searchQuery);
              // Get printers for each found product
              const productPrinters = await Promise.all(
                products.map(async (product) => {
                  try {
                    return await printerService.getProductPrinters(product.id);
                  } catch (error) {
                    return [];
                  }
                })
              );
              // Flatten and deduplicate printers
              const allPrinters = productPrinters.flat();
              const uniquePrinters = allPrinters.filter((printer, index, self) => 
                index === self.findIndex(p => p.id === printer.id)
              );
              printers = uniquePrinters;
            } catch (error) {
              console.log('Product-based printer search failed');
            }
          }
          
          // Get compatible products for found printers
          const printersWithProductsData = await Promise.all(printers.map(async printer => {
            try {
              const products = await supabase
                .from('product_printers')
                .select('product:products(*)')
                .eq('printer_id', printer.id)
                .order('product(name)', { ascending: true })
                .order('product(color)', { ascending: true });
              return {
                ...printer,
                compatibleProducts: (products.data || []).map(pp => pp.product).filter(Boolean)
              };
            } catch (error) {
              return {
                ...printer,
                compatibleProducts: []
              };
            }
          }));
          
          if (!cancelled) setPrintersWithProducts(printersWithProductsData);
        } else if (searchType === 'records') {
          // Records filter active - search for DR numbers and Purchase Order numbers
          try {
            // Import the transaction service
            const { transactionService } = await import('@/services/transactionService');
            
            // Get all transaction records and filter for matching DR/PO numbers
            const [poItems, deliveryItems] = await Promise.all([
              transactionService.getAllTransactions(),
              transactionService.getAllDeliveryItems()
            ]);
            
            // Combine and filter records based on search query
            const allRecords = [...poItems, ...deliveryItems];
            const filteredRecords = allRecords.filter(record => {
              const query = searchQuery.toLowerCase();
              return (
                (record.delivery_receipt_number && record.delivery_receipt_number.toLowerCase().includes(query)) ||
                (record.purchase_order_number && record.purchase_order_number.toLowerCase().includes(query))
              );
            });
            
            if (!cancelled) setTransactionRecords(filteredRecords);
          } catch (error) {
            console.log('Records search failed:', error);
            if (!cancelled) setTransactionRecords([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setProductsWithPricing([]);
          setPrintersWithProducts([]);
          setTransactionRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timeoutId = setTimeout(fetch, 300);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [searchQuery, searchType]);

  useEffect(() => {
    if (!showSalesModal || !productQuery.trim()) {
      setProductResults([]);
      return;
    }
    let cancelled = false;
    setProductSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await productService.searchProducts(productQuery);
        if (!cancelled) setProductResults(results);
      } catch (err) {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setProductSearchLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [productQuery, showSalesModal]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
    // Clear search results and query
    setSearchQuery("");
    setProductsWithPricing([]);
    setPrintersWithProducts([]);
    setTransactionRecords([]);
  };

  const handleCloseProductDetails = () => {
    setShowProductDetails(false);
    setSelectedProduct(null);
  };

  const toggleSupplierPrice = (productId: string) => {
    setShowSupplierPrices(prev => ({ ...prev, [productId]: !prev[productId] }));
  };
  const toggleClientPrice = (productId: string) => {
    setShowClientPrices(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const getAssignmentStatusInfo = (printer: PrinterWithProducts) => {
    const assignmentStatus = printer.printer_assignments?.filter((a: any) => a.status === 'active') || [];
    
    if (assignmentStatus.length === 0) {
      return {
        status: 'available',
        label: 'Available',
        color: 'bg-green-100 text-green-700'
      };
    } else {
      return {
        status: 'assigned',
        label: 'Currently Assigned',
        color: 'bg-blue-100 text-blue-700'
      };
    }
  };

  // Fetch client pricing for all products in the sales list when client or sales list changes
  useEffect(() => {
    const fetchPrices = async () => {
      if (!selectedClient) {
        setPricingMap({});
        return;
      }
      const allProductIds = Array.from(new Set(addedProducts.map(p => p.id)));
      const newPricing: Record<string, number> = {};
      for (const productId of allProductIds) {
        try {
          const productWithClients = await productService.getProductWithClients(productId);
          if (productWithClients && productWithClients.clients) {
            const clientEntry = productWithClients.clients.find((c: any) => c.client_id === selectedClient);
            newPricing[productId] = clientEntry ? clientEntry.quoted_price : 0;
          } else {
            newPricing[productId] = 0;
          }
        } catch {
          newPricing[productId] = 0;
        }
      }
      setPricingMap(newPricing);
    };
    fetchPrices();
  }, [selectedClient, addedProducts]);

  // Handler for record click
  const handleRecordClick = async (record: any) => {
    // Clear search results and query immediately
    setSearchQuery("");
    setProductsWithPricing([]);
    setPrintersWithProducts([]);
    setTransactionRecords([]);
    
    if (record.type === 'purchase_order' && record.purchase_order_id) {
      try {
        // Fetch full purchase order data
        const { purchaseOrderService } = await import('@/services/purchaseOrderService');
        const purchaseOrder = await purchaseOrderService.getPurchaseOrderWithItems(record.purchase_order_id);
        setSelectedPurchaseOrder(purchaseOrder);
        setShowPurchaseInvoiceModal(true);
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        toast.error('Failed to load purchase order details');
      }
    } else if (record.type === 'delivery_receipt' && record.delivery_id) {
      try {
        // Fetch full delivery data
        const { deliveryService } = await import('@/services/deliveryService');
        const delivery = await deliveryService.getDeliveryWithItems(record.delivery_id);
        setSelectedDelivery(delivery);
        setShowDeliveryReceiptModal(true);
      } catch (error) {
        console.error('Error fetching delivery:', error);
        toast.error('Failed to load delivery details');
      }
    }
  };

  return (
    <>
      {/* Purchase Invoice Preview Modal */}
      {showPurchaseInvoiceModal && selectedPurchaseOrder && (
        <PurchaseInvoicePreview
          isOpen={showPurchaseInvoiceModal}
          onClose={() => {
            setShowPurchaseInvoiceModal(false);
            setSelectedPurchaseOrder(null);
          }}
          purchaseOrder={selectedPurchaseOrder}
        />
      )}

      {/* Delivery Receipt Preview Modal */}
      {showDeliveryReceiptModal && selectedDelivery && (
        <PurchaseDeliveryPreview
          isOpen={showDeliveryReceiptModal}
          onClose={() => {
            setShowDeliveryReceiptModal(false);
            setSelectedDelivery(null);
          }}
          delivery={selectedDelivery}
        />
      )}

      {/* Add Item Modal */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg flex flex-col items-center relative">
            <h3 className="text-lg font-semibold mb-4">Add Item to Sale</h3>
            <Input
              type="text"
              placeholder="Search products to add..."
              value={productQuery}
              onChange={e => setProductQuery(e.target.value)}
              className="mb-2"
            />
            {/* Product search results */}
            {productQuery.trim() && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow max-h-64 overflow-y-auto w-full">
                {productSearchLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
                ) : productResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">No products found</div>
                ) : (
                  productResults.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between px-4 py-2 border-b last:border-b-0 hover:bg-orange-50 transition cursor-pointer"
                      onClick={() => handleAddProductClick(product)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        {product.color && <div className="text-xs text-gray-400">Color: {product.color}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <button
              className="mt-4 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
              onClick={() => setAddItemModalOpen(false)}
            >Close</button>
          </div>
        </div>
      )}
      {/* Quantity Prompt Modal (remains above all) */}
      {qtyPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-xs flex flex-col items-center relative">
            <h3 className="text-lg font-semibold mb-2">Enter Quantity</h3>
            <div className="mb-4 w-full">
              <input
                ref={qtyInputRef}
                type="number"
                min={1}
                value={qtyInput}
                onChange={e => setQtyInput(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-2 w-full">
              <button
                className="flex-1 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                onClick={() => { setQtyPromptOpen(false); setQtyPromptProduct(null); setQtyInput(1); }}
              >Cancel</button>
              <button
                className="flex-1 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                onClick={handleConfirmQty}
                disabled={qtyInput < 1}
              >Add</button>
            </div>
          </div>
        </div>
      )}
      {/* POS Modal for Sales */}
      {showSalesModal && (
        <AddSalesModal isOpen={showSalesModal} onClose={() => setShowSalesModal(false)} />
      )}
      {showPurchaseModal && (
        <AddPurchaseModal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} />
      )}
      {showDeliveryModal && (
        <CreateDeliveryModal onClose={() => setShowDeliveryModal(false)} />
      )}
      {showTransactionRecordsModal && (
        <TransactionRecordModal open={showTransactionRecordsModal} onClose={() => setShowTransactionRecordsModal(false)} />
      )}
      {/* Floating Bottom Search Bar */}
      <div className={`fixed bottom-0 left-0 w-full ${showSalesModal ? 'z-0 pointer-events-none' : 'z-[10000]'}`} style={showSalesModal ? { opacity: 0.2 } : {}}>
        <div className="w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl">
          <div className="px-2 py-2">
            <div className="flex items-center gap-2">
              {/* Menu Button */}
              <div className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Menu"
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200"
                    >
                      <User className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 z-[9999]">
                    <DropdownMenuItem onClick={() => setShowAccountSettings(true)}>
                      <Settings className="mr-2 h-4 w-4" /> Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDeveloperModal(true)}>
                      <Settings className="mr-2 h-4 w-4" /> Developer Mode
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSubmitReportModal(true)}>
                      <FileText className="mr-2 h-4 w-4" /> Submit Report
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/auth";
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Search Input - Hidden for client users */}
              {userProfile?.role !== 'client' && (
                <div className="flex-1">
                  <MobileSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search anything - products, printers, SKUs, models..."
                  />
                </div>
              )}
               
              {/* Filter Buttons - Hidden for client users */}
              {userProfile?.role !== 'client' && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSearchType('printers')}
                    className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200
                      ${searchType === 'printers' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    aria-pressed={searchType === 'printers'}
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('products')}
                    className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200
                      ${searchType === 'products' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    aria-pressed={searchType === 'products'}
                  >
                     <Package className="h-4 w-4" />
                   </button>
                   <button
                     type="button"
                     onClick={() => setSearchType('records')}
                     className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200
                       ${searchType === 'records' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                     `}
                     aria-pressed={searchType === 'records'}
                   >
                     <FileText className="h-4 w-4" />
                   </button>
                 </div>
               )}

              {/* Add Button - Hidden for client users */}
              {userProfile?.role !== 'client' && (
                <div className="flex-shrink-0 relative">
                  <AnimatePresence>
                    {showAddMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full right-0 mb-2 z-50"
                      >
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-80 max-w-[90vw]">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Add Options</h3>
                            <button
                              onClick={() => setShowAddMenu(false)}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                              aria-label="Close menu"
                            >
                              <X className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                          {/* Menu Options */}
                          <div className="space-y-3">
                            <button
                              onClick={() => { setShowAddMenu(false); setShowSalesModal(true); }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors text-left"
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="font-bold text-orange-600 text-lg">S</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">Sales</h4>
                              </div>
                            </button>
                            {/* New Transaction Records Option */}
                            <button
                              onClick={() => { setShowAddMenu(false); setShowTransactionRecordsModal(true); }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors text-left"
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                                <FileText className="text-violet-600 h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">Transaction Records</h4>
                              </div>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Desktop Add Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition border border-orange-700 ml-2 hidden sm:flex"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add</span>
                  </button>
                  {/* Mobile Add Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white transition border border-orange-700 flex sm:hidden ml-2"
                    aria-label="Add"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Search Results Dropdown (above input) */}
            {searchQuery.trim() && (
              <div className="w-full mb-2 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg z-20 relative pt-2">
                {/* Close button - sticky at the top right */}
                <button
                  type="button"
                  className="sticky top-0 right-0 float-right m-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition border border-gray-300 shadow z-10"
                  aria-label="Close results"
                  onClick={e => { e.stopPropagation(); setSearchQuery(""); }}
                >
                  <X className="h-4 w-4" />
                </button>
                {loading ? (
                  <CustomLoading message="Searching products" />
                ) : error ? (
                  <div className="w-full text-center py-4">
                    <div className="text-red-500 text-sm break-words">{error}</div>
                  </div>
                ) : searchType === 'products' ? (
                  // Product Results
                  productsWithPricing.length > 0 ? (
                    <div className="w-full space-y-3 p-1">
                      {productsWithPricing.map(product => {
                        // Filter out 0.0 prices
                        const filteredSuppliers = (product.suppliers || []).filter(s => s.current_price && s.current_price > 0);
                        const filteredClients = (product.clients || []).filter(c => c.quoted_price && c.quoted_price > 0);
                        return (
                          <div
                            key={product.id}
                            className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-2">
                              {/* Product Info */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 text-lg leading-tight">{product.name}</span>
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{product.sku}</span>
                                {product.color && <span className="inline-block w-3 h-3 rounded-full border ml-1" style={{ backgroundColor: product.color }} />}
                              </div>
                              {/* Supplier Pricing */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="font-medium">Supplier pricing:</span>
                                  <button
                                    type="button"
                                    className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-200 transition"
                                    onClick={e => { e.stopPropagation(); toggleSupplierPrice(product.id); }}
                                  >
                                    {showSupplierPrices[product.id] ? 'HIDE' : <Eye className="inline h-4 w-4" />}
                                  </button>
                                </div>
                                {filteredSuppliers.length > 0 ? (
                                  showSupplierPrices[product.id] ? (
                                    <div className="flex flex-wrap gap-1">
                                      {filteredSuppliers.map(supplierRelation => (
                                        <span
                                          key={supplierRelation.id}
                                          className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-base font-bold text-blue-800"
                                        >
                                          {supplierRelation.supplier?.name}: <span className="font-bold text-blue-900">₱{supplierRelation.current_price?.toLocaleString()}</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-base text-blue-800 font-bold">
                                      ₱{Math.max(...filteredSuppliers.map(s => s.current_price)).toLocaleString()}
                                    </div>
                                  )
                                ) : (
                                  <div className="text-xs text-gray-500">No supplier pricing available</div>
                                )}
                              </div>
                              {/* Client Pricing */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="font-medium">Client pricing:</span>
                                  <button
                                    type="button"
                                    className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold border border-green-200 hover:bg-green-200 transition"
                                    onClick={e => { e.stopPropagation(); toggleClientPrice(product.id); }}
                                  >
                                    {showClientPrices[product.id] ? 'HIDE' : <Eye className="inline h-4 w-4" />}
                                  </button>
                                </div>
                                {filteredClients.length > 0 ? (
                                  showClientPrices[product.id] ? (
                                    <div className="flex flex-wrap gap-1">
                                      {filteredClients.map(clientRelation => (
                                        <span
                                          key={clientRelation.id}
                                          className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-1 text-base font-bold text-green-800"
                                        >
                                          {clientRelation.client?.name}: <span className="font-bold text-green-900">₱{clientRelation.quoted_price?.toLocaleString()}</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-base text-green-800 font-bold">
                                      ₱{Math.max(...filteredClients.map(c => c.quoted_price)).toLocaleString()}
                                    </div>
                                  )
                                ) : (
                                  <div className="text-xs text-gray-500">No client pricing available</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full text-center py-4">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30 text-gray-400" />
                      <p className="text-gray-500 text-sm mb-1">No products found</p>
                      <p className="text-xs text-gray-400 px-4 break-words">
                        Try searching for product names, SKUs, or printer names/models
                      </p>
                    </div>
                  )
                 ) : searchType === 'printers' ? (
                   // Printer Results
                   printersWithProducts.length > 0 ? (
                     <div className="w-full space-y-3 p-1">
                      {printersWithProducts.map(printer => {
                        const statusInfo = getAssignmentStatusInfo(printer);
                        return (
                          <div
                            key={printer.id}
                            className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              {/* Thumbnail */}
                              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded border overflow-hidden mr-3">
                                {printer.image_url ? (
                                  <img src={printer.image_url} alt={printer.name} className="object-contain w-full h-full" />
                                ) : (
                                  <Printer className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-sm">
                                    {[printer.manufacturer, printer.series, printer.model || printer.name].filter(Boolean).join(' ')}
                                  </h4>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </Badge>
                                    {printer.rental_eligible && (
                                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                        Rental Eligible
                                      </Badge>
                                    )}
                                    {printer.color && (
                                      <Badge variant="outline" className="text-xs">
                                        {printer.color}
                                      </Badge>
                                    )}
                                  </div>
                                  {/* Compatible Products Section */}
                                  <div className="mt-2">
                                    <span className="text-xs text-gray-600 block mb-1">Compatible Products:</span>
                                    {printer.compatibleProducts.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {(() => {
                                          // Group products by name and SKU
                                          const grouped = printer.compatibleProducts.reduce((acc, product: any) => {
                                            const key = `${product.name}-${product.sku}`;
                                            if (!acc[key]) {
                                              acc[key] = {
                                                name: product.name,
                                                sku: product.sku,
                                                colors: [],
                                                allProducts: []
                                              };
                                            }
                                            if (product.color && !acc[key].colors.includes(product.color)) {
                                              acc[key].colors.push(product.color);
                                            }
                                            acc[key].allProducts.push(product);
                                            return acc;
                                          }, {} as Record<string, {
                                            name: string;
                                            sku?: string;
                                            colors: string[];
                                            allProducts: any[];
                                          }>);

                                          return Object.values(grouped).map((group, idx) => (
                                            <Badge key={idx} variant="outline" className="flex items-center space-x-1.5 text-xs bg-gray-50">
                                              <span>{group.name}{group.sku && ` (${group.sku})`}</span>
                                              {group.colors.map(color => <ColorDot key={color} color={color} />)}
                                            </Badge>
                                          ));
                                        })()}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">No compatible products found</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full text-center py-4">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30 text-gray-400" />
                      <p className="text-gray-500 text-sm mb-1">No printers found</p>
                      <p className="text-xs text-gray-400 px-4 break-words">
                        Try searching for printer names, models, or product names/SKUs
                      </p>
                     </div>
                   )
                 ) : (
                   // Records Results
                   transactionRecords.length > 0 ? (
                     <div className="w-full space-y-3 p-1">
                       {transactionRecords.map(record => (
                         <div
                           key={record.id}
                           className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => handleRecordClick(record)}
                         >
                           <div className="space-y-2">
                             {/* Record Info */}
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <span className="font-bold text-gray-900 text-lg leading-tight">{record.model}</span>
                                 <Badge variant="outline" className="text-xs">
                                   {record.type === 'purchase_order' ? 'PO' : record.type === 'delivery_receipt' ? 'DR' : record.type}
                                 </Badge>
                               </div>
                               <div className="text-right">
                                 <div className="text-sm font-medium text-gray-900">₱{record.total_price?.toLocaleString()}</div>
                                 <div className="text-xs text-gray-500">Qty: {record.quantity}</div>
                               </div>
                             </div>
                             
                             {/* Record Details */}
                             <div className="grid grid-cols-2 gap-2 text-xs">
                               <div>
                                 <span className="text-gray-600">Customer:</span>
                                 <div className="font-medium text-gray-900">{record.customer || 'N/A'}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">Date:</span>
                                 <div className="font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</div>
                               </div>
                               {record.purchase_order_number && (
                                 <div>
                                   <span className="text-gray-600">PO Number:</span>
                                   <div className="font-medium text-blue-900">{record.purchase_order_number}</div>
                                 </div>
                               )}
                               {record.delivery_receipt_number && (
                                 <div>
                                   <span className="text-gray-600">DR Number:</span>
                                   <div className="font-medium text-green-900">{record.delivery_receipt_number}</div>
                                 </div>
                               )}
                             </div>
                             
                             {/* Status */}
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary" className={`text-xs ${
                                 record.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                 record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                 record.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                 'bg-gray-100 text-gray-700'
                               }`}>
                                 {record.status}
                               </Badge>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="w-full text-center py-4">
                       <Search className="h-8 w-8 mx-auto mb-2 opacity-30 text-gray-400" />
                       <p className="text-gray-500 text-sm mb-1">No records found</p>
                       <p className="text-xs text-gray-400 px-4 break-words">
                         Try searching for DR numbers or Purchase Order numbers
                       </p>
                     </div>
                   )
                 )}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <ProductDetailsModal
          isOpen={showProductDetails}
          onClose={handleCloseProductDetails}
          product={selectedProduct} 
        />
      )}
      {/* Placeholder Modal for Back Button */}
      <Dialog open={showPlaceholderModal} onOpenChange={setShowPlaceholderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-600 flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowPlaceholderModal(false);
                // Optionally, show a toast or open settings
              }}
            >
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Account Settings Modal */}
      <AccountSettings isOpen={showAccountSettings} onClose={() => setShowAccountSettings(false)} />
      {/* Developer Mode Modal */}
      <DevTesting open={showDeveloperModal} onClose={() => setShowDeveloperModal(false)} />
      {/* Submit Report Modal */}
      <SubmitReportModal isOpen={showSubmitReportModal} onClose={() => setShowSubmitReportModal(false)} />
    </>
  );
};
