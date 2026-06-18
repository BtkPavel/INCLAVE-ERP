import { useEffect, useState } from 'react';
import { projectsApi } from '../../../api/modules/projects.api';
import type { Project } from '../../../api/types/projects';
import type { CreateTaskDto, Task, TaskPriority } from '../../../api/types/tasks';
import { useAuth } from '../../../auth/AuthContext';
import type { UserRole } from '../../../auth/users';
import { DatePicker } from '../../../components/DatePicker';
import { FormSelect } from '../../../components/FormSelect';
import { TASK_PRIORITY_LABELS } from '../constants';
import styles from './TaskForm.module.css';

const ASSIGNEE_OPTIONS: { id: UserRole; label: string }[] = [
  { id: 'director', label: 'Директор' },
  { id: 'accountant', label: 'Бухгалтер' },
  { id: 'product_office', label: 'Product Office' },
];

interface TaskFormProps {
  onSubmit: (dto: CreateTaskDto) => Promise<void>;
  initial?: Task | null;
  onCancel?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TaskForm({ onSubmit, initial, onCancel }: TaskFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [projectId, setProjectId] = useState(initial?.projectId ?? '');
  const [assigneeId, setAssigneeId] = useState<UserRole>(
    (initial?.assigneeId as UserRole | undefined) ?? user?.role ?? 'director',
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void projectsApi
      .list({ perPage: 100 })
      .then((res) => {
        if (!cancelled) setProjects(res.data);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Укажите название задачи');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        projectId: projectId || null,
        ...(user?.role === 'director' && !initial ? { assigneeId } : {}),
      });
      if (!initial) {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setProjectId('');
        setAssigneeId(user?.role ?? 'director');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Задача</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          required
        />
      </label>

      <label className={styles.field}>
        <span>Описание</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Детали, ссылки, контекст..."
          rows={3}
        />
      </label>

      <label className={styles.field}>
        <span>Проект</span>
        <FormSelect value={projectId} onChange={setProjectId}>
          <option value="">Личная задача (только для меня)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.category === 'investment' ? ' · инвест' : ' · текущий'}
            </option>
          ))}
        </FormSelect>
      </label>

      {user?.role === 'director' && !initial && (
        <label className={styles.field}>
          <span>Исполнитель</span>
          <FormSelect value={assigneeId} onChange={(v) => setAssigneeId(v as UserRole)}>
            {ASSIGNEE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </label>
      )}

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Приоритет</span>
          <FormSelect value={priority} onChange={(v) => setPriority(v as TaskPriority)}>
            {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((value) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_LABELS[value]}
              </option>
            ))}
          </FormSelect>
        </label>

        <label className={styles.field}>
          <span>Срок</span>
          <DatePicker
            value={dueDate}
            onChange={setDueDate}
            min={initial ? undefined : todayIso()}
            placeholder="Без срока"
            clearable
          />
        </label>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Сохранение…' : initial ? 'Сохранить' : 'Создать задачу'}
        </button>
      </div>
    </form>
  );
}
