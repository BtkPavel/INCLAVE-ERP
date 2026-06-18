import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { authenticate, authMiddleware, listUsers, signToken } from './auth.mjs';
import { KEYS, loadJson, saveJson } from './db.mjs';
import { buildPaymentCalendar, buildProfitTaxRecord, buildSummary } from './finance.mjs';
import { buildHrStats, ensureSeedEmployees, filterEmployees, loadEmployees as loadHrEmployees, normalizeEmployee } from './hr.mjs';
import { isRoleAccessBlocked } from './access.mjs';
import {
  applySprintNumber,
  createSprintPayload,
  nextSprintNumber,
  sprintsForProject,
} from './sprints.mjs';
import { runAssistantChat, clearStoredAgent } from './assistant.mjs';

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
  if (role && isRoleAccessBlocked(role)) {
    res.status(403).json({
      code: 'ACCESS_BLOCKED',
      message: 'Доступ заблокирован. Обратитесь к директору.',
    });
    return;
  }
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

app.get('/api/v1/auth/users', authMiddleware, (_req, res) => {
  res.json({ data: listUsers() });
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

// ─── Projects ───────────────────────────────────────────────────────────────

function loadProjects() {
  return loadJson(KEYS.projects, []);
}

function saveProjects(projects) {
  saveJson(KEYS.projects, projects);
}

function filterProjects(projects, { category, status } = {}) {
  return projects.filter((project) => {
    if (category && project.category !== category) return false;
    if (status && project.status !== status) return false;
    return true;
  });
}

const PROJECT_METHODOLOGIES = new Set(['scrum', 'waterfall', 'kanban', 'hybrid']);

function projectCodeFromName(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const prefix = parts.map((p) => [...p][0]?.toUpperCase() ?? '').join('').slice(0, 4) || 'PRJ';
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${suffix}`;
}

function normalizeMembers(members) {
  if (!Array.isArray(members)) return [];
  return members
    .filter((m) => m && (m.userId || m.employeeId) && m.name)
    .map((m) => ({
      userId: String(m.userId ?? m.employeeId).trim(),
      name: String(m.name).trim(),
      role: String(m.role ?? '').trim() || 'Участник',
    }));
}

function normalizeProject(project) {
  return {
    ...project,
    methodology: PROJECT_METHODOLOGIES.has(project.methodology) ? project.methodology : 'waterfall',
    sprintWeeks: project.sprintWeeks ?? null,
    members: normalizeMembers(project.members),
    requiredInvestments: project.requiredInvestments ?? null,
    budget: project.budget ?? null,
    createdBy: project.createdBy ?? project.managerId ?? null,
  };
}

function canManageProject(user, project) {
  return user.role === 'director' || project.createdBy === user.role;
}

function loadSprints() {
  return loadJson(KEYS.sprints, []);
}

function saveSprints(sprints) {
  saveJson(KEYS.sprints, sprints);
}

function findProject(id) {
  return loadNormalizedProjects().find((p) => p.id === id) ?? null;
}

function loadNormalizedProjects() {
  return loadProjects().map(normalizeProject);
}

app.get('/api/v1/projects/stats', authMiddleware, (_req, res) => {
  const projects = loadNormalizedProjects();
  res.json({
    data: {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      onHold: projects.filter((p) => p.status === 'on_hold').length,
    },
  });
});

app.get('/api/v1/projects', authMiddleware, (req, res) => {
  const { category, status, page, perPage } = req.query;
  const items = filterProjects(loadNormalizedProjects(), { category, status });
  res.json(paginate(items, Number(page) || 1, Number(perPage) || 50));
});

app.get('/api/v1/projects/:id', authMiddleware, (req, res) => {
  const project = loadNormalizedProjects().find((p) => p.id === req.params.id);
  if (!project) return notFound(res);
  res.json({ data: project });
});

app.post('/api/v1/projects', authMiddleware, (req, res) => {
  if (req.user.role !== 'director') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Создавать проекты может только директор' });
    return;
  }

  const dto = req.body ?? {};
  const name = String(dto.name ?? '').trim();
  if (!name) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Название проекта обязательно' });
    return;
  }

  const category = dto.category === 'current' ? 'current' : 'investment';
  const methodology = PROJECT_METHODOLOGIES.has(dto.methodology) ? dto.methodology : 'waterfall';
  const sprintWeeks =
    methodology === 'scrum' || methodology === 'hybrid'
      ? Number(dto.sprintWeeks) || 2
      : null;

  if (category === 'investment' && (dto.requiredInvestments == null || dto.requiredInvestments === '')) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Для инвест-проекта укажите требуемые инвестиции' });
    return;
  }

  const now = new Date().toISOString();
  const project = normalizeProject({
    id: crypto.randomUUID(),
    name,
    code: String(dto.code ?? '').trim() || projectCodeFromName(name),
    description: dto.description?.trim() || null,
    category,
    status: dto.status ?? 'active',
    methodology,
    sprintWeeks,
    startDate: dto.startDate ?? null,
    endDate: dto.endDate ?? null,
    budget: dto.budget != null && dto.budget !== '' ? Number(dto.budget) : null,
    requiredInvestments:
      dto.requiredInvestments != null && dto.requiredInvestments !== ''
        ? Number(dto.requiredInvestments)
        : null,
    members: normalizeMembers(dto.members),
    managerId: dto.managerId ?? req.user.role,
    createdBy: req.user.role,
    createdAt: now,
    updatedAt: now,
  });

  const projects = loadProjects();
  projects.push(project);
  saveProjects(projects);
  res.status(201).json({ data: project });
});

app.patch('/api/v1/projects/:id', authMiddleware, (req, res) => {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return notFound(res);
  const current = normalizeProject(projects[idx]);
  if (!canManageProject(req.user, current)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Редактировать проект может только директор или создатель' });
    return;
  }
  const dto = req.body ?? {};
  const methodology = dto.methodology
    ? PROJECT_METHODOLOGIES.has(dto.methodology)
      ? dto.methodology
      : current.methodology
    : current.methodology;
  const sprintWeeks =
    dto.sprintWeeks !== undefined
      ? dto.sprintWeeks != null
        ? Number(dto.sprintWeeks)
        : null
      : methodology === 'scrum' || methodology === 'hybrid'
        ? current.sprintWeeks ?? 2
        : null;

  projects[idx] = normalizeProject({
    ...current,
    ...dto,
    name: dto.name?.trim() ?? current.name,
    code: dto.code?.trim() ?? current.code,
    description: dto.description !== undefined ? dto.description.trim() || null : current.description,
    category:
      dto.category === 'current' || dto.category === 'investment' ? dto.category : current.category,
    methodology,
    sprintWeeks,
    members: dto.members !== undefined ? normalizeMembers(dto.members) : current.members,
    budget: dto.budget !== undefined ? (dto.budget != null ? Number(dto.budget) : null) : current.budget,
    requiredInvestments:
      dto.requiredInvestments !== undefined
        ? dto.requiredInvestments != null
          ? Number(dto.requiredInvestments)
          : null
        : current.requiredInvestments,
    updatedAt: new Date().toISOString(),
  });
  saveProjects(projects);
  res.json({ data: projects[idx] });
});

app.delete('/api/v1/projects/:id', authMiddleware, (req, res) => {
  const projects = loadProjects();
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return notFound(res);
  if (!canManageProject(req.user, normalizeProject(project))) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Удалять проект может только директор или создатель' });
    return;
  }
  const next = projects.filter((p) => p.id !== req.params.id);
  saveProjects(next);
  const sprints = loadSprints().filter((s) => s.projectId !== req.params.id);
  saveSprints(sprints);
  res.status(204).end();
});

app.get('/api/v1/projects/:id/tasks', authMiddleware, (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return notFound(res);

  const { sprintId } = req.query;
  let tasks = loadTasks().filter((t) => t.projectId === project.id);
  if (req.user.role !== 'director') {
    tasks = tasks.filter((t) => t.assigneeId === req.user.role);
  }
  if (sprintId === 'backlog') {
    tasks = tasks.filter((t) => !t.sprintId);
  } else if (sprintId) {
    tasks = tasks.filter((t) => t.sprintId === sprintId);
  }
  res.json({ data: sortTasks(tasks) });
});

app.get('/api/v1/projects/:id/sprints', authMiddleware, (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return notFound(res);
  res.json({ data: sprintsForProject(loadSprints(), project.id) });
});

app.post('/api/v1/projects/:id/sprints', authMiddleware, (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return notFound(res);

  const dto = req.body ?? {};
  const sprints = loadSprints();
  const number = nextSprintNumber(sprints, project.id);
  const draft = createSprintPayload({
    projectId: project.id,
    project,
    goal: dto.goal,
    startDate: dto.startDate,
  });
  const sprint = applySprintNumber(draft, number);
  sprints.push(sprint);
  saveSprints(sprints);
  res.status(201).json({ data: sprint });
});

app.patch('/api/v1/projects/:id/sprints/:sprintId', authMiddleware, (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return notFound(res);

  const sprints = loadSprints();
  const idx = sprints.findIndex((s) => s.id === req.params.sprintId && s.projectId === project.id);
  if (idx === -1) return notFound(res);

  const dto = req.body ?? {};
  sprints[idx] = {
    ...sprints[idx],
    ...dto,
    goal: dto.goal?.trim() ?? sprints[idx].goal,
    updatedAt: new Date().toISOString(),
  };
  saveSprints(sprints);
  res.json({ data: sprints[idx] });
});

app.post('/api/v1/projects/:id/sprints/:sprintId/start', authMiddleware, (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return notFound(res);

  const sprints = loadSprints();
  const idx = sprints.findIndex((s) => s.id === req.params.sprintId && s.projectId === project.id);
  if (idx === -1) return notFound(res);

  const hasActive = sprints.some((s) => s.projectId === project.id && s.status === 'active');
  if (hasActive) {
    res.status(409).json({ code: 'CONFLICT', message: 'Уже есть активный спринт. Завершите его перед запуском нового.' });
    return;
  }

  for (let i = 0; i < sprints.length; i += 1) {
    if (sprints[i].projectId === project.id && sprints[i].status === 'active') {
      sprints[i] = { ...sprints[i], status: 'completed', updatedAt: new Date().toISOString() };
    }
  }
  sprints[idx] = { ...sprints[idx], status: 'active', updatedAt: new Date().toISOString() };
  saveSprints(sprints);
  res.json({ data: sprints[idx] });
});

app.post('/api/v1/projects/:id/sprints/:sprintId/complete', authMiddleware, (req, res) => {
  const project = findProject(req.params.id);
  if (!project) return notFound(res);

  const sprints = loadSprints();
  const idx = sprints.findIndex((s) => s.id === req.params.sprintId && s.projectId === project.id);
  if (idx === -1) return notFound(res);

  sprints[idx] = { ...sprints[idx], status: 'completed', updatedAt: new Date().toISOString() };
  saveSprints(sprints);
  res.json({ data: sprints[idx] });
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
  const { status, page, perPage, assigneeId } = req.query;
  let role = req.user.role;
  if (assigneeId && req.user.role === 'director') {
    const validRoles = listUsers().map((u) => u.role);
    if (validRoles.includes(assigneeId)) {
      role = assigneeId;
    }
  }
  const items = tasksForUser(role, status);
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
  let assigneeId = req.user.role;
  if (req.user.role === 'director' && dto.assigneeId) {
    const validRoles = listUsers().map((u) => u.role);
    if (validRoles.includes(dto.assigneeId)) {
      assigneeId = dto.assigneeId;
    }
  }
  const task = {
    id: crypto.randomUUID(),
    title: String(dto.title ?? '').trim(),
    description: dto.description?.trim() || null,
    status: dto.status ?? 'todo',
    priority: dto.priority ?? 'medium',
    projectId: dto.projectId ?? null,
    sprintId: dto.sprintId ?? null,
    assigneeId,
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

app.post('/api/v1/tasks/:id/assign', authMiddleware, (req, res) => {
  if (req.user.role !== 'director') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Назначать исполнителя может только директор' });
    return;
  }

  const { assigneeId } = req.body ?? {};
  const validRoles = listUsers().map((u) => u.role);
  if (!assigneeId || !validRoles.includes(assigneeId)) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Укажите корректного исполнителя' });
    return;
  }

  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return notFound(res);

  tasks[idx] = {
    ...tasks[idx],
    assigneeId,
    updatedAt: new Date().toISOString(),
  };
  saveTasks(tasks);
  res.json({ data: tasks[idx] });
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
    projectId: dto.projectId !== undefined ? dto.projectId : current.projectId,
    sprintId: dto.sprintId !== undefined ? dto.sprintId : current.sprintId,
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

// ─── HR (Кадры) ─────────────────────────────────────────────────────────────

function requireDirector(req, res, next) {
  if (req.user.role !== 'director') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Доступно только директору' });
    return;
  }
  next();
}

function loadEmployees() {
  ensureSeedEmployees(loadJson, saveJson, KEYS.employees);
  return loadHrEmployees(loadJson, KEYS.employees).map(normalizeEmployee);
}

function saveEmployees(employees) {
  saveJson(KEYS.employees, employees);
}

app.get('/api/v1/hr/employees', authMiddleware, (req, res) => {
  const { employmentType, department, status, search, page, perPage } = req.query;
  const items = filterEmployees(loadEmployees(), {
    employmentType,
    department,
    status,
    search,
  });
  res.json(paginate(items, Number(page) || 1, Number(perPage) || 100));
});

app.get('/api/v1/hr/stats', authMiddleware, (_req, res) => {
  res.json({ data: buildHrStats(loadEmployees()) });
});

app.get('/api/v1/hr/employees/:id', authMiddleware, (req, res) => {
  const employee = loadEmployees().find((e) => e.id === req.params.id);
  if (!employee) return notFound(res);
  res.json({ data: employee });
});

app.post('/api/v1/hr/employees', authMiddleware, requireDirector, (req, res) => {
  const dto = req.body ?? {};
  const now = new Date().toISOString();
  const validRoles = listUsers().map((user) => user.role);
  const employee = normalizeEmployee({
    id: crypto.randomUUID(),
    fullName: String(dto.fullName ?? '').trim(),
    position: String(dto.position ?? '').trim(),
    department: String(dto.department ?? '').trim(),
    employmentType: dto.employmentType === 'outsource' ? 'outsource' : 'staff',
    status: 'active',
    email: dto.email?.trim() || null,
    phone: dto.phone?.trim() || null,
    hiredAt: dto.hiredAt ?? now.slice(0, 10),
    paymentType: dto.paymentType === 'unpaid' ? 'unpaid' : 'paid',
    paymentNote: dto.paymentNote?.trim() || null,
    systemRole: dto.systemRole && validRoles.includes(dto.systemRole) ? dto.systemRole : null,
    accessBlocked: false,
    createdAt: now,
    updatedAt: now,
  });
  if (!employee.fullName || !employee.position || !employee.department) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'ФИО, должность и отдел обязательны' });
    return;
  }
  const employees = loadEmployees();
  employees.push(employee);
  saveEmployees(employees);
  res.status(201).json({ data: employee });
});

app.patch('/api/v1/hr/employees/:id', authMiddleware, requireDirector, (req, res) => {
  const employees = loadEmployees();
  const idx = employees.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return notFound(res);
  const current = employees[idx];
  const dto = req.body ?? {};
  const validRoles = listUsers().map((user) => user.role);
  employees[idx] = normalizeEmployee({
    ...current,
    ...dto,
    fullName: dto.fullName?.trim() ?? current.fullName,
    position: dto.position?.trim() ?? current.position,
    department: dto.department?.trim() ?? current.department,
    employmentType:
      dto.employmentType === 'outsource' || dto.employmentType === 'staff'
        ? dto.employmentType
        : current.employmentType,
    status: dto.status ?? current.status,
    email: dto.email !== undefined ? dto.email?.trim() || null : current.email,
    phone: dto.phone !== undefined ? dto.phone?.trim() || null : current.phone,
    paymentType:
      dto.paymentType === 'unpaid' || dto.paymentType === 'paid'
        ? dto.paymentType
        : current.paymentType,
    paymentNote: dto.paymentNote !== undefined ? dto.paymentNote?.trim() || null : current.paymentNote,
    systemRole:
      dto.systemRole === null
        ? null
        : dto.systemRole && validRoles.includes(dto.systemRole)
          ? dto.systemRole
          : current.systemRole,
    accessBlocked: dto.accessBlocked !== undefined ? dto.accessBlocked === true : current.accessBlocked,
    updatedAt: new Date().toISOString(),
  });
  saveEmployees(employees);
  res.json({ data: employees[idx] });
});

app.delete('/api/v1/hr/employees/:id', authMiddleware, requireDirector, (req, res) => {
  const employees = loadEmployees();
  const next = employees.filter((e) => e.id !== req.params.id);
  if (next.length === employees.length) return notFound(res);
  saveEmployees(next);
  res.status(204).end();
});

// ─── AI Assistant ───────────────────────────────────────────────────────────

app.post('/api/v1/assistant/chat', authMiddleware, async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Нужен массив messages' });
    return;
  }

  const sanitized = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .filter((m) => m.content.length > 0);

  if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== 'user') {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Последнее сообщение должно быть от user' });
    return;
  }

  try {
    const result = await runAssistantChat(sanitized, req.user);
    res.json({ data: result });
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(502).json({
      code: 'ASSISTANT_ERROR',
      message: err instanceof Error ? err.message : 'Ошибка AI-ассистента',
    });
  }
});

app.post('/api/v1/assistant/reset', authMiddleware, (req, res) => {
  clearStoredAgent(req.user.role);
  res.status(204).end();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`INCLAVE API listening on http://127.0.0.1:${PORT}`);
});
