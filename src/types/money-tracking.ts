export type FundSource = 'Bank' | 'GCash' | 'Cash on Hand';
export type BankDestination = 'TECHPINOY' | 'MYTCH';

export interface IncomeEntry {
  id: string;
  amount: number;
  source: string;
  destination?: FundSource;
  bankDestination?: BankDestination;
  date: Date;
  description?: string;
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  purpose: string;
  source: FundSource;
  date: Date;
  description?: string;
}

export interface FundBalances {
  Bank: number;
  TECHPINOY: number;
  MYTCH: number;
  GCash: number;
  'Cash on Hand': number;
}