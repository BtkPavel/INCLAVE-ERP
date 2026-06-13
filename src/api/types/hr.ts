import type { Id, ListParams } from './common';

export type EmploymentType = 'staff' | 'outsource';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

export interface Employee {
  id: Id;
  fullName: string;
  position: string;
  department: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  email: string | null;
  phone: string | null;
  hiredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListParams extends ListParams {
  employmentType?: EmploymentType;
  department?: string;
  status?: EmployeeStatus;
  search?: string;
}

export interface CreateEmployeeDto {
  fullName: string;
  position: string;
  department: string;
  employmentType: EmploymentType;
  email?: string;
  phone?: string;
  hiredAt: string;
}
