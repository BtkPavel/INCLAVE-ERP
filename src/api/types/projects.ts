import type { Id, ISODate, ListParams } from './common';

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectCategory = 'investment' | 'current';
export type ProjectMethodology = 'scrum' | 'waterfall' | 'kanban' | 'hybrid';

export interface ProjectMember {
  userId: Id;
  name: string;
  role: string;
}

export interface Project {
  id: Id;
  name: string;
  code: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  methodology: ProjectMethodology;
  sprintWeeks: number | null;
  startDate: ISODate | null;
  endDate: ISODate | null;
  budget: number | null;
  requiredInvestments: number | null;
  members: ProjectMember[];
  managerId: Id | null;
  createdBy: Id | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}

export interface ProjectListParams extends ListParams {
  status?: ProjectStatus;
  category?: ProjectCategory;
  managerId?: Id;
}

export interface CreateProjectDto {
  name: string;
  code?: string;
  description?: string;
  category?: ProjectCategory;
  status?: ProjectStatus;
  methodology?: ProjectMethodology;
  sprintWeeks?: number | null;
  startDate?: ISODate;
  endDate?: ISODate;
  budget?: number | null;
  requiredInvestments?: number | null;
  members?: ProjectMember[];
  managerId?: Id;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

export interface AddProjectMemberDto {
  userId: Id;
  role: string;
}
