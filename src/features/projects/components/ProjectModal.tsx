import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectCategory } from '../../../api/types/projects';
import type { CreateProjectDto } from '../../../api/types/projects';
import { ProjectForm } from './ProjectForm';
import styles from './ProjectModal.module.css';

interface ProjectModalProps {
  open: boolean;
  category: ProjectCategory;
  title: string;
  onClose: () => void;
  onSubmit: (dto: CreateProjectDto) => Promise<void>;
}

export function ProjectModal({ open, category, title, onClose, onSubmit }: ProjectModalProps) {
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

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className={styles.body}>
          <ProjectForm
          category={category}
          onCancel={onClose}
          onSubmit={async (dto) => {
            await onSubmit(dto);
            onClose();
          }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
