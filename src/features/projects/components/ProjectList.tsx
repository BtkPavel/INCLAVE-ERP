import { Link } from 'react-router-dom';
import type { Project, ProjectCategory } from '../../../api/types/projects';
import {
  PROJECT_METHODOLOGY_LABELS,
  PROJECT_STATUS_LABELS,
} from '../constants';
import styles from './ProjectList.module.css';

interface ProjectListProps {
  projects: Project[];
  category: ProjectCategory;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

export function ProjectList({ projects, category }: ProjectListProps) {
  const basePath = category === 'investment' ? '/projects/invest' : '/projects/current';

  if (projects.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Проектов пока нет</p>
        <p className={styles.emptyText}>Нажмите «Создать проект», чтобы добавить первый.</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li key={project.id}>
          <Link to={`${basePath}/${project.id}`} className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.code}>{project.code}</span>
            <span className={`${styles.status} ${styles[`status_${project.status}`]}`}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
          <h3 className={styles.name}>{project.name}</h3>
          {project.description && <p className={styles.description}>{project.description}</p>}

          <dl className={styles.meta}>
            <div>
              <dt>Старт</dt>
              <dd>{formatDate(project.startDate)}</dd>
            </div>
            <div>
              <dt>Методология</dt>
              <dd>{PROJECT_METHODOLOGY_LABELS[project.methodology]}</dd>
            </div>
            <div>
              <dt>Команда</dt>
              <dd>{project.members?.length ?? 0} чел.</dd>
            </div>
            {category === 'investment' && project.requiredInvestments != null && (
              <div>
                <dt>Инвестиции</dt>
                <dd className={styles.invest}>{formatMoney(project.requiredInvestments)} BYN</dd>
              </div>
            )}
            {category === 'current' && project.budget != null && (
              <div>
                <dt>Бюджет</dt>
                <dd>{formatMoney(project.budget)} BYN</dd>
              </div>
            )}
          </dl>

          {project.members && project.members.length > 0 && (
            <div className={styles.team}>
              {project.members.slice(0, 4).map((member) => (
                <span key={member.userId} className={styles.teamChip}>
                  {member.name.split(' ')[0]}
                </span>
              ))}
              {project.members.length > 4 && (
                <span className={styles.teamMore}>+{project.members.length - 4}</span>
              )}
            </div>
          )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
