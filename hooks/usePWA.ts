import { useState, useEffect } from 'react';

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ✅ FIX: Check installation status synchronously (safe)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    checkInstalled();

    // ✅ FIX: beforeinstallprompt is async — safe to set state here
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> });
      // ✅ This is safe: event handler, not render
    };

    window.addEventListener('beforeinstallprompt', handler);

    // ✅ FIX: Use functional update for appinstalled
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []); // ✅ Empty deps — listeners added once

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      return choice.outcome === 'accepted';
    } catch {
      return false;
    }
  };

  return { isInstalled, canInstall: !!deferredPrompt, promptInstall };
}
