import type { UserRole } from '../../auth/users';

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
