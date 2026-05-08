const isDev = import.meta.env.DEV || localStorage.getItem('DEBUG') === 'true';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const prefix = (level: LogLevel) => {
  const icons: Record<LogLevel, string> = { info: 'ℹ️', warn: '⚠️', error: '🚨', debug: '🐞' };
  return `[DTP][${level.toUpperCase()}] ${icons[level]}`;
};

export const logger = {
  info: (...args: unknown[]) => { if (isDev) console.log(prefix('info'), ...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(prefix('warn'), ...args); },
  error: (...args: unknown[]) => { console.error(prefix('error'), ...args); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(prefix('debug'), ...args); },
};
