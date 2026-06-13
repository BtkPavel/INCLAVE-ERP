import type { CreateTaskDto, Task, TaskStats, TaskStatus, UpdateTaskDto } from '../../../api/types/tasks';
import type { UserRole } from '../../../auth/users';

const STORAGE_KEY = 'inclave-erp-tasks';
const INITIALIZED_PREFIX = 'inclave-erp-tasks-initialized-';

function buildSeedTasks(assigneeId: UserRole): Task[] {
  const now = new Date();
  const ts = now.toISOString();
  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const inWeek = new Date(now);
  inWeek.setDate(inWeek.getDate() + 7);

  const seeds: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'assigneeId'>> = [
    {
      title: 'Подготовить отчёт за квартал',
      description: 'Собрать данные по проектам и финансам',
      status: 'todo',
      priority: 'high',
      projectId: null,
      dueDate: inThreeDays.toISOString().slice(0, 10),
    },
    {
      title: 'Согласовать договор с подрядчиком',
      description: null,
      status: 'in_progress',
      priority: 'medium',
      projectId: null,
      dueDate: inWeek.toISOString().slice(0, 10),
    },
  ];

  return seeds.map((item, index) => ({
    ...item,
    id: `seed-task-${assigneeId}-${index + 1}`,
    assigneeId,
    completedAt: null,
    createdAt: ts,
    updatedAt: ts,
  }));
}

function loadAll(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function saveAll(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function isInitialized(assigneeId: UserRole): boolean {
  return localStorage.getItem(`${INITIALIZED_PREFIX}${assigneeId}`) === '1';
}

function markInitialized(assigneeId: UserRole): void {
  localStorage.setItem(`${INITIALIZED_PREFIX}${assigneeId}`, '1');
}

/** Демо-задачи только при первом входе пользователя, не при пустом списке */
function ensureSeeded(assigneeId: UserRole): Task[] {
  if (isInitialized(assigneeId)) {
    return loadAll();
  }

  const tasks = loadAll();
  const hasMine = tasks.some((task) => task.assigneeId === assigneeId);

  if (!hasMine) {
    saveAll([...tasks, ...buildSeedTasks(assigneeId)]);
  }

  markInitialized(assigneeId);
  return loadAll();
}

function sortTasks(tasks: Task[]): Task[] {
  const statusOrder: Record<TaskStatus, number> = {
    in_progress: 0,
    review: 1,
    todo: 2,
    done: 3,
    cancelled: 4,
  };

  return [...tasks].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export const tasksStorage = {
  listForUser(assigneeId: UserRole, status?: TaskStatus): Task[] {
    const tasks = ensureSeeded(assigneeId).filter(
      (task) => task.assigneeId === assigneeId,
    );
    const filtered = status ? tasks.filter((task) => task.status === status) : tasks;
    return sortTasks(filtered);
  },

  create(assigneeId: UserRole, dto: CreateTaskDto): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      status: dto.status ?? 'todo',
      priority: dto.priority ?? 'medium',
      projectId: dto.projectId ?? null,
      assigneeId,
      dueDate: dto.dueDate ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const tasks = loadAll();
    tasks.push(task);
    saveAll(tasks);
    markInitialized(assigneeId);
    return task;
  },

  update(id: string, assigneeId: UserRole, dto: UpdateTaskDto): Task | null {
    const tasks = loadAll();
    const index = tasks.findIndex((task) => task.id === id && task.assigneeId === assigneeId);
    if (index === -1) return null;

    const current = tasks[index];
    const nextStatus = dto.status ?? current.status;
    const completedAt =
      nextStatus === 'done' && current.status !== 'done'
        ? new Date().toISOString()
        : nextStatus !== 'done'
          ? null
          : current.completedAt;

    const updated: Task = {
      ...current,
      ...dto,
      title: dto.title?.trim() ?? current.title,
      description:
        dto.description !== undefined ? dto.description.trim() || null : current.description,
      status: nextStatus,
      completedAt,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updated;
    saveAll(tasks);
    return updated;
  },

  complete(id: string, assigneeId: UserRole): Task | null {
    return this.update(id, assigneeId, { status: 'done' });
  },

  delete(id: string, assigneeId: UserRole): boolean {
    const tasks = loadAll();
    const next = tasks.filter(
      (task) => !(task.id === id && task.assigneeId === assigneeId),
    );
    if (next.length === tasks.length) return false;
    saveAll(next);
    return true;
  },

  stats(assigneeId: UserRole): TaskStats {
    const tasks = this.listForUser(assigneeId);
    const today = new Date().toISOString().slice(0, 10);

    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
      overdue: tasks.filter(
        (task) =>
          task.dueDate &&
          task.dueDate < today &&
          task.status !== 'done' &&
          task.status !== 'cancelled',
      ).length,
    };
  },

  listWithDueDate(assigneeId: UserRole): Task[] {
    return this.listForUser(assigneeId).filter(
      (task) => task.dueDate && task.status !== 'cancelled',
    );
  },
};
