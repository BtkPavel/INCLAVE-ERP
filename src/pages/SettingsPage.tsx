import { useCallback, useEffect, useState } from 'react';
import { projectsApi } from '../api/modules/projects.api';
import { settingsApi } from '../api/modules/settings.api';
import type { AccessSettings, ModulePermissions } from '../api/types/auth';
import type { Project } from '../api/types/projects';
import type { UserRole } from '../auth/users';
import { MODULE_LABELS } from '../auth/permissions';
import { FormSelect } from '../components/FormSelect';
import styles from './SettingsPage.module.css';
import pageStyles from './ModulePage.module.css';

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'director', label: 'Директор' },
  { id: 'accountant', label: 'Бухгалтер' },
  { id: 'product_office', label: 'Product Office' },
];

const MODULE_KEYS = Object.keys(MODULE_LABELS) as (keyof ModulePermissions)[];

export function SettingsPage() {
  const [settings, setSettings] = useState<AccessSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [passwordRole, setPasswordRole] = useState<UserRole>('director');
  const [newPassword, setNewPassword] = useState('');

  const [projectId, setProjectId] = useState('');
  const [projectRole, setProjectRole] = useState<UserRole>('product_office');

  const [calendarOwner, setCalendarOwner] = useState<UserRole>('director');
  const [calendarViewer, setCalendarViewer] = useState<UserRole>('product_office');

  const [moduleRole, setModuleRole] = useState<UserRole>('product_office');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, projectsRes] = await Promise.all([
        settingsApi.get(),
        projectsApi.list({ perPage: 100 }),
      ]);
      setSettings(settingsRes.data);
      setProjects(projectsRes.data);
      if (!projectId && projectsRes.data[0]) {
        setProjectId(projectsRes.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    try {
      await settingsApi.updatePassword(passwordRole, newPassword);
      setNewPassword('');
      setNotice(`Пароль для «${ROLES.find((r) => r.id === passwordRole)?.label}» обновлён`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить пароль');
    }
  }

  async function toggleProjectAccess(granted: boolean) {
    if (!projectId) return;
    setNotice(null);
    try {
      const res = await settingsApi.setProjectAccess(projectId, projectRole, granted);
      setSettings(res.data);
      setNotice(granted ? 'Доступ к проекту выдан' : 'Доступ к проекту отозван');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить доступ к проекту');
    }
  }

  async function toggleCalendarSharing(granted: boolean) {
    setNotice(null);
    try {
      const res = await settingsApi.setCalendarSharing(calendarOwner, calendarViewer, granted);
      setSettings(res.data);
      setNotice(granted ? 'Доступ к календарю выдан' : 'Доступ к календарю отозван');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить доступ к календарю');
    }
  }

  async function toggleModule(key: keyof ModulePermissions) {
    if (!settings) return;
    const current = settings.moduleAccess[moduleRole][key];
    setNotice(null);
    try {
      const res = await settingsApi.setModuleAccess(moduleRole, { [key]: !current });
      setSettings(res.data);
      setNotice('Права модулей обновлены');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить права');
    }
  }

  function hasProjectAccess(role: UserRole, id: string): boolean {
    return settings?.projectAccess.some((entry) => entry.projectId === id && entry.role === role) ?? false;
  }

  function hasCalendarSharing(owner: UserRole, viewer: UserRole): boolean {
    return (
      settings?.calendarSharing.some(
        (entry) => entry.ownerRole === owner && entry.viewerRole === viewer,
      ) ?? false
    );
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка настроек…</div>;
  }

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.header}>
        <span className={pageStyles.fig}>FIG 1.6</span>
        <h1 className={pageStyles.title}>Настройки</h1>
        <p className={pageStyles.subtitle}>
          Пароли, доступ к проектам и доскам спринта, календарям и модулям системы
        </p>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Пароли</h2>
        <form className={styles.card} onSubmit={handlePasswordSubmit}>
          <label className={styles.field}>
            <span>Роль</span>
            <FormSelect value={passwordRole} onChange={(v) => setPasswordRole(v as UserRole)}>
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </FormSelect>
          </label>
          <label className={styles.field}>
            <span>Новый пароль</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </label>
          <button type="submit" className={styles.primaryBtn} disabled={!newPassword}>
            Сохранить пароль
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Доступ к проекту (доска спринта)</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Проект</span>
              <FormSelect value={projectId} onChange={setProjectId}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label className={styles.field}>
              <span>Сотрудник</span>
              <FormSelect value={projectRole} onChange={(v) => setProjectRole(v as UserRole)}>
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </FormSelect>
            </label>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void toggleProjectAccess(true)}
            >
              Выдать доступ
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => void toggleProjectAccess(false)}
            >
              Отозвать
            </button>
          </div>
          {projectId && (
            <p className={styles.hint}>
              {hasProjectAccess(projectRole, projectId)
                ? 'У сотрудника есть доступ к проекту и доске спринта'
                : 'Доступ к проекту не выдан'}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Видимость календарей</h2>
        <div className={styles.card}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Чей календарь</span>
              <FormSelect value={calendarOwner} onChange={(v) => setCalendarOwner(v as UserRole)}>
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label className={styles.field}>
              <span>Кто видит</span>
              <FormSelect value={calendarViewer} onChange={(v) => setCalendarViewer(v as UserRole)}>
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </FormSelect>
            </label>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void toggleCalendarSharing(true)}
            >
              Разрешить просмотр
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => void toggleCalendarSharing(false)}
            >
              Запретить
            </button>
          </div>
          <p className={styles.hint}>
            {hasCalendarSharing(calendarOwner, calendarViewer)
              ? 'Просмотр календаря разрешён'
              : 'Просмотр календаря не настроен'}
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Доступ к модулям</h2>
        <div className={styles.card}>
          <label className={styles.field}>
            <span>Роль</span>
            <FormSelect value={moduleRole} onChange={(v) => setModuleRole(v as UserRole)}>
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </FormSelect>
          </label>
          <ul className={styles.moduleList}>
            {MODULE_KEYS.map((key) => (
              <li key={key} className={styles.moduleItem}>
                <span>{MODULE_LABELS[key]}</span>
                <button
                  type="button"
                  className={
                    settings?.moduleAccess[moduleRole][key]
                      ? styles.toggleOn
                      : styles.toggleOff
                  }
                  onClick={() => void toggleModule(key)}
                >
                  {settings?.moduleAccess[moduleRole][key] ? 'Включено' : 'Выключено'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
