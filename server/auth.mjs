import jwt from 'jsonwebtoken';
import { isRoleAccessBlocked } from './access.mjs';
import { getRolePassword } from './settings.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-inclave-secret-change-me';
const TOKEN_TTL = '30d';

const USERS = {
  director: {
    name: 'Директор',
    title: 'Руководитель предприятия',
  },
  accountant: {
    name: 'Бухгалтер',
    title: 'Финансовый отдел',
  },
  product_office: {
    name: 'Product Office',
    title: 'Продуктовый офис',
  },
};

export function listUsers() {
  return Object.entries(USERS).map(([role, user]) => ({
    id: role,
    role,
    name: user.name,
    title: user.title,
  }));
}

export function authenticate(role, password) {
  const user = USERS[role];
  const expected = getRolePassword(role);
  if (!user || !expected || expected !== password) return null;
  if (isRoleAccessBlocked(role)) return null;
  return { role, name: user.name, title: user.title };
}

export function signToken(role) {
  return jwt.sign({ role, sub: role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = USERS[payload.role];
    if (!user) return null;
    if (isRoleAccessBlocked(payload.role)) return null;
    return { role: payload.role, name: user.name, title: user.title };
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Требуется авторизация' });
    return;
  }
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Сессия истекла' });
    return;
  }
  req.user = user;
  next();
}
