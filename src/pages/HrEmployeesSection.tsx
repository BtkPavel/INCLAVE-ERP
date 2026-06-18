import { useState } from 'react';
import type { Employee, EmploymentType } from '../api/types/hr';
import { useAuth } from '../auth/AuthContext';
import { EmployeeForm } from '../features/hr/components/EmployeeForm';
import { EmployeeList } from '../features/hr/components/EmployeeList';
import { useHrEmployeeActions, useHrEmployees } from '../hooks/useModuleApi';
import styles from './HrEmployeesSection.module.css';

interface HrEmployeesSectionProps {
  employmentType: EmploymentType;
  fig: string;
  title: string;
  subtitle: string;
}

export function HrEmployeesSection({
  employmentType,
  fig,
  title,
  subtitle,
}: HrEmployeesSectionProps) {
  const { user } = useAuth();
  const canManage = user?.role === 'director';
  const { version, create, update, remove, toggleAccess } = useHrEmployeeActions();
  const employeesState = useHrEmployees(employmentType, version);
  const [editing, setEditing] = useState<Employee | null>(null);

  const employees =
    employeesState.status === 'success' ? employeesState.data.data : [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.fig}>{fig}</span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      {canManage && (
        <EmployeeForm
          key={editing?.id ?? `new-${employmentType}`}
          employmentType={employmentType}
          initial={editing}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSubmit={async (dto) => {
            if (editing) {
              await update(editing.id, dto);
              setEditing(null);
            } else {
              await create(dto);
            }
          }}
        />
      )}

      {employeesState.status === 'loading' || employeesState.status === 'idle' ? (
        <div className={styles.loading}>Загрузка сотрудников…</div>
      ) : employeesState.status === 'error' ? (
        <div className={styles.error} role="alert">
          {employeesState.error}
        </div>
      ) : (
        <EmployeeList
          employees={employees}
          canManage={canManage}
          onEdit={setEditing}
          onDelete={async (id) => {
            await remove(id);
            if (editing?.id === id) setEditing(null);
          }}
          onToggleAccess={toggleAccess}
        />
      )}
    </div>
  );
}
