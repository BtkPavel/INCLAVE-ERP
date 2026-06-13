import { useTheme } from '../theme/ThemeContext';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ''}`}
      onClick={toggleTheme}
      aria-label={isLight ? 'Включить тёмную тему' : 'Включить светлую тему'}
      title={isLight ? 'Тёмная тема' : 'Светлая тема'}
    >
      <span className={styles.icon} aria-hidden>
        {isLight ? '☾' : '☀'}
      </span>
      <span className={styles.label}>{isLight ? 'Тёмная' : 'Светлая'}</span>
    </button>
  );
}
