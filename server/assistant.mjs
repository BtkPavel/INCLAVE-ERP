import { KEYS, loadJson, saveJson } from './db.mjs';
import { buildPaymentCalendar, buildSummary } from './finance.mjs';
import { buildHrStats, filterEmployees, loadEmployees as loadHrEmployees } from './hr.mjs';

const CURSOR_API = 'https://api.cursor.com/v1';
const POLL_MS = 2000;
const MAX_WAIT_MS = 120_000;
const MAX_TOOL_ROUNDS = 5;

const TOOL_HELP = `
Доступные действия (верни блок erp_action при необходимости):

Задачи:
- create_task: { title, description?, dueDate? (YYYY-MM-DD), priority? }
- list_tasks: { status?, assigneeId? }
- get_task_stats: {}
- complete_task: { taskId }
- update_task: { taskId, title?, status?, priority?, dueDate? }

Календарь:
- create_calendar_event: { title, startAt (ISO), endAt?, allDay?, type?, priority? }
- list_calendar_events: { from?, to? }
- delete_calendar_event: { eventId }

Проекты:
- list_projects: { category? (investment|current), status? }
- get_project_stats: {}
- create_project: { name, code, category?, status?, description?, budget? }

Финансы:
- get_finance_summary: {}
- list_transactions: { type? (income|expense), limit? }
- create_transaction: { type, amount, description, date (YYYY-MM-DD), category? }
- list_operational_expenses: {}
- create_operational_expense: { title, amount, startDate, billingStatus (one_time|cyclic), recurrence? }
- get_payment_calendar: { from (YYYY-MM-DD), to (YYYY-MM-DD) }

Кадры:
- get_hr_stats: {}
- list_employees: { employmentType? (staff|outsource), department?, status?, search? }
- create_employee: { fullName, position, department, employmentType?, hiredAt? }
- update_employee: { employeeId, fullName?, position?, department?, status?, employmentType? }

Формат действия (только когда нужно получить или изменить данные ERP):
\`\`\`erp_action
{"tool":"get_hr_stats","args":{}}
\`\`\`
Можно несколько блоков erp_action подряд. Иначе отвечай обычным текстом по-русски.
`.trim();

function getApiKey() {
  return process.env.CURSOR_API_KEY?.trim() || '';
}

function authHeaders() {
  const key = getApiKey();
  if (!key) return null;
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function loadAgentMap() {
  return loadJson(KEYS.assistantAgents, {});
}

function saveAgentMap(map) {
  saveJson(KEYS.assistantAgents, map);
}

function getStoredAgentId(role) {
  return loadAgentMap()[role] ?? null;
}

export function clearStoredAgent(role) {
  const map = loadAgentMap();
  delete map[role];
  saveAgentMap(map);
}

function setStoredAgentId(role, agentId) {
  const map = loadAgentMap();
  map[role] = agentId;
  saveAgentMap(map);
}

async function cursorRequest(method, path, body) {
  const headers = authHeaders();
  if (!headers) {
    throw new Error('CURSOR_API_KEY_MISSING');
  }

  const response = await fetch(`${CURSOR_API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || `Cursor API ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.code = payload?.error?.code;
    throw err;
  }

  return payload;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSystemPrompt(user) {
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `Ты — Клариса, женский AI-ассистент INCLAVE ERP.
Пользователь: ${user.name} (${user.title}, роль: ${user.role}).
Сегодня: ${today}.

Характер и стиль:
- Общайся тепло, заботливо и профессионально, на «вы».
- Говори от первого лица в женском роде («я помогла», «готова», «сделала», «рада помочь»).
- Будь лаконичной и деловой, без панибратства и без излишней эмоциональности.
- Представляйся как Клариса, если уместно.

У тебя полный доступ ко всем модулям INCLAVE ERP: задачи, календарь, проекты, финансы, кадры.
На вопросы о персонале, финансах и проектах отвечай через erp_action — не говори, что доступа нет.
${TOOL_HELP}`;
}

function parseErpActions(text) {
  if (!text) return [];
  const calls = [];
  const re = /```erp_action\s*([\s\S]*?)```/gi;
  let match;
  while ((match = re.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed?.tool) {
        calls.push({ tool: parsed.tool, args: parsed.args ?? {} });
      }
    } catch {
      // skip invalid blocks
    }
  }
  return calls;
}

function stripErpActions(text) {
  return text.replace(/```erp_action[\s\S]*?```/gi, '').trim();
}

function unwrapRun(payload) {
  return payload?.run ?? payload;
}

async function waitForRun(agentId, runId) {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const run = unwrapRun(
      await cursorRequest('GET', `/agents/${agentId}/runs/${runId}`),
    );
    const status = run?.status;

    if (status === 'FINISHED') {
      return run.result || run.summary || 'Готово.';
    }
    if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
      throw new Error(`Cursor run ${status?.toLowerCase() ?? 'failed'}`);
    }

    await sleep(POLL_MS);
  }

  throw new Error('Cursor не ответил вовремя. Попробуйте ещё раз.');
}

