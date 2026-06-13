import type { IncomeTaxBase, Transaction } from '../../../api/types/finance';

const TRANSACTIONS_KEY = 'inclave-erp-finance-transactions';
const SETTINGS_KEY = 'inclave-erp-finance-settings';

export interface FinanceSettings {
  /** Режим налогообложения: доход на прибыль */
  incomeTaxBase: IncomeTaxBase;
}

function defaultSettings(): FinanceSettings {
  return { incomeTaxBase: 'profit' };
}

function loadSettings(): FinanceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...(JSON.parse(raw) as FinanceSettings) };
  } catch {
    return defaultSettings();
  }
}

function saveSettings(settings: FinanceSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function seedTransactions(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ts = now.toISOString();

  const seeds: Array<Omit<Transaction, 'id' | 'createdAt'>> = [
    {
      type: 'income',
      amount: 120_000,
      currency: 'BYN',
      accountId: 'main',
      counterpartyAccountId: null,
      description: 'Оплата по договору №12',
      category: 'выручка',
      projectId: null,
      date: `${year}-${month}-05`,
    },
    {
      type: 'income',
      amount: 45_000,
      currency: 'BYN',
      accountId: 'main',
      counterpartyAccountId: null,
      description: 'Дополнительные услуги',
      category: 'выручка',
      projectId: null,
      date: `${year}-${month}-12`,
    },
    {
      type: 'expense',
      amount: 38_000,
      currency: 'BYN',
      accountId: 'main',
      counterpartyAccountId: null,
      description: 'Зарплата штат',
      category: 'фонд оплаты труда',
      projectId: null,
      date: `${year}-${month}-10`,
    },
    {
      type: 'expense',
      amount: 22_500,
      currency: 'BYN',
      accountId: 'main',
      counterpartyAccountId: null,
      description: 'Аутсорс и подряд',
      category: 'услуги',
      projectId: null,
      date: `${year}-${month}-18`,
    },
  ];

  const transactions: Transaction[] = seeds.map((item, index) => ({
    ...item,
    id: `seed-tx-${index + 1}`,
    createdAt: ts,
  }));

  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return transactions;
}

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return seedTransactions();
    return JSON.parse(raw) as Transaction[];
  } catch {
    return seedTransactions();
  }
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
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
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
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    return transactions[index];
  },

  deleteTransaction(id: string): boolean {
    const transactions = loadTransactions();
    const next = transactions.filter((item) => item.id !== id);
    if (next.length === transactions.length) return false;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(next));
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
