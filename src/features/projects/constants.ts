import type { ProjectMethodology, ProjectStatus } from '../../api/types/projects';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Черновик',
  active: 'Активный',
  on_hold: 'На паузе',
  completed: 'Завершён',
  archived: 'Архив',
};

export const PROJECT_METHODOLOGY_LABELS: Record<ProjectMethodology, string> = {
  scrum: 'Спринты (Scrum)',
  waterfall: 'Водопад (Waterfall)',
  kanban: 'Kanban',
  hybrid: 'Гибрид',
};
