/**
 * INCLAVE ERP — API Architecture
 *
 * REST API v1, префикс: /api/v1
 *
 * Слои:
 *   UI (pages) → hooks → modules/*.api.ts → client.ts → backend
 *
 * Модули:
 *   auth      — аутентификация
 *   projects  — проекты
 *   calendar  — календарь
 *   tasks     — задачи
 *   finance   — финансы
 *   hr        — кадры
 */

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}`;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
}

export interface ApiModuleDefinition {
  name: string;
  basePath: string;
  description: string;
  endpoints: Record<string, ApiEndpoint>;
}

function ep(
  method: HttpMethod,
  path: string,
  description: string,
): ApiEndpoint {
  return { method, path, description };
}

export const API_MODULES = {
  auth: {
    name: 'auth',
    basePath: `${API_PREFIX}/auth`,
    description: 'Аутентификация и сессии',
    endpoints: {
      login: ep('POST', '/login', 'Вход по роли и паролю'),
      logout: ep('POST', '/logout', 'Завершение сессии'),
      me: ep('GET', '/me', 'Текущий пользователь'),
      users: ep('GET', '/users', 'Пользователи с доступом к системе'),
      refresh: ep('POST', '/refresh', 'Обновление токена'),
    },
  },

  projects: {
    name: 'projects',
    basePath: `${API_PREFIX}/projects`,
    description: 'Управление проектами',
    endpoints: {
      list: ep('GET', '/', 'Список проектов с фильтрами'),
      get: ep('GET', '/:id', 'Проект по ID'),
      create: ep('POST', '/', 'Создание проекта'),
      update: ep('PATCH', '/:id', 'Обновление проекта'),
      delete: ep('DELETE', '/:id', 'Удаление проекта'),
      members: ep('GET', '/:id/members', 'Участники проекта'),
      addMember: ep('POST', '/:id/members', 'Добавить участника'),
      removeMember: ep('DELETE', '/:id/members/:userId', 'Удалить участника'),
      stats: ep('GET', '/stats', 'Сводная статистика по проектам'),
    },
  },

  calendar: {
    name: 'calendar',
    basePath: `${API_PREFIX}/calendar`,
    description: 'Календарь и события',
    endpoints: {
      listEvents: ep('GET', '/events', 'События за период'),
      getEvent: ep('GET', '/events/:id', 'Событие по ID'),
      createEvent: ep('POST', '/events', 'Создание события'),
      updateEvent: ep('PATCH', '/events/:id', 'Обновление события'),
      deleteEvent: ep('DELETE', '/events/:id', 'Удаление события'),
      upcoming: ep('GET', '/events/upcoming', 'Ближайшие события'),
    },
  },

  tasks: {
    name: 'tasks',
    basePath: `${API_PREFIX}/tasks`,
    description: 'Задачи и исполнение',
    endpoints: {
      list: ep('GET', '/', 'Список задач с фильтрами'),
      get: ep('GET', '/:id', 'Задача по ID'),
      create: ep('POST', '/', 'Создание задачи'),
      update: ep('PATCH', '/:id', 'Обновление задачи'),
      delete: ep('DELETE', '/:id', 'Удаление задачи'),
      complete: ep('POST', '/:id/complete', 'Отметить выполненной'),
      assign: ep('POST', '/:id/assign', 'Назначить исполнителя'),
      byProject: ep('GET', '/by-project/:projectId', 'Задачи проекта'),
      stats: ep('GET', '/stats', 'Статистика задач'),
    },
  },

  finance: {
    name: 'finance',
    basePath: `${API_PREFIX}/finance`,
    description: 'Финансы и учёт',
    endpoints: {
      accounts: ep('GET', '/accounts', 'Список счетов'),
      getAccount: ep('GET', '/accounts/:id', 'Счёт по ID'),
      createAccount: ep('POST', '/accounts', 'Создание счёта'),
      transactions: ep('GET', '/transactions', 'Операции за период'),
      getTransaction: ep('GET', '/transactions/:id', 'Операция по ID'),
      createTransaction: ep('POST', '/transactions', 'Новая операция'),
      updateTransaction: ep('PATCH', '/transactions/:id', 'Обновление операции'),
      deleteTransaction: ep('DELETE', '/transactions/:id', 'Удаление операции'),
      budgets: ep('GET', '/budgets', 'Бюджеты'),
      getBudget: ep('GET', '/budgets/:id', 'Бюджет по ID'),
      createBudget: ep('POST', '/budgets', 'Создание бюджета'),
      summary: ep('GET', '/summary', 'Финансовая сводка'),
      reports: ep('GET', '/reports', 'Отчёты'),
      taxes: ep('GET', '/taxes', 'Налоговые записи (6% от прибыли при режиме «доход на прибыль»)'),
      operationalExpenses: ep('GET', '/operational-expenses', 'Операционные расходы'),
      createOperationalExpense: ep('POST', '/operational-expenses', 'Создание операционного расхода'),
      updateOperationalExpense: ep('PATCH', '/operational-expenses/:id', 'Обновление операционного расхода'),
      deleteOperationalExpense: ep('DELETE', '/operational-expenses/:id', 'Удаление операционного расхода'),
      paymentCalendar: ep('GET', '/payment-calendar', 'Платежный календарь'),
    },
  },

  hr: {
    name: 'hr',
    basePath: `${API_PREFIX}/hr`,
    description: 'Кадры и персонал',
    endpoints: {
      list: ep('GET', '/employees', 'Список сотрудников'),
      get: ep('GET', '/employees/:id', 'Сотрудник по ID'),
      create: ep('POST', '/employees', 'Добавление сотрудника'),
      update: ep('PATCH', '/employees/:id', 'Обновление сотрудника'),
      delete: ep('DELETE', '/employees/:id', 'Удаление сотрудника'),
      stats: ep('GET', '/stats', 'Сводная статистика по сотрудникам'),
    },
  },

  assistant: {
    name: 'assistant',
    basePath: `${API_PREFIX}/assistant`,
    description: 'AI-ассистент (Cursor)',
    endpoints: {
      chat: ep('POST', '/chat', 'Диалог с ассистентом'),
      reset: ep('POST', '/reset', 'Сброс сессии Cursor'),
    },
  },
} as const satisfies Record<string, ApiModuleDefinition>;

export type ApiModuleName = keyof typeof API_MODULES;

export function buildUrl(
  module: ApiModuleName,
  endpointKey: string,
  params?: Record<string, string>,
): string {
  const mod = API_MODULES[module];
  const endpoints = mod.endpoints as Record<string, ApiEndpoint>;
  const endpoint = endpoints[endpointKey];
  if (!endpoint) {
    throw new Error(`Unknown endpoint: ${module}.${endpointKey}`);
  }

  let path = endpoint.path;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  return `${mod.basePath}${path === '/' ? '' : path}`;
}
