import { useState } from 'react';
import type {
  CreateEmployeeDto,
  Employee,
  EmploymentType,
  PaymentType,
} from '../../../api/types/hr';
import type { UserRole } from '../../../auth/users';
import { DatePicker } from '../../../components/DatePicker';
import { FormSelect } from '../../../components/FormSelect';
import { PAYMENT_TYPE_LABELS, SYSTEM_ROLE_OPTIONS } from '../constants';
import styles from './EmployeeForm.module.css';

interface EmployeeFormProps {
  employmentType: EmploymentType;
  onSubmit: (dto: CreateEmployeeDto) => Promise<void>;
  initial?: Employee | null;
  onCancel?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EmployeeForm({
  employmentType,
  onSubmit,
  initial,
  onCancel,
}: EmployeeFormProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [position, setPosition] = useState(initial?.position ?? '');
  const [department, setDepartment] = useState(initial?.department ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [hiredAt, setHiredAt] = useState(initial?.hiredAt ?? todayIso());
  const [paymentType, setPaymentType] = useState<PaymentType>(
    initial?.paymentType ?? (employmentType === 'outsource' ? 'unpaid' : 'paid'),
  );
  const [paymentNote, setPaymentNote] = useState(initial?.paymentNote ?? '');
  const [systemRole, setSystemRole] = useState<UserRole | ''>(
    (initial?.systemRole as UserRole | undefined) ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !position.trim() || !department.trim()) {
      setError('Заполните ФИО, должность и отдел');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        position: position.trim(),
        department: department.trim(),
        employmentType,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        hiredAt,
        paymentType: employmentType === 'outsource' ? paymentType : 'paid',
        paymentNote:
          employmentType === 'outsource' && paymentNote.trim()
            ? paymentNote.trim()
            : employmentType === 'outsource' && paymentType === 'unpaid'
              ? 'Без оплаты'
              : undefined,
        systemRole: systemRole || null,
      });
      if (!initial) {
        setFullName('');
        setPosition('');
        setDepartment('');
        setEmail('');
        setPhone('');
        setHiredAt(todayIso());
        setPaymentType(employmentType === 'outsource' ? 'unpaid' : 'paid');
        setPaymentNote('');
        setSystemRole('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить сотрудника');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>ФИО</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Должность</span>
          <input value={position} onChange={(e) => setPosition(e.target.value)} required />
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Отдел</span>
          <input value={department} onChange={(e) => setDepartment(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Дата начала</span>
          <DatePicker value={hiredAt} onChange={setHiredAt} />
        </label>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Телефон</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>

      {employmentType === 'outsource' && (
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Оплата</span>
            <FormSelect value={paymentType} onChange={(v) => setPaymentType(v as PaymentType)}>
              {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((value) => (
                <option key={value} value={value}>
                  {PAYMENT_TYPE_LABELS[value]}
                </option>
              ))}
            </FormSelect>
          </label>
          <label className={styles.field}>
            <span>Комментарий к оплате</span>
            <input
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder={paymentType === 'unpaid' ? 'Без оплаты' : 'Ставка, договор...'}
            />
          </label>
        </div>
      )}

      <label className={styles.field}>
        <span>Доступ в ERP</span>
        <FormSelect value={systemRole} onChange={(v) => setSystemRole(v as UserRole | '')}>
          {SYSTEM_ROLE_OPTIONS.map((option) => (
            <option key={option.id || 'none'} value={option.id}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Сохранение…' : initial ? 'Сохранить' : 'Добавить сотрудника'}
        </button>
      </div>
    </form>
  );
}
