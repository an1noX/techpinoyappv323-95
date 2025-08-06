import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Plus, Building2, Wallet, Banknote } from "lucide-react";
import { IncomeEntry, FundSource, BankDestination } from "@/types/money-tracking";

interface EnhancedIncomeFormProps {
  onAddIncome: (income: Omit<IncomeEntry, 'id' | 'date'>) => void;
}

export const EnhancedIncomeForm = ({ onAddIncome }: EnhancedIncomeFormProps) => {
  const [step, setStep] = useState<'form' | 'bank'>('form');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState<FundSource | ''>('');
  const [bankDestination, setBankDestination] = useState<BankDestination | ''>('');
  const [description, setDescription] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source || !destination) return;
    
    if (destination === 'Bank') {
      setStep('bank');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!amount || !source || !destination) return;
    if (destination === 'Bank' && !bankDestination) return;

    onAddIncome({
      amount: parseFloat(amount),
      source,
      destination: destination as FundSource,
      bankDestination: destination === 'Bank' ? bankDestination as BankDestination : undefined,
      description
    });

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setStep('form');
    setAmount('');
    setSource('');
    setDestination('');
    setBankDestination('');
    setDescription('');
  };

  const getStepIcon = (fundType: FundSource) => {
    switch (fundType) {
      case 'Bank':
        return <Building2 className="h-5 w-5" />;
      case 'GCash':
        return <Wallet className="h-5 w-5" />;
      case 'Cash on Hand':
        return <Banknote className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <div>
      <div className="mb-4">
        {step === 'bank' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Income Details & Destination</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium text-green-600">Choose Bank</span>
          </div>
        )}
      </div>
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Income Source *</Label>
                <Input
                  id="source"
                  placeholder="e.g., Salary, Freelance, Business"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Additional details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Where should this income go? *</Label>
              <div className="grid grid-cols-1 gap-3">
                {(['Bank', 'GCash', 'Cash on Hand'] as FundSource[]).map((fund) => (
                  <button
                    key={fund}
                    type="button"
                    onClick={() => setDestination(fund)}
                    className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                      destination === fund
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getStepIcon(fund)}
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
              type="submit"
              className="w-full"
              disabled={!amount || !source || !destination}
            >
              {destination === 'Bank' ? 'Next: Choose Bank' : 'Add Income'}
              {destination === 'Bank' ? (
                <ArrowRight className="h-4 w-4 ml-2" />
              ) : (
                <Plus className="h-4 w-4 ml-2" />
              )}
            </Button>
          </form>
        )}

        {step === 'bank' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Which bank account?</Label>
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
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!bankDestination}
              >
                Add Income
                <Plus className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
    </div>
  );
};