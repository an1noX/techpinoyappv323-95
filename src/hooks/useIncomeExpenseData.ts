import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { IncomeEntry, ExpenseEntry, FundBalances } from '@/types/money-tracking';

// Create a generic supabase client for custom tables
const supabaseGeneric = supabase as any;

export interface DatabaseIncomeEntry {
  id: string;
  amount: number;
  source: string;
  destination?: 'Bank' | 'GCash' | 'Cash on Hand';
  bank_destination?: 'TECHPINOY' | 'MYTCH';
  description?: string;
  sales_invoice_id?: string;
  sales_invoice_number?: string;
  entry_date: string;
  created_at: string;
}

export interface DatabaseExpenseEntry {
  id: string;
  amount: number;
  purpose: string;
  source: 'Bank' | 'GCash' | 'Cash on Hand';
  description?: string;
  purchase_order_id?: string;
  purchase_order_number?: string;
  entry_date: string;
  created_at: string;
}

export const useIncomeEntries = () => {
  return useQuery({
    queryKey: ['income-entries'],
    queryFn: async (): Promise<IncomeEntry[]> => {
      const { data, error } = await supabaseGeneric
        .from('income_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((entry: DatabaseIncomeEntry) => ({
        id: entry.id,
        amount: entry.amount,
        source: entry.source,
        destination: entry.destination,
        bankDestination: entry.bank_destination,
        description: entry.description,
        date: new Date(entry.entry_date),
        salesInvoiceId: entry.sales_invoice_id,
        salesInvoiceNumber: entry.sales_invoice_number
      }));
    }
  });
};

export const useExpenseEntries = () => {
  return useQuery({
    queryKey: ['expense-entries'],
    queryFn: async (): Promise<ExpenseEntry[]> => {
      const { data, error } = await supabaseGeneric
        .from('expense_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((entry: DatabaseExpenseEntry) => ({
        id: entry.id,
        amount: entry.amount,
        purpose: entry.purpose,
        source: entry.source,
        description: entry.description,
        date: new Date(entry.entry_date),
        purchaseOrderId: entry.purchase_order_id,
        purchaseOrderNumber: entry.purchase_order_number
      }));
    }
  });
};

export const useAddIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (income: Omit<IncomeEntry, 'id' | 'date'> & { 
      salesInvoiceId?: string; 
      salesInvoiceNumber?: string;
      entryDate?: Date;
    }) => {
      const { data, error } = await supabaseGeneric
        .from('income_entries')
        .insert({
          amount: income.amount,
          source: income.source,
          destination: income.destination,
          bank_destination: income.bankDestination,
          description: income.description,
          sales_invoice_id: income.salesInvoiceId,
          sales_invoice_number: income.salesInvoiceNumber,
          entry_date: income.entryDate ? income.entryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-entries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-invoices-for-income'] });
    }
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<ExpenseEntry, 'id' | 'date'> & { 
      purchaseOrderId?: string; 
      purchaseOrderNumber?: string;
      entryDate?: Date;
    }) => {
      const { data, error } = await supabaseGeneric
        .from('expense_entries')
        .insert({
          amount: expense.amount,
          purpose: expense.purpose,
          source: expense.source,
          description: expense.description,
          purchase_order_id: expense.purchaseOrderId,
          purchase_order_number: expense.purchaseOrderNumber,
          entry_date: expense.entryDate ? expense.entryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    }
  });
};

export const useCalculateBalances = () => {
  const { data: incomeEntries = [] } = useIncomeEntries();
  const { data: expenseEntries = [] } = useExpenseEntries();

  const balances: FundBalances = {
    Bank: 0,
    TECHPINOY: 0,
    MYTCH: 0,
    GCash: 0,
    'Cash on Hand': 0
  };

  // Calculate income contributions to each fund (only allocated income)
  incomeEntries.forEach(entry => {
    if (entry.destination) {
      if (entry.destination === 'Bank' && entry.bankDestination) {
        balances[entry.bankDestination] += entry.amount;
      } else if (entry.destination !== 'Bank') {
        balances[entry.destination] += entry.amount;
      }
    }
  });

  // Subtract expenses from each fund
  expenseEntries.forEach(entry => {
    balances[entry.source] -= entry.amount;
  });

  return balances;
};

export const useTransferIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transfer: { 
      incomeId: string; 
      destination: 'Bank' | 'GCash' | 'Cash on Hand';
      bankDestination?: 'TECHPINOY' | 'MYTCH';
    }) => {
      const { data, error } = await supabaseGeneric
        .from('income_entries')
        .update({
          destination: transfer.destination,
          bank_destination: transfer.bankDestination
        })
        .eq('id', transfer.incomeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-entries'] });
    }
  });
};