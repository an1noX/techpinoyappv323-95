import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/database';
import { productService } from '@/services/productService';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MergeSummary {
  transactions: number;
  suppliers: number;
  clients: number;
  printers: number;
}

interface AdminMergeProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onMergeComplete: () => void;
}

const AdminMergeProductsModal: React.FC<AdminMergeProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  onMergeComplete,
}) => {
  const [primaryProductId, setPrimaryProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<MergeSummary | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      setPrimaryProductId(products[0].id);
    }
  }, [products]);

  const fetchMergeSummary = async () => {
    setIsFetchingSummary(true);
    let summaryData: MergeSummary = { transactions: 0, suppliers: 0, clients: 0, printers: 0 };
    
    const otherProducts = products.filter(p => p.id !== primaryProductId);
    
    for (const product of otherProducts) {
      // This is a simplified summary. We're just counting for now.
      const { data: transactions } = await supabase.from('transaction_records').select('id', { count: 'exact' }).eq('product_id', product.id);
      const { data: suppliers } = await supabase.from('product_suppliers').select('id', { count: 'exact' }).eq('product_id', product.id);
      const { data: clients } = await supabase.from('product_clients').select('id', { count: 'exact' }).eq('product_id', product.id);
      const { data: printers } = await supabase.from('product_printers').select('id', { count: 'exact' }).eq('product_id', product.id);
      
      summaryData.transactions += transactions?.length || 0;
      summaryData.suppliers += suppliers?.length || 0;
      summaryData.clients += clients?.length || 0;
      summaryData.printers += printers?.length || 0;
    }

    setSummary(summaryData);
    setIsFetchingSummary(false);
  };

  useEffect(() => {
    if (primaryProductId) {
      fetchMergeSummary();
    }
  }, [primaryProductId]);

  const handleMerge = async () => {
    if (!primaryProductId) {
      toast.error('You must select a primary product.');
      return;
    }
    setIsLoading(true);

    const primaryProduct = products.find(p => p.id === primaryProductId);
    const otherProducts = products.filter(p => p.id !== primaryProductId);

    if (!primaryProduct) {
        toast.error('Primary product not found.');
        setIsLoading(false);
        return;
    }

    try {
      const mergedAlias = otherProducts
        .map(p => `${p.sku} - ${p.name}`)
        .join(', ');
      
      const updatedAlias = primaryProduct.alias 
        ? `${primaryProduct.alias}, ${mergedAlias}`
        : mergedAlias;

      await productService.mergeProducts(primaryProductId, otherProducts.map(p => p.id), updatedAlias);
      
      toast.success('Products merged successfully!');
      onMergeComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to merge products.');
      console.error('Merge failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge {products.length} Products</DialogTitle>
          <DialogDescription>
            Select a primary product. All other products will be merged into it. 
            The merged products' SKUs and Names will be added to the primary product's alias, and they will be deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={primaryProductId || ''} onValueChange={setPrimaryProductId}>
            {products.map(product => (
              <div key={product.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value={product.id} id={product.id} />
                <Label htmlFor={product.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {isFetchingSummary && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /> <span className="ml-2">Loading summary...</span></div>}

        {summary && !isFetchingSummary && (
          <div className="p-4 border bg-gray-50 rounded-md">
            <h4 className="font-semibold mb-2">Merge Summary</h4>
            <p className="text-sm">The following items from the secondary products will be moved to the primary product:</p>
            <ul className="list-disc list-inside text-sm mt-2">
              <li>{summary.transactions} Transaction Records</li>
              <li>{summary.suppliers} Supplier Prices</li>
              <li>{summary.clients} Client Quotes</li>
              <li>{summary.printers} Printer Compatibilities</li>
            </ul>
          </div>
        )}

        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            This action is irreversible. The non-primary products will be permanently deleted.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleMerge} disabled={isLoading || !primaryProductId}>
            {isLoading ? 'Merging...' : 'Confirm Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMergeProductsModal; 