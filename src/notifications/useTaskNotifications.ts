import { useEffect } from 'react';
import { tasksApi } from '../api/modules/tasks.api';
import type { Task } from '../api/types/tasks';
import { useAuth } from '../auth/AuthContext';
import {
  getNotificationState,
  showDirectorTaskAssignedNotification,
  showDirectorTaskCompletedNotification,
  showTaskAssignedNotification,
} from './notifications';

const POLL_INTERVAL_MS = 30_000;

interface TaskSnapshot {
  status: string;
  updatedAt: string;
}

type SnapshotMap = Record<string, TaskSnapshot>;

function loadSnapshot(key: string): SnapshotMap {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as SnapshotMap;
  } catch {
    return {};
  }
}

function saveSnapshot(key: string, snapshot: SnapshotMap): void {
  localStorage.setItem(key, JSON.stringify(snapshot));
}

function buildSnapshot(tasks: Task[]): SnapshotMap {
  return Object.fromEntries(
    tasks.map((task) => [task.id, { status: task.status, updatedAt: task.updatedAt }]),
  );
}

function processChanges(
  role: 'director' | 'product_office',
  tasks: Task[],
  previous: SnapshotMap,
  isInitial: boolean,
): void {
  if (isInitial) return;

  for (const task of tasks) {
    const old = previous[task.id];
    if (!old) {
      if (role === 'product_office') {
        showTaskAssignedNotification(task.title);
      } else {
        showDirectorTaskAssignedNotification(task.title);
      }
      continue;
    }

    if (role === 'director' && old.status !== 'done' && task.status === 'done') {
      showDirectorTaskCompletedNotification(task.title);
    }
  }
}

export function useTaskNotifications(): void {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'director' && user.role !== 'product_office') return;
    if (getNotificationState() !== 'granted') return;

    const storageKey = `inclave-task-snapshot-${user.role}`;
    let previous = loadSnapshot(storageKey);
    let isInitial = Object.keys(previous).length === 0;

    async function poll(): Promise<void> {
      try {
        const response = await tasksApi.list({
          perPage: 200,
          ...(user!.role === 'director' ? { assigneeId: 'product_office' } : {}),
        });
        const tasks = response.data;
        processChanges(user!.role as 'director' | 'product_office', tasks, previous, isInitial);
        previous = buildSnapshot(tasks);
        saveSnapshot(storageKey, previous);
        isInitial = false;
      } catch {
        // ignore polling errors
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [user]);
}
