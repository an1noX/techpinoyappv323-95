import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Clock } from 'lucide-react';
import { TransactionRecord } from '@/types/sales';

interface GroupedTransaction {
  poNumber: string;
  transactions: TransactionRecord[];
  totalAmount: number;
  itemCount: number;
  isImported: boolean;
  supplierName: string;
}

interface PurchaseOrderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupedTransactions: GroupedTransaction[];
  onImport: (selectedPONumbers: string[]) => Promise<void>;
  isLoading: boolean;
}

export const PurchaseOrderImportModal: React.FC<PurchaseOrderImportModalProps> = ({
  isOpen,
  onClose,
  groupedTransactions,
  onImport,
  isLoading
}) => {
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    const availablePOs = groupedTransactions
      .filter(group => !group.isImported)
      .map(group => group.poNumber);
    
    if (selectedPOs.size === availablePOs.length) {
      setSelectedPOs(new Set());
    } else {
      setSelectedPOs(new Set(availablePOs));
    }
  };

  const handleSelectPO = (poNumber: string, isImported: boolean) => {
    if (isImported) return;
    
    const newSelected = new Set(selectedPOs);
    if (newSelected.has(poNumber)) {
      newSelected.delete(poNumber);
    } else {
      newSelected.add(poNumber);
    }
    setSelectedPOs(newSelected);
  };

  const handleImport = async () => {
    if (selectedPOs.size > 0) {
      await onImport(Array.from(selectedPOs));
      setSelectedPOs(new Set());
    }
  };

  const availableCount = groupedTransactions.filter(group => !group.isImported).length;
  const importedCount = groupedTransactions.filter(group => group.isImported).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Purchase Orders from Transaction Records
          </DialogTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Available: {availableCount}</span>
            <span>Already Imported: {importedCount}</span>
            <span>Selected: {selectedPOs.size}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPOs.size === availableCount && availableCount > 0}
                onCheckedChange={handleSelectAll}
                disabled={availableCount === 0}
              />
              <span className="text-sm font-medium">Select All Available</span>
            </div>
            <Button
              onClick={handleImport}
              disabled={selectedPOs.size === 0 || isLoading}
              className="ml-auto"
            >
              {isLoading ? 'Importing...' : `Import Selected (${selectedPOs.size})`}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 p-2">
            {groupedTransactions.map((group) => (
              <div
                key={group.poNumber}
                className={`border rounded-lg p-4 transition-colors ${
                  group.isImported 
                    ? 'bg-muted/50 border-muted' 
                    : selectedPOs.has(group.poNumber)
                    ? 'bg-primary/5 border-primary'
                    : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedPOs.has(group.poNumber)}
                    onCheckedChange={() => handleSelectPO(group.poNumber, group.isImported)}
                    disabled={group.isImported}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">PO: {group.poNumber}</h3>
                        {group.isImported ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₱{group.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{group.itemCount} items</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Supplier: </span>
                        <span>{group.supplierName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transactions: </span>
                        <span>{group.transactions.length}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Items:</div>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {group.transactions.slice(0, 3).map((transaction, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{transaction.model}</span>
                            <span>{transaction.quantity} × ₱{transaction.unit_price}</span>
                          </div>
                        ))}
                        {group.transactions.length > 3 && (
                          <div className="text-muted-foreground">
                            +{group.transactions.length - 3} more items...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedPOs.size === 0 || isLoading}
          >
            {isLoading ? 'Importing...' : `Import ${selectedPOs.size} Purchase Orders`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};