import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { printerService } from '@/services/printerService';
import { productService } from '@/services/productService';
import { Printer, Product } from '@/types/database';
import { Loader2, MessageCircle, Package, Printer as PrinterIcon, Star, Plus, Minus, ShoppingCart } from 'lucide-react';

const PrinterSearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const printerId = searchParams.get('printerId');
  const query = searchParams.get('q');
  
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [searchedPrinters, setSearchedPrinters] = useState<Printer[]>([]);
  const [compatibleProducts, setCompatibleProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (printerId) {
          // Fetch specific printer and its compatible products
          const printers = await printerService.getPrinters();
          const foundPrinter = printers.find(p => p.id === printerId);
          
          if (foundPrinter) {
            setPrinter(foundPrinter);
            const products = await productService.getProductsByPrinter(printerId);
            setCompatibleProducts(products);
            // Initialize quantities
            const initialQuantities: { [key: string]: number } = {};
            products.forEach(product => {
              initialQuantities[product.id] = 1;
            });
            setQuantities(initialQuantities);
          } else {
            setError('Printer not found');
          }
        } else if (query) {
          // Search for printers matching the query
          const printers = await printerService.searchPrinters(query);
          setSearchedPrinters(printers);
          
          if (printers.length === 1) {
            // If only one printer found, show it directly
            setPrinter(printers[0]);
            const products = await productService.getProductsByPrinter(printers[0].id);
            setCompatibleProducts(products);
            const initialQuantities: { [key: string]: number } = {};
            products.forEach(product => {
              initialQuantities[product.id] = 1;
            });
            setQuantities(initialQuantities);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load printer data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [printerId, query]);

  const handleInquirePrice = () => {
    const message = `I would like to inquire about pricing for ${printer?.name} compatible products.`;
    window.open(`mailto:info@techpinoy.com?subject=Price Inquiry for ${printer?.name}&body=${encodeURIComponent(message)}`, '_blank');
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantities(prev => ({
        ...prev,
        [productId]: newQuantity
      }));
    }
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    console.log(`Adding ${quantity} of ${product.name} to cart`);
    // TODO: Implement actual cart functionality
  };

  const getMinPrice = () => {
    // Mock pricing logic - in real app, this would come from your pricing data
    const basePrice = Math.floor(Math.random() * 50) + 20;
    return basePrice;
  };

  const renderStars = (rating: number = 4.5) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({Math.floor(Math.random() * 50) + 10} reviews)</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">Loading printer information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/store">
              <Button>Return to Store</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-4 py-8">
        {/* Multiple search results */}
        {searchedPrinters.length > 1 && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Found {searchedPrinters.length} printers matching "{query}"
            </h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchedPrinters.map((searchPrinter) => (
                <Card key={searchPrinter.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <PrinterIcon className="h-8 w-8 text-teal-600 mr-3" />
                      <div>
                        <h3 className="font-semibold text-lg">{searchPrinter.name}</h3>
                        {searchPrinter.manufacturer && (
                          <p className="text-gray-600">{searchPrinter.manufacturer}</p>
                        )}
                      </div>
                    </div>
                    <Link to={`/printer-search?printerId=${searchPrinter.id}`}>
                      <Button className="w-full">View Compatible Products</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Single printer details */}
        {printer && (
          <div>
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {printer.manufacturer} {printer.name} Toner from ${getMinPrice()}.99
              </h1>
              <div className="text-gray-600 max-w-4xl">
                <p className="mb-2">
                  <strong>Replace cartridges often</strong> in the {printer.manufacturer} {printer.series} due to its yellow compatibility. Also get quality cartridges that consistently produce high page yield.
                </p>
                <p className="mb-2">
                  <strong>Intelligent chip</strong> - most these discount compatible {printer.manufacturer} toner cartridges utilize exceptional performance at overwhelming cost savings. With compatibility to customers satisfaction, {"100%"} flow products & {"100%"} remanufactured, guaranteed, and at a {"100%"} purchase volume. It will give you professional and great advantages.
                </p>
                <p>
                  <strong>Toner technology</strong> advantage combined with ["100%"] Toner Canon Color imageCLASS MF{"series"} cartridge drive high yield.
                </p>
              </div>
            </div>

            {/* Compatible Products Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Color imageCLASS MF{printer.series || "654C"}
                </h2>
              </div>
              
              <div className="p-6">
                {compatibleProducts.length > 0 ? (
                  <div className="space-y-6">
                    {compatibleProducts.map((product) => {
                      const basePrice = getMinPrice();
                      const discountedPrice = Math.floor(basePrice * 0.8);
                      const currentQuantity = quantities[product.id] || 1;
                      
                      return (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Product Image */}
                            <div className="relative">
                              <Badge className="absolute -top-2 -left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                                QUICK BUY
                              </Badge>
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-10 h-10 text-gray-400" />
                              </div>
                            </div>

                            {/* Product Details */}
                            <div className="flex-1">
                              {/* Rating */}
                              {renderStars()}
                              
                              {/* Product Name */}
                              <h3 className="font-semibold text-lg text-gray-900 mt-2 mb-1">
                                Compatible {printer.manufacturer} {product.name} | High Yield
                              </h3>
                              
                              {/* Color dots and page count */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1">
                                  {product.color && (
                                    <div className={`w-3 h-3 rounded-full ${
                                      product.color.toLowerCase() === 'black' ? 'bg-black' :
                                      product.color.toLowerCase() === 'cyan' ? 'bg-cyan-500' :
                                      product.color.toLowerCase() === 'magenta' ? 'bg-pink-500' :
                                      product.color.toLowerCase() === 'yellow' ? 'bg-yellow-400' :
                                      'bg-gray-400'
                                    }`}></div>
                                  )}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {Math.floor(Math.random() * 3000) + 1000} Pages
                                </span>
                              </div>

                              {/* SKU */}
                              <p className="text-sm text-gray-500 mb-3">SKU: {product.sku}</p>
                            </div>

                            {/* Price and Controls */}
                            <div className="text-right">
                              {/* Price */}
                              <div className="mb-4">
                                <div className="text-2xl font-bold text-pink-600">
                                  ${discountedPrice}.95
                                </div>
                                <div className="text-sm text-gray-500 line-through">
                                  ${basePrice}.99
                                </div>
                                <div className="text-xs text-gray-600">
                                  In Stock ✓
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, currentQuantity - 1)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">{currentQuantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Add to Cart Button */}
                              <Button
                                onClick={() => handleAddToCart(product)}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Compatible Products Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We don{"'"}t have any products listed for this printer model yet.
                    </p>
                    <Button onClick={handleInquirePrice} variant="outline">
                      Contact Us for Available Options
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Inquire Price Section */}
            <Card className="mt-8">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Need Pricing Information?
                </h3>
                <p className="text-gray-600 mb-6">
                  Get personalized quotes for {printer.name} compatible products. 
                  Our team will provide you with the best prices and availability.
                </p>
                <Button 
                  onClick={handleInquirePrice}
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Inquire Price
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No results */}
        {!printer && searchedPrinters.length === 0 && query && (
          <div className="text-center py-16">
            <PrinterIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No printers found for "{query}"
            </h1>
            <p className="text-gray-600 mb-6">
              Try searching with a different model name or manufacturer.
            </p>
            <Link to="/store">
              <Button>Return to Store</Button>
            </Link>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default PrinterSearchResults;