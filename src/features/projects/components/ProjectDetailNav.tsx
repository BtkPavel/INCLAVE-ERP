import { NavLink } from 'react-router-dom';
import { projectSectionPath } from '../utils/projectDetailPath';
import styles from './ProjectDetailNav.module.css';

interface ProjectDetailNavProps {
  basePath: string;
}

export function ProjectDetailNav({ basePath }: ProjectDetailNavProps) {
  return (
    <nav className={styles.nav} aria-label="Разделы проекта">
      <NavLink
        to={projectSectionPath(basePath, 'workspace')}
        end
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
      >
        Проект
      </NavLink>
      <NavLink
        to={projectSectionPath(basePath, 'documentation')}
        className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
      >
        Документация
      </NavLink>
    </nav>
  );
}
