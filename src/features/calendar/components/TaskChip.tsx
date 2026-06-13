import type { Task } from '../../../api/types/tasks';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../tasks/constants';
import styles from './TaskChip.module.css';

interface TaskChipProps {
  task: Task;
  compact?: boolean;
  onClick?: (task: Task) => void;
}

export function TaskChip({ task, compact, onClick }: TaskChipProps) {
  const done = task.status === 'done';

  return (
    <button
      type="button"
      className={`${styles.chip} ${compact ? styles.compact : ''} ${done ? styles.done : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(task);
      }}
      title={`Задача · ${TASK_STATUS_LABELS[task.status]}`}
    >
      <span className={styles.badge}>☑</span>
      <span className={styles.title}>{task.title}</span>
      {!compact && (
        <span className={styles.meta}>{TASK_PRIORITY_LABELS[task.priority]}</span>
      )}
    </button>
  );
}
