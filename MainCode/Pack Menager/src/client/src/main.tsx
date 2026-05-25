import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initGa4, trackPageView } from './analytics/ga4';

void initGa4().then(() => trackPageView('/', 'TGS Pack Manager'));

if (import.meta.env.DEV) {
  const shouldSkipDevNoise = (args: unknown[]) =>
    typeof args[0] === 'string' &&
    (args[0].includes('Download the React DevTools') ||
      args[0].includes('Electron Security Warning'));

  for (const method of ['log', 'info', 'warn'] as const) {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      if (!shouldSkipDevNoise(args)) original(...args);
    };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
