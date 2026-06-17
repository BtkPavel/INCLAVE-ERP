import { ApiModuleShell } from '../components/ApiModuleShell';
import { ProjectList } from '../features/projects/components/ProjectList';
import { useProjects } from '../hooks/useModuleApi';
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
  const projects = useProjects(category);

  return (
    <div className={styles.section}>
      <header className={styles.headerRow}>
        <div>
          <span className={styles.fig}>{figLabel}</span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </header>

      <ApiModuleShell
        state={projects}
        figLabel={figLabel}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      >
        {(data: PaginatedResponse<Project>) => <ProjectList projects={data.data} />}
      </ApiModuleShell>
    </div>
  );
}
