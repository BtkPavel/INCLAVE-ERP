import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../auth/AuthContext';
import { useAiAssistant } from '../AiAssistantContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { AssistantMessage } from '../../../api/types/assistant';
import styles from './AssistantPanel.module.css';

export function AssistantPanel() {
  const { user } = useAuth();
  const { open, closeAssistant, messages, sending, sendMessage, clearChat } = useAiAssistant();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceResult = useCallback(
    (text: string) => {
      void sendMessage(text);
    },
    [sendMessage],
  );

  const {
    supported: voiceSupported,
    listening,
    interimText,
    error: voiceError,
    toggle: toggleVoice,
    abort: abortVoice,
    clearError: clearVoiceError,
  } = useSpeechRecognition({ onFinalResult: handleVoiceResult });

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('assistant-open');
    inputRef.current?.focus();
    return () => {
      document.body.classList.remove('assistant-open');
      abortVoice();
    };
  }, [open, abortVoice]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages, sending]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (listening) abortVoice();
    const text = input;
    setInput('');
    await sendMessage(text);
  }

  const displayValue = listening ? interimText || input : input;
  const inputDisabled = !user || sending || listening;

  if (!open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className={styles.backdrop}
        onClick={closeAssistant}
        aria-label="Закрыть ассистента"
      />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label="Клариса — ассистент INCLAVE">
        <header className={styles.header}>
          <div>
            <span className={styles.badge}>Клариса</span>
            <h2 className={styles.title}>Клариса</h2>
            <p className={styles.subtitle}>
              {user ? `Ассистент INCLAVE · ${user.name}` : 'Войдите для полного доступа'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.iconBtn} onClick={clearChat} title="Очистить чат">
              ↺
            </button>
            <button type="button" className={styles.iconBtn} onClick={closeAssistant} aria-label="Закрыть">
              ×
            </button>
          </div>
        </header>

        <div className={styles.messages} ref={listRef}>
          {messages.map((msg: AssistantMessage) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
            >
              <p className={styles.messageText}>{msg.content}</p>
            </div>
          ))}
          {sending && (
            <div className={`${styles.message} ${styles.messageAssistant}`}>
              <p className={styles.typing}>Клариса думает… (до 1–2 мин)</p>
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className={`${styles.input} ${listening ? styles.inputListening : ''}`}
            value={displayValue}
            onChange={(e) => {
              if (listening) return;
              clearVoiceError();
              setInput(e.target.value);
            }}
            placeholder={
              listening
                ? 'Говорите…'
                : user
                  ? 'Напишите или нажмите микрофон…'
                  : 'Сначала войдите в систему'
            }
            rows={2}
            disabled={inputDisabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
          />

          {voiceError && <p className={styles.voiceError}>{voiceError}</p>}

          <div className={styles.formActions}>
            {voiceSupported && (
              <button
                type="button"
                className={`${styles.micBtn} ${listening ? styles.micBtnActive : ''}`}
                onClick={() => {
                  clearVoiceError();
                  toggleVoice();
                }}
                disabled={!user || sending}
                aria-label={listening ? 'Остановить запись' : 'Записать голосом'}
                title={listening ? 'Остановить и отправить' : 'Записать голосом'}
              >
                <span className={styles.micIcon} aria-hidden>
                  {listening ? '■' : '🎤'}
                </span>
                <span className={styles.micLabel}>{listening ? 'Стоп' : 'Голос'}</span>
              </button>
            )}

            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!user || sending || listening || !input.trim()}
            >
              Отправить
            </button>
          </div>
        </form>
      </aside>
    </>,
    document.body,
  );
}
