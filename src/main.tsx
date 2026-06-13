import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './theme/applyTheme';
import { initPwaMode } from './utils/pwa';
import './styles/global.css';

initTheme();
initPwaMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
