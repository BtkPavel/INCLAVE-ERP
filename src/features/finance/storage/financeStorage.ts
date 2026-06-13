import type { IncomeTaxBase, Transaction } from '../../../api/types/finance';
import { loadJson, saveJson } from '../../../storage/persistence';

const TRANSACTIONS_KEY = 'inclave-erp-finance-transactions';
const SETTINGS_KEY = 'inclave-erp-finance-settings';

export interface FinanceSettings {
  incomeTaxBase: IncomeTaxBase;
}

function defaultSettings(): FinanceSettings {
  return { incomeTaxBase: 'profit' };
}

function loadSettings(): FinanceSettings {
  const stored = loadJson<Partial<FinanceSettings> | null>(SETTINGS_KEY, null);
  if (!stored) return defaultSettings();
  return { ...defaultSettings(), ...stored };
}

function saveSettings(settings: FinanceSettings): void {
  saveJson(SETTINGS_KEY, settings);
}

function loadTransactions(): Transaction[] {
  return loadJson<Transaction[]>(TRANSACTIONS_KEY, []);
}

function saveTransactions(transactions: Transaction[]): void {
  saveJson(TRANSACTIONS_KEY, transactions);
}

export const financeStorage = {
  listTransactions(): Transaction[] {
    return loadTransactions();
  },

  createTransaction(dto: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transaction: Transaction = {
      ...dto,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const transactions = loadTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);
    return transaction;
  },

  updateTransaction(
    id: string,
    patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  ): Transaction | null {
    const transactions = loadTransactions();
    const index = transactions.findIndex((item) => item.id === id);
    if (index === -1) return null;

    transactions[index] = { ...transactions[index], ...patch };
    saveTransactions(transactions);
    return transactions[index];
  },

  deleteTransaction(id: string): boolean {
    const transactions = loadTransactions();
    const next = transactions.filter((item) => item.id !== id);
    if (next.length === transactions.length) return false;
    saveTransactions(next);
    return true;
  },

  getSettings(): FinanceSettings {
    return loadSettings();
  },

  setIncomeTaxBase(incomeTaxBase: IncomeTaxBase): FinanceSettings {
    const settings = { ...loadSettings(), incomeTaxBase };
    saveSettings(settings);
    return settings;
  },
};
