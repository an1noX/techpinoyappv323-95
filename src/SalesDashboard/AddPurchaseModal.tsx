import { useState } from 'react';
import { Plus, Minus, FileText, User, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePurchaseOrdersEnhanced } from '@/hooks/usePurchaseOrdersEnhanced';
import { CreatePurchaseOrderData } from '@/types/purchaseOrder';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface POItemForm {
  product_id?: string;
  model?: string;
  quantity: number;
  unit_price: number;
}

export const AddPurchaseModal = ({ isOpen, onClose, onSuccess }: AddPurchaseModalProps) => {
  const { createPurchaseOrder } = usePurchaseOrdersEnhanced();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    status: 'pending' as const,
    payment_status: 'unpaid' as const,
    notes: ''
  });
  const [items, setItems] = useState<POItemForm[]>([
    { model: '', quantity: 1, unit_price: 0 }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const poData: CreatePurchaseOrderData = {
        supplier_name: formData.supplier_name,
        status: formData.status,
        payment_status: formData.payment_status,
        notes: formData.notes,
        items: items.filter(item => item.model && item.quantity > 0)
      };
      await createPurchaseOrder(poData);
      
      // Reset form after successful creation
      setFormData({
        supplier_name: '',
        status: 'pending' as const,
        payment_status: 'unpaid' as const,
        notes: ''
      });
      setItems([{ model: '', quantity: 1, unit_price: 0 }]);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof POItemForm, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const addItem = () => {
    setItems(prev => [...prev, { model: '', quantity: 1, unit_price: 0 }]);
  };
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-br from-purple-50 to-violet-50 animate-in fade-in-0 slide-in-from-bottom-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-purple-100/90 p-4 flex items-center justify-between border-b border-purple-200 rounded-b-xl shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-500" />
          <span className="text-lg font-semibold">New Purchase Order</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-purple-200 transition" aria-label="Close">
          <Minus className="h-5 w-5 text-purple-500" />
        </button>
      </div>
      {/* Scrollable Content */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 sm:pb-8" // pb-28 for mobile sticky bar, sm:pb-8 for desktop
      >
        {/* Supplier & Status Section */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 space-y-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-purple-400" />
            <label className="block text-base font-semibold">Supplier Name</label>
          </div>
          <Input
            id="supplier_name"
            value={formData.supplier_name}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
            required
            className="h-12 text-base"
          />
          <div className="flex items-center gap-3 mt-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <label className="block text-base font-semibold">Status</label>
          </div>
          <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="h-12 text-base border border-purple-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Payment Status & Notes Section */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 space-y-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <label className="block text-base font-semibold">Payment Status</label>
          </div>
          <Select value={formData.payment_status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_status: value }))}>
            <SelectTrigger className="h-12 text-base border border-purple-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <label className="block text-base font-semibold mt-4">Notes</label>
          <Textarea
            id="notes"
            placeholder="Optional notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="h-12 text-base"
          />
        </div>
        {/* Items Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-base font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-orange-400" />Items</label>
            <button type="button" className="h-12 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow transition flex items-center gap-2" onClick={addItem}>
              <Plus size={18} /> Add Item
            </button>
          </div>
          {items.map((item, index) => (
            <div key={index} className="border rounded-xl p-4 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                    onClick={() => removeItem(index)}
                  >
                    <Minus size={18} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Model/Product</label>
                  <Input
                    placeholder="Product model"
                    value={item.model || ''}
                    onChange={(e) => updateItem(index, 'model', e.target.value)}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Unit Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                Subtotal: ₱{(item.quantity * item.unit_price).toFixed(2)}
              </div>
            </div>
          ))}
          <div className="text-right border-t pt-3">
            <div className="text-lg font-semibold">
              Total: ₱{calculateTotal().toFixed(2)}
            </div>
          </div>
        </div>
        {/* Footer (not sticky, just at the end of the form) */}
        <div className="bg-white border-t border-orange-100 p-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 rounded-t-xl mt-4">
          <button
            type="button"
            className="h-12 px-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-12 px-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}; 