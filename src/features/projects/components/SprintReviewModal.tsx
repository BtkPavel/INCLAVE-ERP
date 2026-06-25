import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { projectsApi } from '../../../api/modules/projects.api';
import type { Sprint, SprintComment } from '../../../api/types/sprints';
import type { Task } from '../../../api/types/tasks';
import { ApiError } from '../../../api/errors';
import { TASK_STATUS_LABELS } from '../../tasks/constants';
import { TaskPriorityBadge } from '../../tasks/components/TaskPriorityBadge';
import styles from './SprintReviewModal.module.css';

interface SprintReviewModalProps {
  open: boolean;
  projectId: string;
  sprint: Sprint | null;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function SprintReviewModal({ open, projectId, sprint, onClose }: SprintReviewModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<SprintComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!open || !sprint) return;
    setCommentText('');
    setError(null);
    setLoading(true);
    void Promise.all([
      projectsApi.listTasks(projectId, sprint.id),
      projectsApi.listSprintComments(projectId, sprint.id),
    ])
      .then(([tasksRes, commentsRes]) => {
        setTasks(tasksRes.data);
        setComments(commentsRes.data);
      })
      .catch((err) => {
        setTasks([]);
        setComments([]);
        setError(ApiError.isApiError(err) ? err.message : 'Не удалось загрузить спринт');
      })
      .finally(() => setLoading(false));
  }, [open, projectId, sprint]);

  async function handleAddComment(event: FormEvent) {
    event.preventDefault();
    if (!sprint) return;
    const text = commentText.trim();
    if (!text) return;

    setCommentBusy(true);
    setError(null);
    try {
      const res = await projectsApi.addSprintComment(projectId, sprint.id, { text });
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch (err) {
      setError(ApiError.isApiError(err) ? err.message : 'Не удалось отправить комментарий');
    } finally {
      setCommentBusy(false);
    }
  }

  if (!open || !sprint) return null;

  const doneCount = tasks.filter((task) => task.status === 'done').length;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Спринт ${sprint.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>{sprint.name}</h2>
            <p className={styles.meta}>
              Завершён · {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <div>
            <h3 className={styles.sectionTitle}>Цель спринта</h3>
            <p className={styles.goal}>{sprint.goal}</p>
          </div>

          <div>
            <h3 className={styles.sectionTitle}>
              Задачи спринта {tasks.length > 0 ? `(${doneCount}/${tasks.length} выполнено)` : ''}
            </h3>
            {loading ? (
              <p className={styles.loading}>Загрузка задач…</p>
            ) : tasks.length === 0 ? (
              <p className={styles.empty}>В спринте не было задач</p>
            ) : (
              <ul className={styles.taskList}>
                {tasks.map((task) => (
                  <li key={task.id} className={styles.taskItem}>
                    <p className={styles.taskTitle}>{task.title}</p>
                    <p className={styles.taskMeta}>
                      <TaskPriorityBadge priority={task.priority} /> · {TASK_STATUS_LABELS[task.status]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.comments}>
            <h3 className={styles.sectionTitle}>Комментарии</h3>
            {comments.length === 0 ? (
              <p className={styles.empty}>Комментариев пока нет</p>
            ) : (
              <ul className={styles.commentList}>
                {comments.map((comment) => (
                  <li key={comment.id} className={styles.commentItem}>
                    <p className={styles.commentMeta}>
                      {comment.authorName} ·{' '}
                      {new Date(comment.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className={styles.commentText}>{comment.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <form className={styles.commentForm} onSubmit={handleAddComment}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Итоги спринта, выводы, заметки…"
              />
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={commentBusy || !commentText.trim()}
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
