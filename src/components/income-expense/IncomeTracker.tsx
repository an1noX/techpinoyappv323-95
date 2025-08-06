import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, Edit3, ArrowRightLeft, Trash2 } from "lucide-react";
import { IncomeEntry, FundSource } from "@/types/money-tracking";
import { formatPHP } from "@/utils/currency";
import { EnhancedSalesInvoicePanel } from "./EnhancedSalesInvoicePanel";
import { AddIncomeModal } from "./AddIncomeModal";
import { IncomeTransferDialog } from "./IncomeTransferDialog";

interface IncomeTrackerProps {
  onAddIncome: (income: Omit<IncomeEntry, 'id' | 'date'>) => void;
  incomeEntries: IncomeEntry[];
  onTransferIncome?: (incomeId: string, destination: FundSource, bankDestination?: string) => void;
  onDeleteIncome?: (incomeId: string) => void;
}

export const IncomeTracker = ({ onAddIncome, incomeEntries, onTransferIncome, onDeleteIncome }: IncomeTrackerProps) => {
  const [selectedEntry, setSelectedEntry] = useState<IncomeEntry | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleTransfer = async (entryId: string, amount: number, destination: FundSource, bankDestination?: string) => {
    if (onTransferIncome) {
      await onTransferIncome(entryId, destination, bankDestination);
      setIsTransferDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  const handleDelete = (entryId: string) => {
    if (onDeleteIncome && confirm('Are you sure you want to delete this income entry?')) {
      onDeleteIncome(entryId);
    }
  };

  const openTransferDialog = (entry: IncomeEntry) => {
    setSelectedEntry(entry);
    setIsTransferDialogOpen(true);
  };

  const sortedEntries = incomeEntries.filter(entry => entry.destination);

  return (
    <div className="space-y-6">
      <EnhancedSalesInvoicePanel />
      <AddIncomeModal onAddIncome={onAddIncome} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Income Entries
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-mode"
                checked={isEditMode}
                onCheckedChange={setIsEditMode}
              />
              <Label htmlFor="edit-mode" className="text-sm font-medium flex items-center gap-1">
                <Edit3 className="h-4 w-4" />
                Edit Mode
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No income entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{entry.source}</p>
                    <p className="text-sm text-muted-foreground">
                      To {entry.destination === 'Bank' && entry.bankDestination ? entry.bankDestination : entry.destination} • {entry.date.toLocaleDateString()}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-green-600">{formatPHP(entry.amount)}</p>
                    </div>
                    {isEditMode && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransferDialog(entry)}
                          className="flex items-center gap-1"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(entry.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <IncomeTransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => {
          setIsTransferDialogOpen(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
        onTransfer={handleTransfer}
      />
    </div>
  );
};