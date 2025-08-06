import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Wallet, CreditCard, Banknote, TrendingUp, TrendingDown } from "lucide-react";
import { FundBalances, IncomeEntry, ExpenseEntry } from "@/types/money-tracking";
import { formatPHP } from "@/utils/currency";

interface FinancialSummaryProps {
  balances: FundBalances;
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
}

export const FinancialSummary = ({ balances, incomeEntries, expenseEntries }: FinancialSummaryProps) => {
  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  const getBalanceIcon = (source: string) => {
    switch (source) {
      case 'Bank':
      case 'TECHPINOY':
      case 'MYTCH':
        return <CreditCard className="h-5 w-5" />;
      case 'GCash':
        return <Wallet className="h-5 w-5" />;
      case 'Cash on Hand':
        return <Banknote className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className={`text-2xl font-bold ${getBalanceColor(totalBalance)}`}>
                  {formatPHP(totalBalance)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatPHP(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatPHP(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${getBalanceColor(netIncome)}`}>
                  {formatPHP(netIncome)}
                </p>
              </div>
              <BarChart3 className={`h-8 w-8 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Fund Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(balances).map(([fundType, balance]) => (
              <div key={fundType} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBalanceIcon(fundType)}
                    <span className="font-medium">{fundType}</span>
                  </div>
                  <span className={`font-semibold ${getBalanceColor(balance)}`}>
                    {formatPHP(balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Income by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No income entries yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  incomeEntries.reduce((acc, entry) => {
                    acc[entry.destination] = (acc[entry.destination] || 0) + entry.amount;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([destination, amount]) => (
                  <div key={destination} className="flex justify-between items-center">
                    <span className="text-sm">{destination}</span>
                    <span className="font-medium text-green-600">{formatPHP(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Expenses by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No expense entries yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  expenseEntries.reduce((acc, entry) => {
                    acc[entry.source] = (acc[entry.source] || 0) + entry.amount;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([source, amount]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-sm">{source}</span>
                    <span className="font-medium text-red-600">{formatPHP(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};