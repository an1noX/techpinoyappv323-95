import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IncomeTracker } from "@/components/income-expense/IncomeTracker";
import { ExpenseTracker } from "@/components/income-expense/ExpenseTracker";
import { FinancialSummary } from "@/components/income-expense/FinancialSummary";
import { useIncomeEntries, useExpenseEntries, useAddIncome, useAddExpense, useCalculateBalances, useTransferIncome } from "@/hooks/useIncomeExpenseData";

export const IncomeExpensePage = () => {
  const navigate = useNavigate();
  
  // Use Supabase hooks for real data
  const { data: incomeEntries = [] } = useIncomeEntries();
  const { data: expenseEntries = [] } = useExpenseEntries();
  const addIncomeMutation = useAddIncome();
  const addExpenseMutation = useAddExpense();
  const transferIncomeMutation = useTransferIncome();
  const balances = useCalculateBalances();
  
  const handleAddIncome = async (income: any) => {
    try {
      await addIncomeMutation.mutateAsync(income);
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };
  
  const handleTransferIncome = async (incomeId: string, destination: any, bankDestination?: string) => {
    try {
      await transferIncomeMutation.mutateAsync({
        incomeId,
        destination,
        bankDestination: bankDestination as 'TECHPINOY' | 'MYTCH' | undefined
      });
    } catch (error) {
      console.error('Error transferring income:', error);
    }
  };
  
  const handleAddExpense = async (expense: any) => {
    try {
      await addExpenseMutation.mutateAsync(expense);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Income & Expense</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Expense
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-6">
            <IncomeTracker 
              onAddIncome={handleAddIncome}
              incomeEntries={incomeEntries}
              onTransferIncome={handleTransferIncome}
            />
          </TabsContent>

          <TabsContent value="expense" className="mt-6">
            <ExpenseTracker 
              onAddExpense={handleAddExpense}
              expenseEntries={expenseEntries}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <FinancialSummary 
              balances={balances}
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};