async function createAgent(promptText, user) {
  const payload = await cursorRequest('POST', '/agents', {
    prompt: { text: promptText },
    model: { id: process.env.CURSOR_MODEL?.trim() || 'auto' },
    name: `Клариса · ${user.role}`.slice(0, 100),
  });
  return payload;
}

async function createRun(agentId, promptText) {
  try {
    const payload = await cursorRequest('POST', `/agents/${agentId}/runs`, {
      prompt: { text: promptText },
    });
    return unwrapRun(payload);
  } catch (err) {
    if (err.status === 404) {
      err.code = 'AGENT_NOT_FOUND';
    }
    if (err.status === 409) {
      err.code = 'AGENT_BUSY';
    }
    throw err;
  }
}

// ─── ERP tools (local) ───────────────────────────────────────────────────────

function loadTasks() {
  return loadJson(KEYS.tasks, []);
}

function saveTasks(tasks) {
  saveJson(KEYS.tasks, tasks);
}

function loadEvents() {
  return loadJson(KEYS.events, []);
}

function saveEvents(events) {
  saveJson(KEYS.events, events);
}

function loadProjects() {
  return loadJson(KEYS.projects, []);
}

function saveProjects(projects) {
  saveJson(KEYS.projects, projects);
}

function loadTransactions() {
  return loadJson(KEYS.transactions, []);
}

function saveTransactions(transactions) {
  saveJson(KEYS.transactions, transactions);
}

function loadFinanceSettings() {
  const stored = loadJson(KEYS.settings, null);
  return { incomeTaxBase: stored?.incomeTaxBase ?? 'profit' };
}

function loadExpenses() {
  return loadJson(KEYS.expenses, []);
}

function saveExpenses(expenses) {
  saveJson(KEYS.expenses, expenses);
}

function loadEmployees() {
  return loadHrEmployees(loadJson, KEYS.employees);
}

function saveEmployees(employees) {
  saveJson(KEYS.employees, employees);
}

function tasksForAssistant(user, status, assigneeId) {
  let tasks = loadTasks();
  if (assigneeId) {
    tasks = tasks.filter((t) => t.assigneeId === assigneeId);
  } else if (user.role !== 'director') {
    tasks = tasks.filter((t) => t.assigneeId === user.role);
  }
  if (status) tasks = tasks.filter((t) => t.status === status);
  return tasks;
}

function filterEvents(events, from, to) {
  return events.filter((e) => {
    const start = new Date(e.startAt).getTime();
    if (from && start < new Date(from).getTime()) return false;
    if (to && start > new Date(to).getTime()) return false;
    return true;
  });
}

