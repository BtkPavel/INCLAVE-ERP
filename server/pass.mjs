export function loadPassEntries(loadJson, key) {
  return loadJson(key, []);
}

export function savePassEntries(saveJson, key, entries) {
  saveJson(key, entries);
}

export function normalizePassEntry(dto, existing = null) {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    title: String(dto.title ?? '').trim(),
    login: String(dto.login ?? '').trim(),
    password: String(dto.password ?? ''),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function sortPassEntries(entries) {
  return [...entries].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
