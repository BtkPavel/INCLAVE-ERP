import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DashboardModulePreview } from '../components/dashboard/DashboardModulePreview';
import styles from './DashboardPage.module.css';

const MODULES = [
  {
    to: '/projects',
    label: 'Проекты',
    fig: 'FIG 1.1',
    description: 'Управление проектами и инициативами предприятия',
  },
  {
    to: '/calendar',
    label: 'Календарь',
    fig: 'FIG 1.2',
    description: 'События, встречи и дедлайны команды',
  },
  {
    to: '/tasks',
    label: 'Задачи',
    fig: 'FIG 1.3',
    description: 'Постановка и контроль исполнения задач',
  },
  {
    to: '/finance/income',
    label: 'Финансы',
    fig: 'FIG 1.4',
    description: 'Учёт, отчётность и финансовый контроль',
  },
  {
    to: '/hr/staff',
    label: 'Кадры',
    fig: 'FIG 1.5',
    description: 'Штатные сотрудники и аутсорс-специалисты',
  },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.fig}>FIG 0.1</span>
          <div className={styles.pulse}>
            <span className={styles.pulseDot}>
              <span className={styles.pulseInner} />
            </span>
            <span className={styles.pulseText}>Система активна</span>
          </div>
        </div>
        <h1 className={styles.title}>
          Добро пожаловать, {user?.name}
        </h1>
        <p className={styles.subtitle}>
          Панель управления предприятием INCLAVE. Выберите модуль для работы.
        </p>
      </header>

      <div className={styles.grid}>
        {MODULES.map((mod) => (
          <Link key={mod.to} to={mod.to} className={styles.card}>
            <span className={styles.cardFig}>{mod.fig}</span>
            <div className={styles.cardPlaceholder} aria-hidden>
              <DashboardModulePreview modulePath={mod.to} />
            </div>
            <h2 className={styles.cardTitle}>{mod.label}</h2>
            <p className={styles.cardDesc}>{mod.description}</p>
            <span className={styles.cardLink}>
              Открыть <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
