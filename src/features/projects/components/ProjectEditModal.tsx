import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Project, UpdateProjectDto } from '../../../api/types/projects';
import { ProjectForm } from './ProjectForm';
import styles from './ProjectModal.module.css';

interface ProjectEditModalProps {
  open: boolean;
  project: Project;
  onClose: () => void;
  onSubmit: (dto: UpdateProjectDto) => Promise<void>;
}

export function ProjectEditModal({ open, project, onClose, onSubmit }: ProjectEditModalProps) {
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
        aria-label="Редактирование проекта"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Редактирование проекта</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className={styles.body}>
          <ProjectForm
            category={project.category}
            initial={project}
            submitLabel="Сохранить"
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
