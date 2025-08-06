import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit, Save, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity_delivered: number;
  created_at: string;
  purpose?: 'warranty' | 'replacement' | 'demo' | null;
  products?: {
    id: string;
    name: string;
    sku?: string;
    color?: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  color?: string;
}

interface EditableDRItemsTableProps {
  deliveryItems: DeliveryItem[];
  onItemsChange: (items: DeliveryItem[]) => void;
  isEditing: boolean;
  deliveryId: string;
}

export const EditableDRItemsTable: React.FC<EditableDRItemsTableProps> = ({
  deliveryItems,
  onItemsChange,
  isEditing,
  deliveryId
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [newItem, setNewItem] = useState<any>({
    product_id: '',
    quantity_delivered: 1
  });

  useEffect(() => {
    if (isEditing) {
      fetchProducts();
    }
  }, [isEditing]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, color')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: DeliveryItem) => {
    setEditingItem(item.id);
    setEditValues({
      id: item.id,
      product_id: item.product_id || '',
      quantity_delivered: item.quantity_delivered
    });
  };

  const handleSaveEdit = () => {
    const selectedProduct = products.find(p => p.id === editValues.product_id);
    const updatedItems = deliveryItems.map(item => 
      item.id === editValues.id 
        ? {
            ...item,
            product_id: editValues.product_id,
            quantity_delivered: Number(editValues.quantity_delivered),
            products: selectedProduct
          }
        : item
    );
    
    onItemsChange(updatedItems);
    setEditingItem(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.quantity_delivered) {
      return;
    }

    const selectedProduct = products.find(p => p.id === newItem.product_id);
    const itemToAdd: DeliveryItem = {
      id: `temp-${Date.now()}`,
      delivery_id: deliveryId,
      product_id: newItem.product_id,
      quantity_delivered: Number(newItem.quantity_delivered),
      created_at: new Date().toISOString(),
      products: selectedProduct
    };
    
    onItemsChange([...deliveryItems, itemToAdd]);
    setNewItem({ product_id: '', quantity_delivered: 1 });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = deliveryItems.filter(item => item.id !== itemId);
    onItemsChange(updatedItems);
  };

  const getProductDisplayName = (product?: Product) => {
    if (!product) return 'N/A';
    
    const parts = [product.name];
    if (product.sku) parts.push(`(${product.sku})`);
    if (product.color) {
      const colorAbbreviations: { [key: string]: string } = {
        'black': 'BK', 'cyan': 'CY', 'yellow': 'YL', 'magenta': 'MG',
        'blue': 'BL', 'red': 'RD', 'green': 'GR', 'white': 'WH',
        'gray': 'GY', 'grey': 'GY', 'orange': 'OR', 'purple': 'PR',
        'pink': 'PK', 'brown': 'BR'
      };
      
      const colorLower = product.color.toLowerCase();
      const abbreviation = colorAbbreviations[colorLower] || product.color.substring(0, 2).toUpperCase();
      parts.push(abbreviation);
    }
    
    return parts.join(' ');
  };

  if (!isEditing) {
    return (
      <div>
        <h4 className="text-lg font-semibold mb-4 border-b pb-2">DELIVERY ITEMS</h4>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="border border-gray-300 px-2 py-2 text-left">ITEM #</th>
              <th className="border border-gray-300 px-2 py-2 text-left">PRODUCT</th>
              <th className="border border-gray-300 px-1 py-2 text-center">QTY</th>
              <th className="border border-gray-300 px-2 py-2 text-left">NOTES</th>
            </tr>
          </thead>
          <tbody>
            {deliveryItems.length > 0 ? deliveryItems.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 px-2 py-2 text-xs">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-2 py-2">
                  <span className="text-xs">
                    {getProductDisplayName(item.products)}
                  </span>
                </td>
                <td className="border border-gray-300 px-1 py-2 text-center">
                  <span className="text-xs">{item.quantity_delivered}</span>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-xs">
                  -
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-xs">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold">DELIVERY ITEMS</h4>
      </div>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-blue-800 text-white">
            <th className="border border-gray-300 px-2 py-2 text-left">ITEM #</th>
            <th className="border border-gray-300 px-2 py-2 text-left">PRODUCT</th>
            <th className="border border-gray-300 px-1 py-2 text-center">QTY</th>
            <th className="border border-gray-300 px-1 py-2 text-center">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {deliveryItems.length > 0 ? deliveryItems.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 px-2 py-2 text-xs">
                {index + 1}
              </td>
              <td className="border border-gray-300 px-2 py-2">
                {editingItem === item.id ? (
                  <Select
                    value={editValues.product_id || ''}
                    onValueChange={(value) => setEditValues({...editValues, product_id: value})}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>Loading products...</SelectItem>
                      ) : products.length === 0 ? (
                        <SelectItem value="no-products" disabled>No products available</SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {getProductDisplayName(product)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs">
                    {getProductDisplayName(item.products)}
                  </span>
                )}
              </td>
              <td className="border border-gray-300 px-1 py-2 text-center">
                {editingItem === item.id ? (
                  <Input
                    type="number"
                    min="1"
                    value={editValues.quantity_delivered}
                    onChange={(e) => setEditValues({...editValues, quantity_delivered: e.target.value})}
                    className="w-16 text-xs text-center p-1"
                  />
                ) : (
                  <span className="text-xs">{item.quantity_delivered}</span>
                )}
              </td>
              <td className="border border-gray-300 px-1 py-2 text-center">
                {editingItem === item.id ? (
                  <div className="flex gap-1 justify-center">
                    <Button
                      onClick={handleSaveEdit}
                      size="sm"
                      variant="outline"
                      className="p-1 h-6 w-6"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="p-1 h-6 w-6"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-1 justify-center">
                    <Button
                      onClick={() => handleEditItem(item)}
                      size="sm"
                      variant="outline"
                      className="p-1 h-6 w-6"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteItem(item.id)}
                      size="sm"
                      variant="outline"
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-xs">
                No items found
              </td>
            </tr>
          )}
          
          {/* Add new item row */}
          <tr className="bg-blue-50">
            <td className="border border-gray-300 px-2 py-2 text-center">
              <span className="text-xs text-gray-500">NEW</span>
            </td>
            <td className="border border-gray-300 px-2 py-2">
              <Select
                value={newItem.product_id || ''}
                onValueChange={(value) => setNewItem({...newItem, product_id: value})}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                  ) : products.length === 0 ? (
                    <SelectItem value="no-products" disabled>No products available</SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {getProductDisplayName(product)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </td>
            <td className="border border-gray-300 px-1 py-2">
              <Input
                type="number"
                min="1"
                placeholder="Qty"
                value={newItem.quantity_delivered || ''}
                onChange={(e) => setNewItem({...newItem, quantity_delivered: e.target.value})}
                className="w-16 text-xs text-center p-1"
              />
            </td>
            <td className="border border-gray-300 px-1 py-2 text-center">
              <Button
                onClick={handleAddItem}
                size="sm"
                variant="outline"
                className="p-1 h-6 w-6"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};