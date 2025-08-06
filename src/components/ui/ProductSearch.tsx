
import { useState, useEffect } from "react";
import { Search, Eye, X, ArrowLeft, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/sales";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import { productService } from "@/services/productService";
import { useLocation } from "react-router-dom";
import AddPrinterModal from "@/components/AddPrinterModal";
import NavigationButton from "@/PrinterDashboard/components/NavigationButton";
import { CustomLoading } from "@/components/ui/CustomLoading";

export const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [productsWithPricing, setProductsWithPricing] = useState<any[]>([]);
  const [showSupplierPrices, setShowSupplierPrices] = useState<{ [productId: string]: boolean }>({});
  const [showClientPrices, setShowClientPrices] = useState<{ [productId: string]: boolean }>({});
  const [showAddPrinter, setShowAddPrinter] = useState(false);

  const location = useLocation();
  const isRootRoute = location.pathname === '/';
  const isSearchActive = searchQuery.trim().length > 0;

  // Search and fetch pricing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProductsWithPricing([]);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await productService.searchProducts(searchQuery);
        const productsWithPricingData = await Promise.all(results.map(async product => {
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
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setProductsWithPricing([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timeoutId = setTimeout(fetch, 300);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [searchQuery]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
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

  const handleBackClick = () => {
    setSearchQuery("");
  };

  return (
    <>
      {/* Floating Bottom Search Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        <div className="w-full bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl">
          <div className="w-full px-4 py-3">
            {/* Compact Search Input */}
            <div className="w-full relative flex flex-col-reverse">
              {/* Search Input */}
              <div className="w-full relative z-10 flex items-center gap-2">
                {/* Navigation Button - shows logo on root route when not searching, back arrow otherwise */}
                <NavigationButton
                  label="Back"
                  isActive={false}
                  show={!isRootRoute || isSearchActive}
                  isInitial={isRootRoute && !isSearchActive}
                  onClick={handleBackClick}
                />
                
                {/* Search input with icon inside */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                  <Input
                    placeholder="Search products, printers, SKU..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/90 border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                
                {/* + icon to open AddPrinterModal */}
                <button
                  type="button"
                  className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 hover:text-orange-800 transition border border-orange-200 ml-2"
                  aria-label="Add printer"
                  onClick={() => setShowAddPrinter(true)}
                  style={{ zIndex: 11 }}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search Results Dropdown (above input) - Higher z-index to appear above navigation */}
              {searchQuery.trim() && (
                <div className="w-full mb-2 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-lg border border-gray-200 rounded-lg shadow-lg z-50 relative pt-2">
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
                  ) : productsWithPricing.length > 0 ? (
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
                        Try searching for printer names, product names, SKUs, or aliases
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Offline Indicator */}
            {/* isOffline && (
              <div className="w-full mt-2">
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-2">
                  <p className="text-xs text-orange-800">
                    <strong>Offline Mode:</strong> Searching in cached data only
                  </p>
                </div>
              </div>
            ) */}
          </div>
        </div>
      </div>

      <ProductDetailsModal 
        isOpen={showProductDetails} 
        onClose={handleCloseProductDetails} 
        product={selectedProduct} 
      />
      {/* AddPrinterModal */}
      {showAddPrinter && (
        <AddPrinterModal isOpen={showAddPrinter} onClose={() => setShowAddPrinter(false)} onPrinterAdded={() => {}} />
      )}
    </>
  );
};
