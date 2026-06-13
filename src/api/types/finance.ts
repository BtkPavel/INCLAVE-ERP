import type { Id, ISODate, ListParams } from './common';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type FinanceSection = 'income' | 'expense' | 'taxes';
/** Режим налогообложения дохода */
export type IncomeTaxBase = 'profit' | 'revenue';
export type Currency = 'BYN' | 'USD' | 'EUR' | 'RUB';

export interface Account {
  id: Id;
  name: string;
  code: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseBillingStatus = 'one_time' | 'cyclic';
export type PaymentRecurrence = 'monthly' | 'quarterly' | 'yearly';

export interface OperationalExpense {
  id: Id;
  title: string;
  amount: number;
  currency: Currency;
  category: string | null;
  startDate: ISODate;
  billingStatus: ExpenseBillingStatus;
  recurrence: PaymentRecurrence | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCalendarEntry {
  id: Id;
  expenseId: Id;
  title: string;
  amount: number;
  currency: Currency;
  dueDate: ISODate;
  billingStatus: ExpenseBillingStatus;
  recurrence: PaymentRecurrence | null;
}

export interface PaymentCalendarParams {
  from: ISODate;
  to: ISODate;
}

export interface CreateOperationalExpenseDto {
  title: string;
  amount: number;
  currency?: Currency;
  category?: string;
  startDate: ISODate;
  billingStatus: ExpenseBillingStatus;
  recurrence?: PaymentRecurrence | null;
}

export interface Transaction {
  id: Id;
  type: TransactionType;
  amount: number;
  currency: Currency;
  accountId: Id;
  counterpartyAccountId: Id | null;
  description: string;
  category: string | null;
  projectId: Id | null;
  date: ISODate;
  createdAt: string;
}

export interface Budget {
  id: Id;
  name: string;
  projectId: Id | null;
  amount: number;
  spent: number;
  currency: Currency;
  periodStart: ISODate;
  periodEnd: ISODate;
  createdAt: string;
}

export interface FinanceSummary {
  totalBalance: number;
  income: number;
  expense: number;
  profit?: number;
  taxAmount?: number;
  incomeTaxBase?: IncomeTaxBase;
  currency: Currency;
  accountsCount: number;
  transactionsCount: number;
}

export interface FinanceReport {
  id: Id;
  type: string;
  title: string;
  periodStart: ISODate;
  periodEnd: ISODate;
  generatedAt: string;
}

export interface TaxRecord {
  id: Id;
  name: string;
  amount: number;
  currency: Currency;
  dueDate: ISODate;
  paidAt: ISODate | null;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  taxBase?: IncomeTaxBase;
  rate?: number;
  income?: number;
  expenses?: number;
  profit?: number;
  formula?: string;
}

export interface TransactionListParams extends ListParams {
  from?: ISODate;
  to?: ISODate;
  accountId?: Id;
  type?: TransactionType;
  projectId?: Id;
}

export interface CreateAccountDto {
  name: string;
  code: string;
  type: AccountType;
  currency?: Currency;
}

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  currency?: Currency;
  accountId: Id;
  counterpartyAccountId?: Id;
  description: string;
  category?: string;
  projectId?: Id;
  date: ISODate;
}

export interface CreateBudgetDto {
  name: string;
  projectId?: Id;
  amount: number;
  currency?: Currency;
  periodStart: ISODate;
  periodEnd: ISODate;
}
