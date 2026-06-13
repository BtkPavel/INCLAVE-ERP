import type {
  CreateOperationalExpenseDto,
  OperationalExpense,
  PaymentRecurrence,
} from '../../../api/types/finance';

const STORAGE_KEY = 'inclave-erp-operational-expenses';

function seedExpenses(): OperationalExpense[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ts = now.toISOString();

  const seeds: Array<Omit<OperationalExpense, 'id' | 'createdAt' | 'updatedAt'>> = [
    {
      title: 'Аренда офиса',
      amount: 4_500,
      currency: 'BYN',
      category: 'аренда',
      startDate: `${year}-${month}-01`,
      billingStatus: 'cyclic',
      recurrence: 'monthly',
    },
    {
      title: 'Страхование имущества',
      amount: 18_000,
      currency: 'BYN',
      category: 'страхование',
      startDate: `${year}-01-15`,
      billingStatus: 'cyclic',
      recurrence: 'yearly',
    },
    {
      title: 'Бухгалтерский аутсорс',
      amount: 9_000,
      currency: 'BYN',
      category: 'услуги',
      startDate: `${year}-${month}-20`,
      billingStatus: 'cyclic',
      recurrence: 'quarterly',
    },
    {
      title: 'Закупка оборудования',
      amount: 12_800,
      currency: 'BYN',
      category: 'закупки',
      startDate: `${year}-${month}-25`,
      billingStatus: 'one_time',
      recurrence: null,
    },
  ];

  const expenses = seeds.map((item, index) => ({
    ...item,
    id: `seed-opex-${index + 1}`,
    createdAt: ts,
    updatedAt: ts,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  return expenses;
}

function loadAll(): OperationalExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedExpenses();
    return JSON.parse(raw) as OperationalExpense[];
  } catch {
    return seedExpenses();
  }
}

function saveAll(expenses: OperationalExpense[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function validateRecurrence(
  billingStatus: CreateOperationalExpenseDto['billingStatus'],
  recurrence?: PaymentRecurrence | null,
): PaymentRecurrence | null {
  if (billingStatus === 'cyclic') {
    return recurrence ?? 'monthly';
  }
  return null;
}

export const operationalExpensesStorage = {
  list(): OperationalExpense[] {
    return loadAll().sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
  },

  create(dto: CreateOperationalExpenseDto): OperationalExpense {
    const now = new Date().toISOString();
    const expense: OperationalExpense = {
      id: crypto.randomUUID(),
      title: dto.title.trim(),
      amount: dto.amount,
      currency: dto.currency ?? 'BYN',
      category: dto.category?.trim() || null,
      startDate: dto.startDate,
      billingStatus: dto.billingStatus,
      recurrence: validateRecurrence(dto.billingStatus, dto.recurrence),
      createdAt: now,
      updatedAt: now,
    };

    const expenses = loadAll();
    expenses.push(expense);
    saveAll(expenses);
    return expense;
  },

  update(
    id: string,
    dto: Partial<CreateOperationalExpenseDto>,
  ): OperationalExpense | null {
    const expenses = loadAll();
    const index = expenses.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const current = expenses[index];
    const billingStatus = dto.billingStatus ?? current.billingStatus;
    const updated: OperationalExpense = {
      ...current,
      ...dto,
      title: dto.title?.trim() ?? current.title,
      category: dto.category !== undefined ? dto.category.trim() || null : current.category,
      billingStatus,
      recurrence: validateRecurrence(
        billingStatus,
        dto.recurrence !== undefined ? dto.recurrence : current.recurrence,
      ),
      updatedAt: new Date().toISOString(),
    };

    expenses[index] = updated;
    saveAll(expenses);
    return updated;
  },

  delete(id: string): boolean {
    const expenses = loadAll();
    const next = expenses.filter((item) => item.id !== id);
    if (next.length === expenses.length) return false;
    saveAll(next);
    return true;
  },
};
