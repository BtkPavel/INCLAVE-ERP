import { ApiModuleShell } from '../components/ApiModuleShell';
import { useHrEmployees } from '../hooks/useModuleApi';
import styles from './HrSectionPage.module.css';

export function HrOutsourcePage() {
  const employees = useHrEmployees('outsource');

  return (
    <ApiModuleShell
      state={employees}
      figLabel="FIG 1.5.2"
      emptyTitle="Аутсорс-специалисты"
      emptyDescription="Реестр внешних специалистов: контрагенты, договоры, сроки и ставки."
    >
      {() => <div className={styles.content} />}
    </ApiModuleShell>
  );
}
