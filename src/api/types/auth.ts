import type { UserRole } from '../../auth/users';

export interface ModulePermissions {
  overview: boolean;
  projects: boolean;
  calendar: boolean;
  tasks: boolean;
  finance: boolean;
  hr: boolean;
  settings: boolean;
}

export interface UserPermissions {
  modules: ModulePermissions;
  projectIds: string[] | null;
}

export interface LoginDto {
  role: UserRole;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserResponse {
  role: UserRole;
  name: string;
  title: string;
  permissions?: UserPermissions;
}

export interface AuthSession {
  user: AuthUserResponse;
  tokens: AuthTokenResponse;
}

export interface SystemUser {
  id: string;
  role: UserRole;
  name: string;
  title: string;
}

export interface AccessSettings {
  moduleAccess: Record<UserRole, ModulePermissions>;
  projectAccess: Array<{ projectId: string; role: UserRole }>;
  calendarSharing: Array<{ ownerRole: UserRole; viewerRole: UserRole }>;
}
