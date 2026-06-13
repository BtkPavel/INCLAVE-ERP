import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description: string;
  figLabel?: string;
}

export function EmptyState({ title, description, figLabel }: EmptyStateProps) {
  return (
    <div className={styles.card}>
      {figLabel && <span className={styles.fig}>{figLabel}</span>}
      <div className={styles.placeholder}>
        <div className={styles.grid} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.cell} />
          ))}
        </div>
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <span className={styles.badge}>Скоро</span>
    </div>
  );
}
