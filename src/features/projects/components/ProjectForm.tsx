import { useEffect, useState, type FormEvent } from 'react';
import { authApi } from '../../../api/modules/auth.api';
import type { SystemUser } from '../../../api/types/auth';
import type {
  CreateProjectDto,
  Project,
  ProjectCategory,
  ProjectMember,
  ProjectMethodology,
  ProjectStatus,
} from '../../../api/types/projects';
import { DatePicker } from '../../../components/DatePicker';
import { FormSelect } from '../../../components/FormSelect';
import { ApiError } from '../../../api/errors';
import { PROJECT_METHODOLOGY_LABELS, PROJECT_STATUS_LABELS } from '../constants';
import styles from './ProjectForm.module.css';

interface ProjectFormProps {
  category: ProjectCategory;
  initial?: Project;
  submitLabel?: string;
  onSubmit: (dto: CreateProjectDto) => Promise<void>;
  onCancel: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectForm({
  category,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayIso());
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [methodology, setMethodology] = useState<ProjectMethodology>(
    initial?.methodology ?? 'scrum',
  );
  const [sprintWeeks, setSprintWeeks] = useState(String(initial?.sprintWeeks ?? 2));
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'active');
  const [requiredInvestments, setRequiredInvestments] = useState(
    initial?.requiredInvestments != null ? String(initial.requiredInvestments) : '',
  );
  const [budget, setBudget] = useState(
    initial?.budget != null ? String(initial.budget) : '',
  );
  const [members, setMembers] = useState<ProjectMember[]>(initial?.members ?? []);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInvestment = category === 'investment';
  const showSprintField = methodology === 'scrum' || methodology === 'hybrid';

  useEffect(() => {
    let cancelled = false;
    void authApi
      .listUsers()
      .then((res) => {
        if (!cancelled) setSystemUsers(res.data);
      })
      .catch(() => {
        if (!cancelled) setSystemUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableUsers = systemUsers.filter(
    (user) => !members.some((m) => m.userId === user.id),
  );

  function addMember() {
    const user = systemUsers.find((u) => u.id === selectedUserId);
    if (!user) return;
    setMembers((prev) => [
      ...prev,
      { userId: user.id, name: user.name, role: user.title },
    ]);
    setSelectedUserId('');
  }

  function removeMember(userId: string) {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  function updateMemberRole(userId: string, role: string) {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Укажите название проекта');
      return;
    }
    if (!startDate) {
      setError('Укажите дату начала');
      return;
    }
    if (isInvestment && !isEdit && !requiredInvestments.trim()) {
      setError('Укажите требуемые инвестиции');
      return;
    }

    const dto: CreateProjectDto = {
      name: trimmedName,
      description: description.trim() || undefined,
      category,
      status,
      methodology,
      sprintWeeks: showSprintField ? Number(sprintWeeks) || 2 : null,
      startDate,
      endDate: endDate || undefined,
      members,
      requiredInvestments: isInvestment ? Number(requiredInvestments) : undefined,
      budget: !isInvestment && budget.trim() ? Number(budget) : undefined,
    };

    setSaving(true);
    try {
      await onSubmit(dto);
    } catch (err) {
      setError(
        ApiError.isApiError(err)
          ? err.message
          : isEdit
            ? 'Не удалось сохранить проект'
            : 'Не удалось создать проект',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Название проекта</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isInvestment ? 'Например: Расширение производства' : 'Например: Внедрение CRM'}
          required
        />
      </label>

      <label className={styles.field}>
        <span>Описание</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Цели, контекст, ожидаемый результат..."
          rows={3}
        />
      </label>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Дата начала</span>
          <DatePicker value={startDate} onChange={setStartDate} required />
        </label>

        <label className={styles.field}>
          <span>Плановое окончание</span>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            min={startDate}
            placeholder="Не задано"
            clearable
          />
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Методология</span>
          <FormSelect
            value={methodology}
            onChange={(v) => setMethodology(v as ProjectMethodology)}
          >
            {(Object.keys(PROJECT_METHODOLOGY_LABELS) as ProjectMethodology[]).map((value) => (
              <option key={value} value={value}>
                {PROJECT_METHODOLOGY_LABELS[value]}
              </option>
            ))}
          </FormSelect>
        </label>

        {showSprintField ? (
          <label className={styles.field}>
            <span>Длительность спринта (нед.)</span>
            <input
              type="number"
              min="1"
              max="8"
              value={sprintWeeks}
              onChange={(e) => setSprintWeeks(e.target.value)}
            />
          </label>
        ) : (
          <label className={styles.field}>
            <span>Статус</span>
            <FormSelect value={status} onChange={(v) => setStatus(v as ProjectStatus)}>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((value) => (
                <option key={value} value={value}>
                  {PROJECT_STATUS_LABELS[value]}
                </option>
              ))}
            </FormSelect>
          </label>
        )}
      </div>

      {showSprintField && (
        <label className={styles.field}>
          <span>Статус</span>
          <FormSelect value={status} onChange={(v) => setStatus(v as ProjectStatus)}>
            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((value) => (
              <option key={value} value={value}>
                {PROJECT_STATUS_LABELS[value]}
              </option>
            ))}
          </FormSelect>
        </label>
      )}

      {isInvestment ? (
        <label className={styles.field}>
          <span>Требуемые инвестиции, BYN</span>
          <input
            type="number"
            min="1"
            step="1"
            value={requiredInvestments}
            onChange={(e) => setRequiredInvestments(e.target.value)}
            placeholder="Сумма привлечения капитала"
            required
          />
        </label>
      ) : (
        <label className={styles.field}>
          <span>Бюджет проекта, BYN</span>
          <input
            type="number"
            min="1"
            step="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Необязательно"
          />
        </label>
      )}

      <div className={styles.field}>
        <span>Члены команды</span>
        <div className={styles.memberAdd}>
          <FormSelect
            value={selectedUserId}
            onChange={setSelectedUserId}
            disabled={availableUsers.length === 0}
          >
            <option value="">
              {systemUsers.length === 0 ? 'Загрузка…' : 'Выберите пользователя'}
            </option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} · {user.title}
              </option>
            ))}
          </FormSelect>
          <button
            type="button"
            className={styles.addMemberBtn}
            onClick={addMember}
            disabled={!selectedUserId}
          >
            Добавить
          </button>
        </div>

        {members.length > 0 ? (
          <ul className={styles.memberList}>
            {members.map((member) => (
              <li key={member.userId} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{member.name}</span>
                  <input
                    className={styles.memberRole}
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.userId, e.target.value)}
                    placeholder="Роль в проекте"
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeMemberBtn}
                  onClick={() => removeMember(member.userId)}
                  aria-label={`Убрать ${member.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.memberHint}>Добавьте пользователей с доступом к INCLAVE ERP</p>
        )}
      </div>

      {isInvestment && requiredInvestments && (
        <p className={styles.summary}>
          Запрашиваемые инвестиции: {formatMoney(Number(requiredInvestments))} BYN
        </p>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving
            ? isEdit
              ? 'Сохранение…'
              : 'Создание…'
            : submitLabel ?? (isEdit ? 'Сохранить' : 'Создать проект')}
        </button>
      </div>
    </form>
  );
}
