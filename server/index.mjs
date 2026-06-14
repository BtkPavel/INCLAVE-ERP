import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { authenticate, authMiddleware, signToken } from './auth.mjs';
import { KEYS, loadJson, saveJson } from './db.mjs';
import { buildPaymentCalendar, buildProfitTaxRecord, buildSummary } from './finance.mjs';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function paginate(items, page = 1, perPage = 100) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: { page, perPage, total, totalPages },
  };
}

function notFound(res) {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Не найдено' });
}

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/v1/auth/login', (req, res) => {
  const { role, password } = req.body ?? {};
  const user = authenticate(role, password);
  if (!user) {
    res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Неверный пароль' });
    return;
  }
  const accessToken = signToken(user.role);
  res.json({
    user: { role: user.role, name: user.name, title: user.title },
    tokens: {
      accessToken,
      refreshToken: accessToken,
      expiresIn: 30 * 24 * 3600,
    },
  });
});

app.post('/api/v1/auth/logout', authMiddleware, (_req, res) => {
  res.status(204).end();
});

app.get('/api/v1/auth/me', authMiddleware, (req, res) => {
  res.json({ data: { role: req.user.role, name: req.user.name, title: req.user.title } });
});

// ─── Calendar ───────────────────────────────────────────────────────────────

function loadEvents() {
  return loadJson(KEYS.events, []).map((e) => ({
    ...e,
    reminderMinutes: e.reminderMinutes ?? null,
    priority: e.priority ?? 'medium',
  }));
}

function saveEvents(events) {
  saveJson(KEYS.events, events);
}

