import type { Id, ISODate, ListParams } from './common';

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectCategory = 'investment' | 'current';

export interface Project {
  id: Id;
  name: string;
  code: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  startDate: ISODate | null;
  endDate: ISODate | null;
  budget: number | null;
  managerId: Id | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: Id;
  role: string;
  name: string;
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
  code: string;
  description?: string;
  category?: ProjectCategory;
  status?: ProjectStatus;
  startDate?: ISODate;
  endDate?: ISODate;
  budget?: number;
  managerId?: Id;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

export interface AddProjectMemberDto {
  userId: Id;
  role: string;
}
