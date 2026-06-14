import { useEffect, useState } from 'react';
import { isPwaStandalone } from '../../../utils/pwa';

/** Компактная сетка месяца: без длинных плашек в ячейках (телефон / PWA). */
export function useCompactMonthGrid(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    function check() {
      const narrow = window.matchMedia('(max-width: 1024px)').matches;
      const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      setCompact(isPwaStandalone() || narrow || touch);
    }

    check();
    window.addEventListener('resize', check);
    const mq = window.matchMedia('(max-width: 1024px)');
    mq.addEventListener('change', check);

    return () => {
      window.removeEventListener('resize', check);
      mq.removeEventListener('change', check);
    };
  }, []);

  return compact;
}
