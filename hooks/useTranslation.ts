import { useState, useEffect, useCallback } from 'react';
import { i18n } from '../utils/i18n';
import type { I18nKey } from '../utils/i18n-keys';
import type { Locale } from '../utils/i18n';

export function useTranslation() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('dtp:locale-change', handler);
    return () => window.removeEventListener('dtp:locale-change', handler);
  }, []);

  const t = useCallback((key: I18nKey, params?: Record<string, string | number>) => {
    return i18n.t(key, params);
  }, []);

  const setLocale = useCallback((lang: Locale) => {
    i18n.set(lang);
  }, []);

  return { t, locale: i18n.current, setLocale, available: i18n.getAvailable() };
}
