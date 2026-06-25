import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { authApi } from '../../../api/modules/auth.api';
import { projectsApi } from '../../../api/modules/projects.api';
import { tasksApi } from '../../../api/modules/tasks.api';
import type { Project } from '../../../api/types/projects';
import type { Sprint } from '../../../api/types/sprints';
import type { Task, TaskStatus } from '../../../api/types/tasks';
import type { UserRole } from '../../../auth/users';
import { useAuth } from '../../../auth/AuthContext';
import { ApiError } from '../../../api/errors';
import { TASK_STATUS_LABELS } from '../../tasks/constants';
import { TaskPriorityBadge } from '../../tasks/components/TaskPriorityBadge';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';
import { SprintReviewModal } from './SprintReviewModal';
import styles from './ScrumWorkspace.module.css';

interface ScrumWorkspaceProps {
  project: Project;
  canEdit: boolean;
}

type Tab = 'backlog' | 'sprints' | 'board';

const BOARD_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'К выполнению' },
  { status: 'in_progress', label: 'В работе' },
  { status: 'done', label: 'Готово' },
];

const SPRINT_STATUS_LABELS: Record<Sprint['status'], string> = {
  planned: 'Запланирован',
  active: 'Активный',
  completed: 'Завершён',
};

const ASSIGNEE_LABELS: Record<string, string> = {
  director: 'Директор',
  accountant: 'Бухгалтер',
  product_office: 'Product Office',
};

