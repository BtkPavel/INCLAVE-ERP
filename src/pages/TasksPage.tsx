import { useEffect, useMemo, useState } from 'react';
import type { Task, TaskStatus } from '../api/types/tasks';
import { useAuth } from '../auth/AuthContext';
import { setTasksAssignee } from '../backend/tasks/tasksService';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { TaskList } from '../features/tasks/components/TaskList';
import { TASK_FILTER_OPTIONS } from '../features/tasks/constants';
import { useTaskActions, useTasks, useTaskStats, useProjects } from '../hooks/useModuleApi';
import styles from './TasksPage.module.css';
import pageStyles from './ModulePage.module.css';

export function TasksPage() {
  const { user } = useAuth();
  const { version, create, update, complete, remove } = useTaskActions();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    if (user) {
      setTasksAssignee(user.role);
    }
  }, [user]);

  const statusFilter = filter === 'all' ? undefined : filter;
  const tasksState = useTasks(version, statusFilter);
  const statsState = useTaskStats(version);
  const projectsState = useProjects();

  const projectNames = useMemo(() => {
    if (projectsState.status !== 'success') return {};
    return Object.fromEntries(projectsState.data.data.map((p) => [p.id, p.name]));
  }, [projectsState]);

  const tasks =
    tasksState.status === 'success' ? tasksState.data.data : [];
  const stats = statsState.status === 'success' ? statsState.data.data : null;

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.header}>
        <span className={pageStyles.fig}>FIG 1.3</span>
        <h1 className={pageStyles.title}>Задачи</h1>
        <p className={pageStyles.subtitle}>
          {user
            ? `Задачи для ${user.name.toLowerCase()}: личные дела или работа по проектам`
            : 'Постановка и контроль исполнения задач'}
        </p>
      </header>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>всего</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.todo}</span>
            <span className={styles.statLabel}>к выполнению</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.inProgress}</span>
            <span className={styles.statLabel}>в работе</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.done}</span>
            <span className={styles.statLabel}>выполнено</span>
          </div>
          {stats.overdue > 0 && (
            <div className={`${styles.stat} ${styles.statDanger}`}>
              <span className={styles.statValue}>{stats.overdue}</span>
              <span className={styles.statLabel}>просрочено</span>
            </div>
          )}
        </div>
      )}

      <TaskForm
        key={editing?.id ?? 'new-task'}
        initial={editing}
        onCancel={editing ? () => setEditing(null) : undefined}
        onSubmit={async (dto) => {
          if (editing) {
            await update(editing.id, dto);
            setEditing(null);
          } else {
            await create(dto);
          }
        }}
      />

      <div className={styles.filters} role="tablist" aria-label="Фильтр задач">
        {TASK_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={`${styles.filterBtn} ${filter === option.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tasksState.status === 'loading' || tasksState.status === 'idle' ? (
        <div className={styles.loading}>Загрузка задач…</div>
      ) : tasksState.status === 'error' ? (
        <div className={styles.error} role="alert">
          {tasksState.error}
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          projectNames={projectNames}
          emptyText="Задач пока нет — создайте первую задачу выше"
          onComplete={complete}
          onStatusChange={(id, status) => update(id, { status })}
          onEdit={setEditing}
          onDelete={remove}
        />
      )}
    </div>
  );
}
