import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../auth/users';
import {
  requestNotificationPermission,
  showWelcomeNotification,
} from '../notifications/notifications';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './LoginPage.module.css';

const ROLES: { id: UserRole; label: string; description: string }[] = [
  {
    id: 'director',
    label: 'Директор',
    description: 'Полный доступ к управлению предприятием',
  },
  {
    id: 'accountant',
    label: 'Бухгалтер',
    description: 'Финансовый учёт и отчётность',
  },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const [role, setRole] = useState<UserRole>('director');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = login(role, password);
    if (!success) {
      setError('Неверный пароль. Попробуйте снова.');
      setLoading(false);
      return;
    }

    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      const roleLabel = ROLES.find((r) => r.id === role)?.label ?? '';
      showWelcomeNotification(roleLabel);
    }

    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <ThemeToggle />
      </div>
      <div className={styles.glow} aria-hidden />
      <div className={styles.container}>
        <header className={styles.brand}>
          <img src="/logowhite.svg" alt="INCLAVE" className={`${styles.logo} logoImage`} />
          <span className={styles.badge}>ERP</span>
        </header>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Вход в систему</h1>
            <p className={styles.subtitle}>
              Система управления предприятием INCLAVE
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <fieldset className={styles.roleFieldset}>
              <legend className={styles.legend}>Роль</legend>
              <div className={styles.roles}>
                {ROLES.map((r) => (
                  <label
                    key={r.id}
                    className={`${styles.roleOption} ${role === r.id ? styles.roleActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={role === r.id}
                      onChange={() => setRole(r.id)}
                      className={styles.roleInput}
                    />
                    <span className={styles.roleLabel}>{r.label}</span>
                    <span className={styles.roleDesc}>{r.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className={styles.field}>
              <span className={styles.label}>Пароль</span>
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !password}
            >
              {loading ? 'Вход…' : 'Войти'}
            </button>
          </form>

          <p className={styles.hint}>
            Регистрация недоступна. Доступ только для сотрудников INCLAVE.
          </p>
        </div>

        <footer className={styles.footer}>
          <span className={styles.mono}>© 2026 INCLAVE LLC</span>
        </footer>
      </div>
    </div>
  );
}
