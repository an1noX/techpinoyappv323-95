import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Wallet, Banknote, ArrowRight } from "lucide-react";
import { IncomeEntry, FundSource, BankDestination } from "@/types/money-tracking";
import { formatPHP } from "@/utils/currency";

interface TransferIncomeDialogProps {
  entry: IncomeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (destination: FundSource, bankDestination?: BankDestination) => void;
  isLoading?: boolean;
}

export const TransferIncomeDialog = ({ 
  entry, 
  isOpen, 
  onClose, 
  onTransfer, 
  isLoading 
}: TransferIncomeDialogProps) => {
  const [destination, setDestination] = useState<FundSource | ''>('');
  const [bankDestination, setBankDestination] = useState<BankDestination | ''>('');
  const [step, setStep] = useState<'destination' | 'bank'>('destination');

  const handleTransfer = () => {
    if (!destination) return;
    if (destination === 'Bank' && !bankDestination) return;
    
    onTransfer(
      destination as FundSource, 
      destination === 'Bank' ? bankDestination as BankDestination : undefined
    );
    
    // Reset state
    setDestination('');
    setBankDestination('');
    setStep('destination');
  };

  const getDestinationIcon = (fundType: FundSource) => {
    switch (fundType) {
      case 'Bank': return <Building2 className="h-5 w-5" />;
      case 'GCash': return <Wallet className="h-5 w-5" />;
      case 'Cash on Hand': return <Banknote className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Income to Fund</DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>{entry.source} - {formatPHP(entry.amount)}</p>
          </div>
        </DialogHeader>

        {step === 'destination' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Select destination fund:</p>
              <div className="grid grid-cols-1 gap-3">
                {(['Bank', 'GCash', 'Cash on Hand'] as FundSource[]).map((fund) => (
                  <button
                    key={fund}
                    onClick={() => setDestination(fund)}
                    className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                      destination === fund
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getDestinationIcon(fund)}
                      <span className="font-medium">{fund}</span>
                    </div>
                    {destination === fund && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => {
                if (destination === 'Bank') {
                  setStep('bank');
                } else {
                  handleTransfer();
                }
              }}
              className="w-full"
              disabled={!destination || isLoading}
            >
              {destination === 'Bank' ? 'Next: Choose Bank' : 'Transfer Income'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'bank' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Which bank account?</p>
              <div className="grid grid-cols-1 gap-3">
                {(['TECHPINOY', 'MYTCH'] as BankDestination[]).map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setBankDestination(bank)}
                    className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                      bankDestination === bank
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
                      <span className="font-medium">{bank}</span>
                    </div>
                    {bankDestination === bank && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('destination')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleTransfer}
                className="flex-1"
                disabled={!bankDestination || isLoading}
              >
                Transfer Income
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};