function assigneeLabel(assigneeId: string | null): string {
  if (!assigneeId) return 'Общая';
  return ASSIGNEE_LABELS[assigneeId] ?? assigneeId;
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

function nextBoardStatus(current: TaskStatus): TaskStatus {
  if (current === 'todo') return 'in_progress';
  if (current === 'in_progress' || current === 'review') return 'done';
  return 'todo';
}

export function ScrumWorkspace({ project, canEdit }: ScrumWorkspaceProps) {
  const { user } = useAuth();
  const isDirector = user?.role === 'director';
  const [tab, setTab] = useState<Tab>('backlog');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sprintTaskCounts, setSprintTaskCounts] = useState<Record<string, number>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reviewingSprint, setReviewingSprint] = useState<Sprint | null>(null);
  const [assignees, setAssignees] = useState<Array<{ role: UserRole; name: string }>>([]);

  const activeSprint = sprints.find((s) => s.status === 'active');
  const plannedSprints = sprints.filter((s) => s.status === 'planned');
  const completedSprints = sprints.filter((s) => s.status === 'completed');
  const openSprints = sprints.filter((s) => s.status !== 'completed');
  const assignableSprints = activeSprint
    ? [activeSprint, ...plannedSprints]
    : plannedSprints;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sprintsRes = await projectsApi.listSprints(project.id);
      const sprintList = sprintsRes.data;
      setSprints(sprintList);
      const active = sprintList.find((s) => s.status === 'active');

      const [backlogRes, boardRes, allTasksRes] = await Promise.all([
        projectsApi.listTasks(project.id, 'backlog'),
        active
          ? projectsApi.listTasks(project.id, active.id)
          : Promise.resolve({ data: [] as Task[] }),
        projectsApi.listTasks(project.id),
      ]);
      setBacklogTasks(backlogRes.data);
      setBoardTasks(boardRes.data);
      const counts: Record<string, number> = {};
      for (const sprint of sprintList) {
        counts[sprint.id] = allTasksRes.data.filter((t) => t.sprintId === sprint.id).length;
      }
      setSprintTaskCounts(counts);
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось загрузить данные спринта');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void authApi
      .listUsers()
      .then((res) => setAssignees(res.data.map((user) => ({ role: user.role, name: user.name }))))
      .catch(() => setAssignees([]));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleAssignTask(taskId: string, assigneeId: UserRole) {
    setBusy(true);
    try {
      await tasksApi.assign(taskId, { assigneeId });
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось назначить исполнителя');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTask(id: string, dto: Parameters<typeof tasksApi.update>[1]) {
    await tasksApi.update(id, dto);
    await reload();
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      await tasksApi.create({ title, projectId: project.id, sprintId: null });
      setNewTaskTitle('');
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось создать задачу');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddToSprint(taskId: string, sprintId: string, taskTitle: string) {
    setBusy(true);
    setNotice(null);
    try {
      await tasksApi.update(taskId, { sprintId });
      const sprint = assignableSprints.find((s) => s.id === sprintId);
      if (sprint?.status === 'active') {
        setNotice(`«${taskTitle}» добавлена в ${sprint.name}. Откройте вкладку «Доска спринта».`);
      } else {
        setNotice(
          `«${taskTitle}» добавлена в ${sprint?.name ?? 'спринт'}. Запустите спринт на вкладке «Спринты».`,
        );
      }
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось добавить в спринт');
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveToBacklog(taskId: string) {
    setBusy(true);
    try {
      await tasksApi.update(taskId, { sprintId: null, status: 'todo' });
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось вернуть в бэклог');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBacklogTask(task: Task) {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;

    setBusy(true);
    setError(null);
    try {
      await tasksApi.delete(task.id);
      if (editingTask?.id === task.id) {
        setEditingTask(null);
      }
      setNotice(`Задача «${task.title}» удалена`);
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось удалить задачу');
    } finally {
      setBusy(false);
    }
  }

  async function handleBoardStatus(task: Task) {
    if (!canEdit) return;
    const next = nextBoardStatus(task.status);
    setBusy(true);
    try {
      await tasksApi.update(task.id, { status: next });
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось обновить статус');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSprint(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await projectsApi.createSprint(project.id, {
        goal: newSprintGoal.trim() || undefined,
      });
      setNewSprintGoal('');
      setTab('sprints');
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось создать спринт');
    } finally {
      setBusy(false);
    }
  }

  async function handleStartSprint(sprintId: string) {
    setBusy(true);
    try {
      await projectsApi.startSprint(project.id, sprintId);
      setTab('board');
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось запустить спринт');
    } finally {
      setBusy(false);
    }
  }

  async function handleCompleteSprint(sprintId: string) {
    setBusy(true);
    try {
      await projectsApi.completeSprint(project.id, sprintId);
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось завершить спринт');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSprint(sprint: Sprint) {
    const taskCount = sprintTaskCounts[sprint.id] ?? 0;
    const message =
      taskCount > 0
        ? `Удалить ${sprint.name}? ${taskCount} задач вернутся в бэклог.`
        : `Удалить ${sprint.name}?`;
    if (!window.confirm(message)) return;

    setBusy(true);
    setError(null);
    try {
      await projectsApi.deleteSprint(project.id, sprint.id);
      if (tab === 'board' && activeSprint?.id === sprint.id) {
        setTab('sprints');
      }
      if (reviewingSprint?.id === sprint.id) {
        setReviewingSprint(null);
      }
      setNotice(`Спринт «${sprint.name}» удалён`);
      await reload();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось удалить спринт');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка Scrum-пространства…</div>;
  }

  return (
    <section className={styles.workspace}>
      <header className={styles.intro}>
        <div>
          <h2 className={styles.heading}>Scrum</h2>
          <p className={styles.hint}>
            Бэклог продукта → планирование спринта → доска спринта. Спринт длится{' '}
            {project.sprintWeeks ?? 2} нед. — один активный спринт за раз.
          </p>
        </div>
        {activeSprint && (
          <div className={styles.activeBadge}>
            <span className={styles.activeLabel}>Активный спринт</span>
            <strong>{activeSprint.name}</strong>
            <span className={styles.activeDates}>
              {formatDate(activeSprint.startDate)} — {formatDate(activeSprint.endDate)}
            </span>
          </div>
        )}
      </header>

      <nav className={styles.tabs} aria-label="Scrum разделы">
        <button
          type="button"
          className={tab === 'backlog' ? styles.tabActive : styles.tab}
          onClick={() => setTab('backlog')}
        >
          Бэклог
          {backlogTasks.length > 0 && <span className={styles.tabCount}>{backlogTasks.length}</span>}
        </button>
        <button
          type="button"
          className={tab === 'sprints' ? styles.tabActive : styles.tab}
          onClick={() => setTab('sprints')}
        >
          Спринты
          {sprints.length > 0 && <span className={styles.tabCount}>{sprints.length}</span>}
        </button>
        <button
          type="button"
          className={tab === 'board' ? styles.tabActive : styles.tab}
          onClick={() => setTab('board')}
          disabled={!activeSprint}
        >
          Доска спринта
        </button>
      </nav>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {tab === 'backlog' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Бэклог продукта</h3>
            <ol className={styles.steps}>
              <li className={assignableSprints.length > 0 ? styles.stepDone : undefined}>
                Запланируйте спринт на вкладке «Спринты»
              </li>
              <li>У задачи выберите «В спринт…»</li>
              <li>Запустите спринт — задачи появятся на «Доске спринта»</li>
            </ol>
          </div>

          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}

          {canEdit && (
            <form className={styles.addForm} onSubmit={handleCreateTask}>
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Новая задача для бэклога…"
                disabled={busy}
              />
              <button type="submit" className={styles.primaryBtn} disabled={busy || !newTaskTitle.trim()}>
                Добавить
              </button>
            </form>
          )}

          {backlogTasks.length === 0 ? (
            <p className={styles.empty}>Бэклог пуст. Добавьте первую задачу.</p>
          ) : (
            <ul className={styles.taskList}>
              {backlogTasks.map((task) => (
                <li key={task.id} className={styles.taskItem}>
                  <button
                    type="button"
                    className={styles.taskOpen}
                    onClick={() => setEditingTask(task)}
                  >
                    <span className={styles.taskTitle}>{task.title}</span>
                    {task.description && (
                      <span className={styles.taskDescPreview}>{task.description}</span>
                    )}
                    <span className={styles.taskMeta}>
                      <TaskPriorityBadge priority={task.priority} /> · {TASK_STATUS_LABELS[task.status]} ·{' '}
                      {assigneeLabel(task.assigneeId)}
                    </span>
                  </button>
                  {canEdit && assignableSprints.length > 0 ? (
                    <label className={styles.sprintAssign}>
                      <span className={styles.sprintAssignLabel}>В спринт</span>
                      <select
                        className={styles.sprintSelect}
                        defaultValue=""
                        disabled={busy}
                        aria-label={`Добавить «${task.title}» в спринт`}
                        onChange={(e) => {
                          const sprintId = e.target.value;
                          if (sprintId) void handleAddToSprint(task.id, sprintId, task.title);
                          e.target.value = '';
                        }}
                      >
                        <option value="">Выберите…</option>
                        {assignableSprints.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                            {s.status === 'active' ? ' (активный)' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : canEdit ? (
                    <span className={styles.sprintHint}>Сначала запланируйте спринт →</span>
                  ) : null}
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.deleteTaskBtn}
                      disabled={busy}
                      onClick={() => void handleDeleteBacklogTask(task)}
                    >
                      Удалить
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'sprints' && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Спринты</h3>
            <p>Задайте цель спринта, затем запустите — задачи из бэклога попадут на доску.</p>
          </div>

          {canEdit && !activeSprint && (
            <form className={styles.sprintForm} onSubmit={handleCreateSprint}>
              <label className={styles.sprintGoalField}>
                <span>Цель спринта</span>
                <input
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder={`Например: выпустить MVP за ${project.sprintWeeks ?? 2} нед.`}
                  disabled={busy}
                />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={busy}>
                + Запланировать спринт
              </button>
            </form>
          )}

          {openSprints.length === 0 && completedSprints.length === 0 ? (
            <p className={styles.empty}>Спринтов ещё нет. Запланируйте первый.</p>
          ) : (
            <>
              {openSprints.length > 0 && (
                <ul className={styles.sprintList}>
                  {openSprints.map((sprint) => (
                    <li key={sprint.id} className={styles.sprintCard}>
                      <div className={styles.sprintTop}>
                        <strong>{sprint.name}</strong>
                        <span className={`${styles.sprintStatus} ${styles[`sprint_${sprint.status}`]}`}>
                          {SPRINT_STATUS_LABELS[sprint.status]}
                        </span>
                      </div>
                      <p className={styles.sprintGoal}>{sprint.goal}</p>
                      <p className={styles.sprintDates}>
                        {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                      </p>
                      {(sprintTaskCounts[sprint.id] ?? 0) > 0 && (
                        <p className={styles.sprintTasks}>
                          {sprintTaskCounts[sprint.id]} задач в спринте
                        </p>
                      )}
                      {(canEdit && sprint.status === 'planned' && !activeSprint) ||
                      (canEdit && sprint.status === 'active') ||
                      isDirector ? (
                        <div className={styles.sprintActions}>
                          {canEdit && sprint.status === 'planned' && !activeSprint && (
                            <button
                              type="button"
                              className={styles.startBtn}
                              disabled={busy}
                              onClick={() => void handleStartSprint(sprint.id)}
                            >
                              Запустить спринт
                            </button>
                          )}
                          {canEdit && sprint.status === 'active' && (
                            <button
                              type="button"
                              className={styles.completeBtn}
                              disabled={busy}
                              onClick={() => void handleCompleteSprint(sprint.id)}
                            >
                              Завершить спринт
                            </button>
                          )}
                          {isDirector && (
                            <button
                              type="button"
                              className={styles.deleteSprintBtn}
                              disabled={busy}
                              onClick={() => void handleDeleteSprint(sprint)}
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {completedSprints.length > 0 && (
                <div className={styles.completedSection}>
                  <h4 className={styles.completedTitle}>Завершённые спринты</h4>
                  <ul className={styles.sprintList}>
                    {completedSprints.map((sprint) => (
                      <li key={sprint.id} className={`${styles.sprintCard} ${styles.sprintCardCompleted}`}>
                        <div className={styles.sprintTop}>
                          <strong>{sprint.name}</strong>
                          <span className={`${styles.sprintStatus} ${styles.sprint_completed}`}>
                            {SPRINT_STATUS_LABELS[sprint.status]}
                          </span>
                        </div>
                        <p className={styles.sprintGoal}>{sprint.goal}</p>
                        <p className={styles.sprintDates}>
                          {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                        </p>
                        {(sprintTaskCounts[sprint.id] ?? 0) > 0 && (
                          <p className={styles.sprintTasks}>
                            {sprintTaskCounts[sprint.id]} задач в спринте
                          </p>
                        )}
                        <div className={styles.sprintActions}>
                          <button
                            type="button"
                            className={styles.reviewBtn}
                            disabled={busy}
                            onClick={() => setReviewingSprint(sprint)}
                          >
                            Просмотр и комментарии
                          </button>
                          {isDirector && (
                            <button
                              type="button"
                              className={styles.deleteSprintBtn}
                              disabled={busy}
                              onClick={() => void handleDeleteSprint(sprint)}
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'board' && activeSprint && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>{activeSprint.name}</h3>
            <p className={styles.sprintGoalBoard}>Цель: {activeSprint.goal}</p>
          </div>

          <div className={styles.board}>
            {BOARD_COLUMNS.map((col) => {
              const columnTasks = boardTasks.filter((t) => {
                if (col.status === 'in_progress') {
                  return t.status === 'in_progress' || t.status === 'review';
                }
                return t.status === col.status;
              });

              return (
                <div key={col.status} className={styles.column}>
                  <h4 className={styles.columnTitle}>
                    {col.label}
                    <span className={styles.columnCount}>{columnTasks.length}</span>
                  </h4>
                  <ul className={styles.columnList}>
                    {columnTasks.map((task) => (
                      <li key={task.id} className={styles.boardCard}>
                        <button
                          type="button"
                          className={styles.boardCardOpen}
                          onClick={() => setEditingTask(task)}
                        >
                          <p className={styles.boardCardTitle}>{task.title}</p>
                          {task.description && (
                            <p className={styles.boardCardDesc}>{task.description}</p>
                          )}
                        </button>
                        <div className={styles.boardCardFooter}>
                          <TaskPriorityBadge priority={task.priority} />
                          {canEdit && task.sprintId && (
                            <label className={styles.assigneeField}>
                              <span className={styles.assigneeLabel}>Ответственный</span>
                              <select
                                className={styles.assigneeSelect}
                                value={task.assigneeId ?? ''}
                                disabled={busy}
                                onChange={(e) => {
                                  const value = e.target.value as UserRole;
                                  if (value) void handleAssignTask(task.id, value);
                                }}
                              >
                                <option value="">Не назначен</option>
                                {assignees.map((user) => (
                                  <option key={user.role} value={user.role}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          {canEdit && (
                            <div className={styles.boardCardActions}>
                              <button
                                type="button"
                                className={styles.advanceBtn}
                                disabled={busy}
                                onClick={() => void handleBoardStatus(task)}
                              >
                                {task.status === 'done' ? 'Вернуть' : 'Далее →'}
                              </button>
                              <button
                                type="button"
                                className={styles.backlogBtn}
                                disabled={busy}
                                onClick={() => void handleMoveToBacklog(task.id)}
                                title="Вернуть в бэклог"
                              >
                                ↩
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'board' && !activeSprint && (
        <p className={styles.empty}>Нет активного спринта. Запустите спринт на вкладке «Спринты».</p>
      )}

      <TaskDetailModal
        open={!!editingTask}
        task={editingTask}
        canEdit={canEdit}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
      />

      <SprintReviewModal
        open={!!reviewingSprint}
        projectId={project.id}
        sprint={reviewingSprint}
        onClose={() => setReviewingSprint(null)}
      />
    </section>
  );
}
