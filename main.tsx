import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { ErrorBoundary } from './App'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
