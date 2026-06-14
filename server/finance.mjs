const PROFIT_TAX_RATE = 0.06;

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function calculateProfit(income, expenses) {
  return roundMoney(Math.max(0, income - expenses));
}

function calculateProfitTax(input, rate = PROFIT_TAX_RATE) {
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

function sumByType(transactions, type) {
  return transactions.reduce((sum, item) => (item.type === type ? sum + item.amount : sum), 0);
}

function currentPeriodDueDate() {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3 + 2;
  const due = new Date(now.getFullYear(), quarterMonth + 1, 0);
  return due.toISOString().slice(0, 10);
}

export function buildProfitTaxRecord(taxBase, transactions) {
  if (taxBase !== 'profit') return null;
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

export function buildSummary(settings, transactions) {
  const income = sumByType(transactions, 'income');
  const expense = sumByType(transactions, 'expense');
  const taxRecord = buildProfitTaxRecord(settings.incomeTaxBase, transactions);
  return {
    totalBalance: income - expense - (taxRecord?.amount ?? 0),
    income,
    expense,
    profit: income - expense,
    taxAmount: taxRecord?.amount ?? 0,
    incomeTaxBase: settings.incomeTaxBase,
    currency: 'BYN',
    accountsCount: 1,
    transactionsCount: transactions.length,
  };
}

const RECURRENCE_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 };

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonthsKeepDay(date, months) {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function buildEntry(expense, dueDate, occurrenceIndex) {
  return {
    id: `${expense.id}-${toIsoDate(dueDate)}-${occurrenceIndex}`,
    expenseId: expense.id,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    dueDate: toIsoDate(dueDate),
    billingStatus: expense.billingStatus,
    recurrence: expense.recurrence,
  };
}

function generateForExpense(expense, from, to) {
  const start = parseDate(expense.startDate);
  const entries = [];

  if (expense.billingStatus === 'one_time') {
    if (start >= from && start <= to) entries.push(buildEntry(expense, start, 0));
    return entries;
  }

  if (!expense.recurrence) return entries;

  let current = new Date(start);
  let index = 0;
  const horizon = addMonthsKeepDay(to, RECURRENCE_MONTHS[expense.recurrence]);

  while (current.getTime() <= horizon.getTime()) {
    if (current >= from && current <= to) entries.push(buildEntry(expense, current, index));
    current = addMonthsKeepDay(current, RECURRENCE_MONTHS[expense.recurrence]);
    index += 1;
    if (index > 500) break;
  }

  return entries;
}

export function buildPaymentCalendar(expenses, params) {
  const from = parseDate(params.from);
  const to = parseDate(params.to);
  return expenses
    .flatMap((expense) => generateForExpense(expense, from, to))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
