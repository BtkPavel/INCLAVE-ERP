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
