import type { Id, ISODate } from './common';

export type SprintStatus = 'planned' | 'active' | 'completed';

export interface Sprint {
  id: Id;
  projectId: Id;
  number: number;
  name: string;
  goal: string;
  startDate: ISODate;
  endDate: ISODate;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintDto {
  goal?: string;
  startDate?: ISODate;
}

export interface SprintComment {
  id: Id;
  sprintId: Id;
  projectId: Id;
  authorRole: Id;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CreateSprintCommentDto {
  text: string;
}
