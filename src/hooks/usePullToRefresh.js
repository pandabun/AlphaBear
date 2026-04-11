/**
 * src/hooks/usePullToRefresh.js
 * Pull-to-refresh untuk PWA mobile.
 * Aktif hanya di mode standalone (PWA) atau bisa diforce untuk semua.
 *
 * Usage:
 *   const { isRefreshing, pullProgress } = usePullToRefresh(onRefresh);
 */

import { useState, useEffect, useRef } from 'react';

const PULL_THRESHOLD  = 72;  // px yang harus ditarik sebelum trigger refresh
const MAX_PULL        = 110; // px maksimum pull (batas visual)
const RESISTANCE      = 0.45; // semakin kecil semakin berat tarikannya

export function usePullToRefresh(onRefresh, { disabled = false } = {}) {
  const [pullDistance, setPullDistance] = useState(0); // 0–MAX_PULL
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY      = useRef(null);
  const isDragging  = useRef(false);
  const scrollEl    = useRef(null); // element yang di-scroll

  // Progress 0–1 berdasarkan pull distance vs threshold
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isTriggered  = pullDistance >= PULL_THRESHOLD;

  useEffect(() => {
    if (disabled || isRefreshing) return;

    const getScrollTop = () => {
      // Cari scroll container — bisa window atau element dengan overflow
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const onTouchStart = (e) => {
      if (getScrollTop() > 2) return; // hanya aktif di paling atas
      startY.current = e.touches[0].clientY;
      isDragging.current = false;
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      if (getScrollTop() > 2) { startY.current = null; return; }

      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { startY.current = null; return; }

      // Mulai drag
      isDragging.current = true;

      // Resistance: semakin jauh tarik, semakin berat
      const dampened = Math.min(dy * RESISTANCE, MAX_PULL);
      setPullDistance(dampened);

      // Prevent native scroll bounce di iOS saat kita handle sendiri
      if (dampened > 4) e.preventDefault();
    };

    const onTouchEnd = async () => {
      if (!isDragging.current) { startY.current = null; return; }
      isDragging.current = false;
      startY.current = null;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD * 0.75); // tahan di posisi loading
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Snap back
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: false });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  return { pullDistance, pullProgress, isRefreshing, isTriggered };
}
