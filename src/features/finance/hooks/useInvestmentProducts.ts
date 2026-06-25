import { useEffect, useMemo, useState } from 'react';
import { projectsApi } from '../../../api/modules/projects.api';
import type { Project } from '../../../api/types/projects';

export function useInvestmentProducts() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    void projectsApi
      .list({ category: 'investment', perPage: 100 })
      .then((response) => {
        if (!cancelled) {
          setProjects(response.data.filter((project) => project.category === 'investment'));
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const nameById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  return { projects, nameById };
}
