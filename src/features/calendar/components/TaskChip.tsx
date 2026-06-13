import type { Task } from '../../../api/types/tasks';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../tasks/constants';
import styles from './TaskChip.module.css';

interface TaskChipProps {
  task: Task;
  compact?: boolean;
  /** Только отображение (клик обрабатывает родитель). */
  static?: boolean;
  onClick?: (task: Task) => void;
}

export function TaskChip({ task, compact, static: isStatic, onClick }: TaskChipProps) {
  const done = task.status === 'done';

  const content = (
    <>
      <span className={styles.badge}>☑</span>
      <span className={styles.title}>{task.title}</span>
      {!compact && (
        <span className={styles.meta}>{TASK_PRIORITY_LABELS[task.priority]}</span>
      )}
    </>
  );

  const className = `${styles.chip} ${compact ? styles.compact : ''} ${done ? styles.done : ''}`;

  if (isStatic) {
    return (
      <div className={className} title={`Задача · ${TASK_STATUS_LABELS[task.status]}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(task);
      }}
      title={`Задача · ${TASK_STATUS_LABELS[task.status]}`}
    >
      {content}
    </button>
  );
}
