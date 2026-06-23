import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { tasksApi } from '../../../api/modules/tasks.api';
import type { Task, TaskComment, TaskPriority, UpdateTaskDto } from '../../../api/types/tasks';
import { DatePicker } from '../../../components/DatePicker';
import { FormSelect } from '../../../components/FormSelect';
import { ApiError } from '../../../api/errors';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../constants';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import formStyles from './TaskForm.module.css';
import modalStyles from '../../projects/components/ProjectModal.module.css';

interface TaskDetailModalProps {
  open: boolean;
  task: Task | null;
  canEdit: boolean;
  onClose: () => void;
  onSave: (id: string, dto: UpdateTaskDto) => Promise<void>;
}

export function TaskDetailModal({ open, task, canEdit, onClose, onSave }: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!task || !open) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setError(null);
    setCommentText('');
    setCommentsError(null);
    void tasksApi
      .listComments(task.id)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]));
  }, [task, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!task || !canEdit) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Укажите название задачи');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(task.id, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!task) return;
    const text = commentText.trim();
    if (!text) return;
    setCommentBusy(true);
    setCommentsError(null);
    try {
      const res = await tasksApi.addComment(task.id, { text });
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch (err) {
      setCommentsError(ApiError.isApiError(err) ? err.message : 'Не удалось отправить комментарий');
    } finally {
      setCommentBusy(false);
    }
  }

  if (!open || !task) return null;

  return createPortal(
    <div className={modalStyles.overlay} onClick={onClose}>
      <div
        className={modalStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Задача"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={modalStyles.header}>
          <h2 className={modalStyles.title}>Задача</h2>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className={modalStyles.body}>
          {canEdit ? (
            <form className={formStyles.form} onSubmit={handleSubmit} style={{ border: 'none', padding: 0 }}>
              <label className={formStyles.field}>
                <span>Название</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Что нужно сделать?"
                  required
                />
              </label>

              <label className={formStyles.field}>
                <span>Подробное описание</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Детали, шаги, ссылки, критерии готовности…"
                  rows={8}
                />
              </label>

              <div className={formStyles.grid}>
                <label className={formStyles.field}>
                  <span>Приоритет</span>
                  <FormSelect value={priority} onChange={(v) => setPriority(v as TaskPriority)}>
                    {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((value) => (
                      <option key={value} value={value}>
                        {TASK_PRIORITY_LABELS[value]}
                      </option>
                    ))}
                  </FormSelect>
                </label>

                <label className={formStyles.field}>
                  <span>Срок</span>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Без срока"
                    clearable
                  />
                </label>
              </div>

              {error && (
                <p className={formStyles.error} role="alert">
                  {error}
                </p>
              )}

              <div className={formStyles.actions}>
                <button type="button" className={formStyles.cancelBtn} onClick={onClose}>
                  Отмена
                </button>
                <button type="submit" className={formStyles.submitBtn} disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          ) : (
            <div className={formStyles.form} style={{ border: 'none', padding: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{TASK_STATUS_LABELS[task.status]}</span>
                <span>·</span>
                <TaskPriorityBadge priority={task.priority} />
              </p>
              {task.description ? (
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {task.description}
                </p>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Описание не задано</p>
              )}
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-solid)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              Комментарии
            </h3>
            {comments.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Комментариев пока нет</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border-solid)',
                      background: 'var(--surface-hover)',
                    }}
                  >
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {comment.authorName} ·{' '}
                      {new Date(comment.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {comment.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Написать комментарий…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-solid)',
                  background: 'var(--surface-hover)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              {commentsError && (
                <p className={formStyles.error} role="alert">
                  {commentsError}
                </p>
              )}
              <button
                type="submit"
                className={formStyles.submitBtn}
                disabled={commentBusy || !commentText.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {commentBusy ? 'Отправка…' : 'Комментировать'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
