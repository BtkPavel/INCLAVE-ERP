/** Установленное PWA (иконка на экране «Домой»). */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function initPwaMode(): void {
  if (!isPwaStandalone()) return;
  document.documentElement.dataset.pwa = 'true';
}
