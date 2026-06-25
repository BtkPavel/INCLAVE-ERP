import { useCallback, useEffect, useState } from 'react';
import { passApi } from '../api/modules/pass.api';
import type { CreatePassEntryDto, PassEntry } from '../api/types/pass';
import styles from './PassPage.module.css';

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore
  }
}

export function PassPage() {
  const [entries, setEntries] = useState<PassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PassEntry | null>(null);
  const [title, setTitle] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await passApi.list({ perPage: 200 });
      setEntries(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function resetForm() {
    setTitle('');
    setLogin('');
    setPassword('');
    setShowPassword(false);
    setEditing(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Укажите название ресурса');
      return;
    }
    if (!login.trim()) {
      setError('Укажите логин');
      return;
    }
    if (!password) {
      setError('Укажите пароль');
      return;
    }

    const dto: CreatePassEntryDto = {
      title: title.trim(),
      login: login.trim(),
      password,
    };

    setSaving(true);
    try {
      if (editing) {
        await passApi.update(editing.id, dto);
      } else {
        await passApi.create(dto);
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить запись');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry: PassEntry) {
    setEditing(entry);
    setTitle(entry.title);
    setLogin(entry.login);
    setPassword(entry.password);
    setShowPassword(false);
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await passApi.delete(id);
      if (editing?.id === id) resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить запись');
    }
  }

  function toggleReveal(id: string) {
    setRevealedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.fig}>FIG 1.7</span>
        <h1 className={styles.title}>PASS</h1>
        <p className={styles.subtitle}>
          Хранилище паролей от сервисов компании. Доступно только директору.
        </p>
      </header>

      <p className={styles.warning}>
        Данные хранятся в ERP и видны только директору. Не передавайте доступ к этому разделу третьим лицам.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Название ресурса</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="GitHub, хостинг, домен..."
              required
            />
          </label>

          <label className={styles.field}>
            <span>Логин</span>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="email или имя пользователя"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Пароль</span>
            <div className={styles.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Скрыть' : 'Показать'}
              </button>
            </div>
          </label>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          {editing && (
            <button type="button" className={styles.cancelBtn} onClick={resetForm}>
              Отмена
            </button>
          )}
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className={styles.loading}>Загрузка записей…</div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>Записей пока нет — добавьте первый пароль выше</div>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => {
            const revealed = revealedIds.has(entry.id);
            return (
              <li key={entry.id} className={styles.item}>
                <div className={styles.main}>
                  <h2 className={styles.itemTitle}>{entry.title}</h2>
                  <div className={styles.credentials}>
                    <div className={styles.credential}>
                      <span className={styles.credentialLabel}>Логин</span>
                      <div className={styles.credentialValue}>
                        <span>{entry.login}</span>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => void copyText(entry.login)}
                        >
                          Копировать
                        </button>
                      </div>
                    </div>
                    <div className={styles.credential}>
                      <span className={styles.credentialLabel}>Пароль</span>
                      <div className={styles.credentialValue}>
                        <span>{revealed ? entry.password : '••••••••'}</span>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => toggleReveal(entry.id)}
                        >
                          {revealed ? 'Скрыть' : 'Показать'}
                        </button>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => void copyText(entry.password)}
                        >
                          Копировать
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" className={styles.editBtn} onClick={() => startEdit(entry)}>
                    Изменить
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => void handleDelete(entry.id)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
