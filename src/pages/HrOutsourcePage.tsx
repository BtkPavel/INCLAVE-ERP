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
      emptyDescription="Здесь будет реестр внешних специалистов: контрагенты, договоры, сроки и ставки. API готов — ожидается подключение backend."
    >
      {() => <div className={styles.content} />}
    </ApiModuleShell>
  );
}
