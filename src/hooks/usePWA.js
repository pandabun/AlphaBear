/**
 * src/hooks/usePWA.js
 * Hook untuk:
 * 1. Register Service Worker
 * 2. Detect install prompt (A2HS)
 * 3. Detect update tersedia
 */

import { useState, useEffect, useRef } from 'react';

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // ── Register Service Worker ───────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          setSwRegistration(registration);

          // Cek apakah ada update
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // Listen untuk controller change (setelah update)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload halaman otomatis setelah SW update
        window.location.reload();
      });
    }

    // ── Detect A2HS Prompt ────────────────────────────────────────────────────
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // ── Detect jika sudah installed ───────────────────────────────────────────
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt.current = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // ── Trigger install prompt ────────────────────────────────────────────────
  const promptInstall = async () => {
    if (!deferredPrompt.current) return false;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    return outcome === 'accepted';
  };

  // ── Apply update ──────────────────────────────────────────────────────────
  const applyUpdate = () => {
    if (!swRegistration?.waiting) return;
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  return {
    isInstallable,
    isInstalled,
    updateAvailable,
    promptInstall,
    applyUpdate,
  };
}
