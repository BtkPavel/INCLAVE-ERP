import type { AssistantChatRequest, AssistantChatResponse } from '../types/assistant';
import { apiClient } from '../client';
import { buildUrl } from '../architecture';

export const assistantApi = {
  chat(dto: AssistantChatRequest): Promise<{ data: AssistantChatResponse }> {
    if (apiClient.isMockMode()) {
      return Promise.resolve({
        data: {
          message: 'Клариса доступна только при подключении к серверу.',
          actions: [],
        },
      });
    }
    return apiClient.post(buildUrl('assistant', 'chat'), dto);
  },

  reset(): Promise<void> {
    if (apiClient.isMockMode()) {
      return Promise.resolve();
    }
    return apiClient.post(buildUrl('assistant', 'reset')).then(() => undefined);
  },
};
