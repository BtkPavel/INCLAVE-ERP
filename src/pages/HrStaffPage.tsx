import { ApiModuleShell } from '../components/ApiModuleShell';
import { useHrEmployees } from '../hooks/useModuleApi';
import styles from './HrSectionPage.module.css';

export function HrStaffPage() {
  const employees = useHrEmployees('staff');

  return (
    <ApiModuleShell
      state={employees}
      figLabel="FIG 1.5.1"
      emptyTitle="Штатные сотрудники"
      emptyDescription="Реестр штатных сотрудников: должности, отделы, контакты и статусы."
    >
      {() => <div className={styles.content} />}
    </ApiModuleShell>
  );
}
