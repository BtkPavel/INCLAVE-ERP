import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiModuleShell } from '../components/ApiModuleShell';
import { ProjectList } from '../features/projects/components/ProjectList';
import { ProjectModal } from '../features/projects/components/ProjectModal';
import { useProjectActions, useProjects } from '../hooks/useModuleApi';
import { useAuth } from '../auth/AuthContext';
import type { ProjectCategory } from '../api/types/projects';
import type { PaginatedResponse } from '../api/types/common';
import type { Project } from '../api/types/projects';
import styles from './ProjectsSectionPage.module.css';

interface ProjectsSectionPageProps {
  category: ProjectCategory;
  figLabel: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function ProjectsSectionPage({
  category,
  figLabel,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
}: ProjectsSectionPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { version, create } = useProjectActions();
  const projects = useProjects(category, version);
  const [modalOpen, setModalOpen] = useState(false);

  const isInvestment = category === 'investment';
  const canCreate = user?.role === 'director';
  const listPath = isInvestment ? '/projects/invest' : '/projects/current';

  return (
    <div className={styles.section}>
      <header className={styles.headerRow}>
        <div>
          <span className={styles.fig}>{figLabel}</span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {canCreate && (
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setModalOpen(true)}
          >
            + Создать проект
          </button>
        )}
      </header>

      <ApiModuleShell
        state={projects}
        figLabel={figLabel}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      >
        {(data: PaginatedResponse<Project>) => (
          <ProjectList projects={data.data} category={category} />
        )}
      </ApiModuleShell>

      {canCreate && (
        <ProjectModal
          open={modalOpen}
          category={category}
          title={isInvestment ? 'Новый инвест-проект' : 'Новый текущий проект'}
          onClose={() => setModalOpen(false)}
          onSubmit={async (dto) => {
            const { data } = await create(dto);
            navigate(`${listPath}/${data.id}`);
          }}
        />
      )}
    </div>
  );
}
