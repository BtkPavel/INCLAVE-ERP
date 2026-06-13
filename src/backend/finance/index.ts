export {
  PROFIT_TAX_RATE,
  calculateProfit,
  calculateProfitTax,
  isProfitBasedTaxation,
} from './taxCalculation';
export type { ProfitTaxInput, ProfitTaxResult } from './taxCalculation';
export { buildProfitTaxRecord, financeService } from './financeService';
export { buildPaymentCalendar, PAYMENT_RECURRENCE_LABELS } from './paymentCalendar';
