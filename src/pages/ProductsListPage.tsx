import { ProjectsSectionPage } from './ProjectsSectionPage';

export function ProductsListPage() {
  return (
    <ProjectsSectionPage
      category="investment"
      basePath="/products"
      figLabel="FIG 1.1.3.1"
      title="Каталог продуктов"
      subtitle="Все проекты из раздела «Инвест» отображаются здесь как продукты для учёта и планирования."
      emptyTitle="Продуктов пока нет"
      emptyDescription="Создайте первый продукт на базе инвест-проекта."
      createButtonLabel="+ Создать продукт"
      modalTitle="Новый продукт"
    />
  );
}
