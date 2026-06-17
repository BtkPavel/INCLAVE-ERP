import type { Project, ProjectStatus } from '../../../api/types/projects';
import styles from './ProjectList.module.css';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Черновик',
  active: 'Активный',
  on_hold: 'На паузе',
  completed: 'Завершён',
  archived: 'Архив',
};

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li key={project.id} className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.code}>{project.code}</span>
            <span className={`${styles.status} ${styles[`status_${project.status}`]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          <h3 className={styles.name}>{project.name}</h3>
          {project.description && <p className={styles.description}>{project.description}</p>}
        </li>
      ))}
    </ul>
  );
}
