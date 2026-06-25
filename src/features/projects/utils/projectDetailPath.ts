import type { ProjectCategory } from '../../../api/types/projects';

export type ProjectDetailSection = 'workspace' | 'documentation';

export function projectSectionPath(
  basePath: string,
  section: ProjectDetailSection,
): string {
  return section === 'documentation' ? `${basePath}/documentation` : basePath;
}

export function getProjectDetailBasePath(
  pathname: string,
  category: ProjectCategory,
  projectId: string,
): string {
  if (pathname.startsWith('/products/')) {
    return `/products/${projectId}`;
  }
  const segment = category === 'investment' ? 'invest' : 'current';
  return `/projects/${segment}/${projectId}`;
}

export function isDocumentationPath(pathname: string): boolean {
  return pathname.endsWith('/documentation');
}
