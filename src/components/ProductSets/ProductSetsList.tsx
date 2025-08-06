import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { productSetsService } from '@/services/productSetsService';
import { ProductSetWithItems } from '@/types/productSets';
import { Package, Edit, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { getColorBadgeClass, getColorDisplayName } from '@/utils/seriesSetGrouping';
import { ProductSetForm } from './ProductSetForm';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { CustomLoading } from '@/components/ui/CustomLoading';

interface ProductSetsListProps {
  onCreateNew: () => void;
}

export const ProductSetsList: React.FC<ProductSetsListProps> = ({ onCreateNew }) => {
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [editingSet, setEditingSet] = useState<ProductSetWithItems | null>(null);
  const { toast } = useToast();

  const { 
    data: productSets = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['product-sets'],
    queryFn: () => productSetsService.getProductSets()
  });

  const toggleExpanded = (setId: string) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
    }
    setExpandedSets(newExpanded);
  };

  const handleDelete = async (setId: string) => {
    try {
      await productSetsService.deleteProductSet(setId);
      toast({
        title: "Success",
        description: "Product set deleted successfully",
      });
      refetch();
    } catch (error) {
      console.error('Error deleting product set:', error);
      toast({
        title: "Error",
        description: "Failed to delete product set",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (productSet: ProductSetWithItems) => {
    setEditingSet(productSet);
  };

  const handleEditClose = () => {
    setEditingSet(null);
    refetch();
  };

  if (isLoading) {
    return <CustomLoading message="Loading product sets..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Product Sets</h2>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Set
        </Button>
      </div>

      {productSets.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No product sets found</p>
            <Button onClick={onCreateNew}>Create Your First Product Set</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {productSets.map((productSet) => (
            <Card key={productSet.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(productSet.id)}
                      className="p-1 h-8 w-8"
                    >
                      {expandedSets.has(productSet.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{productSet.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{productSet.sku}</Badge>
                        <span className="text-sm text-gray-500">
                          {productSet.items.length} item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(productSet)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product Set</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{productSet.name}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(productSet.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {productSet.description && (
                  <p className="text-sm text-gray-600 mt-2 ml-11">
                    {productSet.description}
                  </p>
                )}
              </CardHeader>

              {expandedSets.has(productSet.id) && (
                <CardContent className="pt-0">
                  <div className="ml-11 space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">Set Items:</h4>
                    <div className="grid gap-2">
                      {productSet.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-sm">{item.product?.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.product?.sku}
                                </Badge>
                                {item.product?.color && (
                                  <Badge 
                                    className={`text-xs ${getColorBadgeClass(item.product.color)}`}
                                  >
                                    {getColorDisplayName(item.product.color)}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {item.product?.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {editingSet && (
        <ProductSetForm
          isOpen={true}
          onClose={handleEditClose}
          editingSet={editingSet}
        />
      )}
    </div>
  );
};