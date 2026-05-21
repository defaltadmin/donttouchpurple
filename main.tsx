import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { scoreSync } from './utils/score-sync'
import { GameProvider } from './contexts/GameContext'
import { DustProvider } from './contexts/DustContext'
import { UIProvider } from './contexts/UIContext'

const IS_PROD = window.location.hostname === 'game.mscarabia.com';

if (IS_PROD) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
      sendDefaultPii: false,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.1,
      tracePropagationTargets: [
        /^https:\/\/game\.mscarabia\.com/,
      ],
    });
    // Initialize safeSentry wrapper so error reporting works
    import('./services/sentry').then(m => m.getSentry()).catch(() => {});
  }).catch(() => {});
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Initialize score sync
scoreSync.init();
if (import.meta.hot) {
  import.meta.hot.dispose(() => scoreSync.destroy());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <DustProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </DustProvider>
      </GameProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