function filterEvents(events, from, to) {
  return events
    .filter((e) => {
      const start = new Date(e.startAt).getTime();
      if (from && start < new Date(from).getTime()) return false;
      if (to && start > new Date(to).getTime()) return false;
      return true;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

app.get('/api/v1/calendar/events', authMiddleware, (req, res) => {
  const { from, to, page, perPage } = req.query;
  const events = filterEvents(loadEvents(), from, to);
  res.json(paginate(events, Number(page) || 1, Number(perPage) || 500));
});

app.get('/api/v1/calendar/events/upcoming', authMiddleware, (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const now = new Date().toISOString();
  const data = filterEvents(loadEvents(), now).slice(0, limit);
  res.json({ data });
});

app.get('/api/v1/calendar/events/:id', authMiddleware, (req, res) => {
  const event = loadEvents().find((e) => e.id === req.params.id);
  if (!event) return notFound(res);
  res.json({ data: event });
});

app.post('/api/v1/calendar/events', authMiddleware, (req, res) => {
  const dto = req.body ?? {};
  const events = loadEvents();
  const ts = new Date().toISOString();
  const event = {
    id: crypto.randomUUID(),
    title: dto.title,
    description: dto.description ?? null,
    type: dto.type ?? 'other',
    priority: dto.priority ?? 'medium',
    startAt: dto.startAt,
    endAt: dto.endAt,
    allDay: dto.allDay ?? false,
    reminderMinutes: dto.reminderMinutes ?? null,
    projectId: dto.projectId ?? null,
    createdBy: req.user.role,
    createdAt: ts,
    updatedAt: ts,
  };
  events.push(event);
  saveEvents(events);
  res.status(201).json({ data: event });
});

app.patch('/api/v1/calendar/events/:id', authMiddleware, (req, res) => {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return notFound(res);
  const dto = req.body ?? {};
  events[idx] = {
    ...events[idx],
    ...dto,
    description: dto.description ?? events[idx].description,
    reminderMinutes: dto.reminderMinutes !== undefined ? dto.reminderMinutes : events[idx].reminderMinutes,
    priority: dto.priority ?? events[idx].priority ?? 'medium',
    updatedAt: new Date().toISOString(),
  };
  saveEvents(events);
  res.json({ data: events[idx] });
});

app.delete('/api/v1/calendar/events/:id', authMiddleware, (req, res) => {
  const events = loadEvents();
  const next = events.filter((e) => e.id !== req.params.id);
  if (next.length === events.length) return notFound(res);
  saveEvents(next);
  res.status(204).end();
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

function loadTasks() {
  return loadJson(KEYS.tasks, []);
}

function saveTasks(tasks) {
  saveJson(KEYS.tasks, tasks);
}

function sortTasks(tasks) {
  const statusOrder = { in_progress: 0, review: 1, todo: 2, done: 3, cancelled: 4 };
  return [...tasks].sort((a, b) => {
    const sd = statusOrder[a.status] - statusOrder[b.status];
    if (sd !== 0) return sd;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function tasksForUser(role, status) {
  let tasks = loadTasks().filter((t) => t.assigneeId === role);
  if (status) tasks = tasks.filter((t) => t.status === status);
  return sortTasks(tasks);
}

app.get('/api/v1/tasks', authMiddleware, (req, res) => {
  const { status, page, perPage } = req.query;
  const items = tasksForUser(req.user.role, status);
  res.json(paginate(items, Number(page) || 1, Number(perPage) || 50));
});

app.get('/api/v1/tasks/stats', authMiddleware, (req, res) => {
  const tasks = tasksForUser(req.user.role);
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    data: {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < today && t.status !== 'done' && t.status !== 'cancelled',
      ).length,
    },
  });
});

app.get('/api/v1/tasks/with-due-date', authMiddleware, (req, res) => {
  const data = tasksForUser(req.user.role).filter(
    (t) => t.dueDate && t.status !== 'cancelled',
  );
  res.json({ data });
});

app.get('/api/v1/tasks/:id', authMiddleware, (req, res) => {
  const task = loadTasks().find((t) => t.id === req.params.id && t.assigneeId === req.user.role);
  if (!task) return notFound(res);
  res.json({ data: task });
});

app.post('/api/v1/tasks', authMiddleware, (req, res) => {
  const dto = req.body ?? {};
  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    title: String(dto.title ?? '').trim(),
    description: dto.description?.trim() || null,
    status: dto.status ?? 'todo',
    priority: dto.priority ?? 'medium',
    projectId: dto.projectId ?? null,
    assigneeId: req.user.role,
    dueDate: dto.dueDate ?? null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const tasks = loadTasks();
  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json({ data: task });
});

app.patch('/api/v1/tasks/:id', authMiddleware, (req, res) => {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === req.params.id && t.assigneeId === req.user.role);
  if (idx === -1) return notFound(res);
  const current = tasks[idx];
  const dto = req.body ?? {};
  const nextStatus = dto.status ?? current.status;
  const completedAt =
    nextStatus === 'done' && current.status !== 'done'
      ? new Date().toISOString()
      : nextStatus !== 'done'
        ? null
        : current.completedAt;
  tasks[idx] = {
    ...current,
    ...dto,
    title: dto.title?.trim() ?? current.title,
    description: dto.description !== undefined ? dto.description.trim() || null : current.description,
    status: nextStatus,
    completedAt,
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);
  res.json({ data: tasks[idx] });
});

app.post('/api/v1/tasks/:id/complete', authMiddleware, (req, res) => {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === req.params.id && t.assigneeId === req.user.role);
  if (idx === -1) return notFound(res);
  tasks[idx] = {
    ...tasks[idx],
    status: 'done',
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);
  res.json({ data: tasks[idx] });
});

app.delete('/api/v1/tasks/:id', authMiddleware, (req, res) => {
  const tasks = loadTasks();
  const next = tasks.filter((t) => !(t.id === req.params.id && t.assigneeId === req.user.role));
  if (next.length === tasks.length) return notFound(res);
  saveTasks(next);
  res.status(204).end();
});

// ─── Finance ────────────────────────────────────────────────────────────────

function loadTransactions() {
  return loadJson(KEYS.transactions, []);
}

function saveTransactions(transactions) {
  saveJson(KEYS.transactions, transactions);
}

function loadSettings() {
  const stored = loadJson(KEYS.settings, null);
  return { incomeTaxBase: stored?.incomeTaxBase ?? 'profit' };
}

function loadExpenses() {
  return loadJson(KEYS.expenses, []).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}

function saveExpenses(expenses) {
  saveJson(KEYS.expenses, expenses);
}

app.get('/api/v1/finance/transactions', authMiddleware, (req, res) => {
  let items = loadTransactions();
  if (req.query.type) items = items.filter((t) => t.type === req.query.type);
  res.json(paginate(items, Number(req.query.page) || 1, Number(req.query.perPage) || 50));
});

app.get('/api/v1/finance/transactions/:id', authMiddleware, (req, res) => {
  const tx = loadTransactions().find((t) => t.id === req.params.id);
  if (!tx) return notFound(res);
  res.json({ data: tx });
});

app.post('/api/v1/finance/transactions', authMiddleware, (req, res) => {
  const dto = req.body ?? {};
  const transaction = {
    id: crypto.randomUUID(),
    type: dto.type,
    amount: dto.amount,
    currency: dto.currency ?? 'BYN',
    accountId: dto.accountId ?? 'main',
    counterpartyAccountId: dto.counterpartyAccountId ?? null,
    description: String(dto.description ?? '').trim(),
    category: dto.category?.trim() || null,
    projectId: dto.projectId ?? null,
    date: dto.date,
    createdAt: new Date().toISOString(),
  };
  const transactions = loadTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
  res.status(201).json({ data: transaction });
});

app.patch('/api/v1/finance/transactions/:id', authMiddleware, (req, res) => {
  const transactions = loadTransactions();
  const idx = transactions.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return notFound(res);
  const dto = req.body ?? {};
  transactions[idx] = {
    ...transactions[idx],
    ...dto,
    description: dto.description?.trim() ?? transactions[idx].description,
    category: dto.category !== undefined ? dto.category.trim() || null : transactions[idx].category,
  };
  saveTransactions(transactions);
  res.json({ data: transactions[idx] });
});

app.delete('/api/v1/finance/transactions/:id', authMiddleware, (req, res) => {
  const transactions = loadTransactions();
  const next = transactions.filter((t) => t.id !== req.params.id);
  if (next.length === transactions.length) return notFound(res);
  saveTransactions(next);
  res.status(204).end();
});

app.get('/api/v1/finance/summary', authMiddleware, (_req, res) => {
  res.json({ data: buildSummary(loadSettings(), loadTransactions()) });
});

app.get('/api/v1/finance/taxes', authMiddleware, (req, res) => {
  const record = buildProfitTaxRecord(loadSettings().incomeTaxBase, loadTransactions());
  const items = record ? [record] : [];
  res.json(paginate(items, Number(req.query.page) || 1, Number(req.query.perPage) || 20));
});

app.get('/api/v1/finance/operational-expenses', authMiddleware, (_req, res) => {
  res.json(paginate(loadExpenses()));
});

app.post('/api/v1/finance/operational-expenses', authMiddleware, (req, res) => {
  const dto = req.body ?? {};
  const now = new Date().toISOString();
  const billingStatus = dto.billingStatus;
  const recurrence = billingStatus === 'cyclic' ? (dto.recurrence ?? 'monthly') : null;
  const expense = {
    id: crypto.randomUUID(),
    title: String(dto.title ?? '').trim(),
    amount: dto.amount,
    currency: dto.currency ?? 'BYN',
    category: dto.category?.trim() || null,
    startDate: dto.startDate,
    billingStatus,
    recurrence,
    createdAt: now,
    updatedAt: now,
  };
  const expenses = loadJson(KEYS.expenses, []);
  expenses.push(expense);
  saveExpenses(expenses);
  res.status(201).json({ data: expense });
});

app.patch('/api/v1/finance/operational-expenses/:id', authMiddleware, (req, res) => {
  const expenses = loadJson(KEYS.expenses, []);
  const idx = expenses.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return notFound(res);
  const current = expenses[idx];
  const dto = req.body ?? {};
  const billingStatus = dto.billingStatus ?? current.billingStatus;
  expenses[idx] = {
    ...current,
    ...dto,
    title: dto.title?.trim() ?? current.title,
    category: dto.category !== undefined ? dto.category.trim() || null : current.category,
    billingStatus,
    recurrence: billingStatus === 'cyclic' ? (dto.recurrence ?? current.recurrence ?? 'monthly') : null,
    updatedAt: new Date().toISOString(),
  };
  saveExpenses(expenses);
  res.json({ data: expenses[idx] });
});

app.delete('/api/v1/finance/operational-expenses/:id', authMiddleware, (req, res) => {
  const expenses = loadJson(KEYS.expenses, []);
  const next = expenses.filter((e) => e.id !== req.params.id);
  if (next.length === expenses.length) return notFound(res);
  saveExpenses(next);
  res.status(204).end();
});

app.get('/api/v1/finance/payment-calendar', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'from и to обязательны' });
    return;
  }
  const data = buildPaymentCalendar(loadExpenses(), { from, to });
  res.json({ data });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`INCLAVE API listening on http://127.0.0.1:${PORT}`);
});
