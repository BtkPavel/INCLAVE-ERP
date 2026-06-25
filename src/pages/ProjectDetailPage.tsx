import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { projectsApi } from '../api/modules/projects.api';
import type { Project, ProjectCategory } from '../api/types/projects';
import { ApiError } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { MethodologyWorkspace } from '../features/projects/components/MethodologyWorkspace';
import { ProjectEditModal } from '../features/projects/components/ProjectEditModal';
import { ProjectHeader } from '../features/projects/components/ProjectHeader';
import { useProjectActions } from '../hooks/useModuleApi';
import type { ProjectsOutletContext } from './ProjectsPage';
import type { ProductsOutletContext } from './ProductsPage';
import styles from './ProjectDetailPage.module.css';

interface ProjectDetailPageProps {
  category: ProjectCategory;
}

type DetailOutletContext = ProjectsOutletContext | ProductsOutletContext;

function defaultListPath(category: ProjectCategory) {
  return category === 'investment' ? '/projects/invest' : '/projects/current';
}

function canManageProject(userRole: string, project: Project) {
  return userRole === 'director' || project.createdBy === userRole;
}

export function ProjectDetailPage({ category }: ProjectDetailPageProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { setDetailLabel } = useOutletContext<DetailOutletContext>();
  const { user } = useAuth();
  const { update } = useProjectActions();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    projectsApi
      .get(projectId)
      .then(({ data }) => {
        if (cancelled) return;
        if (data.category !== category) {
          navigate(`${defaultListPath(data.category)}/${data.id}`, { replace: true });
          return;
        }
        setProject(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(ApiError.isApiError(err) ? err.message : 'Проект не найден');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, category, navigate]);

  useEffect(() => {
    if (project) {
      setDetailLabel(project.name);
    }
    return () => setDetailLabel(null);
  }, [project, setDetailLabel]);

  const canEdit = project && user ? canManageProject(user.role, project) : false;

  if (loading) {
    return <div className={styles.status}>Загрузка проекта…</div>;
  }

  if (error || !project) {
    return (
      <div className={styles.error} role="alert">
        <p>{error ?? 'Проект не найден'}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ProjectHeader
        project={project}
        category={category}
        canEdit={!!canEdit}
        onEdit={() => setEditOpen(true)}
      />

      <MethodologyWorkspace project={project} canEdit={!!canEdit} />

      {canEdit && (
        <ProjectEditModal
          open={editOpen}
          project={project}
          onClose={() => setEditOpen(false)}
          onSubmit={async (dto) => {
            const { data } = await update(project.id, dto);
            setProject(data);
          }}
        />
      )}
    </div>
  );
}
