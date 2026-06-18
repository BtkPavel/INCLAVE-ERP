import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'inclave.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

export function loadJson(key, fallback) {
  const row = db.prepare('SELECT value FROM store WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  db.prepare(`
    INSERT INTO store (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), new Date().toISOString());
}

export const KEYS = {
  events: 'inclave-erp-calendar-events',
  tasks: 'inclave-erp-tasks',
  transactions: 'inclave-erp-finance-transactions',
  settings: 'inclave-erp-finance-settings',
  expenses: 'inclave-erp-operational-expenses',
  projects: 'inclave-erp-projects',
  sprints: 'inclave-erp-project-sprints',
  employees: 'inclave-erp-hr-employees',
  assistantAgents: 'inclave-erp-cursor-agents',
  accessSettings: 'inclave-erp-access-settings',
  passwords: 'inclave-erp-passwords',
};
