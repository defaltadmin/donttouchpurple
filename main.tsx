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
      dsn: 'https://f1800fa06950669a685e5900121ed53a@o4511311285190656.ingest.de.sentry.io/4511311305506896',
      environment: 'production',
      sendDefaultPii: false,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.1,
      tracePropagationTargets: [
        /^https:\/\/game\.mscarabia\.com/,
      ],
    });
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
