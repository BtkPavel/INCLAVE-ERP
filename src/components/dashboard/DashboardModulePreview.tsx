import type { ReactElement } from 'react';
import { DashboardCalendarPreview } from './DashboardCalendarPreview';
import { DashboardFinancePreview } from './DashboardFinancePreview';
import { DashboardHrPreview } from './DashboardHrPreview';
import { DashboardProjectsPreview } from './DashboardProjectsPreview';
import { DashboardTasksPreview } from './DashboardTasksPreview';

const PREVIEWS: Record<string, () => ReactElement> = {
  '/projects': DashboardProjectsPreview,
  '/calendar': DashboardCalendarPreview,
  '/tasks': DashboardTasksPreview,
  '/finance/income': DashboardFinancePreview,
  '/hr/staff': DashboardHrPreview,
};

interface DashboardModulePreviewProps {
  modulePath: string;
}

export function DashboardModulePreview({ modulePath }: DashboardModulePreviewProps) {
  const Preview = PREVIEWS[modulePath];
  if (!Preview) return null;
  return <Preview />;
}
