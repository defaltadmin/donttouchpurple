import { useState, useEffect, useCallback } from "react";

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !('standalone' in navigator && (navigator as any).standalone);

  useEffect(() => {
    const dismissed = localStorage.getItem('dtp-install-dismissed');
    if (dismissed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('dtp-install-dismissed');
    if (!dismissed && isIOS) {
      const timer = setTimeout(() => setShowInstallBanner(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isIOS]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt]);

  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('dtp-install-dismissed', '1');
  }, []);

  return {
    isIOS,
    showInstallBanner,
    deferredPrompt,
    handleInstallClick,
    dismissInstallBanner,
  };
}
