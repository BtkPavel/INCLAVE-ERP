import { KEYS, loadJson, saveJson } from './db.mjs';

const CURSOR_API = 'https://api.cursor.com/v1';
const POLL_MS = 2000;
const MAX_WAIT_MS = 120_000;

const TOOL_HELP = `
Доступные действия (верни блок erp_action при необходимости):
- create_task: { title, description?, dueDate? (YYYY-MM-DD), priority? }
- list_tasks: { status? }
- complete_task: { taskId }
- create_calendar_event: { title, startAt (ISO), endAt?, allDay?, type?, priority? }
- list_calendar_events: { from?, to? }

Формат действия (только когда нужно изменить данные ERP):
\`\`\`erp_action
{"tool":"create_task","args":{"title":"..."}}
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

Помогаешь с задачами и календарём предприятия INCLAVE.
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

function userTasks(role, status) {
  let tasks = loadTasks().filter((t) => t.assigneeId === role);
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
        projectId: null,
        assigneeId: user.role,
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
      const tasks = userTasks(user.role, args.status).slice(0, 20);
      return {
        ok: true,
        data: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
      };
    }
    case 'complete_task': {
      const tasks = loadTasks();
      const idx = tasks.findIndex(
        (t) => t.id === args.taskId && t.assigneeId === user.role,
      );
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
        projectId: null,
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
        .slice(0, 20)
        .map((e) => ({
          id: e.id,
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          type: e.type,
        }));
      return { ok: true, data };
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

  for (let round = 0; round < 3; round += 1) {
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
