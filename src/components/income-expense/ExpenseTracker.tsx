import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, TrendingDown } from "lucide-react";
import { ExpenseEntry, FundSource } from "@/types/money-tracking";
import { formatPHP } from "@/utils/currency";

interface ExpenseTrackerProps {
  onAddExpense: (expense: Omit<ExpenseEntry, 'id' | 'date'>) => void;
  expenseEntries: ExpenseEntry[];
}

export const ExpenseTracker = ({ onAddExpense, expenseEntries }: ExpenseTrackerProps) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [source, setSource] = useState<FundSource | ''>('');
  const [description, setDescription] = useState('');

  const expenseCategories = {
    'Family Budget': ['Food', 'Groceries', 'Detergent'],
    'Operation Budget': ['Transpo', 'Food', 'Incentives', 'Load', 'Bills'],
    'Unnecessary Expenses': ['Custom name input']
  };

  const billsSubcategories = [
    'ISP CDJ', 'ISP Valerio', 'Electricity Valerio', 'Electricity CDJ',
    'Water Valerio', 'House Rent Valerio', 'Bodega Valerio'
  ];

  const getPurposeString = () => {
    if (subcategory === 'Custom name input') {
      return customPurpose;
    }
    if (subcategory === 'Bills') {
      return `Bills - ${customPurpose}`;
    }
    return subcategory ? `${category} - ${subcategory}` : category;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const purposeString = getPurposeString();
    if (!amount || !purposeString || !source) return;

    onAddExpense({
      amount: parseFloat(amount),
      purpose: purposeString,
      source: source as FundSource,
      description
    });

    // Reset form
    setAmount('');
    setCategory('');
    setSubcategory('');
    setCustomPurpose('');
    setSource('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Minus className="h-5 w-5" />
            Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
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
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value) => {
                  setCategory(value);
                  setSubcategory('');
                  setCustomPurpose('');
                }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(expenseCategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {category && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={subcategory} onValueChange={(value) => {
                    setSubcategory(value);
                    setCustomPurpose('');
                  }} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories[category as keyof typeof expenseCategories].map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {subcategory === 'Bills' && (
                <div className="space-y-2">
                  <Label htmlFor="billType">Bill Type</Label>
                  <Select value={customPurpose} onValueChange={setCustomPurpose} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bill type" />
                    </SelectTrigger>
                    <SelectContent>
                      {billsSubcategories.map((bill) => (
                        <SelectItem key={bill} value={bill}>{bill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {subcategory === 'Custom name input' && (
                <div className="space-y-2">
                  <Label htmlFor="customPurpose">Custom Purpose</Label>
                  <Input
                    id="customPurpose"
                    placeholder="Enter custom purpose"
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    required
                  />
                </div>
              )}
              {subcategory === 'Incentives' && (
                <div className="space-y-2">
                  <Label htmlFor="clientReference">Client Reference (Optional)</Label>
                  <Input
                    id="clientReference"
                    placeholder="Link to client record"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="source">Payment Source</Label>
                <Select value={source} onValueChange={(value) => setSource(value as FundSource)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                    <SelectItem value="Cash on Hand">Cash on Hand</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>
            <Button type="submit" className="w-full">
              <Minus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Recent Expense Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No expense entries yet</p>
              <p className="text-sm">Add your first expense entry above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
                  <div>
                    <p className="font-medium">{entry.purpose}</p>
                    <p className="text-sm text-muted-foreground">
                      From {entry.source} • {entry.date.toLocaleDateString()}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">-{formatPHP(entry.amount)}</p>
                  </div>
                </div>
              ))}
              {expenseEntries.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing latest 5 entries
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};