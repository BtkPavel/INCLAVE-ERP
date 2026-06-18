import { KEYS, loadJson, saveJson } from './db.mjs';

const ENV_PASSWORDS = {
  director: process.env.DIRECTOR_PASSWORD || 'inclave-dir',
  accountant: process.env.ACCOUNTANT_PASSWORD || 'inclave-buh',
  product_office: process.env.PRODUCT_OFFICE_PASSWORD || 'Karina1721@',
};

const DEFAULT_MODULE_ACCESS = {
  director: {
    overview: true,
    projects: true,
    calendar: true,
    tasks: true,
    finance: true,
    hr: true,
    settings: true,
  },
  accountant: {
    overview: true,
    projects: true,
    calendar: true,
    tasks: true,
    finance: true,
    hr: true,
    settings: false,
  },
  product_office: {
    overview: false,
    projects: true,
    calendar: true,
    tasks: true,
    finance: false,
    hr: false,
    settings: false,
  },
};

export function getDefaultAccessSettings() {
  return {
    moduleAccess: structuredClone(DEFAULT_MODULE_ACCESS),
    projectAccess: [],
    calendarSharing: [],
  };
}

export function loadAccessSettings() {
  const stored = loadJson(KEYS.accessSettings, null);
  const defaults = getDefaultAccessSettings();
  if (!stored) return defaults;

  const moduleAccess = { ...defaults.moduleAccess };
  for (const role of Object.keys(defaults.moduleAccess)) {
    moduleAccess[role] = { ...defaults.moduleAccess[role], ...(stored.moduleAccess?.[role] ?? {}) };
  }

  return {
    moduleAccess,
    projectAccess: Array.isArray(stored.projectAccess) ? stored.projectAccess : [],
    calendarSharing: Array.isArray(stored.calendarSharing) ? stored.calendarSharing : [],
  };
}

export function saveAccessSettings(settings) {
  saveJson(KEYS.accessSettings, settings);
}

export function getRolePassword(role) {
  const overrides = loadJson(KEYS.passwords, {});
  return overrides[role] ?? ENV_PASSWORDS[role] ?? null;
}

export function setRolePassword(role, password) {
  const overrides = loadJson(KEYS.passwords, {});
  overrides[role] = password;
  saveJson(KEYS.passwords, overrides);
}

export function getModuleAccess(role) {
  const settings = loadAccessSettings();
  const modules = settings.moduleAccess[role] ?? DEFAULT_MODULE_ACCESS[role] ?? {};
  if (role === 'director') {
    return { ...modules, settings: true };
  }
  return modules;
}

export function hasProjectAccess(role, projectId) {
  if (role === 'director') return true;
  const settings = loadAccessSettings();
  return settings.projectAccess.some(
    (entry) => entry.projectId === projectId && entry.role === role,
  );
}

export function listAccessibleProjectIds(role) {
  if (role === 'director') return null;
  const settings = loadAccessSettings();
  return settings.projectAccess
    .filter((entry) => entry.role === role)
    .map((entry) => entry.projectId);
}

export function canViewCalendar(viewerRole, ownerRole) {
  if (viewerRole === ownerRole || viewerRole === 'director') return true;
  const settings = loadAccessSettings();
  return settings.calendarSharing.some(
    (entry) => entry.ownerRole === ownerRole && entry.viewerRole === viewerRole,
  );
}

export function grantProjectAccess(projectId, role) {
  const settings = loadAccessSettings();
  const exists = settings.projectAccess.some(
    (entry) => entry.projectId === projectId && entry.role === role,
  );
  if (!exists) {
    settings.projectAccess.push({ projectId, role });
    saveAccessSettings(settings);
  }
  return settings;
}

export function revokeProjectAccess(projectId, role) {
  const settings = loadAccessSettings();
  settings.projectAccess = settings.projectAccess.filter(
    (entry) => !(entry.projectId === projectId && entry.role === role),
  );
  saveAccessSettings(settings);
  return settings;
}

export function setCalendarSharing(ownerRole, viewerRole, granted) {
  const settings = loadAccessSettings();
  settings.calendarSharing = settings.calendarSharing.filter(
    (entry) => !(entry.ownerRole === ownerRole && entry.viewerRole === viewerRole),
  );
  if (granted) {
    settings.calendarSharing.push({ ownerRole, viewerRole });
  }
  saveAccessSettings(settings);
  return settings;
}

export function setModuleAccess(role, modules) {
  const settings = loadAccessSettings();
  settings.moduleAccess[role] = { ...settings.moduleAccess[role], ...modules };
  saveAccessSettings(settings);
  return settings;
}

export function getPermissionsForRole(role) {
  const settings = loadAccessSettings();
  return {
    modules: getModuleAccess(role),
    projectIds: listAccessibleProjectIds(role),
  };
}
