import type { Id, ListParams } from './common';

export type EmploymentType = 'staff' | 'outsource';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type PaymentType = 'paid' | 'unpaid';

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
  paymentType: PaymentType;
  paymentNote: string | null;
  systemRole: string | null;
  accessBlocked: boolean;
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
  paymentType?: PaymentType;
  paymentNote?: string;
  systemRole?: string | null;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  status?: EmployeeStatus;
  accessBlocked?: boolean;
}
