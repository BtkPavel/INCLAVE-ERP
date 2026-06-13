import type { IncomeTaxBase } from '../../api/types/finance';

/** Ставка налога при режиме «доход на прибыль» */
export const PROFIT_TAX_RATE = 0.06;

export interface ProfitTaxInput {
  income: number;
  expenses: number;
}

export interface ProfitTaxResult {
  income: number;
  expenses: number;
  profit: number;
  rate: number;
  amount: number;
  formula: string;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateProfit(income: number, expenses: number): number {
  return roundMoney(Math.max(0, income - expenses));
}

/**
 * Налог при режиме «доход на прибыль»: 6% от прибыли.
 * Прибыль = доходы − расходы (не ниже 0).
 */
export function calculateProfitTax(
  input: ProfitTaxInput,
  rate: number = PROFIT_TAX_RATE,
): ProfitTaxResult {
  const profit = calculateProfit(input.income, input.expenses);
  const amount = roundMoney(profit * rate);

  return {
    income: roundMoney(input.income),
    expenses: roundMoney(input.expenses),
    profit,
    rate,
    amount,
    formula: 'прибыль × 6%',
  };
}

export function isProfitBasedTaxation(taxBase: IncomeTaxBase): boolean {
  return taxBase === 'profit';
}
