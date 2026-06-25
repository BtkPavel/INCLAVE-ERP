import type { PaginatedResponse } from '../../api/types/common';
import type {
  CreateOperationalExpenseDto,
  CreateTransactionDto,
  FinanceSummary,
  OperationalExpense,
  PaymentCalendarParams,
  PaymentCalendarEntry,
  TaxRecord,
  Transaction,
  TransactionListParams,
} from '../../api/types/finance';
import { financeStorage } from '../../features/finance/storage/financeStorage';
import { operationalExpensesStorage } from '../../features/finance/storage/operationalExpensesStorage';
import { buildPaymentCalendar } from './paymentCalendar';
import {
  calculateProfitTax,
  isProfitBasedTaxation,
  PROFIT_TAX_RATE,
} from './taxCalculation';
import type { IncomeTaxBase } from '../../api/types/finance';

function paginate<T>(
  items: T[],
  page = 1,
  perPage = 20,
): PaginatedResponse<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;

  return {
    data: items.slice(start, start + perPage),
    meta: { page, perPage, total, totalPages },
  };
}

function sumByType(transactions: Transaction[], type: Transaction['type']): number {
  return transactions.reduce(
    (sum, item) => (item.type === type ? sum + item.amount : sum),
    0,
  );
}

function currentPeriodDueDate(): string {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3 + 2;
  const due = new Date(now.getFullYear(), quarterMonth + 1, 0);
  return due.toISOString().slice(0, 10);
}

export function buildProfitTaxRecord(
  taxBase: IncomeTaxBase,
  transactions: Transaction[],
): TaxRecord | null {
  if (!isProfitBasedTaxation(taxBase)) {
    return null;
  }

  const income = sumByType(transactions, 'income');
  const expenses = sumByType(transactions, 'expense');
  const calculation = calculateProfitTax({ income, expenses });
  const now = new Date().toISOString();

  return {
    id: 'tax-profit-current',
    name: 'Налог на прибыль',
    amount: calculation.amount,
    currency: 'BYN',
    dueDate: currentPeriodDueDate(),
    paidAt: null,
    status: 'pending',
    createdAt: now,
    taxBase: 'profit',
    rate: PROFIT_TAX_RATE,
    income: calculation.income,
    expenses: calculation.expenses,
    profit: calculation.profit,
    formula: calculation.formula,
  };
}

export const financeService = {
  listTransactions(params?: TransactionListParams): PaginatedResponse<Transaction> {
    let items = financeStorage.listTransactions();

    if (params?.type) {
      items = items.filter((item) => item.type === params.type);
    }

    return paginate(items, params?.page, params?.perPage);
  },

  createTransaction(dto: CreateTransactionDto): { data: Transaction } {
    const transaction = financeStorage.createTransaction({
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency ?? 'BYN',
      accountId: dto.accountId ?? 'main',
      counterpartyAccountId: dto.counterpartyAccountId ?? null,
      description: dto.description.trim(),
      category: dto.category?.trim() || null,
      activityScope: dto.activityScope,
      projectId: dto.activityScope === 'product' ? (dto.projectId ?? null) : null,
      date: dto.date,
    });
    return { data: transaction };
  },

  updateTransaction(
    id: string,
    dto: Partial<CreateTransactionDto>,
  ): { data: Transaction } | null {
    const activityScope = dto.activityScope;
    const projectId =
      activityScope === 'product'
        ? dto.projectId ?? null
        : activityScope === 'core'
          ? null
          : undefined;
    const updated = financeStorage.updateTransaction(id, {
      ...dto,
      description: dto.description?.trim(),
      category: dto.category !== undefined ? dto.category.trim() || null : undefined,
      ...(activityScope !== undefined ? { activityScope } : {}),
      ...(projectId !== undefined ? { projectId } : {}),
    });
    return updated ? { data: updated } : null;
  },

  deleteTransaction(id: string): boolean {
    return financeStorage.deleteTransaction(id);
  },

  listTaxes(params?: { page?: number; perPage?: number }): PaginatedResponse<TaxRecord> {
    const settings = financeStorage.getSettings();
    const transactions = financeStorage.listTransactions();
    const record = buildProfitTaxRecord(settings.incomeTaxBase, transactions);
    const items = record ? [record] : [];

    return paginate(items, params?.page, params?.perPage);
  },

  summary(): { data: FinanceSummary } {
    const transactions = financeStorage.listTransactions();
    const income = sumByType(transactions, 'income');
    const expense = sumByType(transactions, 'expense');
    const settings = financeStorage.getSettings();
    const taxRecord = buildProfitTaxRecord(settings.incomeTaxBase, transactions);

    return {
      data: {
        totalBalance: income - expense - (taxRecord?.amount ?? 0),
        income,
        expense,
        profit: income - expense,
        taxAmount: taxRecord?.amount ?? 0,
        incomeTaxBase: settings.incomeTaxBase,
        currency: 'BYN',
        accountsCount: 1,
        transactionsCount: transactions.length,
      },
    };
  },

  listOperationalExpenses(): PaginatedResponse<OperationalExpense> {
    return paginate(operationalExpensesStorage.list());
  },

  createOperationalExpense(dto: CreateOperationalExpenseDto): { data: OperationalExpense } {
    return { data: operationalExpensesStorage.create(dto) };
  },

  updateOperationalExpense(
    id: string,
    dto: Partial<CreateOperationalExpenseDto>,
  ): { data: OperationalExpense } | null {
    const updated = operationalExpensesStorage.update(id, dto);
    return updated ? { data: updated } : null;
  },

  deleteOperationalExpense(id: string): boolean {
    return operationalExpensesStorage.delete(id);
  },

  paymentCalendar(params: PaymentCalendarParams): { data: PaymentCalendarEntry[] } {
    const expenses = operationalExpensesStorage.list();
    return { data: buildPaymentCalendar(expenses, params) };
  },
};
