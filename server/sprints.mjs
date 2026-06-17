function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function sprintsForProject(sprints, projectId) {
  return sprints
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => b.number - a.number);
}

export function nextSprintNumber(sprints, projectId) {
  const existing = sprintsForProject(sprints, projectId);
  return existing.length > 0 ? Math.max(...existing.map((s) => s.number)) + 1 : 1;
}

export function createSprintPayload({ projectId, project, goal, startDate }) {
  const weeks = project.sprintWeeks ?? 2;
  const start = startDate || new Date().toISOString().slice(0, 10);
  const end = addDays(start, weeks * 7 - 1);
  const number = 0; // filled by caller

  return {
    id: crypto.randomUUID(),
    projectId,
    number: 0,
    name: '',
    goal: String(goal ?? '').trim() || `Достичь измеримого результата за ${weeks} нед.`,
    startDate: start,
    endDate: end,
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function applySprintNumber(sprint, number) {
  return {
    ...sprint,
    number,
    name: `Спринт ${number}`,
    updatedAt: new Date().toISOString(),
  };
}
