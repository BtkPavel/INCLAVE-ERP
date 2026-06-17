import type { TaskPriority } from '../../../api/types/tasks';
import { TASK_PRIORITY_LABELS } from '../constants';
import styles from './TaskPriority.module.css';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`priority_${priority}`]} ${className ?? ''}`}>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}
