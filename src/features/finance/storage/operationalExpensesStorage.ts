import type {
  CreateOperationalExpenseDto,
  OperationalExpense,
  PaymentRecurrence,
} from '../../../api/types/finance';
import { loadJson, saveJson } from '../../../storage/persistence';

const STORAGE_KEY = 'inclave-erp-operational-expenses';

function loadAll(): OperationalExpense[] {
  return loadJson<OperationalExpense[]>(STORAGE_KEY, []);
}

function saveAll(expenses: OperationalExpense[]): void {
  saveJson(STORAGE_KEY, expenses);
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
      activityScope: dto.activityScope,
      projectId: dto.activityScope === 'product' ? (dto.projectId ?? null) : null,
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
    const activityScope = dto.activityScope ?? current.activityScope ?? 'core';
    const projectId =
      activityScope === 'product'
        ? dto.projectId !== undefined
          ? dto.projectId ?? null
          : current.projectId
        : null;
    const updated: OperationalExpense = {
      ...current,
      ...dto,
      title: dto.title?.trim() ?? current.title,
      category: dto.category !== undefined ? dto.category.trim() || null : current.category,
      activityScope,
      projectId,
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
