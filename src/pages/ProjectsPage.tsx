import { ApiModuleShell } from '../components/ApiModuleShell';
import { useProjects } from '../hooks/useModuleApi';
import styles from './ModulePage.module.css';

export function ProjectsPage() {
  const projects = useProjects();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.1</span>
        <h1 className={styles.title}>Проекты</h1>
        <p className={styles.subtitle}>
          Управление проектами и инициативами предприятия INCLAVE
        </p>
      </header>
      <ApiModuleShell
        state={projects}
        figLabel="FIG 1.1.1"
        emptyTitle="Раздел в разработке"
        emptyDescription="Здесь будет список проектов, статусы, команды и сроки. API готов — ожидается подключение backend."
      />
    </div>
  );
}
