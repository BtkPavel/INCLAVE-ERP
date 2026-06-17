import type { Project } from '../../../api/types/projects';
import { PROJECT_METHODOLOGY_LABELS } from '../constants';
import { ScrumWorkspace } from './ScrumWorkspace';
import styles from './MethodologyWorkspace.module.css';

interface MethodologyWorkspaceProps {
  project: Project;
  canEdit: boolean;
}

const METHODOLOGY_HINTS: Record<Project['methodology'], string> = {
  scrum: '',
  hybrid:
    'Гибридный подход: используйте Scrum для разработки и Waterfall для согласований. Ниже — Scrum-инструменты для итераций.',
  waterfall:
    'Водопад: зафиксируйте этапы (анализ → проектирование → реализация → тест → ввод). Задачи проекта доступны в разделе «Задачи».',
  kanban:
    'Kanban: визуализируйте поток работ без жёстких спринтов. Задачи проекта — в разделе «Задачи»; ограничивайте WIP по колонкам.',
};

export function MethodologyWorkspace({ project, canEdit }: MethodologyWorkspaceProps) {
  const isScrumLike = project.methodology === 'scrum' || project.methodology === 'hybrid';

  if (isScrumLike) {
    return (
      <div>
        {project.methodology === 'hybrid' && (
          <p className={styles.hybridNote}>{METHODOLOGY_HINTS.hybrid}</p>
        )}
        <ScrumWorkspace project={project} canEdit={canEdit} />
      </div>
    );
  }

  return (
    <section className={styles.placeholder}>
      <h2 className={styles.title}>{PROJECT_METHODOLOGY_LABELS[project.methodology]}</h2>
      <p className={styles.text}>{METHODOLOGY_HINTS[project.methodology]}</p>
      <p className={styles.linkHint}>
        Создавайте и отслеживайте задачи проекта в разделе{' '}
        <a href="/tasks">Задачи</a>, выбрав этот проект при создании.
      </p>
    </section>
  );
}
