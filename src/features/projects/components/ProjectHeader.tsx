import type { Project, ProjectCategory } from '../../../api/types/projects';
import {
  PROJECT_METHODOLOGY_LABELS,
  PROJECT_STATUS_LABELS,
} from '../constants';
import styles from './ProjectHeader.module.css';

interface ProjectHeaderProps {
  project: Project;
  category: ProjectCategory;
  canEdit: boolean;
  onEdit: () => void;
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

function isEndDateUrgent(endDate: string | null) {
  if (!endDate) return false;
  const end = new Date(endDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const warningFrom = new Date(end);
  warningFrom.setDate(warningFrom.getDate() - 14);
  return today >= warningFrom;
}

export function ProjectHeader({ project, category, canEdit, onEdit }: ProjectHeaderProps) {
  return (
    <section className={styles.header}>
      <div className={styles.top}>
        <div>
          <span className={styles.code}>{project.code}</span>
          <h1 className={styles.name}>{project.name}</h1>
          {project.description && <p className={styles.description}>{project.description}</p>}
        </div>
        <div className={styles.topRight}>
          <span className={`${styles.status} ${styles[`status_${project.status}`]}`}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          {canEdit && (
            <button type="button" className={styles.editBtn} onClick={onEdit}>
              Редактировать
            </button>
          )}
        </div>
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Старт</dt>
          <dd>{formatDate(project.startDate)}</dd>
        </div>
        <div>
          <dt>Плановое окончание</dt>
          <dd className={isEndDateUrgent(project.endDate) ? styles.endDateUrgent : undefined}>
            {formatDate(project.endDate)}
          </dd>
        </div>
        <div>
          <dt>Методология</dt>
          <dd>{PROJECT_METHODOLOGY_LABELS[project.methodology]}</dd>
        </div>
        <div>
          <dt>Команда</dt>
          <dd>{project.members?.length ?? 0} чел.</dd>
        </div>
        {project.methodology === 'scrum' || project.methodology === 'hybrid' ? (
          <div>
            <dt>Спринт</dt>
            <dd>{project.sprintWeeks ?? 2} нед.</dd>
          </div>
        ) : null}
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
          {project.members.map((member) => (
            <span key={member.userId} className={styles.teamChip}>
              {member.name}
              <span className={styles.teamRole}>{member.role}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
