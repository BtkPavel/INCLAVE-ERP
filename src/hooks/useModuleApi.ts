import { useCallback, useEffect, useState } from 'react';
import { useApiResource } from './useApiResource';
import { projectsApi } from '../api/modules/projects.api';
import { calendarApi } from '../api/modules/calendar.api';
import { tasksApi } from '../api/modules/tasks.api';
import { financeApi } from '../api/modules/finance.api';
import { hrApi } from '../api/modules/hr.api';
import type { EmploymentType } from '../api/types/hr';
import type { FinanceSection } from '../api/types/finance';
import type { TaskStatus } from '../api/types/tasks';
import type { PaginatedResponse } from '../api/types/common';
import type { ISODate } from '../api/types/common';

import type { ProjectCategory } from '../api/types/projects';

export function useProjects(category?: ProjectCategory) {
  return useApiResource(
    useCallback(() => projectsApi.list(category ? { category } : undefined), [category]),
  );
}

export function useProjectStats() {
  return useApiResource(useCallback(() => projectsApi.stats(), []));
}

export function useCalendarEvents() {
  return useApiResource(useCallback(() => calendarApi.listEvents(), []));
}

export function useTasks(version = 0, status?: TaskStatus) {
  return useApiResource(
    useCallback(
      () => tasksApi.list(status ? { status } : undefined),
      [version, status],
    ),
  );
}

export function useTaskStats(version = 0) {
  return useApiResource(useCallback(() => tasksApi.stats(), [version]));
}

export function useTaskActions() {
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    const handler = () => bump();
    window.addEventListener('inclave-assistant-action', handler);
    return () => window.removeEventListener('inclave-assistant-action', handler);
  }, []);

  return {
    version,
    async create(dto: Parameters<typeof tasksApi.create>[0]) {
      const result = await tasksApi.create(dto);
      bump();
      return result;
    },
    async update(id: string, dto: Parameters<typeof tasksApi.update>[1]) {
      const result = await tasksApi.update(id, dto);
      bump();
      return result;
    },
    async complete(id: string) {
      const result = await tasksApi.complete(id);
      bump();
      return result;
    },
    async remove(id: string) {
      await tasksApi.delete(id);
      bump();
    },
  };
}

export function useFinanceAccounts() {
  return useApiResource(useCallback(() => financeApi.accounts(), []));
}

export function useFinanceSummary() {
  return useApiResource(useCallback(() => financeApi.summary(), []));
}

export function useFinanceSection(section: FinanceSection, version = 0) {
  return useApiResource<PaginatedResponse<unknown>>(
    useCallback(() => financeApi.sectionData(section), [section, version]),
  );
}

export function useTransactionActions() {
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  return {
    version,
    async create(dto: Parameters<typeof financeApi.createTransaction>[0]) {
      const result = await financeApi.createTransaction(dto);
      bump();
      return result;
    },
    async update(id: string, dto: Parameters<typeof financeApi.updateTransaction>[1]) {
      const result = await financeApi.updateTransaction(id, dto);
      bump();
      return result;
    },
    async remove(id: string) {
      await financeApi.deleteTransaction(id);
      bump();
    },
  };
}

export function useOperationalExpenses(version = 0) {
  return useApiResource(
    useCallback(() => financeApi.operationalExpenses(), [version]),
  );
}

export function usePaymentCalendar(from: ISODate, to: ISODate) {
  return useApiResource(
    useCallback(() => financeApi.paymentCalendar({ from, to }), [from, to]),
  );
}

export function useOperationalExpenseActions() {
  const [version, setVersion] = useState(0);

  const bump = () => setVersion((v) => v + 1);

  return {
    version,
    async create(dto: Parameters<typeof financeApi.createOperationalExpense>[0]) {
      const result = await financeApi.createOperationalExpense(dto);
      bump();
      return result;
    },
    async update(
      id: string,
      dto: Parameters<typeof financeApi.updateOperationalExpense>[1],
    ) {
      const result = await financeApi.updateOperationalExpense(id, dto);
      bump();
      return result;
    },
    async remove(id: string) {
      await financeApi.deleteOperationalExpense(id);
      bump();
    },
  };
}

export function useHrEmployees(employmentType: EmploymentType) {
  return useApiResource(
    useCallback(() => hrApi.list({ employmentType }), [employmentType]),
  );
}
