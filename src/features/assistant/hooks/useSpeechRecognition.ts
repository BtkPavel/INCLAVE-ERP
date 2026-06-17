import { useCallback, useEffect, useRef, useState } from 'react';

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  onFinalResult: (text: string) => void;
}

export function useSpeechRecognition({
  lang = 'ru-RU',
  onFinalResult,
}: UseSpeechRecognitionOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalBufferRef = useRef('');
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const abort = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    finalBufferRef.current = '';
    setListening(false);
    setInterimText('');
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Голосовой ввод не поддерживается в этом браузере');
      return;
    }

    setError(null);
    finalBufferRef.current = '';
    setInterimText('');

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalBufferRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimText(finalBufferRef.current + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      const messages: Record<string, string> = {
        'not-allowed': 'Нет доступа к микрофону. Разрешите запись в настройках браузера.',
        'service-not-allowed': 'Распознавание речи недоступно на этой странице.',
        'network': 'Нужно подключение к интернету для распознавания речи.',
        'audio-capture': 'Микрофон не найден или занят другим приложением.',
      };
      setError(messages[event.error] ?? 'Не удалось распознать речь');
      setListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);

      const text = finalBufferRef.current.trim();
      finalBufferRef.current = '';
      setInterimText('');

      if (text) {
        onFinalResultRef.current(text);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Не удалось начать запись');
      setListening(false);
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    start();
  }, [listening, start, stop]);

  useEffect(() => () => abort(), [abort]);

  return {
    supported,
    listening,
    interimText,
    error,
    start,
    stop,
    toggle,
    abort,
    clearError: () => setError(null),
  };
}
