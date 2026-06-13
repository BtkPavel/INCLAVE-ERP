import type { PaginatedResponse } from '../types/common';
import type {
  Account,
  Budget,
  CreateAccountDto,
  CreateBudgetDto,
  CreateOperationalExpenseDto,
  CreateTransactionDto,
  FinanceReport,
  FinanceSection,
  FinanceSummary,
  OperationalExpense,
  PaymentCalendarParams,
  PaymentCalendarEntry,
  TaxRecord,
  Transaction,
  TransactionListParams,
} from '../types/finance';
import { apiClient, apiMocks } from '../client';
import type { QueryParams } from '../client';
import { buildUrl } from '../architecture';
import { financeService } from '../../backend/finance/financeService';

const BASE = buildUrl('finance', 'accounts').replace(/\/accounts$/, '');

export const financeApi = {
  accounts(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Account>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(apiMocks.emptyPage(params?.page, params?.perPage));
    }
    return apiClient.get(`${BASE}/accounts`, { params });
  },

  getAccount(id: string): Promise<{ data: Account }> {
    return apiClient.get(buildUrl('finance', 'getAccount', { id }));
  },

  createAccount(dto: CreateAccountDto): Promise<{ data: Account }> {
    return apiClient.post(`${BASE}/accounts`, dto);
  },

  transactions(params?: TransactionListParams): Promise<PaginatedResponse<Transaction>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.listTransactions(params));
    }
    return apiClient.get(`${BASE}/transactions`, { params: params as QueryParams });
  },

  getTransaction(id: string): Promise<{ data: Transaction }> {
    return apiClient.get(buildUrl('finance', 'getTransaction', { id }));
  },

  createTransaction(dto: CreateTransactionDto): Promise<{ data: Transaction }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.createTransaction(dto));
    }
    return apiClient.post(`${BASE}/transactions`, dto);
  },

  updateTransaction(
    id: string,
    dto: Partial<CreateTransactionDto>,
  ): Promise<{ data: Transaction }> {
    if (apiClient.isMockMode()) {
      const result = financeService.updateTransaction(id, dto);
      if (!result) {
        return Promise.reject(new Error('Запись не найдена'));
      }
      return Promise.resolve(result);
    }
    return apiClient.patch(buildUrl('finance', 'updateTransaction', { id }), dto);
  },

  deleteTransaction(id: string): Promise<void> {
    if (apiClient.isMockMode()) {
      financeService.deleteTransaction(id);
      return Promise.resolve();
    }
    return apiClient.delete(buildUrl('finance', 'deleteTransaction', { id }));
  },

  budgets(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<Budget>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(apiMocks.emptyPage(params?.page, params?.perPage));
    }
    return apiClient.get(`${BASE}/budgets`, { params });
  },

  getBudget(id: string): Promise<{ data: Budget }> {
    return apiClient.get(buildUrl('finance', 'getBudget', { id }));
  },

  createBudget(dto: CreateBudgetDto): Promise<{ data: Budget }> {
    return apiClient.post(`${BASE}/budgets`, dto);
  },

  summary(): Promise<{ data: FinanceSummary }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.summary());
    }
    return apiClient.get(buildUrl('finance', 'summary'));
  },

  reports(): Promise<{ data: FinanceReport[] }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve({ data: [] });
    }
    return apiClient.get(buildUrl('finance', 'reports'));
  },

  taxes(params?: { page?: number; perPage?: number }): Promise<PaginatedResponse<TaxRecord>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.listTaxes(params));
    }
    return apiClient.get(`${BASE}/taxes`, { params });
  },

  sectionData(
    section: FinanceSection,
    params?: { page?: number; perPage?: number },
  ): Promise<PaginatedResponse<Transaction | TaxRecord>> {
    if (section === 'taxes') {
      return this.taxes(params);
    }
    return this.transactions({
      ...params,
      type: section,
    });
  },

  operationalExpenses(): Promise<PaginatedResponse<OperationalExpense>> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.listOperationalExpenses());
    }
    return apiClient.get(`${BASE}/operational-expenses`);
  },

  createOperationalExpense(
    dto: CreateOperationalExpenseDto,
  ): Promise<{ data: OperationalExpense }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.createOperationalExpense(dto));
    }
    return apiClient.post(`${BASE}/operational-expenses`, dto);
  },

  updateOperationalExpense(
    id: string,
    dto: Partial<CreateOperationalExpenseDto>,
  ): Promise<{ data: OperationalExpense }> {
    if (apiClient.isMockMode()) {
      const result = financeService.updateOperationalExpense(id, dto);
      if (!result) {
        return Promise.reject(new Error('Расход не найден'));
      }
      return Promise.resolve(result);
    }
    return apiClient.patch(buildUrl('finance', 'updateOperationalExpense', { id }), dto);
  },

  deleteOperationalExpense(id: string): Promise<void> {
    if (apiClient.isMockMode()) {
      financeService.deleteOperationalExpense(id);
      return Promise.resolve();
    }
    return apiClient.delete(buildUrl('finance', 'deleteOperationalExpense', { id }));
  },

  paymentCalendar(params: PaymentCalendarParams): Promise<{ data: PaymentCalendarEntry[] }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve(financeService.paymentCalendar(params));
    }
    return apiClient.get(`${BASE}/payment-calendar`, {
      params: { from: params.from, to: params.to },
    });
  },
};
