import type { FinanceActivityScope } from '../../../api/types/finance';
import type { Project } from '../../../api/types/projects';
import { FormSelect } from '../../../components/FormSelect';
import { ACTIVITY_SCOPE_CORE_LABELS } from '../constants';
import styles from './FinanceActivityFields.module.css';

interface FinanceActivityFieldsProps {
  kind: 'income' | 'expense';
  activityScope: FinanceActivityScope;
  projectId: string;
  products: Project[];
  onScopeChange: (scope: FinanceActivityScope) => void;
  onProjectChange: (projectId: string) => void;
}

export function FinanceActivityFields({
  kind,
  activityScope,
  projectId,
  products,
  onScopeChange,
  onProjectChange,
}: FinanceActivityFieldsProps) {
  return (
    <div className={styles.block}>
      <p className={styles.hint}>
        Укажите {kind === 'income' ? 'выручку' : 'расход'} по основной деятельности или выберите
        конкретный продукт. Все проекты из раздела «Инвест» считаются продуктами.
      </p>

      <fieldset className={styles.scopeGroup}>
        <legend className={styles.legend}>Отнесение</legend>
        <div className={styles.scopeOptions}>
          <label className={`${styles.scopeOption} ${activityScope === 'core' ? styles.scopeActive : ''}`}>
            <input
              type="radio"
              name={`activityScope-${kind}`}
              checked={activityScope === 'core'}
              onChange={() => onScopeChange('core')}
            />
            <span className={styles.scopeLabel}>{ACTIVITY_SCOPE_CORE_LABELS[kind]}</span>
          </label>
          <label className={`${styles.scopeOption} ${activityScope === 'product' ? styles.scopeActive : ''}`}>
            <input
              type="radio"
              name={`activityScope-${kind}`}
              checked={activityScope === 'product'}
              onChange={() => onScopeChange('product')}
            />
            <span className={styles.scopeLabel}>Продукт</span>
          </label>
        </div>
      </fieldset>

      {activityScope === 'product' && (
        <label className={styles.field}>
          <span>Продукт</span>
          <FormSelect value={projectId} onChange={onProjectChange}>
            <option value="">Выберите продукт…</option>
            {products.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </FormSelect>
          {products.length === 0 && (
            <span className={styles.fieldHint}>Создайте продукт в разделе «Продукты» или инвест-проект в «Проекты»</span>
          )}
        </label>
      )}
    </div>
  );
}
