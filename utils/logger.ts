let isDev = import.meta.env.DEV;
try { isDev = isDev || localStorage.getItem('DEBUG') === 'true'; } catch { /* storage blocked */ }

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const prefix = (level: LogLevel) => {
  const icons: Record<LogLevel, string> = { info: 'ℹ️', warn: '⚠️', error: '🚨', debug: '🐞' };
  return `[DTP][${level.toUpperCase()}] ${icons[level]}`;
};

/** Strip newlines from string values to prevent log injection */
export function sanitizeLog(v: unknown): unknown {
  return typeof v === 'string' ? v.replace(/[\r\n]/g, ' ') : v;
}

export const logger = {
  info: (...args: unknown[]) => { if (isDev) console.log(prefix('info'), ...args.map(sanitizeLog)); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(prefix('warn'), ...args.map(sanitizeLog)); },
  error: (...args: unknown[]) => { console.error(prefix('error'), ...args.map(sanitizeLog)); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(prefix('debug'), ...args.map(sanitizeLog)); },
};
