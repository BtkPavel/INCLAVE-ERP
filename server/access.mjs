import { KEYS, loadJson } from './db.mjs';
import { loadEmployees, normalizeEmployee } from './hr.mjs';

export function isRoleAccessBlocked(role) {
  const employees = loadEmployees(loadJson, KEYS.employees).map(normalizeEmployee);
  const linked = employees.find((employee) => employee.systemRole === role);
  return linked?.accessBlocked === true;
}
