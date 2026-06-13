import type { Task, TaskStatus } from '../../../api/types/tasks';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../constants';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  emptyText: string;
  onComplete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') {
    return false;
  }
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

export function TaskList({
  tasks,
  emptyText,
  onComplete,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {tasks.map((task) => {
        const overdue = isOverdue(task);
        const done = task.status === 'done';

        return (
          <li
            key={task.id}
            className={`${styles.item} ${done ? styles.itemDone : ''} ${overdue ? styles.itemOverdue : ''}`}
          >
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={done}
                onChange={() => (done ? onStatusChange(task.id, 'todo') : onComplete(task.id))}
              />
              <span className={styles.checkbox} aria-hidden />
            </label>

            <div className={styles.main}>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>{task.title}</h3>
                <span className={`${styles.priority} ${styles[`priority_${task.priority}`]}`}>
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
              </div>

              {task.description && <p className={styles.description}>{task.description}</p>}

              <div className={styles.meta}>
                <span>{TASK_STATUS_LABELS[task.status]}</span>
                {task.dueDate && (
                  <span className={overdue ? styles.overdue : undefined}>
                    до {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              {!done && (
                <button
                  type="button"
                  className={styles.statusBtn}
                  onClick={() =>
                    onStatusChange(
                      task.id,
                      task.status === 'in_progress' ? 'todo' : 'in_progress',
                    )
                  }
                >
                  {task.status === 'in_progress' ? 'В очередь' : 'В работу'}
                </button>
              )}
              <button type="button" className={styles.editBtn} onClick={() => onEdit(task)}>
                Изменить
              </button>
              <button type="button" className={styles.deleteBtn} onClick={() => onDelete(task.id)}>
                Удалить
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
