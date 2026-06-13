import { useId, type ReactNode } from 'react';
import styles from './FormSelect.module.css';

interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function FormSelect({ value, onChange, children, disabled }: FormSelectProps) {
  const id = useId();

  return (
    <div className={styles.wrap}>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
      <span className={styles.chevron} aria-hidden>
        ▾
      </span>
    </div>
  );
}
