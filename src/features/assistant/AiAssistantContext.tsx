import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { assistantApi } from '../../api/modules/assistant.api';
import type { AssistantMessage } from '../../api/types/assistant';
import { ApiError } from '../../api/errors';
import { AssistantPanel } from './components/AssistantPanel';

interface AiAssistantContextValue {
  open: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  messages: AssistantMessage[];
  sending: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null);

const WELCOME: AssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Здравствуйте! Меня зовут Клариса — я ваш ассистент в INCLAVE. Помогу с задачами и календарём: создам дело, покажу список или добавлю встречу. Например: «Создайте задачу подготовить отчёт до пятницы» или «Добавьте встречу завтра в 10:00».',
  createdAt: new Date().toISOString(),
};

function makeId() {
  return crypto.randomUUID();
}

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [sending, setSending] = useState(false);

  const openAssistant = useCallback(() => setOpen(true), []);
  const closeAssistant = useCallback(() => setOpen(false), []);
  const toggleAssistant = useCallback(() => setOpen((v) => !v), []);
  const clearChat = useCallback(() => {
    setMessages([WELCOME]);
    void assistantApi.reset().catch(() => undefined);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: AssistantMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setSending(true);

    try {
      const payload = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await assistantApi.chat({ messages: payload });

      if (data.actions.length > 0) {
        window.dispatchEvent(new CustomEvent('inclave-assistant-action'));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: unknown) {
      const message = ApiError.isApiError(err)
        ? err.message
        : 'Не удалось связаться с Кларисой';
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [messages, sending]);

  const value = useMemo(
    () => ({
      open,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      messages,
      sending,
      sendMessage,
      clearChat,
    }),
    [open, openAssistant, closeAssistant, toggleAssistant, messages, sending, sendMessage, clearChat],
  );

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      <AssistantPanel />
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant(): AiAssistantContextValue {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) throw new Error('useAiAssistant must be used within AiAssistantProvider');
  return ctx;
}
