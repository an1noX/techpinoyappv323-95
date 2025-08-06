import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Wallet, Banknote, ArrowRight, Loader2 } from "lucide-react";
import { IncomeEntry, FundSource, BankDestination } from "@/types/money-tracking";
import { formatPHP } from "@/utils/currency";
import { toast } from "sonner";

interface IncomeTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: IncomeEntry | null;
  onTransfer: (entryId: string, amount: number, destination: FundSource, bankDestination?: BankDestination) => Promise<void>;
}

export const IncomeTransferDialog = ({ isOpen, onClose, entry, onTransfer }: IncomeTransferDialogProps) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [isFullTransfer, setIsFullTransfer] = useState(true);
  const [destination, setDestination] = useState<FundSource | ''>('');
  const [bankDestination, setBankDestination] = useState<BankDestination | ''>('');
  const [step, setStep] = useState<'amount' | 'destination' | 'bank'>('amount');
  const [isTransferring, setIsTransferring] = useState(false);

  const resetDialog = () => {
    setTransferAmount('');
    setIsFullTransfer(true);
    setDestination('');
    setBankDestination('');
    setStep('amount');
    setIsTransferring(false);
  };

  const handleClose = () => {
    onClose();
    resetDialog();
  };

  const getDestinationIcon = (fundType: FundSource) => {
    switch (fundType) {
      case 'Bank': return <Building2 className="h-5 w-5" />;
      case 'GCash': return <Wallet className="h-5 w-5" />;
      case 'Cash on Hand': return <Banknote className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  const handleAmountNext = () => {
    if (!entry) return;
    
    const amount = isFullTransfer ? entry.amount : parseFloat(transferAmount);
    if (!isFullTransfer && (!transferAmount || amount <= 0 || amount > entry.amount)) {
      toast.error('Please enter a valid transfer amount');
      return;
    }
    
    setStep('destination');
  };

  const handleDestinationNext = () => {
    if (!destination) return;
    
    if (destination === 'Bank') {
      setStep('bank');
    } else {
      handleTransfer();
    }
  };

  const handleTransfer = async () => {
    if (!entry || !destination) return;
    if (destination === 'Bank' && !bankDestination) return;
    
    const amount = isFullTransfer ? entry.amount : parseFloat(transferAmount);
    
    setIsTransferring(true);
    try {
      await onTransfer(entry.id, amount, destination as FundSource, destination === 'Bank' ? bankDestination as BankDestination : undefined);
      toast.success(`Transferred ${formatPHP(amount)} to ${destination === 'Bank' ? bankDestination : destination}`);
      handleClose();
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Income</DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>From: {entry.source}</p>
            <p>Current: {entry.destination === 'Bank' && entry.bankDestination ? entry.bankDestination : entry.destination}</p>
            <p>Available: {formatPHP(entry.amount)}</p>
          </div>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Transfer Amount</Label>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsFullTransfer(true)}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    isFullTransfer 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Full Amount</span>
                    <Badge variant="outline">{formatPHP(entry.amount)}</Badge>
                  </div>
                </button>
                
                <button
                  onClick={() => setIsFullTransfer(false)}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    !isFullTransfer 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">Custom Amount</span>
                </button>
              </div>

              {!isFullTransfer && (
                <div className="space-y-2">
                  <Label htmlFor="transferAmount">Amount to Transfer</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    step="0.01"
                    max={entry.amount}
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {formatPHP(entry.amount)}
                  </p>
                </div>
              )}
            </div>

            <Button onClick={handleAmountNext} className="w-full">
              Next: Choose Destination
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'destination' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transfer To</Label>
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
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('amount')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleDestinationNext} className="flex-1" disabled={!destination}>
                {destination === 'Bank' ? (
                  <>Next: Choose Bank <ArrowRight className="h-4 w-4 ml-2" /></>
                ) : (
                  <>Transfer <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'bank' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Which Bank Account?</Label>
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
                disabled={!bankDestination || isTransferring}
              >
                {isTransferring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <>Transfer <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};