import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit, Save, XCircle } from 'lucide-react';
import { productService } from '@/services/productService';
import { Product } from '@/types/database';
import { DeliveryItem } from '@/types/purchaseOrder';

interface EditableDeliveryItem extends DeliveryItem {
  product?: Product;
  products?: Product; // From database query join
}

interface EditableDeliveryItemsTableProps {
  deliveryItems: EditableDeliveryItem[];
  onItemsChange: (items: EditableDeliveryItem[]) => void;
  isEditing: boolean;
  onUpdateItem?: (item: EditableDeliveryItem) => Promise<void>;
  onDeleteItem?: (itemId: string) => Promise<void>;
}

export const EditableDeliveryItemsTable: React.FC<EditableDeliveryItemsTableProps> = ({
  deliveryItems,
  onItemsChange,
  isEditing,
  onUpdateItem,
  onDeleteItem
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
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: EditableDeliveryItem) => {
    setEditingItem(item.id);
    setEditValues({
      id: item.id,
      product_id: item.product_id || '',
      quantity_delivered: item.quantity_delivered
    });
  };

  const handleSaveEdit = async () => {
    if (onUpdateItem) {
      const selectedProduct = products.find(p => p.id === editValues.product_id);
      const updatedItem = {
        ...editValues,
        product: selectedProduct,
        quantity_delivered: Number(editValues.quantity_delivered)
      };
      await onUpdateItem(updatedItem);
    }
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
    const itemToAdd: EditableDeliveryItem = {
      id: `temp-${Date.now()}`,
      delivery_id: deliveryItems[0]?.delivery_id || '',
      product_id: newItem.product_id,
      quantity_delivered: Number(newItem.quantity_delivered),
      created_at: new Date().toISOString(),
      product: selectedProduct
    };
    
    onItemsChange([...deliveryItems, itemToAdd]);
    setNewItem({ product_id: '', quantity_delivered: 1 });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (onDeleteItem) {
      await onDeleteItem(itemId);
    } else {
      const updatedItems = deliveryItems.filter(item => item.id !== itemId);
      onItemsChange(updatedItems);
    }
  };

  const getProductDisplayName = (product?: Product) => {
    if (!product) return 'N/A';
    
    const parts = [product.name];
    if (product.sku) parts.push(`(${product.sku})`);
    if (product.color) {
      // Abbreviate colors
      const colorAbbreviations: { [key: string]: string } = {
        'black': 'BK',
        'cyan': 'CY', 
        'yellow': 'YL',
        'magenta': 'MG',
        'blue': 'BL',
        'red': 'RD',
        'green': 'GR',
        'white': 'WH',
        'gray': 'GY',
        'grey': 'GY',
        'orange': 'OR',
        'purple': 'PR',
        'pink': 'PK',
        'brown': 'BR'
      };
      
      const colorLower = product.color.toLowerCase();
      const abbreviation = colorAbbreviations[colorLower] || product.color.substring(0, 2).toUpperCase();
      parts.push(abbreviation);
    }
    
    return parts.join(' ');
  };

  if (!isEditing) {
    return (
      <table className="w-full border-collapse border border-gray-300 delivery-items-table">
        <thead>
          <tr className="bg-blue-800 text-white">
            <th className="border border-gray-300 px-2 py-2 text-left item-number-col">ITEM #</th>
            <th className="border border-gray-300 px-2 py-2 text-left product-name-col">PRODUCT</th>
            <th className="border border-gray-300 px-1 py-2 text-center qty-col">QTY</th>
            <th className="border border-gray-300 px-2 py-2 text-left notes-col">NOTES</th>
          </tr>
        </thead>
        <tbody>
          {deliveryItems.length > 0 ? deliveryItems.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 px-2 py-2 text-xs">
                {index + 1}
              </td>
              <td className="border border-gray-300 px-2 py-2 product-name">
                <span className="text-xs">
                  {getProductDisplayName(item.products || item.product)}
                </span>
              </td>
              <td className="border border-gray-300 px-1 py-2 text-center qty-cell">
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
    );
  }

  return (
    <div>
      <style>
        {`
          /* Mobile optimization for delivery items table */
          @media (max-width: 768px) {
            .delivery-items-table {
              table-layout: fixed;
              width: 100%;
            }
            
            .delivery-items-table .item-number-col {
              width: 12%;
            }
            
            .delivery-items-table .product-name-col {
              width: 45%;
            }
            
            .delivery-items-table .qty-col {
              width: 15%;
            }
            
            .delivery-items-table .notes-col {
              width: 20%;
            }
            
            .delivery-items-table .actions-col {
              width: 8%;
            }
            
            .product-name {
              font-size: 11px;
              line-height: 1.2;
              word-break: break-word;
              hyphens: auto;
              -webkit-hyphens: auto;
              -moz-hyphens: auto;
              overflow-wrap: anywhere;
            }
            
            .qty-cell {
              font-family: monospace;
              font-size: 10px;
              text-align: center;
              padding: 2px 4px;
            }
            
            .delivery-items-table th {
              font-size: 10px;
              padding: 4px 2px;
            }
            
            .delivery-items-table td {
              font-size: 10px;
              padding: 4px 2px;
            }
          }
          
          @media (max-width: 480px) {
            .delivery-items-table th {
              font-size: 9px;
              padding: 2px 1px;
            }
            
            .delivery-items-table td {
              font-size: 9px;
              padding: 2px 1px;
            }
          }
        `}
      </style>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">DELIVERED ITEMS</h3>
      </div>
      
      <table className="w-full border-collapse border border-gray-300 delivery-items-table">
        <thead>
          <tr className="bg-blue-800 text-white">
            <th className="border border-gray-300 px-2 py-2 text-left item-number-col">ITEM #</th>
            <th className="border border-gray-300 px-2 py-2 text-left product-name-col">PRODUCT</th>
            <th className="border border-gray-300 px-1 py-2 text-center qty-col">QTY</th>
            {isEditing && (
              <th className="border border-gray-300 px-1 py-2 text-center no-print actions-col">ACTIONS</th>
            )}
          </tr>
        </thead>
        <tbody>
          {deliveryItems.length > 0 ? deliveryItems.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 px-2 py-2 text-xs">
                {index + 1}
              </td>
              <td className="border border-gray-300 px-2 py-2 product-name">
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
                    {getProductDisplayName(item.products || item.product)}
                  </span>
                )}
              </td>
              <td className="border border-gray-300 px-1 py-2 text-center qty-cell">
                {editingItem === item.id ? (
                  <Input
                    type="number"
                    min="1"
                    value={editValues.quantity_delivered}
                    onChange={(e) => setEditValues({...editValues, quantity_delivered: e.target.value})}
                    className="w-12 text-xs text-center p-1"
                  />
                ) : (
                  <span className="text-xs">{item.quantity_delivered}</span>
                )}
              </td>
              {isEditing && (
                <td className="border border-gray-300 px-1 py-2 text-center no-print">
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
              )}
            </tr>
          )) : (
            <tr>
              <td colSpan={isEditing ? 4 : 3} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-xs">
                No items found
              </td>
            </tr>
          )}
          
          {/* Add new item row */}
          {isEditing && (
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
                  className="w-12 text-xs text-center p-1"
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
          )}
        </tbody>
      </table>
    </div>
  );
};