import { useEffect, useState } from 'react';
import type { Project } from '../../../api/types/projects';
import styles from './ProjectDocumentation.module.css';

interface ProjectDocumentationProps {
  project: Project;
  canEdit: boolean;
  onSave: (documentation: string) => Promise<void>;
}

export function ProjectDocumentation({ project, canEdit, onSave }: ProjectDocumentationProps) {
  const [text, setText] = useState(project.documentation ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setText(project.documentation ?? '');
    setError(null);
    setNotice(null);
  }, [project.id, project.documentation]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      await onSave(text.trim());
      setNotice('Документация сохранена');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить документацию');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <span className={styles.fig}>FIG 1.1.3.2</span>
          <h2 className={styles.title}>Документация</h2>
          <p className={styles.subtitle}>
            Описание продукта, требования, заметки и другие материалы по проекту.
          </p>
        </div>
      </header>

      {canEdit ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Описание</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Цели продукта, функциональность, ссылки, заметки..."
              rows={16}
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {notice && <p className={styles.notice}>{notice}</p>}

          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      ) : text.trim() ? (
        <div className={styles.content}>{text}</div>
      ) : (
        <div className={styles.empty}>
          <p>Документация пока не заполнена</p>
        </div>
      )}
    </section>
  );
}
