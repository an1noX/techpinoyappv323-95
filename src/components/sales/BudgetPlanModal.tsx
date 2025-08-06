import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingDown, TrendingUp, Package, Calculator, ShoppingCart, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { productService } from '@/services/productService';
import { supplierService } from '@/services/supplierService';
import { PurchaseOrderWithItems } from '@/services/purchaseOrderService';
import { toast } from 'sonner';
import { CreateInventoryPurchaseModal } from './CreateInventoryPurchaseModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface BudgetPlanModalProps {
  purchaseOrderId: string;
  onClose: () => void;
}

interface BudgetItem {
  id: string;
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
  remaining_quantity: number;
  suppliers?: Array<{
    id: string;
    product_supplier_id: string;
    supplier_name: string;
    current_price: number;
    priceStatus: 'lowest' | 'highest' | 'middle';
  }>;
  recommended_supplier?: {
    id: string;
    supplier_name: string;
    current_price: number;
  };
  potential_savings?: number;
}

interface BudgetSummary {
  total_original_cost: number;
  total_optimized_cost: number;
  total_potential_savings: number;
  savings_percentage: number;
  items_count: number;
  remaining_items_count: number;
}

export const BudgetPlanModal = ({ purchaseOrderId, onClose }: BudgetPlanModalProps) => {
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [showCreatePurchase, setShowCreatePurchase] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ itemId: string, supplierId: string, productSupplierId: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetchBudgetPlanData();
  }, [purchaseOrderId]);

  const formatProductDisplay = (productData: any, fallbackModel?: string) => {
    if (!productData) {
      return fallbackModel || 'Unknown Product';
    }
    
    const name = productData.name || fallbackModel || 'Unknown Product';
    const sku = productData.sku ? `(${productData.sku})` : '';
    const color = productData.color ? ` ${productData.color}` : '';
    
    return `${name} ${sku}${color}`.trim();
  };

  const fetchBudgetPlanData = async () => {
    setLoading(true);
    try {
      // Fetch all suppliers first
      const suppliers = await supplierService.getSuppliers();
      setAllSuppliers(suppliers);
      
      // Get PO with items
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*)
        `)
        .eq('id', purchaseOrderId)
        .single();

      if (poError || !poData || !poData.purchase_order_items) {
        toast.error('No purchase order data found');
        return;
      }

      // Calculate delivered quantities using the same logic as PurchaseInvoicePreview
      const deliveredQuantities: Record<string, number> = {};
      
      try {
        // Fetch linked delivery items instead of deliveries by PO
        const { deliveryItemLinkService } = await import('@/services/deliveryItemLinkService');
        const linkedItems = await deliveryItemLinkService.getDeliveryItemLinksByPurchaseOrder(purchaseOrderId);
        
        // Calculate delivered quantities based on linked items
        linkedItems.forEach(link => {
          if (link.delivery_item?.product_id) {
            const productId = link.delivery_item.product_id;
            // Use linked_quantity instead of full delivery quantity
            deliveredQuantities[productId] = (deliveredQuantities[productId] || 0) + (link.linked_quantity || 0);
          }
        });
      } catch (error) {
        console.error('Error fetching linked delivery items:', error);
        // Fallback to empty deliveries if linking service fails
      }
      
       // Fetch supplier pricing for each unique product and calculate remaining quantities
       const budgetItemsPromises = poData.purchase_order_items.map(async (item) => {
         // Calculate remaining quantity (ordered - delivered)
         const deliveredQty = item.product_id ? (deliveredQuantities[item.product_id] || 0) : 0;
         const remainingQty = Math.max(0, item.quantity - deliveredQty);
         
         // Skip items that are fully delivered
         if (remainingQty <= 0) {
           return null;
         }

         if (!item.product_id) {
           return {
             id: item.id,
             product_id: item.product_id,
             model: item.model || 'Unknown Product',
             quantity: item.quantity,
             unit_price: item.unit_price,
             remaining_quantity: remainingQty,
             suppliers: [],
             recommended_supplier: undefined,
             potential_savings: 0
           };
         }

         // Get product with suppliers
         const productWithSuppliers = await productService.getProductWithSuppliers(item.product_id);
         
         // Filter out ZK suppliers and get valid pricing
         const validSuppliers = productWithSuppliers?.suppliers?.filter(s => 
           s.current_price != null && 
           s.current_price > 0 && 
           s.supplier && 
           !s.supplier.name.toLowerCase().includes('zk')
         ) || [];

         // Calculate price analysis
         let supplierAnalysis: any[] = [];
         let recommendedSupplier;
         let potentialSavings = 0;

         if (validSuppliers.length > 0) {
           const prices = validSuppliers.map(s => s.current_price);
           const minPrice = Math.min(...prices);
           const maxPrice = Math.max(...prices);

           supplierAnalysis = validSuppliers.map(supplier => {
             const priceStatus: 'lowest' | 'highest' | 'middle' = 
               supplier.current_price === minPrice ? 'lowest' : 
               supplier.current_price === maxPrice ? 'highest' : 'middle';
             
             return {
               id: supplier.supplier_id,
               product_supplier_id: supplier.id, // This is the product_suppliers table ID
               supplier_name: supplier.supplier?.name || 'Unknown Supplier',
               current_price: supplier.current_price,
               priceStatus
             };
           });

           // Find recommended supplier (lowest price)
           recommendedSupplier = supplierAnalysis.find(s => s.priceStatus === 'lowest');
           
           // Calculate potential savings based on remaining quantity only
           if (recommendedSupplier && recommendedSupplier.current_price < item.unit_price) {
             potentialSavings = (item.unit_price - recommendedSupplier.current_price) * remainingQty;
           }
         }

         return {
           id: item.id,
           product_id: item.product_id,
           model: formatProductDisplay(productWithSuppliers, item.model),
           quantity: item.quantity,
           unit_price: item.unit_price,
           remaining_quantity: remainingQty,
           suppliers: supplierAnalysis,
           recommended_supplier: recommendedSupplier,
           potential_savings: potentialSavings
         };
       });

       const resolvedBudgetItems = (await Promise.all(budgetItemsPromises)).filter(Boolean); // Remove null items (fully delivered)
      setBudgetItems(resolvedBudgetItems);

      // Calculate summary
      const totalOriginalCost = resolvedBudgetItems.reduce((sum, item) => 
        sum + (item.unit_price * item.remaining_quantity), 0
      );
      
      const totalOptimizedCost = resolvedBudgetItems.reduce((sum, item) => 
        sum + ((item.recommended_supplier?.current_price || item.unit_price) * item.remaining_quantity), 0
      );
      
      const totalPotentialSavings = resolvedBudgetItems.reduce((sum, item) => 
        sum + (item.potential_savings || 0), 0
      );

      const savingsPercentage = totalOriginalCost > 0 ? 
        (totalPotentialSavings / totalOriginalCost) * 100 : 0;

      setBudgetSummary({
        total_original_cost: totalOriginalCost,
        total_optimized_cost: totalOptimizedCost,
        total_potential_savings: totalPotentialSavings,
        savings_percentage: savingsPercentage,
        items_count: poData.purchase_order_items.length,
        remaining_items_count: resolvedBudgetItems.filter(item => item.remaining_quantity > 0).length
      });

    } catch (error) {
      console.error('Error fetching budget plan data:', error);
      toast.error('Failed to generate budget plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceClick = (itemId: string, supplierId: string, productSupplierId: string | null, currentPrice: number) => {
    setEditingPrice({ itemId, supplierId, productSupplierId: productSupplierId || '' });
    setEditingValue(currentPrice.toString());
  };

  const handlePriceUpdate = async () => {
    if (!editingPrice) return;

    const newPrice = parseFloat(editingValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    // Debug: Check authentication context
    const { data: { user } } = await supabase.auth.getUser();
    console.log('BudgetPlanModal - Current user:', user);
    console.log('BudgetPlanModal - User role:', user?.role);
    console.log('BudgetPlanModal - Is authenticated:', !!user);

    try {
      if (editingPrice.productSupplierId) {
        // Update existing product_suppliers entry
        await productService.updateSupplierPrice(editingPrice.productSupplierId, newPrice);
      } else {
        // Create new product_suppliers entry
        const item = budgetItems.find(item => item.id === editingPrice.itemId);
        const supplier = allSuppliers.find(s => s.id === editingPrice.supplierId);
        
        if (!item?.product_id) {
          toast.error('Product ID not found');
          return;
        }
        
        if (!supplier) {
          toast.error('Supplier not found');
          return;
        }
        
        // Use the existing supplier data to create the relationship
        await productService.addSupplierToProduct(
          item.product_id,
          { 
            name: supplier.name,
            contact_email: supplier.contact_email,
            phone: supplier.phone,
            notes: supplier.notes
          },
          newPrice
        );
      }
      
      toast.success('Price updated successfully');
      
      // Refresh the data to show updated prices and recalculate everything
      await fetchBudgetPlanData();
      
      setEditingPrice(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setEditingValue('');
  };

  const validateAndPrepareItems = () => {
    const validItems = budgetItems.filter(item => 
      item.recommended_supplier && 
      item.remaining_quantity > 0 && 
      item.product_id
    );
    
    const invalidItems = budgetItems.filter(item => 
      item.remaining_quantity > 0 && 
      (!item.recommended_supplier || !item.product_id)
    );

    return { validItems, invalidItems };
  };

  const handleCreatePurchaseClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmCreatePurchase = () => {
    setShowConfirmation(false);
    setShowCreatePurchase(true);
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div>Generating budget plan...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator size={20} />
            <span>Budget Plan - PO #{purchaseOrderId.slice(0, 8)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Budget Summary */}
          {budgetSummary && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign size={18} />
                  <span>Budget Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      ₱{budgetSummary.total_original_cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Quoted Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{budgetSummary.total_optimized_cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Optimized Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{budgetSummary.total_potential_savings.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Potential Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {budgetSummary.savings_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Profit Percentage</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Items: {budgetSummary.items_count}</span>
                    <span>Items with Pricing: {budgetSummary.remaining_items_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Items - Sheet Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package size={18} />
                <span>Item Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 border-r">Products</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center border-r">Qty</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right border-r">Quoted Price</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right border-r">Total Price</TableHead>
                      {/* Dynamic supplier columns */}
                      {Array.from(new Set(budgetItems.flatMap(item => 
                        item.suppliers?.map(s => s.supplier_name) || []
                      ))).map(supplierName => (
                        <TableHead key={supplierName} className="font-semibold text-gray-900 text-right border-r min-w-[120px]">
                          {supplierName}
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold text-gray-900 text-right border-r">Best Price</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">Potential Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item, index) => {
                      const supplierColumns = Array.from(new Set(budgetItems.flatMap(item => 
                        item.suppliers?.map(s => s.supplier_name) || []
                      )));
                      
                      return (
                        <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <TableCell className="font-medium border-r">
                            {item.model}
                          </TableCell>
                          <TableCell className="text-center border-r">
                            {item.remaining_quantity}
                          </TableCell>
                          <TableCell className="text-right border-r font-mono">
                            ₱{item.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right border-r font-mono font-medium">
                            ₱{(item.unit_price * item.remaining_quantity).toFixed(2)}
                          </TableCell>
                          
                          {/* Supplier price columns */}
                          {supplierColumns.map(supplierName => {
                            const supplier = item.suppliers?.find(s => s.supplier_name === supplierName);
                            const supplierInAllSuppliers = allSuppliers.find(s => s.name === supplierName);
                            
                            if (!supplier) {
                              // Show ₱0.00 and make it editable for suppliers that don't have pricing
                              return (
                                <TableCell key={supplierName} className="text-right border-r text-gray-400">
                                  {editingPrice?.itemId === item.id && editingPrice?.supplierId === supplierInAllSuppliers?.id ? (
                                    <div className="flex items-center space-x-1">
                                      <Input
                                        type="number"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-20 h-8 text-xs"
                                        step="0.01"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handlePriceUpdate();
                                          if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={handlePriceUpdate}
                                      >
                                        <Check size={12} className="text-green-600" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={handleCancelEdit}
                                      >
                                        <X size={12} className="text-red-600" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="cursor-pointer hover:bg-gray-100 p-1 rounded font-mono"
                                      onClick={() => handlePriceClick(item.id, supplierInAllSuppliers?.id || '', null, 0)}
                                      title="Click to add price"
                                    >
                                      ₱0.00
                                    </div>
                                  )}
                                </TableCell>
                              );
                            }
                            
                            return (
                              <TableCell 
                                key={supplierName} 
                                className={`text-right border-r font-mono ${
                                  supplier.priceStatus === 'lowest' 
                                    ? 'bg-green-50 text-green-700 font-bold' 
                                    : supplier.priceStatus === 'highest'
                                    ? 'bg-red-50 text-red-700'
                                    : ''
                                }`}
                              >
                                {editingPrice?.itemId === item.id && editingPrice?.supplierId === supplier.id ? (
                                  <div className="flex items-center space-x-1">
                                    <Input
                                      type="number"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-20 h-8 text-xs"
                                      step="0.01"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handlePriceUpdate();
                                        if (e.key === 'Escape') handleCancelEdit();
                                      }}
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={handlePriceUpdate}
                                    >
                                      <Check size={12} className="text-green-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={handleCancelEdit}
                                    >
                                      <X size={12} className="text-red-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div 
                                    className="cursor-pointer hover:bg-opacity-80 p-1 rounded"
                                    onClick={() => handlePriceClick(item.id, supplier.id, supplier.product_supplier_id, supplier.current_price)}
                                  >
                                    <div>₱{supplier.current_price.toFixed(2)}</div>
                                    {supplier.priceStatus === 'lowest' && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        <TrendingDown size={8} className="mr-1" />
                                        Best
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                          
                          <TableCell className="text-right border-r font-mono font-bold">
                            {item.recommended_supplier ? (
                              <div className="text-green-700">
                                <div>₱{item.recommended_supplier.current_price.toFixed(2)}</div>
                                <div className="text-xs font-normal text-green-600 mt-1">
                                  {item.recommended_supplier.supplier_name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            {item.potential_savings > 0 ? (
                              <div className="text-green-700 font-bold font-mono">
                                ₱{item.potential_savings.toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-gray-400">₱0.00</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Summary Row */}
                    <TableRow className="bg-gray-100 font-bold border-t-2">
                      <TableCell className="border-r">TOTALS</TableCell>
                      <TableCell className="text-center border-r">
                        {budgetItems.reduce((sum, item) => sum + item.remaining_quantity, 0)}
                      </TableCell>
                      <TableCell className="border-r"></TableCell>
                      <TableCell className="text-right border-r font-mono">
                        ₱{budgetSummary?.total_original_cost.toFixed(2)}
                      </TableCell>
                      
                      {/* Empty supplier columns for totals */}
                      {Array.from(new Set(budgetItems.flatMap(item => 
                        item.suppliers?.map(s => s.supplier_name) || []
                      ))).map(supplierName => (
                        <TableCell key={supplierName} className="border-r"></TableCell>
                      ))}
                      
                      <TableCell className="text-right border-r font-mono text-green-700">
                        ₱{budgetSummary?.total_optimized_cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-700">
                        ₱{budgetSummary?.total_potential_savings.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button 
            onClick={handleCreatePurchaseClick}
            className="bg-green-600 hover:bg-green-700"
            disabled={budgetItems.filter(item => item.recommended_supplier && item.remaining_quantity > 0).length === 0}
          >
            <ShoppingCart size={16} className="mr-2" />
            Create Purchase to Inventory
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Purchase Order Creation</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {(() => {
                  const { validItems, invalidItems } = validateAndPrepareItems();
                  const totalCost = validItems.reduce((sum, item) => 
                    sum + (item.recommended_supplier!.current_price * item.remaining_quantity), 0
                  );
                  
                  return (
                    <div className="space-y-4">
                      <p>This will create a new purchase order with the following details:</p>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Items to be included ({validItems.length}):</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {validItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.model}</span>
                              <span>Qty: {item.remaining_quantity} × ₱{item.recommended_supplier!.current_price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <strong>Total Cost: ₱{totalCost.toFixed(2)}</strong>
                        </div>
                      </div>
                      
                      {invalidItems.length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-orange-800 mb-2">Items excluded ({invalidItems.length}):</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {invalidItems.map(item => (
                              <div key={item.id} className="text-sm text-orange-700">
                                <div className="font-medium">{item.model}</div>
                                <div className="text-xs">
                                  Reason: {!item.product_id 
                                    ? "Missing product ID" 
                                    : !item.recommended_supplier 
                                    ? "No recommended supplier found"
                                    : "Invalid pricing"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">
                        Do you want to proceed with creating the purchase order?
                      </p>
                    </div>
                  );
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCreatePurchase} className="bg-green-600 hover:bg-green-700">
                Create Purchase Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Inventory Purchase Modal */}
        {showCreatePurchase && (
          <CreateInventoryPurchaseModal
            onClose={() => setShowCreatePurchase(false)}
            onSuccess={() => {
              setShowCreatePurchase(false);
              onClose(); // Close budget modal after success
            }}
            budgetItems={budgetItems}
            originalPurchaseOrderId={purchaseOrderId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};