function executeTool(name, args, user) {
  switch (name) {
    case 'create_task': {
      const now = new Date().toISOString();
      const task = {
        id: crypto.randomUUID(),
        title: String(args.title ?? '').trim(),
        description: args.description?.trim() || null,
        status: 'todo',
        priority: args.priority ?? 'medium',
        projectId: args.projectId ?? null,
        assigneeId: args.assigneeId ?? user.role,
        dueDate: args.dueDate ?? null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      if (!task.title) return { ok: false, error: 'Нужно название задачи' };
      const tasks = loadTasks();
      tasks.push(task);
      saveTasks(tasks);
      return { ok: true, data: task };
    }
    case 'list_tasks': {
      const tasks = tasksForAssistant(user, args.status, args.assigneeId).slice(0, 30);
      return {
        ok: true,
        data: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          assigneeId: t.assigneeId,
        })),
      };
    }
    case 'get_task_stats': {
      const tasks = tasksForAssistant(user);
      const today = new Date().toISOString().slice(0, 10);
      return {
        ok: true,
        data: {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === 'todo').length,
          inProgress: tasks.filter((t) => t.status === 'in_progress').length,
          done: tasks.filter((t) => t.status === 'done').length,
          overdue: tasks.filter(
            (t) => t.dueDate && t.dueDate < today && t.status !== 'done' && t.status !== 'cancelled',
          ).length,
        },
      };
    }
    case 'complete_task': {
      const tasks = loadTasks();
      const idx = tasks.findIndex((t) => {
        if (t.id !== args.taskId) return false;
        return user.role === 'director' || t.assigneeId === user.role;
      });
      if (idx === -1) return { ok: false, error: 'Задача не найдена' };
      tasks[idx] = {
        ...tasks[idx],
        status: 'done',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveTasks(tasks);
      return { ok: true, data: tasks[idx] };
    }
    case 'update_task': {
      const tasks = loadTasks();
      const idx = tasks.findIndex((t) => {
        if (t.id !== args.taskId) return false;
        return user.role === 'director' || t.assigneeId === user.role;
      });
      if (idx === -1) return { ok: false, error: 'Задача не найдена' };
      const current = tasks[idx];
      const nextStatus = args.status ?? current.status;
      tasks[idx] = {
        ...current,
        title: args.title?.trim() ?? current.title,
        status: nextStatus,
        priority: args.priority ?? current.priority,
        dueDate: args.dueDate !== undefined ? args.dueDate : current.dueDate,
        completedAt:
          nextStatus === 'done' && current.status !== 'done'
            ? new Date().toISOString()
            : nextStatus !== 'done'
              ? null
              : current.completedAt,
        updatedAt: new Date().toISOString(),
      };
      saveTasks(tasks);
      return { ok: true, data: tasks[idx] };
    }
    case 'create_calendar_event': {
      const now = new Date().toISOString();
      const event = {
        id: crypto.randomUUID(),
        title: String(args.title ?? '').trim(),
        description: args.description?.trim() || null,
        type: args.type ?? 'meeting',
        priority: args.priority ?? 'medium',
        startAt: args.startAt,
        endAt: args.endAt || args.startAt,
        allDay: args.allDay ?? false,
        reminderMinutes: null,
        projectId: args.projectId ?? null,
        createdBy: user.role,
        createdAt: now,
        updatedAt: now,
      };
      if (!event.title) return { ok: false, error: 'Нужно название события' };
      const events = loadEvents();
      events.push(event);
      saveEvents(events);
      return { ok: true, data: event };
    }
    case 'list_calendar_events': {
      const from = args.from || new Date().toISOString();
      const to =
        args.to || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      const data = filterEvents(loadEvents(), from, to)
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
        .slice(0, 30)
        .map((e) => ({
          id: e.id,
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          type: e.type,
        }));
      return { ok: true, data };
    }
    case 'delete_calendar_event': {
      const events = loadEvents();
      const next = events.filter((e) => e.id !== args.eventId);
      if (next.length === events.length) return { ok: false, error: 'Событие не найдено' };
      saveEvents(next);
      return { ok: true, data: { deleted: args.eventId } };
    }
    case 'list_projects': {
      let projects = loadProjects();
      if (args.category) projects = projects.filter((p) => p.category === args.category);
      if (args.status) projects = projects.filter((p) => p.status === args.status);
      return {
        ok: true,
        data: projects.slice(0, 30).map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category,
          status: p.status,
          budget: p.budget,
        })),
      };
    }
    case 'get_project_stats': {
      const projects = loadProjects();
      return {
        ok: true,
        data: {
          total: projects.length,
          active: projects.filter((p) => p.status === 'active').length,
          completed: projects.filter((p) => p.status === 'completed').length,
          onHold: projects.filter((p) => p.status === 'on_hold').length,
          investment: projects.filter((p) => p.category === 'investment').length,
          current: projects.filter((p) => p.category === 'current').length,
        },
      };
    }
    case 'create_project': {
      const now = new Date().toISOString();
      const project = {
        id: crypto.randomUUID(),
        name: String(args.name ?? '').trim(),
        code: String(args.code ?? '').trim(),
        description: args.description?.trim() || null,
        category: args.category === 'current' ? 'current' : 'investment',
        status: args.status ?? 'draft',
        startDate: args.startDate ?? null,
        endDate: args.endDate ?? null,
        budget: args.budget ?? null,
        managerId: args.managerId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      if (!project.name || !project.code) {
        return { ok: false, error: 'Нужны название и код проекта' };
      }
      const projects = loadProjects();
      projects.push(project);
      saveProjects(projects);
      return { ok: true, data: project };
    }
    case 'get_finance_summary': {
      return {
        ok: true,
        data: buildSummary(loadFinanceSettings(), loadTransactions()),
      };
    }
    case 'list_transactions': {
      let items = loadTransactions();
      if (args.type) items = items.filter((t) => t.type === args.type);
      const limit = Math.min(Number(args.limit) || 20, 50);
      return {
        ok: true,
        data: items.slice(-limit).reverse().map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          description: t.description,
          date: t.date,
          category: t.category,
        })),
      };
    }
    case 'create_transaction': {
      const transaction = {
        id: crypto.randomUUID(),
        type: args.type,
        amount: Number(args.amount),
        currency: args.currency ?? 'BYN',
        accountId: 'main',
        counterpartyAccountId: null,
        description: String(args.description ?? '').trim(),
        category: args.category?.trim() || null,
        projectId: null,
        date: args.date,
        createdAt: new Date().toISOString(),
      };
      if (!transaction.type || !transaction.amount || !transaction.date) {
        return { ok: false, error: 'Нужны type, amount и date' };
      }
      const transactions = loadTransactions();
      transactions.push(transaction);
      saveTransactions(transactions);
      return { ok: true, data: transaction };
    }
    case 'list_operational_expenses': {
      return {
        ok: true,
        data: loadExpenses().slice(0, 30).map((e) => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          currency: e.currency,
          billingStatus: e.billingStatus,
          recurrence: e.recurrence,
          startDate: e.startDate,
        })),
      };
    }
    case 'create_operational_expense': {
      const now = new Date().toISOString();
      const billingStatus = args.billingStatus;
      const expense = {
        id: crypto.randomUUID(),
        title: String(args.title ?? '').trim(),
        amount: Number(args.amount),
        currency: args.currency ?? 'BYN',
        category: args.category?.trim() || null,
        startDate: args.startDate,
        billingStatus,
        recurrence: billingStatus === 'cyclic' ? (args.recurrence ?? 'monthly') : null,
        createdAt: now,
        updatedAt: now,
      };
      if (!expense.title || !expense.amount || !expense.startDate || !billingStatus) {
        return { ok: false, error: 'Нужны title, amount, startDate и billingStatus' };
      }
      const expenses = loadExpenses();
      expenses.push(expense);
      saveExpenses(expenses);
      return { ok: true, data: expense };
    }
    case 'get_payment_calendar': {
      const from = args.from;
      const to = args.to;
      if (!from || !to) return { ok: false, error: 'Нужны from и to (YYYY-MM-DD)' };
      return {
        ok: true,
        data: buildPaymentCalendar(loadExpenses(), { from, to }).slice(0, 40),
      };
    }
    case 'get_hr_stats': {
      return { ok: true, data: buildHrStats(loadEmployees()) };
    }
    case 'list_employees': {
      const data = filterEmployees(loadEmployees(), {
        employmentType: args.employmentType,
        department: args.department,
        status: args.status,
        search: args.search,
      })
        .slice(0, 40)
        .map((e) => ({
          id: e.id,
          fullName: e.fullName,
          position: e.position,
          department: e.department,
          employmentType: e.employmentType,
          status: e.status,
        }));
      return { ok: true, data };
    }
    case 'create_employee': {
      const now = new Date().toISOString();
      const employee = {
        id: crypto.randomUUID(),
        fullName: String(args.fullName ?? '').trim(),
        position: String(args.position ?? '').trim(),
        department: String(args.department ?? '').trim(),
        employmentType: args.employmentType === 'outsource' ? 'outsource' : 'staff',
        status: 'active',
        email: args.email?.trim() || null,
        phone: args.phone?.trim() || null,
        hiredAt: args.hiredAt ?? now.slice(0, 10),
        createdAt: now,
        updatedAt: now,
      };
      if (!employee.fullName || !employee.position || !employee.department) {
        return { ok: false, error: 'Нужны fullName, position и department' };
      }
      const employees = loadEmployees();
      employees.push(employee);
      saveEmployees(employees);
      return { ok: true, data: employee };
    }
    case 'update_employee': {
      const employees = loadEmployees();
      const idx = employees.findIndex((e) => e.id === args.employeeId);
      if (idx === -1) return { ok: false, error: 'Сотрудник не найден' };
      const current = employees[idx];
      employees[idx] = {
        ...current,
        fullName: args.fullName?.trim() ?? current.fullName,
        position: args.position?.trim() ?? current.position,
        department: args.department?.trim() ?? current.department,
        employmentType:
          args.employmentType === 'outsource' || args.employmentType === 'staff'
            ? args.employmentType
            : current.employmentType,
        status: args.status ?? current.status,
        updatedAt: new Date().toISOString(),
      };
      saveEmployees(employees);
      return { ok: true, data: employees[idx] };
    }
    default:
      return { ok: false, error: `Неизвестный инструмент: ${name}` };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function runAssistantChat(inputMessages, user) {
  if (!getApiKey()) {
    return {
      message:
        'AI на Cursor не настроен. Добавьте CURSOR_API_KEY в server/.env (ключ: cursor.com/dashboard → Integrations → API Keys) и перезапустите API.',
      actions: [],
    };
  }

  const lastUser = [...inputMessages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    throw new Error('Нет сообщения пользователя');
  }

  const actions = [];
  let agentId = getStoredAgentId(user.role);
  let run;

  const isNewThread = inputMessages.filter((m) => m.role === 'user').length <= 1;

  try {
    if (!agentId || isNewThread) {
      const prompt = `${buildSystemPrompt(user)}\n\nПользователь: ${lastUser.content}`;
      const created = await createAgent(prompt, user);
      agentId = created.agent.id;
      run = created.run;
      setStoredAgentId(user.role, agentId);
    } else {
      run = await createRun(agentId, lastUser.content);
    }
  } catch (err) {
    if (err.code === 'AGENT_NOT_FOUND' || err.code === 'AGENT_BUSY') {
      clearStoredAgent(user.role);
      const prompt = `${buildSystemPrompt(user)}\n\nПользователь: ${lastUser.content}`;
      const created = await createAgent(prompt, user);
      agentId = created.agent.id;
      run = created.run;
      setStoredAgentId(user.role, agentId);
    } else {
      throw err;
    }
  }

  let resultText = await waitForRun(agentId, run.id);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const calls = parseErpActions(resultText);
    if (calls.length === 0) break;

    const results = calls.map((call) => {
      const result = executeTool(call.tool, call.args, user);
      actions.push({ tool: call.tool, args: call.args, result });
      return { tool: call.tool, result };
    });

    const followUp = `Результаты действий в ERP:\n${JSON.stringify(results, null, 2)}\n\nКратко ответь пользователю по-русски.`;
    const followRun = await createRun(agentId, followUp);
    resultText = await waitForRun(agentId, followRun.id);
  }

  const message = stripErpActions(resultText) || resultText || 'Готово.';

  return { message, actions };
}
