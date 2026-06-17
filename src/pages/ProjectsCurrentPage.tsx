import { ProjectsSectionPage } from './ProjectsSectionPage';

export function ProjectsCurrentPage() {
  return (
    <ProjectsSectionPage
      category="current"
      figLabel="FIG 1.1.2"
      title="Текущие проекты"
      subtitle="Действующие инициативы предприятия: статусы, сроки и команды."
      emptyTitle="Проектов пока нет"
      emptyDescription="Здесь появятся текущие проекты INCLAVE с актуальными сроками и ответственными."
    />
  );
}
