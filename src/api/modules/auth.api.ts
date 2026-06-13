import type { AuthSession, LoginDto } from '../types/auth';
import { apiClient, clearAuthToken, saveAuthToken } from '../client';
import { buildUrl } from '../architecture';

export const authApi = {
  async login(dto: LoginDto): Promise<AuthSession> {
    if (apiClient.isMockMode()) {
      return Promise.reject(new Error('Mock auth handled client-side'));
    }
    const session = await apiClient.post<AuthSession>(
      buildUrl('auth', 'login'),
      dto,
    );
    saveAuthToken(session.tokens.accessToken);
    return session;
  },

  logout(): Promise<void> {
    if (apiClient.isMockMode()) {
      clearAuthToken();
      return Promise.resolve();
    }
    return apiClient.post(buildUrl('auth', 'logout')).then(() => {
      clearAuthToken();
    });
  },

  me(): Promise<{ data: AuthSession['user'] }> {
    return apiClient.get(buildUrl('auth', 'me'));
  },

  refresh(refreshToken: string): Promise<AuthSession> {
    const session = apiClient.post<AuthSession>(buildUrl('auth', 'refresh'), {
      refreshToken,
    });
    return session.then((s) => {
      saveAuthToken(s.tokens.accessToken);
      return s;
    });
  },
};
