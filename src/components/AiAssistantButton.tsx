import { useAiAssistant } from '../features/assistant/AiAssistantContext';
import styles from './AiAssistantButton.module.css';

interface AiAssistantButtonProps {
  className?: string;
}

export function AiAssistantButton({ className }: AiAssistantButtonProps) {
  const { open, toggleAssistant } = useAiAssistant();

  return (
    <button
      type="button"
      className={`${styles.button} ${open ? styles.buttonActive : ''} ${className ?? ''}`}
      onClick={toggleAssistant}
      aria-label="Клариса — ассистент INCLAVE"
      aria-pressed={open}
      title="Клариса — ассистент INCLAVE"
    >
      <span className={styles.icon} aria-hidden>
        ✦
      </span>
      <span className={styles.label}>Клариса</span>
    </button>
  );
}
