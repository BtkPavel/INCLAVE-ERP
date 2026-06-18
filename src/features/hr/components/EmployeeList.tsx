import type { Employee } from '../../../api/types/hr';
import {
  EMPLOYEE_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  systemRoleLabel,
} from '../constants';
import styles from './EmployeeList.module.css';

interface EmployeeListProps {
  employees: Employee[];
  canManage: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onToggleAccess: (employee: Employee) => void;
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU');
}

export function EmployeeList({
  employees,
  canManage,
  onEdit,
  onDelete,
  onToggleAccess,
}: EmployeeListProps) {
  if (employees.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Сотрудников пока нет</p>
        {canManage && (
          <p className={styles.emptyHint}>Добавьте первого сотрудника с помощью формы выше</p>
        )}
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {employees.map((employee) => (
        <li key={employee.id} className={styles.item}>
          <div className={styles.main}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{employee.fullName}</h3>
              <span className={styles.badge}>{EMPLOYEE_STATUS_LABELS[employee.status]}</span>
              {employee.systemRole && (
                <span
                  className={`${styles.badge} ${employee.accessBlocked ? styles.badgeBlocked : styles.badgeAccess}`}
                >
                  {employee.accessBlocked ? 'Доступ заблокирован' : systemRoleLabel(employee.systemRole)}
                </span>
              )}
            </div>
            <p className={styles.meta}>
              {employee.position} · {employee.department}
            </p>
            <p className={styles.meta}>
              с {formatDate(employee.hiredAt)}
              {employee.email ? ` · ${employee.email}` : ''}
              {employee.phone ? ` · ${employee.phone}` : ''}
            </p>
            {employee.employmentType === 'outsource' && (
              <p className={styles.payment}>
                {PAYMENT_TYPE_LABELS[employee.paymentType]}
                {employee.paymentNote ? ` · ${employee.paymentNote}` : ''}
              </p>
            )}
          </div>

          {canManage && (
            <div className={styles.actions}>
              {employee.systemRole && (
                <button
                  type="button"
                  className={employee.accessBlocked ? styles.unblockBtn : styles.blockBtn}
                  onClick={() => onToggleAccess(employee)}
                >
                  {employee.accessBlocked ? 'Разблокировать' : 'Заблокировать доступ'}
                </button>
              )}
              <button type="button" className={styles.editBtn} onClick={() => onEdit(employee)}>
                Изменить
              </button>
              <button type="button" className={styles.deleteBtn} onClick={() => onDelete(employee.id)}>
                Удалить
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
