import crypto from 'node:crypto';

export function loadEmployees(loadJson, key) {
  return loadJson(key, []);
}

export function normalizeEmployee(employee) {
  return {
    ...employee,
    paymentType: employee.paymentType === 'unpaid' ? 'unpaid' : 'paid',
    paymentNote: employee.paymentNote ?? null,
    systemRole: employee.systemRole ?? null,
    accessBlocked: employee.accessBlocked === true,
  };
}

export function ensureSeedEmployees(loadJson, saveJson, key) {
  const employees = loadEmployees(loadJson, key).map(normalizeEmployee);
  const karinaExists = employees.some(
    (employee) =>
      employee.systemRole === 'product_office' || employee.fullName === 'Карина Михневич',
  );
  if (karinaExists) return employees;

  const now = new Date().toISOString();
  const karina = normalizeEmployee({
    id: crypto.randomUUID(),
    fullName: 'Карина Михневич',
    position: 'UX/UI Дизайнер',
    department: 'Product Office',
    employmentType: 'outsource',
    status: 'active',
    email: null,
    phone: null,
    hiredAt: now.slice(0, 10),
    paymentType: 'unpaid',
    paymentNote: 'Без оплаты',
    systemRole: 'product_office',
    accessBlocked: false,
    createdAt: now,
    updatedAt: now,
  });
  const next = [...employees, karina];
  saveJson(key, next);
  return next;
}

export function filterEmployees(employees, { employmentType, department, status, search } = {}) {
  let items = employees;
  if (employmentType) items = items.filter((e) => e.employmentType === employmentType);
  if (department) items = items.filter((e) => e.department === department);
  if (status) items = items.filter((e) => e.status === status);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
    );
  }
  return items.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
}

export function buildHrStats(employees) {
  const active = employees.filter((e) => e.status === 'active');
  const staff = active.filter((e) => e.employmentType === 'staff');
  const outsource = active.filter((e) => e.employmentType === 'outsource');
  const byDepartment = {};
  for (const e of active) {
    byDepartment[e.department] = (byDepartment[e.department] ?? 0) + 1;
  }
  return {
    total: employees.length,
    active: active.length,
    staff: staff.length,
    outsource: outsource.length,
    onLeave: employees.filter((e) => e.status === 'on_leave').length,
    terminated: employees.filter((e) => e.status === 'terminated').length,
    byDepartment,
  };
}
