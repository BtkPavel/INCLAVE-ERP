export type AssistantMessageRole = 'user' | 'assistant';

export interface AssistantMessage {
  id: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
}

export interface AssistantAction {
  tool: string;
  args: Record<string, unknown>;
  result: { ok: boolean; data?: unknown; error?: string };
}

export interface AssistantChatResponse {
  message: string;
  actions: AssistantAction[];
}

export interface AssistantChatRequest {
  messages: Array<{ role: AssistantMessageRole; content: string }>;
}
